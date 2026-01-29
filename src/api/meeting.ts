import request from '@/utils/request'
import type {
  ApiResponse,
  MeetingUploadResp,
  MeetingSummaryReq,
  MeetingSummaryResp,
  MeetingTodosReq,
  MeetingTodosResp
} from '@/types'

/**
 * 上传会议记录文件
 * 支持 .txt, .md, .pdf 格式
 */
export function uploadMeeting(file: File): Promise<ApiResponse<MeetingUploadResp>> {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/v1/meeting/upload',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000 // 上传可能较慢，设置60秒超时
  })
}

/**
 * 生成会议纪要
 * 可以通过 fileId 引用已上传的文件，或直接提供 content
 */
export function generateSummary(data: MeetingSummaryReq): Promise<ApiResponse<MeetingSummaryResp>> {
  return request({
    url: '/v1/meeting/summary',
    method: 'post',
    data,
    timeout: 120000 // AI 处理可能较慢，设置120秒超时
  })
}

/**
 * 提取会议待办事项
 * 可以通过 fileId 引用已上传的文件，或直接提供 content
 */
export function extractTodos(data: MeetingTodosReq): Promise<ApiResponse<MeetingTodosResp>> {
  return request({
    url: '/v1/meeting/todos',
    method: 'post',
    data,
    timeout: 120000 // AI 处理可能较慢，设置120秒超时
  })
}
