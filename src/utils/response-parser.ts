/**
 * Multi-Agent 响应解析器
 * 统一处理新版 Multi-Agent 格式和旧版 chatType 格式
 */

import type {
  ParsedAIResponse,
  MultiAgentResponse,
  ChatResponse,
  MeetingSummaryResp,
  MeetingTodoItem,
  Citation,
  GraphEntity,
  GraphRelation,
  RAGResult
} from '@/types'

/**
 * 解析 AI 响应（统一入口）
 * 支持 Multi-Agent 新格式和旧版 chatType 格式
 */
export function parseAIResponse(response: unknown): ParsedAIResponse {
  // 空响应
  if (!response) {
    return { type: 'text', content: '无响应内容' }
  }

  // 纯文本响应
  if (typeof response === 'string') {
    return { type: 'text', content: response }
  }

  // 对象响应
  if (typeof response === 'object') {
    const resp = response as MultiAgentResponse | ChatResponse

    // 1. 检查是否是 Multi-Agent 格式（有 agentType 字段）
    if ('agentType' in resp && resp.agentType) {
      return parseMultiAgentResponse(resp as MultiAgentResponse)
    }

    // 2. 检查是否是旧版 chatType 格式
    if ('chatType' in resp && typeof resp.chatType === 'number') {
      return parseLegacyChatResponse(resp as ChatResponse)
    }

    // 3. 只有 data 字段的响应
    if ('data' in resp) {
      const data = resp.data
      if (typeof data === 'string') {
        return { type: 'text', content: data }
      }
      // 尝试检测数据类型
      return detectAndParseData(data)
    }
  }

  // 4. 未知格式，JSON 展示
  return {
    type: 'json',
    content: JSON.stringify(response, null, 2),
    structured: response
  }
}

/**
 * 解析 Multi-Agent 格式响应
 */
function parseMultiAgentResponse(response: MultiAgentResponse): ParsedAIResponse {
  const { agentType, data } = response

  switch (agentType) {
    case 'meeting':
      return parseMeetingData(data)
    case 'todo':
      return parseTodoData(data)
    case 'knowledge':
      return parseKnowledgeData(data)
    case 'approval':
      return parseApprovalData(data)
    case 'supervisor':
    default:
      // Supervisor 通常返回文本或委托给其他 Agent
      if (typeof data === 'string') {
        return { type: 'text', content: data }
      }
      return detectAndParseData(data)
  }
}

/**
 * 解析旧版 chatType 格式响应
 */
function parseLegacyChatResponse(response: ChatResponse): ParsedAIResponse {
  const { chatType, data } = response

  switch (chatType) {
    case 0: // 默认对话
      return { type: 'text', content: String(data) }
    case 1: // 待办查询
    case 2: // 待办添加
      return { type: 'todo_list', content: formatTodoList(data), structured: data }
    case 3: // 审批查询
      return { type: 'approval_list', content: formatApprovalList(data), structured: data }
    case 4: // 群消息总结
      return { type: 'text', content: String(data) }
    case 5: // 知识库对话
      return { type: 'knowledge', content: String(data) }
    default:
      return { type: 'text', content: String(data) }
  }
}

/**
 * 解析会议相关数据
 */
function parseMeetingData(data: unknown): ParsedAIResponse {
  if (!data || typeof data !== 'object') {
    return { type: 'text', content: String(data) }
  }

  const obj = data as Record<string, unknown>

  // 检测会议纪要格式
  if ('title' in obj && 'keyPoints' in obj) {
    const summary = obj as unknown as MeetingSummaryResp
    return {
      type: 'meeting_summary',
      content: summary.markdown || formatMeetingSummary(summary),
      structured: summary
    }
  }

  // 检测会议待办格式
  if ('todoItems' in obj && Array.isArray(obj.todoItems)) {
    return {
      type: 'meeting_todos',
      content: formatMeetingTodos(obj.todoItems as MeetingTodoItem[]),
      structured: obj
    }
  }

  // 如果有 markdown 字段，直接使用
  if ('markdown' in obj && typeof obj.markdown === 'string') {
    return { type: 'text', content: obj.markdown }
  }

  return { type: 'text', content: JSON.stringify(data, null, 2) }
}

