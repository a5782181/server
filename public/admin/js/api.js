// API 接口封装
const api = {
    // 登录相关
    auth: {
        login: (data) => axios.post('/admin/api/auth/login', data),
        logout: () => axios.post('/admin/api/auth/logout'),
        check: () => axios.get('/admin/api/auth/check')
    },
    // 分类相关
    categories: {
        list: () => axios.get('/admin/api/categories'),
        add: (data) => axios.post('/admin/api/categories', data),
        update: (id, data) => axios.put(`/admin/api/categories/${id}`, data),
        delete: (id) => axios.delete(`/admin/api/categories/${id}`)
    },
    // 商品相关
    products: {
        list: (params) => axios.get('/admin/api/products', { params }),
        add: (data) => axios.post('/admin/api/products', data),
        update: (id, data) => axios.put(`/admin/api/products/${id}`, data),
        delete: (id) => axios.delete(`/admin/api/products/${id}`)
    },
    // 规格相关
    specs: {
        list: (productId) => axios.get(`/admin/api/specs/products/${productId}/specs`),
        add: (data) => axios.post('/admin/api/specs/specs', data),
        update: (id, data) => axios.put(`/admin/api/specs/specs/${id}`, data),
        delete: (id) => axios.delete(`/admin/api/specs/specs/${id}`)
    },
    orders: {
        list: (params) => axios.get('/admin/api/orders', { params }),
        updateStatus: (id, data) => axios.put(`/admin/api/orders/${id}/status`, data),
        delete: (id) => axios.delete(`/admin/api/orders/${id}`)
    }
}