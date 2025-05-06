const Orders = {
    template: `
        <div class="app-container">
            <!-- 搜索和筛选区域 -->
            <div class="bg-white rounded-lg shadow-sm p-4 mb-4">
                <el-form :model="searchForm" class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <el-form-item label="订单号" class="mb-0">
                        <el-input 
                            v-model="searchForm.order_no" 
                            placeholder="请输入订单号"
                            clearable>
                        </el-input>
                    </el-form-item>
                    <el-form-item label="用户名" class="mb-0">
                        <el-input 
                            v-model="searchForm.user_name" 
                            placeholder="请输入用户名"
                            clearable>
                        </el-input>
                    </el-form-item>
                    <el-form-item label="订单状态" class="mb-0">
                        <el-select 
                            v-model="searchForm.status" 
                            placeholder="请选择状态" 
                            clearable
                            class="w-full">
                            <el-option 
                                v-for="(text, status) in statusOptions" 
                                :key="status"
                                :label="text"
                                :value="Number(status)">
                            </el-option>
                        </el-select>
                    </el-form-item>
                    <div class="flex gap-2 items-end">
                        <el-button type="primary" @click="handleSearch" class="flex-1 md:flex-none">
                            <el-icon class="mr-1"><search /></el-icon>搜索
                        </el-button>
                        <el-button @click="resetSearch" class="flex-1 md:flex-none">
                            <el-icon class="mr-1"><refresh /></el-icon>重置
                        </el-button>
                    </div>
                </el-form>
            </div>

            <!-- 订单列表 -->
            <div class="bg-white rounded-lg shadow-sm overflow-hidden">
                <el-table 
                    :data="orders" 
                    style="width: 100%"
                    :max-height="tableHeight"
                >
                    <el-table-column 
                        prop="order_no" 
                        label="订单号" 
                        min-width="180"
                        show-overflow-tooltip>
                    </el-table-column>
                    
                    <el-table-column 
                        prop="user_name" 
                        label="用户名" 
                        min-width="120">
                    </el-table-column>
                    
                    <el-table-column 
                        label="收货信息" 
                        min-width="300">
                        <template #default="scope">
                            <div class="space-y-1">
                                <div class="flex items-center gap-2">
                                    <span class="font-medium">{{scope.row.receiver_name}}</span>
                                    <span class="text-gray-500">{{scope.row.receiver_phone}}</span>
                                </div>
                                <div class="text-gray-600 text-sm">
                                    {{scope.row.province}}{{scope.row.city}}{{scope.row.district}}{{scope.row.address_detail}}
                                </div>
                            </div>
                        </template>
                    </el-table-column>
                    
                    <el-table-column 
                        prop="total_amount" 
                        label="订单金额" 
                        min-width="120"
                        align="right">
                        <template #default="scope">
                            <span class="text-primary font-medium">¥{{ scope.row.total_amount.toFixed(2) }}</span>
                        </template>
                    </el-table-column>
                    
                    <el-table-column 
                        prop="status" 
                        label="订单状态" 
                        min-width="120"
                        align="center">
                        <template #default="scope">
                            <el-tag 
                                :type="getStatusType(scope.row.status)"
                                class="w-20"
                            >
                                {{ scope.row.status_text }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    
                    <el-table-column 
                        prop="create_time" 
                        label="创建时间" 
                        min-width="180"
                        show-overflow-tooltip>
                    </el-table-column>
                    
                    <el-table-column 
                        label="操作" 
                        min-width="160"
                        align="center">
                        <template #default="scope">
                            <div class="flex gap-2 justify-center">
                                <el-button 
                                    size="small" 
                                    type="primary"
                                    @click="handleUpdateStatus(scope.row)"
                                    :disabled="scope.row.status === 4">
                                    <el-icon class="mr-1"><edit /></el-icon>更新状态
                                </el-button>
                                <el-button 
                                    size="small" 
                                    type="danger" 
                                    @click="handleDelete(scope.row)">
                                    <el-icon class="mr-1"><delete /></el-icon>删除
                                </el-button>
                            </div>
                        </template>
                    </el-table-column>
                </el-table>

                <!-- 分页 -->
                <div class="p-4 border-t">
                    <el-pagination
                        v-model:current-page="page"
                        v-model:page-size="limit"
                        :page-sizes="[10, 20, 50, 100]"
                        :total="total"
                        layout="total, sizes, prev, pager, next, jumper"
                        @size-change="handleSizeChange"
                        @current-change="handleCurrentChange">
                    </el-pagination>
                </div>
            </div>

            <!-- 状态更新对话框 -->
            <el-dialog 
                title="更新订单状态" 
                v-model="statusDialogVisible"
                width="90%"
                max-width="500px"
                class="rounded-lg">
                <el-form :model="statusForm" label-width="100px">
                    <el-form-item label="订单状态" required>
                        <el-select v-model="statusForm.status" class="w-full">
                            <el-option 
                                v-for="(text, status) in getNextStatusOptions(currentOrder?.status)" 
                                :key="status"
                                :label="text"
                                :value="Number(status)">
                            </el-option>
                        </el-select>
                    </el-form-item>
                </el-form>
                <template #footer>
                    <div class="flex gap-2 justify-end">
                        <el-button @click="statusDialogVisible = false">取消</el-button>
                        <el-button type="primary" @click="submitStatusUpdate">确定</el-button>
                    </div>
                </template>
            </el-dialog>
        </div>
    `,
    data() {
        return {
            searchForm: {
                order_no: '',
                user_name: '',
                status: null
            },
            orders: [],
            page: 1,
            limit: 10,
            total: 0,
            statusDialogVisible: false,
            statusForm: {
                status: null
            },
            currentOrder: null,
            statusOptions: {
                0: '待付款',
                1: '待发货',
                2: '待收货',
                3: '已完成',
                4: '已取消'
            },
            tableHeight: window.innerHeight - 300 // 动态计算表格高度
        }
    },
    created() {
        this.loadOrders()
        window.addEventListener('resize', this.updateTableHeight)
    },
    unmounted() {
        window.removeEventListener('resize', this.updateTableHeight)
    },
    methods: {
        updateTableHeight() {
            const isMobile = window.innerWidth <= 768
            this.tableHeight = window.innerHeight - (isMobile ? 350 : 300)
        },
        async loadOrders() {
            try {
                const params = {
                    page: this.page,
                    limit: this.limit,
                    ...this.searchForm
                }
                const res = await api.orders.list(params)
                this.orders = res.data.data.list
                this.total = res.data.data.pagination.total
            } catch (error) {
                ElMessage.error('获取订单列表失败')
            }
        },
        handleSearch() {
            this.page = 1
            this.loadOrders()
        },
        resetSearch() {
            this.searchForm = {
                order_no: '',
                user_name: '',
                status: null
            }
            this.handleSearch()
        },
        handleSizeChange(val) {
            this.limit = val
            this.loadOrders()
        },
        handleCurrentChange(val) {
            this.page = val
            this.loadOrders()
        },
        getStatusType(status) {
            const typeMap = {
                0: 'info',
                1: 'warning',
                2: 'primary',
                3: 'success',
                4: 'danger'
            }
            return typeMap[status] || 'info'
        },
        getNextStatusOptions(currentStatus) {
            const options = {}
            switch (currentStatus) {
                case 0:
                    options[1] = '待发货'
                    options[4] = '已取消'
                    break
                case 1:
                    options[2] = '待收货'
                    break
                case 2:
                    options[3] = '已完成'
                    break
            }
            return options
        },
        handleUpdateStatus(row) {
            this.currentOrder = row
            this.statusForm.status = null
            this.statusDialogVisible = true
        },
        async submitStatusUpdate() {
            if (!this.statusForm.status) {
                ElMessage.warning('请选择状态')
                return
            }
            try {
                await api.orders.updateStatus(this.currentOrder.id, this.statusForm)
                ElMessage.success('状态更新成功')
                this.statusDialogVisible = false
                this.loadOrders()
            } catch (error) {
                ElMessage.error('状态更新失败')
            }
        },
        async handleDelete(row) {
            try {
                await ElMessageBox.confirm('确定要删除该订单吗？', '提示', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                })
                await api.orders.delete(row.id)
                ElMessage.success('删除成功')
                this.loadOrders()
            } catch (error) {
                if (error !== 'cancel') {
                    ElMessage.error('删除失败')
                }
            }
        }
    }
}