/**
 * 解析待办数据
 */
function parseTodoData(data: unknown): ParsedAIResponse {
  if (typeof data === 'string') {
    return { type: 'text', content: data }
  }
  return {
    type: 'todo_list',
    content: formatTodoList(data),
    structured: data
  }
}

/**
 * 解析知识库数据
 * v9.0: 支持 RAGResult 格式，包含 citations、graphEntities 等
 */
function parseKnowledgeData(data: unknown): ParsedAIResponse {
  if (typeof data === 'string') {
    return { type: 'knowledge', content: data }
  }
  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>

    // v9.0: 检测 RAGResult 格式（有 answer 字段）
    if ('answer' in obj) {
      const ragResult = obj as unknown as RAGResult
      const result: ParsedAIResponse = {
        type: 'knowledge',
        content: String(ragResult.answer),
        structured: data
      }

      // 提取 v9.0 新增字段
      if (ragResult.citations && ragResult.citations.length > 0) {
        result.citations = normalizeCitations(ragResult.citations)
      }
      if (ragResult.graphEntities && ragResult.graphEntities.length > 0) {
        result.graphEntities = normalizeGraphEntities(ragResult.graphEntities)
      }
      if (ragResult.graphRelations && ragResult.graphRelations.length > 0) {
        result.graphRelations = normalizeGraphRelations(ragResult.graphRelations)
      }
      if (ragResult.usedChannel) {
        result.usedChannel = ragResult.usedChannel as ParsedAIResponse['usedChannel']
      }

      return result
    }
  }
  return { type: 'knowledge', content: String(data) }
}

/**
 * 标准化引用数据（处理 snake_case 到 camelCase 的转换）
 */
function normalizeCitations(citations: unknown[]): Citation[] {
  return citations.map((c) => {
    const citation = c as Record<string, unknown>
    return {
      index: Number(citation.index ?? citation['index'] ?? 0),
      title: String(citation.title ?? ''),
      source: String(citation.source ?? ''),
      sourceId: String(citation.sourceId ?? citation['source_id'] ?? ''),
      pageNumber: citation.pageNumber !== undefined
        ? Number(citation.pageNumber)
        : (citation['page_number'] !== undefined ? Number(citation['page_number']) : undefined),
      snippet: citation.snippet ? String(citation.snippet) : undefined
    }
  })
}

/**
 * 标准化图谱实体数据
 */
function normalizeGraphEntities(entities: unknown[]): GraphEntity[] {
  return entities.map((e) => {
    const entity = e as Record<string, unknown>
    return {
      name: String(entity.name ?? ''),
      type: entity.type ? String(entity.type) : undefined,
      description: entity.description ? String(entity.description) : undefined
    }
  })
}

/**
 * 标准化图谱关系数据
 */
function normalizeGraphRelations(relations: unknown[]): GraphRelation[] {
  return relations.map((r) => {
    const relation = r as Record<string, unknown>
    return {
      source: String(relation.source ?? ''),
      target: String(relation.target ?? ''),
      relation: String(relation.relation ?? ''),
      description: relation.description ? String(relation.description) : undefined
    }
  })
}

/**
 * 解析审批数据
 */
function parseApprovalData(data: unknown): ParsedAIResponse {
  if (typeof data === 'string') {
    return { type: 'text', content: data }
  }
  return {
    type: 'approval_list',
    content: formatApprovalList(data),
    structured: data
  }
}

/**
 * 自动检测并解析数据类型
 */
function detectAndParseData(data: unknown): ParsedAIResponse {
  if (typeof data === 'string') {
    return { type: 'text', content: data }
  }

  if (Array.isArray(data)) {
    // 检查是否是待办列表
    if (data.length > 0 && 'todoId' in data[0]) {
      return { type: 'todo_list', content: formatTodoList(data), structured: data }
    }
    // 检查是否是审批列表
    if (data.length > 0 && 'approvalId' in data[0]) {
      return { type: 'approval_list', content: formatApprovalList(data), structured: data }
    }
    // 检查是否是会议待办列表
    if (data.length > 0 && 'assignee' in data[0] && 'priority' in data[0]) {
      return { type: 'meeting_todos', content: formatMeetingTodos(data as MeetingTodoItem[]), structured: data }
    }
  }

  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>

    // 检测会议纪要
    if ('title' in obj && ('keyPoints' in obj || 'attendees' in obj)) {
      return parseMeetingData(data)
    }

    // 检测会议待办响应
    if ('todoItems' in obj) {
      return parseMeetingData(data)
    }
  }

  return {
    type: 'json',
    content: JSON.stringify(data, null, 2),
    structured: data
  }
}

