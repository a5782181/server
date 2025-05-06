// 分类管理组件
const Categories = {
    template: `
        <div class="app-container">
            <div class="bg-white rounded-lg shadow-sm p-4 mb-4">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 class="text-lg font-medium">分类管理</h2>
                    <el-button type="primary" @click="showAddDialog" class="w-full sm:w-auto">
                        <el-icon class="mr-1"><plus /></el-icon>添加分类
                    </el-button>
                </div>
            </div>
            
            <div class="bg-white rounded-lg shadow-sm">
                <el-table 
                    :data="categories" 
                    style="width: 100%"
                    :max-height="tableHeight"
                    class="custom-table"
                >
                    <el-table-column 
                        prop="name" 
                        label="分类名称"
                        min-width="120"
                    ></el-table-column>
                    <el-table-column 
                        prop="sort" 
                        label="排序"
                        min-width="80"
                        class-name="text-center"
                    ></el-table-column>
                    <el-table-column 
                        label="操作"
                        min-width="160"
                        fixed="right"
                    >
                        <template #default="scope">
                            <div class="flex flex-wrap gap-2">
                                <el-button 
                                    size="small" 
                                    @click="handleEdit(scope.row)"
                                    class="flex-1 sm:flex-none"
                                >
                                    <el-icon class="mr-1"><edit /></el-icon>编辑
                                </el-button>
                                <el-button 
                                    size="small" 
                                    type="danger" 
                                    @click="handleDelete(scope.row)"
                                    class="flex-1 sm:flex-none"
                                >
                                    <el-icon class="mr-1"><delete /></el-icon>删除
                                </el-button>
                            </div>
                        </template>
                    </el-table-column>
                </el-table>
            </div>

            <!-- 添加/编辑对话框 -->
            <el-dialog 
                :title="dialogTitle" 
                v-model="dialogVisible"
                custom-class="rounded-lg"
                width="90%"
                max-width="500px"
            >
                <el-form :model="form" label-position="top">
                    <el-form-item label="分类名称" required>
                        <el-input 
                            v-model="form.name"
                            placeholder="请输入分类名称"
                            maxlength="50"
                            show-word-limit
                        ></el-input>
                    </el-form-item>
                    <el-form-item label="排序">
                        <el-input-number 
                            v-model="form.sort"
                            :min="0"
                            :max="999"
                            class="w-full"
                        ></el-input-number>
                    </el-form-item>
                </el-form>
                <template #footer>
                    <div class="flex flex-col sm:flex-row gap-2 justify-end">
                        <el-button 
                            @click="dialogVisible = false"
                            class="w-full sm:w-auto"
                        >取消</el-button>
                        <el-button 
                            type="primary" 
                            @click="handleSubmit"
                            class="w-full sm:w-auto"
                        >确定</el-button>
                    </div>
                </template>
            </el-dialog>
        </div>
    `,
    data() {
        return {
            categories: [],
            dialogVisible: false,
            dialogTitle: '添加分类',
            form: {
                name: '',
                sort: 0
            },
            editingId: null,
            tableHeight: window.innerHeight - 300 // 动态计算表格高度
        }
    },
    created() {
        this.loadCategories()
        // 监听窗口大小变化，更新表格高度
        window.addEventListener('resize', this.updateTableHeight)
    },
    unmounted() {
        // 移除事件监听
        window.removeEventListener('resize', this.updateTableHeight)
    },
    methods: {
        updateTableHeight() {
            // 动态计算表格高度，考虑移动端底部导航栏
            const isMobile = window.innerWidth <= 768
            this.tableHeight = window.innerHeight - (isMobile ? 350 : 300)
        },
        async loadCategories() {
            try {
                const res = await api.categories.list()
                this.categories = res.data.data
            } catch (error) {
                ElMessage.error('获取分类列表失败')
            }
        },
        showAddDialog() {
            this.dialogTitle = '添加分类'
            this.form = { name: '', sort: 0 }
            this.editingId = null
            this.dialogVisible = true
        },
        handleEdit(row) {
            this.dialogTitle = '编辑分类'
            this.form = { ...row }
            this.editingId = row.id
            this.dialogVisible = true
        },
        async handleDelete(row) {
            try {
                await ElMessageBox.confirm('确定要删除该分类吗？', '提示', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                })
                await api.categories.delete(row.id)
                ElMessage.success('删除成功')
                this.loadCategories()
            } catch (error) {
                if (error !== 'cancel') {
                    ElMessage.error('删除失败')
                }
            }
        },
        async handleSubmit() {
            try {
                if (!this.form.name) {
                    ElMessage.warning('请输入分类名称')
                    return
                }

                if (this.editingId) {
                    await api.categories.update(this.editingId, this.form)
                    ElMessage.success('更新成功')
                } else {
                    await api.categories.add(this.form)
                    ElMessage.success('添加成功')
                }
                this.dialogVisible = false
                this.loadCategories()
            } catch (error) {
                ElMessage.error(this.editingId ? '更新失败' : '添加失败')
            }
        }
    }
}