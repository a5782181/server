const { ElMessage, ElMessageBox } = ElementPlus

// 创建路由
const router = VueRouter.createRouter({
    history: VueRouter.createWebHashHistory(),
    routes: [
        { path: '/categories', component: Categories },
        { path: '/products', component: Products },
        { path: '/orders', component: Orders },
        { path: '/', redirect: '/categories' }
    ]
})

// 创建应用
const app = Vue.createApp({
    data() {
        return {
            isLoggedIn: false,
            loginForm: {
                username: '',
                password: ''
            }
        }
    },
    async created() {
        // 应用创建时检查登录状态
        try {
            await this.checkAuth()
            ElementPlus.ElMessage.success('欢迎回来！')
        } catch (error) {
            console.log('未登录状态')
        }
    },
    methods: {
        async checkAuth() {
            try {
                const res = await api.auth.check()
                this.isLoggedIn = true
                if (this.$router.currentRoute.value.path === '/') {
                    this.$router.push('/categories')
                }
            } catch (error) {
                this.isLoggedIn = false
                this.$router.push('/')
            }
        },
        async handleLogin() {
            try {
                await api.auth.login(this.loginForm)
                this.isLoggedIn = true
                this.$router.push('/categories')
                ElementPlus.ElMessage.success('登录成功')
            } catch (error) {
                ElementPlus.ElMessage.error('登录失败')
            }
        }
    }
})

// 注册必要的组件和插件
app.use(ElementPlus)
app.use(router)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
}

// 挂载应用
app.mount('#app') 