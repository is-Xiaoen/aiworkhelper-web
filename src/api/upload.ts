import request from '@/utils/request'
import type { ApiResponse, UploadResponse } from '@/types'

// 文件上传
export function uploadFile(file: File, chat?: string): Promise<ApiResponse<UploadResponse>> {
  const formData = new FormData()
  formData.append('file', file)
  if (chat) {
    formData.append('chat', chat)
  }

  return request({
    url: '/v1/upload/file',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}
