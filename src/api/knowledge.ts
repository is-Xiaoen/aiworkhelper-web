import request from '@/utils/request'
import type {
  ApiResponse,
  ChatRequest,
  ChatResponse,
  UploadResponse,
  KnowledgeUploadResp,
  KnowledgeListParams,
  KnowledgeListResp,
  KnowledgeReindexResp,
  KnowledgeHealthResp,
  KnowledgeWorkspaceReq,
  KnowledgeWorkspaceVO,
  KnowledgeWorkspaceListResp
} from '@/types'

// ========== 旧版 API（AI 对话模式）==========

/** 上传知识库文件（旧版） */
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

/** 知识库对话（旧版） */
export function knowledgeChat(data: ChatRequest): Promise<ApiResponse<ChatResponse>> {
  return request({
    url: '/v1/chat',
    method: 'post',
    data
  })
}

// ========== 新版 API（文件管理模式）==========

/**
 * 上传知识库文件
 * 支持 .txt, .md, .pdf 格式，会自动触发索引
 * @param file 文件对象
 * @param workspaceId 可选的工作空间 ID
 */
export function uploadKnowledge(
  file: File,
  workspaceId?: string
): Promise<ApiResponse<KnowledgeUploadResp>> {
  const formData = new FormData()
  formData.append('file', file)
  if (workspaceId) {
    formData.append('workspaceId', workspaceId)
  }
  return request({
    url: '/v1/knowledge/upload',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000 // 上传可能较慢，设置60秒超时
  })
}

/**
 * 获取知识库文件列表
 * 包含索引状态信息
 * @param params 查询参数，支持 workspaceId 过滤
 */
export function getKnowledgeList(params?: KnowledgeListParams): Promise<ApiResponse<KnowledgeListResp>> {
  return request({
    url: '/v1/knowledge/files',
    method: 'get',
    params: {
      page: params?.page || 1,
      count: params?.count || 20,
      workspaceId: params?.workspaceId || undefined
    }
  })
}

/**
 * 删除知识库文件
 * 同时删除所有相关索引
 */
export function deleteKnowledge(id: string): Promise<ApiResponse<null>> {
  return request({
    url: `/v1/knowledge/files/${id}`,
    method: 'delete'
  })
}

/**
 * 重新索引文件
 * 用于索引失败后重试
 */
export function reindexKnowledge(id: string): Promise<ApiResponse<KnowledgeReindexResp>> {
  return request({
    url: `/v1/knowledge/files/${id}/reindex`,
    method: 'post',
    timeout: 60000 // 索引可能较慢
  })
}

/**
 * 知识库健康检查
 * 检查所有索引适配器的状态
 */
export function getKnowledgeHealth(): Promise<ApiResponse<KnowledgeHealthResp>> {
  return request({
    url: '/v1/knowledge/health',
    method: 'get'
  })
}

// ========== 知识库工作空间 API ==========

/**
 * 创建知识库工作空间
 * @param data 工作空间信息
 */
export function createKnowledgeWorkspace(data: KnowledgeWorkspaceReq): Promise<ApiResponse<KnowledgeWorkspaceVO>> {
  return request({
    url: '/v1/knowledge/workspaces',
    method: 'post',
    data
  })
}

/**
 * 获取知识库工作空间列表
 */
export function getKnowledgeWorkspaces(): Promise<ApiResponse<KnowledgeWorkspaceListResp>> {
  return request({
    url: '/v1/knowledge/workspaces',
    method: 'get'
  })
}

/**
 * 获取单个工作空间详情
 * @param id 工作空间 ID
 */
export function getKnowledgeWorkspace(id: string): Promise<ApiResponse<KnowledgeWorkspaceVO>> {
  return request({
    url: `/v1/knowledge/workspaces/${id}`,
    method: 'get'
  })
}

/**
 * 删除知识库工作空间
 * 会同时删除该工作空间下的所有文档
 * @param id 工作空间 ID
 */
export function deleteKnowledgeWorkspace(id: string): Promise<ApiResponse<null>> {
  return request({
    url: `/v1/knowledge/workspaces/${id}`,
    method: 'delete'
  })
}