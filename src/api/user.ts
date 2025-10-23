import request from '@/utils/request'
import type {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  User,
  UserListParams,
  PageData,
  ChangePasswordRequest
} from '@/types'

// 用户登录
export function login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
  return request({
    url: '/v1/user/login',
    method: 'post',
    data
  })
}

// 获取用户信息
export function getUser(id: string): Promise<ApiResponse<User>> {
  return request({
    url: `/v1/user/${id}`,
    method: 'get'
  })
}

// 创建用户
export function createUser(data: User): Promise<ApiResponse> {
  return request({
    url: '/v1/user',
    method: 'post',
    data
  })
}

// 编辑用户
export function updateUser(data: User): Promise<ApiResponse> {
  return request({
    url: '/v1/user',
    method: 'put',
    data
  })
}

// 删除用户
export function deleteUser(id: string): Promise<ApiResponse> {
  return request({
    url: `/v1/user/${id}`,
    method: 'delete'
  })
}

// 获取用户列表
export function getUserList(data: UserListParams): Promise<ApiResponse<PageData<User>>> {
  return request({
    url: '/v1/user/list',
    method: 'get',
    data  // 使用 data 而不是 params，将参数放在请求体中
  })
}

// 修改密码
export function changePassword(data: ChangePasswordRequest): Promise<ApiResponse> {
  return request({
    url: '/v1/user/password',
    method: 'post',
    data
  })
}
