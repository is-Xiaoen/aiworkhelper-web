import request from '@/utils/request'
import type { ApiResponse, ChatRequest, ChatResponse } from '@/types'

// AI聊天
export function chat(data: ChatRequest): Promise<ApiResponse<ChatResponse>> {
  return request({
    url: '/v1/chat',
    method: 'post',
    data
  })
}
