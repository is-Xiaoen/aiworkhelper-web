import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { User, LoginRequest } from '@/types'
import { login as loginApi } from '@/api/user'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem('token') || '')
  const userInfo = ref<User | null>(null)

  // 登录
  const login = async (loginForm: LoginRequest) => {
    try {
      const res = await loginApi(loginForm)
      if (res.code === 200 && res.data.token) {
        token.value = res.data.token
        userInfo.value = {
          id: res.data.id,
          name: res.data.name,
          status: 1
        }
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
        return true
      }
      return false
    } catch (error) {
      console.error('登录失败:', error)
      return false
    }
  }

  // 登出
  const logout = () => {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
  }

  // 初始化用户信息
  const initUserInfo = () => {
    const storedUserInfo = localStorage.getItem('userInfo')
    if (storedUserInfo) {
      try {
        userInfo.value = JSON.parse(storedUserInfo)
      } catch (error) {
        console.error('解析用户信息失败:', error)
      }
    }
  }

  return {
    token,
    userInfo,
    login,
    logout,
    initUserInfo
  }
})
