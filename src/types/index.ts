// 通用响应类型
export interface ApiResponse<T = any> {
  code: number
  data: T
  msg: string
}

// 分页请求参数
export interface PageParams {
  page: number
  count: number
}

// 分页响应数据
export interface PageData<T> {
  count: number
  data: T[]
}

// 用户相关类型
export interface User {
  id: string
  name: string
  password?: string
  status: number // 0=禁用，1=启用
}

export interface LoginRequest {
  name: string
  password: string
}

export interface LoginResponse {
  status: number
  id: string
  name: string
  token: string
  accessExpire: number
  refreshAfter: number
}

export interface ChangePasswordRequest {
  id: string
  oldPwd: string
  newPwd: string
}

export interface UserListParams extends PageParams {
  ids?: string[]
  name?: string
}

// 待办事项类型
export interface TodoRecord {
  todoId: string
  userId: string
  userName: string
  content: string
  image?: string
  createAt: number
}

export interface Todo {
  id: string
  creatorId: string
  creatorName: string
  title: string
  deadlineAt: number
  desc: string
  status: number // 0=未发布，1=进行中，2=已完成
  records?: TodoRecord[]
  executeIds: string[]
  todoStatus: number
}

export interface TodoListParams extends PageParams {
  id?: string
  userId?: string
  startTime?: number
  endTime?: number
}

export interface TodoFinishRequest {
  userId: string
  todoId: string
}

// 审批相关类型
export interface ApprovalUser {
  userId: string
  userName: string
  status: number
  reason?: string
}

export interface ApprovalCopyPerson {
  userId: string
  userName: string
  status: number
}

export interface MakeCard {
  date: number
  reason: string
  day: number
  workCheckType: number
}

export interface Leave {
  type: number
  startTime: number
  endTime: number
  duration: number
  reason: string
  timeType: number // 1=小时，2=天
}

export interface GoOut {
  startTime: number
  endTime: number
  duration: number
  reason: string
}

export interface Approval {
  id: string
  user?: ApprovalUser
  no: string
  type: number // 1=请假，2=补卡，3=外出
  status: number // 0=待审批，1=已通过，2=已拒绝，3=已撤销
  title: string
  abstract: string
  reason: string
  approver?: ApprovalUser
  approvers?: ApprovalUser[]
  copyPersons?: ApprovalCopyPerson[]
  makeCard?: MakeCard
  leave?: Leave
  goOut?: GoOut
  finishAt?: number
  finishDay?: number
  finishMonth?: number
  finishYeas?: number
  updateAt?: number
  createAt?: number
}

export interface ApprovalListParams extends PageParams {
  userId?: string
  type?: number
}

export interface ApprovalDisposeRequest {
  approvalId: string
  status: number // 1=通过，2=拒绝，3=撤销
  reason?: string
}

// 部门相关类型
export interface DepUser {
  id: string
  user: string
  dep: string
  userName: string
}

export interface Department {
  id: string
  name: string
  parentId: string
  parentPath?: string
  level: number
  leaderId: string
  leader: string
  count: number
  users?: DepUser[]
  child?: Department[]
}

export interface SetDepUserRequest {
  depId: string
  userIds: string[]
}

// AI聊天类型
export interface ChatRequest {
  prompts: string
  chatType: number // 0=默认对话，1=待办查询，2=待办添加，3=审批查询，4=群消息总结
  relationId?: string
  startTime?: number
  endTime?: number
}

export interface ChatResponse {
  chatType: number
  data: any
}

// WebSocket消息类型
export interface WsMessage {
  conversationId: string // 群聊为"all"，私聊为两个用户ID组合
  recvId: string // 接收者ID（群聊时为空）
  sendId: string // 发送者ID
  chatType: number // 1=群聊，2=私聊，99=系统消息
  content: string
  contentType: number // 1=文字，2=图片，3=表情包等
  // 系统消息扩展字段（用于群聊创建等通知）
  systemType?: 'group_create' | 'group_dismiss' // 系统消息类型
  groupInfo?: {
    groupId: string
    groupName: string
    memberIds: string[]
    creatorId: string
  }
}

