import request from '@/utils/request'
import type { ApiResponse, Department, DepUser, SetDepUserRequest } from '@/types'

// 获取部门SOA信息
export function getDepSoa(): Promise<ApiResponse<Department>> {
  return request({
    url: '/v1/dep/soa',
    method: 'get'
  })
}

// 获取部门详情
export function getDepartment(id: string): Promise<ApiResponse<Department>> {
  return request({
    url: `/v1/dep/${id}`,
    method: 'get'
  })
}

// 创建部门
export function createDepartment(data: Department): Promise<ApiResponse> {
  return request({
    url: '/v1/dep',
    method: 'post',
    data
  })
}

// 编辑部门
export function updateDepartment(data: Department): Promise<ApiResponse> {
  return request({
    url: '/v1/dep',
    method: 'put',
    data
  })
}

// 删除部门
export function deleteDepartment(id: string): Promise<ApiResponse> {
  return request({
    url: `/v1/dep/${id}`,
    method: 'delete'
  })
}

// 设置部门用户
export function setDepUser(data: SetDepUserRequest): Promise<ApiResponse> {
  return request({
    url: '/v1/dep/user',
    method: 'post',
    data
  })
}

// 获取用户部门信息
export function getUserDep(id: string): Promise<ApiResponse<DepUser>> {
  return request({
    url: `/v1/dep/user/${id}`,
    method: 'get'
  })
}
