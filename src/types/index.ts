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
  chatType: number // 1=群聊，2=私聊
  content: string
  contentType: number // 1=文字，2=图片，3=表情包等
}

// 文件上传响应
export interface UploadResponse {
  host: string
  file: string
  filename: string
}