// 文件上传响应
export interface UploadResponse {
  host: string
  file: string
  filename: string
}

// 知识库相关类型（旧版 - AI 对话模式）
export interface KnowledgeFile {
  id: string
  filename: string
  filepath: string
  uploadTime: number
  size?: number
  status?: number // 0=处理中，1=已完成
}

export interface KnowledgeChatRequest {
  prompts: string
  chatType: number // 5=知识库对话
}

export interface KnowledgeChatResponse {
  chatType: number
  data: string
}

// ========== 知识库管理相关类型（新版 - 文件管理模式）==========

/** 知识库文件上传响应 */
export interface KnowledgeUploadResp {
  id: string           // 文档 ID
  filename: string     // 原始文件名
  title: string        // 文档标题
  contentType: string  // 内容类型
  fileSize: number     // 文件大小（字节）
}

/** 知识库文件列表请求参数 */
export interface KnowledgeListParams {
  page?: number   // 页码（从1开始）
  count?: number  // 每页数量
}

/** 知识库索引状态 */
export interface KnowledgeIndexStatus {
  meilisearch: 'pending' | 'synced' | 'failed'  // Meilisearch 状态
  graphrag: 'pending' | 'synced' | 'failed'     // GraphRAG 状态
  lastSyncAt: number   // 最后同步时间戳
  errorMsg: string     // 错误信息
}

/** 知识库文件视图对象 */
export interface KnowledgeFileVO {
  id: string            // 文档 ID
  title: string         // 文档标题
  filename: string      // 原始文件名
  contentType: string   // 内容类型
  fileSize: number      // 文件大小
  chunkCount: number    // 分块数量
  indexStatus: KnowledgeIndexStatus  // 各索引器状态
  createAt: number      // 创建时间
  updateAt: number      // 更新时间
}

/** 知识库文件列表响应 */
export interface KnowledgeListResp {
  total: number           // 总记录数
  list: KnowledgeFileVO[] // 文件列表
}

/** 知识库重新索引响应 */
export interface KnowledgeReindexResp {
  id: string                    // 文档 ID
  success: boolean              // 是否成功
  chunkCount: number            // 分块数量
  adapters: Record<string, boolean>  // 各适配器结果
  errors: Record<string, string>     // 各适配器错误信息
}

/** 适配器健康状态 */
export interface AdapterHealthVO {
  name: string        // 适配器名称
  required: boolean   // 是否必选
  available: boolean  // 是否可用
  error: string       // 错误信息
}

/** 知识库健康检查响应 */
export interface KnowledgeHealthResp {
  healthy: boolean                        // 整体是否健康
  adapters: Record<string, AdapterHealthVO>  // 各适配器状态
}

// ========== 会议相关类型 ==========

/** 会议文件上传响应 */
export interface MeetingUploadResp {
  fileId: string      // 文件唯一标识
  filename: string    // 原始文件名
  contentLen: number  // 内容长度（字符数）
  preview: string     // 内容预览（前500字符）
  contentType: string // 文件类型
}

/** 会议纪要生成请求 */
export interface MeetingSummaryReq {
  content?: string  // 会议内容（直接提供文本）
  fileId?: string   // 文件ID（引用之前上传的文件）
}

/** 会议纪要响应 */
export interface MeetingSummaryResp {
  title: string       // 会议主题
  date: string        // 会议日期
  duration: string    // 会议时长
  attendees: string[] // 参会人员
  keyPoints: string[] // 讨论要点
  decisions: string[] // 决议事项
  actionItems: string[] // 待办事项（简要）
  summary: string     // 会议总结
  markdown: string    // Markdown 格式完整纪要
}

