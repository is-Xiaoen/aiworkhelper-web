import request from '@/utils/request'
import type { ApiResponse, ChatRequest, ChatResponse, UploadResponse } from '@/types'

// 上传知识库文件
export function uploadKnowledgeFile(file: File): Promise<ApiResponse<UploadResponse>> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('chat', '1') // 启用记忆机制,后端会将文件信息保存到记忆中

  return request({
    url: '/v1/upload/file',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 知识库对话 - 更新知识库
export function knowledgeChat(data: ChatRequest): Promise<ApiResponse<ChatResponse>> {
  return request({
    url: '/v1/chat',
    method: 'post',
    data
  })
}