// ========== 格式化函数 ==========

/**
 * 格式化会议纪要为 Markdown
 */
export function formatMeetingSummary(summary: MeetingSummaryResp): string {
  let md = `## 📋 ${summary.title || '会议纪要'}\n\n`

  if (summary.date) {
    md += `**📅 日期**: ${summary.date}\n`
  }
  if (summary.duration) {
    md += `**⏱️ 时长**: ${summary.duration}\n`
  }
  if (summary.attendees && summary.attendees.length > 0) {
    md += `**👥 参会人员**: ${summary.attendees.join('、')}\n`
  }
  md += '\n'

  if (summary.keyPoints && summary.keyPoints.length > 0) {
    md += `### 💡 讨论要点\n`
    summary.keyPoints.forEach((point, i) => {
      md += `${i + 1}. ${point}\n`
    })
    md += '\n'
  }

  if (summary.decisions && summary.decisions.length > 0) {
    md += `### ✅ 决议事项\n`
    summary.decisions.forEach((decision, i) => {
      md += `${i + 1}. ${decision}\n`
    })
    md += '\n'
  }

  if (summary.actionItems && summary.actionItems.length > 0) {
    md += `### 📝 待办事项\n`
    summary.actionItems.forEach((item, i) => {
      md += `${i + 1}. ${item}\n`
    })
    md += '\n'
  }

  if (summary.summary) {
    md += `### 📄 会议总结\n${summary.summary}\n`
  }

  return md
}

/**
 * 格式化会议待办为 Markdown
 */
export function formatMeetingTodos(todos: MeetingTodoItem[]): string {
  if (!todos || todos.length === 0) {
    return '暂无待办事项'
  }

  const priorityIcon: Record<string, string> = {
    high: '🔴',
    medium: '🟡',
    low: '🟢'
  }

  let md = `## 📋 会议待办事项（共 ${todos.length} 项）\n\n`

  todos.forEach((todo, i) => {
    const icon = priorityIcon[todo.priority] || '⚪'
    md += `### ${i + 1}. ${icon} ${todo.title}\n`
    if (todo.description) {
      md += `> ${todo.description}\n\n`
    }
    md += `- **👤 责任人**: ${todo.assignee || '待指定'}\n`
    md += `- **📅 截止时间**: ${todo.deadline || '待定'}\n`
    md += `- **⚡ 优先级**: ${todo.priority === 'high' ? '高' : todo.priority === 'medium' ? '中' : '低'}\n`
    if (todo.context) {
      md += `- **📝 背景**: ${todo.context}\n`
    }
    md += '\n'
  })

  return md
}

/**
 * 格式化待办列表
 */
function formatTodoList(data: unknown): string {
  if (typeof data === 'string') {
    return data
  }
  if (Array.isArray(data)) {
    return data.map((item, i) => {
      if (typeof item === 'object' && item !== null) {
        const todo = item as Record<string, unknown>
        return `${i + 1}. ${todo.title || todo.content || JSON.stringify(item)}`
      }
      return `${i + 1}. ${String(item)}`
    }).join('\n')
  }
  return JSON.stringify(data, null, 2)
}

/**
 * 格式化审批列表
 */
function formatApprovalList(data: unknown): string {
  if (typeof data === 'string') {
    return data
  }
  if (Array.isArray(data)) {
    return data.map((item, i) => {
      if (typeof item === 'object' && item !== null) {
        const approval = item as Record<string, unknown>
        const status = approval.status === 0 ? '待审批' :
          approval.status === 1 ? '已通过' :
          approval.status === 2 ? '已拒绝' : '已撤销'
        return `${i + 1}. [${status}] ${approval.title || JSON.stringify(item)}`
      }
      return `${i + 1}. ${String(item)}`
    }).join('\n')
  }
  return JSON.stringify(data, null, 2)
}