/** 会议待办提取请求 */
export interface MeetingTodosReq {
  content?: string  // 会议内容（直接提供文本）
  fileId?: string   // 文件ID（引用之前上传的文件）
}

/** 单个会议待办项 */
export interface MeetingTodoItem {
  title: string       // 任务标题
  description: string // 任务描述
  assignee: string    // 责任人
  deadline: string    // 截止时间
  priority: 'high' | 'medium' | 'low' // 优先级
  context: string     // 任务背景
}

/** 会议待办提取响应 */
export interface MeetingTodosResp {
  meetingTitle: string        // 来源会议
  todoCount: number           // 待办数量
  todoItems: MeetingTodoItem[] // 待办事项列表
  notes: string               // 备注
  markdown: string            // Markdown 格式输出
}

/** 会议记录（前端扩展，用于列表展示） */
export interface MeetingRecord {
  fileId: string
  filename: string
  contentLen: number
  preview: string
  contentType: string
  uploadTime: number
  status: MeetingStatus
  summary?: MeetingSummaryResp
  todos?: MeetingTodosResp
}

/** 会议处理状态 */
export type MeetingStatus = 'uploaded' | 'processing' | 'completed' | 'failed'

// ========== AI 会话持久化类型 ==========

/** AI 会话状态 */
export type AIConversationStatus = 'active' | 'archived'

/** AI 会话对象 */
export interface AIConversation {
  id: string
  userId: string
  title: string
  messageCount: number
  status: AIConversationStatus
  createdAt: number
  updatedAt: number
  lastActiveAt: number
  summary?: string
}

/** 创建会话请求 */
export interface CreateAIConversationReq {
  title?: string
}

/** 更新会话请求 */
export interface UpdateAIConversationReq {
  title?: string
  status?: AIConversationStatus
}

/** 会话列表请求参数 */
export interface AIConversationListParams {
  page?: number
  pageSize?: number
  status?: AIConversationStatus
}

/** 会话列表响应 */
export interface AIConversationListResp {
  total: number
  list: AIConversation[]
}

/** AI 消息角色 */
export type AIMessageRole = 'user' | 'assistant' | 'system'

/** AI 消息对象 */
export interface AIMessage {
  id: string
  conversationId: string
  role: AIMessageRole
  content: string
  createdAt: number
  metadata?: Record<string, unknown>
}

/** 消息列表请求参数 */
export interface AIMessageListParams {
  limit?: number
  before?: number  // 游标分页：获取此时间戳之前的消息
}

/** 消息列表响应 */
export interface AIMessageListResp {
  list: AIMessage[]
  hasMore: boolean
}

/** 发送消息请求 */
export interface SendAIMessageReq {
  content: string
}

/** SSE 事件类型 */
export type SSEEventType = 'token' | 'done' | 'error' | 'heartbeat'

/** SSE Token 事件数据 */
export interface SSETokenPayload {
  content: string
  done: false
}

/** SSE Done 事件数据 */
export interface SSEDonePayload {
  content: string
  done: true
  fullResponse: string
  conversationId: string
  userMessageId: string
  assistantMessageId: string
  newConversation: boolean
}

/** SSE Error 事件数据 */
export interface SSEErrorPayload {
  error: string
  code: number
}

// ========== Multi-Agent 响应类型 ==========

/** Multi-Agent 响应格式 */
export interface MultiAgentResponse {
  agentType?: 'supervisor' | 'todo' | 'knowledge' | 'meeting' | 'approval'
  traceId?: string
  chatType?: number  // 兼容旧版格式
  data: unknown
  metadata?: {
    duration_ms: number
    tools_used: string[]
  }
}

/** 解析后的 AI 响应 */
export interface ParsedAIResponse {
  type: 'text' | 'meeting_summary' | 'meeting_todos' | 'todo_list' | 'approval_list' | 'knowledge' | 'json'
  content: string
  structured?: unknown
}
