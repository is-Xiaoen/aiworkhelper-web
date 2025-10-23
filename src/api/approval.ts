import request from '@/utils/request'
import type { ApiResponse, Approval, ApprovalListParams, PageData, ApprovalDisposeRequest } from '@/types'

// 获取审批详情
export function getApproval(id: string): Promise<ApiResponse<Approval>> {
  return request({
    url: `/v1/approval/${id}`,
    method: 'get'
  })
}

// 创建审批
export function createApproval(data: Approval): Promise<ApiResponse<{ id: string }>> {
  return request({
    url: '/v1/approval',
    method: 'post',
    data
  })
}

// 获取审批列表
export function getApprovalList(params: ApprovalListParams): Promise<ApiResponse<PageData<Approval>>> {
  return request({
    url: '/v1/approval/list',
    method: 'get',
    params
  })
}

// 处理审批
export function disposeApproval(data: ApprovalDisposeRequest): Promise<ApiResponse> {
  return request({
    url: '/v1/approval/dispose',
    method: 'put',
    data
  })
}
