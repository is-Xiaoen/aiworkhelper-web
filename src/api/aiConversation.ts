import request from '@/utils/request'
import type {
  ApiResponse,
  AIConversation,
  AIConversationListParams,
  AIConversationListResp,
  CreateAIConversationReq,
  UpdateAIConversationReq,
  AIMessageListParams,
  AIMessageListResp,
  SendAIMessageReq,
  SSETokenPayload,
  SSEDonePayload,
  SSEErrorPayload
} from '@/types'
import { useUserStore } from '@/stores/user'

const BASE_URL = '/v1/ai/conversations'

// ========== 会话管理 API ==========

/** 获取会话列表 */
export function getConversationList(params?: AIConversationListParams): Promise<ApiResponse<AIConversationListResp>> {
  return request({
    url: BASE_URL,
    method: 'get',
    params
  })
}

/** 创建新会话 */
export function createConversation(data?: CreateAIConversationReq): Promise<ApiResponse<AIConversation>> {
  return request({
    url: BASE_URL,
    method: 'post',
    data: data || {}
  })
}

/** 获取会话详情 */
export function getConversation(id: string): Promise<ApiResponse<AIConversation>> {
  return request({
    url: `${BASE_URL}/${id}`,
    method: 'get'
  })
}

/** 更新会话 */
export function updateConversation(id: string, data: UpdateAIConversationReq): Promise<ApiResponse<AIConversation>> {
  return request({
    url: `${BASE_URL}/${id}`,
    method: 'patch',
    data
  })
}

/** 删除会话 */
export function deleteConversation(id: string): Promise<ApiResponse<null>> {
  return request({
    url: `${BASE_URL}/${id}`,
    method: 'delete'
  })
}

// ========== 消息管理 API ==========

/** 获取会话消息列表 */
export function getMessages(conversationId: string, params?: AIMessageListParams): Promise<ApiResponse<AIMessageListResp>> {
  return request({
    url: `${BASE_URL}/${conversationId}/messages`,
    method: 'get',
    params
  })
}

// ========== SSE 流式消息 ==========

/** SSE 事件回调类型 */
export interface SSECallbacks {
  onToken?: (payload: SSETokenPayload) => void
  onDone?: (payload: SSEDonePayload) => void
  onError?: (payload: SSEErrorPayload) => void
  onHeartbeat?: () => void
}

/**
 * 发送流式消息（SSE）
 * @param conversationId 会话 ID（空字符串表示自动创建新会话）
 * @param content 消息内容
 * @param callbacks SSE 事件回调
 * @returns AbortController 用于中断流式请求
 */
export function sendStreamMessage(
  conversationId: string,
  content: string,
  callbacks: SSECallbacks
): AbortController {
  const abortController = new AbortController()
  const userStore = useUserStore()

  // 构建 URL（conversationId 为空时传空字符串，后端会自动创建）
  const url = `${BASE_URL}/${conversationId || ''}/messages/stream`

  // 使用 fetch API 发送 POST 请求并接收 SSE
  const baseURL = import.meta.env.MODE === 'development'
    ? ''
    : (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8888')

  fetch(`${baseURL}${url}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userStore.token}`
    },
    body: JSON.stringify({ content } as SendAIMessageReq),
    signal: abortController.signal
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Response body is not readable')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // 解析 SSE 事件
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // 保留不完整的行

        let currentEvent = ''
        let currentData = ''

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7).trim()
          } else if (line.startsWith('data: ')) {
            currentData = line.slice(6)
          } else if (line === '' && currentEvent && currentData) {
            // 空行表示事件结束，处理事件
            try {
              const payload = JSON.parse(currentData)

              switch (currentEvent) {
                case 'token':
                  callbacks.onToken?.(payload as SSETokenPayload)
                  break
                case 'done':
                  callbacks.onDone?.(payload as SSEDonePayload)
                  break
                case 'error':
                  callbacks.onError?.(payload as SSEErrorPayload)
                  break
                case 'heartbeat':
                  callbacks.onHeartbeat?.()
                  break
              }
            } catch (e) {
              console.error('[SSE] Failed to parse event data:', currentData, e)
            }

            // 重置
            currentEvent = ''
            currentData = ''
          }
        }
      }
    })
    .catch((error) => {
      if (error.name === 'AbortError') {
        console.log('[SSE] Request aborted by user')
        return
      }
      console.error('[SSE] Stream error:', error)
      callbacks.onError?.({
        error: error.message || 'Stream connection failed',
        code: 500
      })
    })

  return abortController
}
