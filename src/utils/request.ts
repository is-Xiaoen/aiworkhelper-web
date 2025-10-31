import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import router from '@/router'

// 创建axios实例
const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.MODE === 'development' ? '' : (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8888'),
  timeout: 90000, // 90秒，用于支持 AI 接口的长时间处理
  headers: {
    'Content-Type': 'application/json;charset=utf-8'
  }
})

// 请求拦截器
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const userStore = useUserStore()
    const token = userStore.token

    // 添加token到请求头
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error: AxiosError) => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data

    // 如果返回的状态码不是200，则显示错误
    if (res.code !== 200) {
      ElMessage.error(res.msg || '请求失败')

      // 401: 未授权，跳转到登录页
      if (res.code === 401) {
        const userStore = useUserStore()
        userStore.logout()
        router.push('/login')
      }

      return Promise.reject(new Error(res.msg || '请求失败'))
    }

    return res
  },
  (error: AxiosError) => {
    console.error('响应错误:', error)

    // 处理网络错误
    if (!error.response) {
      ElMessage.error('网络连接失败')
      return Promise.reject(error)
    }

    // 处理HTTP错误状态码
    const status = error.response.status
    switch (status) {
      case 401:
        ElMessage.error('未授权，请重新登录')
        const userStore = useUserStore()
        userStore.logout()
        router.push('/login')
        break
      case 403:
        ElMessage.error('拒绝访问')
        break
      case 404:
        ElMessage.error('请求资源不存在')
        break
      case 500:
        ElMessage.error('服务器错误')
        break
      default:
        ElMessage.error(`请求失败: ${status}`)
    }

    return Promise.reject(error)
  }
)

export default service
