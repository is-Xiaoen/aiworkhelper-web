<template>
  <div class="chat-page">
    <el-row :gutter="20" style="height: 100%;">
      <!-- 左侧会话列表 -->
      <el-col :xs="24" :sm="8" :md="6" style="height: 100%;">
        <el-card class="chat-sidebar" body-style="padding: 0;">
          <template #header>
            <div class="sidebar-header">
              <span>消息</span>
              <el-dropdown @command="handleMenuCommand">
                <el-button circle size="small">
                  <el-icon><Plus /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="ai">AI对话</el-dropdown-item>
                    <el-dropdown-item command="group">群聊</el-dropdown-item>
                    <el-dropdown-item command="private">发起私聊</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>

          <div class="conversation-list">
            <!-- AI助手 -->
            <div
              :class="['conversation-item', { active: activeConversation === 'ai' }]"
              @click="switchConversation(conversations[0])"
            >
              <el-avatar :size="40" style="background-color: #409eff;">AI</el-avatar>
              <div class="conversation-info">
                <div class="conversation-name">AI助手</div>
                <div class="conversation-last">你好，我是AI助手</div>
              </div>
            </div>

            <!-- 群聊列表 -->
            <div
              v-for="conv in groupConversations"
              :key="conv.id"
              :class="['conversation-item', { active: activeConversation === conv.id }]"
              @click="switchConversation(conv)"
            >
              <el-avatar :size="40" style="background-color: #67c23a;">群</el-avatar>
              <div class="conversation-info">
                <div class="conversation-name">{{ conv.name }}</div>
                <div class="conversation-last">{{ conv.lastMessage || '暂无消息' }}</div>
              </div>
            </div>

            <!-- 已有私聊会话列表（按最新消息时间排序） -->
            <div
              v-for="conv in sortedPrivateConversations"
              :key="conv.id"
              :class="['conversation-item', {
                active: activeConversation === conv.id
              }]"
              @click="switchConversation(conv)"
            >
              <el-avatar :size="40">{{ conv.name[0] }}</el-avatar>
              <div class="conversation-info">
                <div class="conversation-name">{{ conv.name }}</div>
                <div class="conversation-last">
                  {{ conv.lastMessage || '暂无消息' }}
                </div>
              </div>
            </div>

            <!-- 没有会话的其他用户 -->
            <div
              v-for="user in usersWithoutConversation"
              :key="user.id"
              :class="['conversation-item', {
                active: isUserInActivePrivateChat(user.id)
              }]"
              @click="startPrivateChatWithUser(user)"
            >
              <el-avatar :size="40">{{ user.name[0] }}</el-avatar>
              <div class="conversation-info">
                <div class="conversation-name">{{ user.name }}</div>
                <div class="conversation-last">点击开始聊天</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧聊天区域 -->
      <el-col :xs="24" :sm="16" :md="18" style="height: 100%;">
        <el-card class="chat-main">
          <template #header>
            <div class="chat-header">
              <span>{{ currentConversationName }}</span>
              <el-tag v-if="wsConnected" type="success" size="small">已连接</el-tag>
              <el-tag v-else type="danger" size="small">未连接</el-tag>
            </div>
          </template>

          <div class="chat-container">
            <!-- 消息列表 -->
            <div ref="messageListRef" class="message-list">
              <div
                v-for="(msg, index) in sortedMessages"
                :key="index"
                :class="['message-item', msg.isSelf ? 'self' : 'other']"
              >
                <el-avatar :size="36">
                  {{ msg.senderName?.[0] || 'U' }}
                </el-avatar>
                <div class="message-content">
                  <div class="message-meta">
                    <span class="sender-name">{{ msg.senderName }}</span>
                    <span class="message-time">{{ formatTime(msg.time) }}</span>
                  </div>
                  <div class="message-bubble">
                    <div v-if="msg.contentType === 1" class="text-message">
                      {{ msg.content }}
                    </div>
                    <img v-else-if="msg.contentType === 2" :src="msg.content" class="image-message" />
                  </div>
                </div>
              </div>

              <div v-if="aiLoading" class="message-item other">
                <el-avatar :size="36">AI</el-avatar>
                <div class="message-content">
                  <div class="message-bubble">
                    <el-icon class="is-loading"><Loading /></el-icon>
                    AI正在思考中...
                  </div>
                </div>
              </div>
            </div>

            <!-- 输入区域 -->
            <div class="message-input-area">
              <div class="input-box" style="position: relative;">
                <el-input
                  ref="inputRef"
                  v-model="inputMessage"
                  type="textarea"
                  :rows="3"
                  :placeholder="currentChatType === 'group' ? '输入 @ 可提及群成员或AI...' : '请输入消息...'"
                  @keydown.enter.ctrl="handleSend"
                  @input="handleInputChange"
                  @keydown="handleKeyDown"
                />

                <!-- @ 提及选择器 -->
                <div
                  v-if="showMentionList && currentChatType === 'group'"
                  class="mention-list"
                  :style="{ bottom: mentionListBottom + 'px' }"
                >
                  <div
                    v-for="(item, index) in mentionFilteredList"
                    :key="item.id"
                    :class="['mention-item', { active: mentionSelectedIndex === index }]"
                    @click="selectMention(item)"
                    @mouseenter="mentionSelectedIndex = index"
                  >
                    <el-avatar :size="32">{{ item.name[0] }}</el-avatar>
                    <span class="mention-name">{{ item.name }}</span>
                  </div>
                  <div v-if="mentionFilteredList.length === 0" class="mention-empty">
                    无匹配结果
                  </div>
                </div>

                <el-button
                  type="primary"
                  :loading="sending"
                  @click="handleSend"
                >
                  发送 (Ctrl+Enter)
                </el-button>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 用户选择对话框 -->
    <el-dialog
      v-model="userSelectDialogVisible"
      :title="isCreatingGroup ? '创建群聊 - 选择成员' : '选择用户'"
      width="500px"
    >
      <el-input
        v-model="userSearchKeyword"
        placeholder="搜索用户"
        prefix-icon="Search"
        style="margin-bottom: 16px;"
      />

      <!-- 已选择的用户（创建群聊时显示） -->
      <div v-if="isCreatingGroup && selectedUserIds.length > 0" class="selected-users">
        <el-tag
          v-for="userId in selectedUserIds"
          :key="userId"
          closable
          @close="toggleUserSelection(userId)"
          style="margin-right: 8px; margin-bottom: 8px;"
        >
          {{ userList.find(u => u.id === userId)?.name }}
        </el-tag>
      </div>

      <div class="user-list">
        <div
          v-for="user in filteredUsers"
          :key="user.id"
          :class="['user-item', { selected: selectedUserIds.includes(user.id) }]"
          @click="handleUserSelect(user)"
        >
          <el-avatar :size="36">{{ user.name[0] }}</el-avatar>
          <span class="user-name">{{ user.name }}</span>
          <el-icon v-if="isCreatingGroup && selectedUserIds.includes(user.id)" class="check-icon">
            <el-icon-check />
          </el-icon>
        </div>
      </div>
      <div v-if="filteredUsers.length === 0" class="empty-text">
        暂无用户
      </div>

      <template #footer v-if="isCreatingGroup">
        <el-button @click="userSelectDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :disabled="selectedUserIds.length < 2"
          @click="createGroupChat"
        >
          创建群聊 ({{ selectedUserIds.length }}人)
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Picture, Loading, Check } from '@element-plus/icons-vue'
import { chat } from '@/api/chat'
import { uploadFile } from '@/api/upload'
import { getUserList } from '@/api/user'
import { createWebSocket, WebSocketClient } from '@/utils/websocket'
import { useUserStore } from '@/stores/user'
import dayjs from 'dayjs'
import type { WsMessage, User } from '@/types'

const userStore = useUserStore()

interface Message {
  sendId: string
  senderName: string
  content: string
  contentType: number
  time: number
  isSelf: boolean
}

interface Conversation {
  id: string
  name: string
  type: 'ai' | 'group' | 'private'
  lastMessage: string
  memberIds?: string[] // 群聊成员ID列表
  creatorId?: string   // 群创建者ID
  createTime?: number  // 创建时间
}

const messageListRef = ref<HTMLElement>()
const inputRef = ref()
const messages = ref<Message[]>([])
const inputMessage = ref('')
const sending = ref(false)
const aiLoading = ref(false)

// @ 提及功能相关
const showMentionList = ref(false)
const mentionSearchText = ref('')
const mentionSelectedIndex = ref(0)
const mentionListBottom = ref(100) // 选择器距离底部的距离

interface MentionItem {
  id: string
  name: string
  type: 'user' | 'ai'
}

// 用户列表相关
const userList = ref<User[]>([])
const userSelectDialogVisible = ref(false)
const userSearchKeyword = ref('')
const selectedUserIds = ref<string[]>([]) // 多选用户ID列表
const isCreatingGroup = ref(false) // 是否正在创建群聊

// WebSocket相关
let wsClient: WebSocketClient | null = null
const wsConnected = ref(false)
// 保存消息处理器的引用，用于清理
let messageHandler: ((message: WsMessage) => void) | null = null

// 会话消息存储（每个会话保存自己的消息）
const conversationMessages = reactive<Record<string, Message[]>>({})

// 会话管理
const conversations = ref<Conversation[]>([
  {
    id: 'ai',
    name: 'AI助手',
    type: 'ai',
    lastMessage: '你好，我是AI助手'
  }
  // 群聊会话将动态添加
])

const activeConversation = ref('ai')
const currentChatType = ref<'ai' | 'group' | 'private'>('ai')
const aiChatType = ref(0)

const currentConversationName = computed(() => {
  return conversations.value.find(c => c.id === activeConversation.value)?.name || ''
})

// 获取群聊列表
const groupConversations = computed(() => {
  return conversations.value.filter(c => c.type === 'group')
})

// 获取私聊会话列表（按最后消息时间排序）
const sortedPrivateConversations = computed(() => {
  const privateConvs = conversations.value.filter(c => c.type === 'private')

  // 按最后消息时间排序（最新的在前面）
  return [...privateConvs].sort((a, b) => {
    const aMessages = conversationMessages[a.id] || []
    const bMessages = conversationMessages[b.id] || []
    const aLastTime = aMessages.length > 0 ? aMessages[aMessages.length - 1].time : 0
    const bLastTime = bMessages.length > 0 ? bMessages[bMessages.length - 1].time : 0
    return bLastTime - aLastTime
  })
})

// 获取私聊会话中的对方用户ID
const getPrivateChatUserId = (conv: Conversation) => {
  if (conv.memberIds && conv.memberIds.length > 0) {
    // 返回不是当前用户的ID
    return conv.memberIds.find(id => id !== userStore.userInfo?.id) || ''
  }
  return ''
}

// 检查用户是否在当前活跃的私聊会话中
const isUserInActivePrivateChat = (userId: string) => {
  if (!activeConversation.value) return false
  
  const activeConv = conversations.value.find(c => c.id === activeConversation.value)
  if (!activeConv || activeConv.type !== 'private') return false
  
  return activeConv.memberIds?.includes(userId) || false
}

// 没有私聊会话的用户列表
const usersWithoutConversation = computed(() => {
  // 获取所有私聊会话中的用户ID
  const privateConvUserIds = new Set<string>()
  
  conversations.value
    .filter(c => c.type === 'private')
    .forEach(conv => {
      // 从 memberIds 中获取对方用户ID（排除自己）
      if (conv.memberIds) {
        conv.memberIds.forEach(id => {
          if (id !== userStore.userInfo?.id) {
            privateConvUserIds.add(id)
          }
        })
      }
    })

  return userList.value.filter(u =>
    u.id !== userStore.userInfo?.id && !privateConvUserIds.has(u.id)
  )
})

// 按时间排序的消息列表
const sortedMessages = computed(() => {
  return [...messages.value].sort((a, b) => a.time - b.time)
})

// 过滤用户列表（对话框用）
const filteredUsers = computed(() => {
  if (!userSearchKeyword.value) {
    return userList.value.filter(u => u.id !== userStore.userInfo?.id)
  }
  return userList.value.filter(
    u => u.id !== userStore.userInfo?.id && u.name.includes(userSearchKeyword.value)
  )
})

// @ 提及候选列表
const mentionCandidates = computed<MentionItem[]>(() => {
  const candidates: MentionItem[] = []

  // 添加 AI 助手
  candidates.push({
    id: 'ai',
    name: 'AI助手',
    type: 'ai'
  })

  // 添加群成员
  const currentConv = conversations.value.find(c => c.id === activeConversation.value)
  if (currentConv && currentConv.type === 'group' && currentConv.memberIds) {
    currentConv.memberIds.forEach(memberId => {
      if (memberId !== userStore.userInfo?.id) {
        const user = userList.value.find(u => u.id === memberId)
        if (user) {
          candidates.push({
            id: user.id,
            name: user.name,
            type: 'user'
          })
        }
      }
    })
  }

  return candidates
})

// 根据搜索文本过滤 @ 提及列表
const mentionFilteredList = computed(() => {
  if (!mentionSearchText.value) {
    return mentionCandidates.value
  }
  return mentionCandidates.value.filter(item =>
    item.name.toLowerCase().includes(mentionSearchText.value.toLowerCase())
  )
})

// 判断用户是否在线（通过账户状态判断）
const isUserOnline = (userId: string) => {
  // 当前登录用户始终在线
  if (userId === userStore.userInfo?.id) {
    return true
  }
  // 查找用户信息，status=1 表示账户启用（在线），status=0 表示禁用（离线）
  const user = userList.value.find(u => u.id === userId)
  return user ? user.status === 1 : false
}

// 点击用户列表中的用户创建私聊
const startPrivateChatWithUser = (user: User) => {
  // 不能和自己聊天
  if (user.id === userStore.userInfo?.id) {
    ElMessage.warning('不能和自己聊天')
    return
  }
  startPrivateChat(user)
}

const formatTime = (timestamp: number) => {
  return dayjs.unix(timestamp).format('HH:mm:ss')
}

// 处理输入变化，检测 @ 符号
const handleInputChange = () => {
  const text = inputMessage.value
  const cursorPos = inputRef.value?.$refs?.textarea?.selectionStart || text.length

  // 查找最近的 @ 符号位置
  let atPos = -1
  for (let i = cursorPos - 1; i >= 0; i--) {
    if (text[i] === '@') {
      atPos = i
      break
    }
    if (text[i] === ' ' || text[i] === '\n') {
      break
    }
  }

  if (atPos !== -1 && currentChatType.value === 'group') {
    // 提取 @ 后的搜索文本
    const searchText = text.substring(atPos + 1, cursorPos)
    mentionSearchText.value = searchText
    showMentionList.value = true
    mentionSelectedIndex.value = 0
  } else {
    showMentionList.value = false
    mentionSearchText.value = ''
  }
}

// 处理键盘事件（上下箭头选择，回车确认）
const handleKeyDown = (event: KeyboardEvent) => {
  if (!showMentionList.value) return

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    mentionSelectedIndex.value = Math.min(
      mentionSelectedIndex.value + 1,
      mentionFilteredList.value.length - 1
    )
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    mentionSelectedIndex.value = Math.max(mentionSelectedIndex.value - 1, 0)
  } else if (event.key === 'Enter' && !event.ctrlKey && !event.shiftKey) {
    event.preventDefault()
    if (mentionFilteredList.value[mentionSelectedIndex.value]) {
      selectMention(mentionFilteredList.value[mentionSelectedIndex.value])
    }
  } else if (event.key === 'Escape') {
    showMentionList.value = false
  }
}

// 选择提及的用户或AI
const selectMention = (item: MentionItem) => {
  const text = inputMessage.value
  const cursorPos = inputRef.value?.$refs?.textarea?.selectionStart || text.length

  // 查找最近的 @ 符号位置
  let atPos = -1
  for (let i = cursorPos - 1; i >= 0; i--) {
    if (text[i] === '@') {
      atPos = i
      break
    }
  }

  if (atPos !== -1) {
    // 替换 @ 后的文本为选中的名称
    const before = text.substring(0, atPos)
    const after = text.substring(cursorPos)
    inputMessage.value = before + '@' + item.name + ' ' + after

    // 隐藏选择列表
    showMentionList.value = false
    mentionSearchText.value = ''

    // 重新聚焦输入框
    nextTick(() => {
      const textarea = inputRef.value?.$refs?.textarea
      if (textarea) {
        textarea.focus()
        const newPos = (before + '@' + item.name + ' ').length
        textarea.setSelectionRange(newPos, newPos)
      }
    })
  }
}

// 初始化WebSocket连接
const initWebSocket = async () => {
  if (!userStore.token) return

  // 如果已经连接，不要重复初始化
  if (wsClient && wsClient.isConnected) {
    console.log('[WebSocket] 已连接，跳过重复初始化')
    return
  }

  try {
    // 如果存在旧的连接，先移除旧的消息处理器
    if (wsClient && messageHandler) {
      console.log('[WebSocket] 移除旧的消息处理器')
      wsClient.offMessage(messageHandler)
      messageHandler = null
    }

    // 如果存在旧的连接，先关闭（这会清除所有监听器）
    if (wsClient) {
      console.log('[WebSocket] 关闭旧连接')
      wsClient.close()
      wsClient = null
    }

    console.log('[WebSocket] 创建新连接')
    wsClient = createWebSocket(userStore.token)
    await wsClient.connect()
    wsConnected.value = true

    // 创建消息处理器并保存引用（只在第一次创建时）
    if (!messageHandler) {
      messageHandler = (message: WsMessage) => {
        console.log('[WebSocket] 消息处理器被调用，处理消息:', message)
        handleReceiveMessage(message)
      }
      
      // 监听消息（只添加一次）
      console.log('[WebSocket] 添加消息监听器')
      wsClient.onMessage(messageHandler)
    }
    
    // 验证处理器是否已添加
    console.log('[WebSocket] 验证处理器注册状态，当前处理器数量:', wsClient['messageHandlers']?.length || 0)

    ElMessage.success('WebSocket连接成功')
  } catch (error) {
    console.error('WebSocket连接失败:', error)
    ElMessage.error('WebSocket连接失败')
  }
}

// 接收消息
const handleReceiveMessage = (wsMessage: WsMessage) => {
  try {
    console.log('[接收消息] 收到WebSocket消息:', wsMessage)

    // 处理系统消息（群聊创建通知等）
    if (wsMessage.chatType === 99) {
    console.log('[接收消息] 收到系统消息:', wsMessage.systemType)

    if (wsMessage.systemType === 'group_create' && wsMessage.groupInfo) {
      const { groupId, groupName, memberIds, creatorId } = wsMessage.groupInfo

      // 检查自己是否在群成员列表中
      const isMyGroup = memberIds.includes(userStore.userInfo?.id || '')

      console.log('[接收消息] 群聊创建通知:', {
        groupId,
        groupName,
        memberIds,
        当前用户ID: userStore.userInfo?.id,
        是否是我的群: isMyGroup
      })

      if (isMyGroup) {
        // 检查本地是否已存在该群聊
        const existingGroup = conversations.value.find(c => c.id === groupId)
        if (!existingGroup) {
          // 创建群聊会话
          const newGroup: Conversation = {
            id: groupId,
            name: groupName,
            type: 'group',
            lastMessage: wsMessage.content,
            memberIds,
            creatorId,
            createTime: Date.now()
          }
          conversations.value.push(newGroup)
          console.log('[接收消息] 自动创建群聊会话:', newGroup)

          // 如果不是创建者，显示通知
          if (creatorId !== userStore.userInfo?.id) {
            ElMessage.success(`你已被邀请加入群聊"${groupName}"`)
          }
        }
      }
    }
    return // 系统消息不需要显示在聊天列表中
  }

  // 获取发送者名称
  const senderUser = userList.value.find(u => u.id === wsMessage.sendId)
  let senderName: string
  if (wsMessage.sendId === userStore.userInfo?.id) {
    senderName = '我'
  } else if (wsMessage.sendId === 'ai') {
    senderName = 'AI助手'
  } else if (senderUser) {
    senderName = senderUser.name
  } else {
    senderName = '用户' + (wsMessage.sendId?.slice(0, 4) || 'unknown')
  }

  const message: Message = {
    sendId: wsMessage.sendId,
    senderName,
    content: wsMessage.content,
    contentType: wsMessage.contentType,
    time: Date.now() / 1000,
    isSelf: wsMessage.sendId === userStore.userInfo?.id
  }

  console.log('[接收消息] 转换后的消息对象:', message)

  // 根据消息类型添加到对应会话
  if (wsMessage.chatType === 1) {
    // 群聊消息
    const convId = wsMessage.conversationId

    // 检查是否是自己所在的群
    let groupConv = conversations.value.find(c => c.id === convId && c.type === 'group')

    console.log('[接收消息] 群聊消息处理:', {
      conversationId: convId,
      找到群会话: !!groupConv,
      当前会话: activeConversation.value,
      消息内容: message.content,
      发送者ID: wsMessage.sendId,
      当前用户ID: userStore.userInfo?.id
    })

    // 如果本地没有这个群聊会话，自动创建该群聊
    // 无论是自己发的还是别人发的，只要收到消息就说明这个群是存在的
    if (!groupConv) {
      console.log('[接收消息] 收到未知群的消息，自动创建群聊会话')

      // 尝试从消息内容中提取群名称（如果是创建群聊的欢迎消息）
      let groupName = convId // 默认使用群ID
      const createPattern = /创建了群聊"(.+?)"，成员：(.+)/
      const match = message.content.match(createPattern)
      if (match) {
        groupName = match[1] // 提取群名称
        console.log('[接收消息] 从消息中提取群名称:', groupName)
      } else {
        // 如果无法提取，使用发送者名称
        const senderName = senderUser?.name || '未知用户'
        groupName = `${senderName}的群聊`
      }

      groupConv = {
        id: convId,
        name: groupName,
        type: 'group',
        lastMessage: '',
        memberIds: [userStore.userInfo?.id || '', wsMessage.sendId], // 至少包含自己和发送者
        creatorId: wsMessage.sendId,
        createTime: Date.now()
      }
      conversations.value.push(groupConv)

      // 只有不是自己发的消息才提示加入群聊
      if (wsMessage.sendId !== userStore.userInfo?.id) {
        ElMessage.success(`你已加入群聊"${groupConv.name}"`)
      }
    }

    if (!conversationMessages[convId]) {
      conversationMessages[convId] = []
    }

    // 去重检查：群聊消息去重
    // 检查conversationMessages中是否已有相同的消息
    const existsInStorage = conversationMessages[convId].some(m =>
      m.sendId === message.sendId &&
      m.content === message.content &&
      m.contentType === message.contentType &&
      Math.abs(m.time - message.time) < 5
    )

    console.log('[接收消息-群聊] 去重检查:', {
      conversationId: convId,
      存储中消息数: conversationMessages[convId].length,
      是否已存在: existsInStorage,
      消息详情: { sendId: message.sendId, content: message.content.substring(0, 30), time: message.time }
    })

    if (existsInStorage) {
      console.log('[接收消息-群聊] 检测到重复消息（存储中已存在），跳过添加')
      return
    }

    // 添加到会话消息存储
    conversationMessages[convId].push(message)
    console.log('[接收消息-群聊] 消息已添加到存储，当前存储消息数:', conversationMessages[convId].length)

    // 更新会话列表的最后一条消息
    const conv = conversations.value.find(c => c.id === convId)
    if (conv) {
      conv.lastMessage = message.contentType === 1 ? message.content : '[图片]'
    }

    // 如果当前在该会话，更新显示列���并滚动
    if (activeConversation.value === convId) {
      // 再次检查显示列表中是否已存在（双重保险）
      const existsInDisplay = messages.value.some(m =>
        m.sendId === message.sendId &&
        m.content === message.content &&
        m.contentType === message.contentType &&
        Math.abs(m.time - message.time) < 5
      )

      if (existsInDisplay) {
        console.log('[接收消息-群聊] 检测到重复消息（显示列表中已存在），跳过显示')
        return
      }

      console.log('[接收消息-群聊] 添加消息到显示列表')
      console.log('[接收消息-群聊] 添加前messages.value长度:', messages.value.length)
      messages.value.push(message)
      console.log('[接收消息-群聊] 添加后messages.value长度:', messages.value.length)
      scrollToBottom()
    } else {
      console.log('[接收消息-群聊] 不在当前会话，消息已保存但不显示')
    }
  } else if (wsMessage.chatType === 2) {
    // 私聊消息处理
    // 确定对话的另一方用户ID（用于显示头像和名称）
    const otherUserId = wsMessage.sendId === userStore.userInfo?.id ? wsMessage.recvId : wsMessage.sendId

    console.log('[接收消息-私聊] 收到私聊消息:', {
      后端conversationId: wsMessage.conversationId,
      sendId: wsMessage.sendId,
      recvId: wsMessage.recvId,
      当前用户ID: userStore.userInfo?.id,
      对方用户ID: otherUserId,
      消息内容: wsMessage.content,
      是自己发的: wsMessage.sendId === userStore.userInfo?.id
    })

    // 关键修复：使用对方用户ID作为存储键，而不是后端的conversationId
    // 这样可以确保与同一个人的所有消息都存储在同一个地方
    const storageKey = `private_${otherUserId}`

    if (!conversationMessages[storageKey]) {
      conversationMessages[storageKey] = []
    }

    console.log('[接收消息-私聊] 使用存储键:', storageKey)

    // 去重检查：私聊消息也需要去重
    const recentMessages = conversationMessages[storageKey].slice(-10)
    const isDuplicate = recentMessages.some(m =>
      m.sendId === message.sendId &&
      m.content === message.content &&
      m.contentType === message.contentType &&
      Math.abs(m.time - message.time) < 3
    )

    if (isDuplicate) {
      console.log('[接收消息-私聊] 检测到重复的私聊消息，已忽略')
      return
    }

    // 特殊处理：如果是自己发送的消息回显，且已经通过乐观更新添加过，则跳过
    console.log('[接收消息-私聊] 检查消息发送者ID:', wsMessage.sendId, '当前用户ID:', userStore.userInfo?.id)
    if (wsMessage.sendId === userStore.userInfo?.id) {
      console.log('[接收消息-私聊] 收到自己发送的消息回显，跳过添加（已通过乐观更新处理）')
      return
    }

    // 添加到消息存储
    conversationMessages[storageKey].push(message)
    console.log('[接收消息-私聊] 消息已添加到存储，当前存储消息数:', conversationMessages[storageKey].length)

    // 查找或创建私聊会话
    // 使用 memberIds 来查找会话（而不是会话ID）
    let conv = conversations.value.find(c =>
      c.type === 'private' &&
      c.memberIds?.includes(otherUserId) &&
      c.memberIds?.includes(userStore.userInfo?.id || '')
    )

    if (!conv) {
      // 创建新的私聊会话，使用统一的会话ID格式
      const otherUser = userList.value.find(u => u.id === otherUserId)
      conv = {
        id: storageKey, // 使用与存储键相同的格式
        name: otherUser?.name || '用户' + otherUserId.slice(0, 4),
        type: 'private',
        lastMessage: message.contentType === 1 ? message.content : '[图片]',
        memberIds: [userStore.userInfo?.id || '', otherUserId] // 存储双方用户ID
      }
      conversations.value.push(conv)
      console.log('[接收消息-私聊] 创建新的私聊会话:', conv)
    } else {
      // 更新已有会话的最后消息
      conv.lastMessage = message.contentType === 1 ? message.content : '[图片]'
      console.log('[接收消息-私聊] 更新已有私聊会话:', conv)
    }

    // 如果当前在该会话，更新消息列表并滚动
    if (activeConversation.value === conv.id) {
      console.log('[接收消息-私聊] 添加消息到当前显示列表')
      console.log('[接收消息-私聊] 添加前messages.value长度:', messages.value.length)
      console.log('[接收消息-私聊] 要添加的消息:', {
        sendId: message.sendId,
        content: message.content,
        time: message.time
      })

      // 检查消息是否已存在（避免WebSocket回显导致的重复）
      const messageExists = messages.value.some(existingMsg =>
        existingMsg.sendId === message.sendId &&
        existingMsg.content === message.content &&
        existingMsg.time === message.time
      )

      if (!messageExists) {
        console.log('[接收消息-私聊] 消息不存在，添加到显示列表')
        messages.value.push(message)
        console.log('[接收消息-私聊] 添加后messages.value长度:', messages.value.length)
        scrollToBottom()
      } else {
        console.log('[接收消息-私聊] 消息已存在，跳过添加（避免重复）')
      }
    } else {
      console.log('[接收消息-私聊] 不在当前会话，私聊消息已保存但不显示')
    }
  }
  } catch (error) {
    console.error('[接收消息-错误] WebSocket消息处理失败:', error)
    console.error('[接收消息-错误] 原始消息:', wsMessage)
  }
}

// 发送消息
const handleSend = async () => {
  if (!inputMessage.value.trim()) return

  if (currentChatType.value === 'ai') {
    // AI对话
    await sendAIMessage()
  } else if (currentChatType.value === 'group') {
    // 群聊 - 检查是否 @AI助手 或 @AI
    const content = inputMessage.value.trim()
    if (content.includes('@AI助手') || content.includes('@AI') || content.includes('@ai')) {
      await sendAIMessageInGroup()
    } else {
      await sendGroupMessage()
    }
  } else if (currentChatType.value === 'private') {
    // 私聊
    await sendPrivateMessage()
  }
}

// 发送AI消息
const sendAIMessage = async () => {
  const content = inputMessage.value.trim()
  if (!content) return

  // 添加用户消息到列表
  messages.value.push({
    sendId: userStore.userInfo?.id || '',
    senderName: '我',
    content,
    contentType: 1,
    time: Date.now() / 1000,
    isSelf: true
  })

  inputMessage.value = ''
  scrollToBottom()

  aiLoading.value = true
  try {
    const res = await chat({
      prompts: content,
      chatType: aiChatType.value
    })

    if (res.code === 200) {
      // 格式化AI回复内容
      let content = ''
      let rawData = res.data.data

      console.log('[AI回复] 原始数据类型:', typeof rawData)
      console.log('[AI回复] 原始数据 (完整):', rawData)
      console.log('[AI回复] 原始数据长度:', typeof rawData === 'string' ? rawData.length : 'N/A')

      // 如果是字符串，尝试提取其中的JSON
      if (typeof rawData === 'string') {
        // 检查是否包含```json代码块（支持```json或```格式）
        const jsonBlockMatch = rawData.match(/```json\s*\n([\s\S]*?)\n```/) ||
                               rawData.match(/```\s*\n([\s\S]*?)\n```/) ||
                               rawData.match(/```json\s*([\s\S]*?)```/) ||
                               rawData.match(/```([\s\S]*?)```/)

        if (jsonBlockMatch) {
          try {
            console.log('[AI回复] 检测到JSON代码块，提取内容')
            const jsonStr = jsonBlockMatch[1].trim()
            rawData = JSON.parse(jsonStr)
            console.log('[AI回复] 成功解析JSON:', rawData)
          } catch (e) {
            console.error('[AI回复] JSON解析失败:', e)
            // 尝试直接解析整个字符串
            try {
              rawData = JSON.parse(rawData)
              console.log('[AI回复] 直接解析原始字符串成功')
            } catch (e2) {
              content = rawData
            }
          }
        } else {
          // 没有代码块，尝试直接解析为JSON
          try {
            const parsed = JSON.parse(rawData)
            rawData = parsed
            console.log('[AI回复] 直接解析字符串为JSON成功')
          } catch (e) {
            // 解析失败，作为普通文本处理
            content = rawData
          }
        }
      }

      // 如果成功解析出对象，进行格式化
      if (content === '' && typeof rawData === 'object' && rawData !== null) {
        // 检查是否是标准的AI响应格式 {chatType: 1, data: {...}}
        if (rawData.chatType !== undefined && rawData.data !== undefined) {
          console.log('[AI回复] 检测到标准AI响应格式, chatType:', rawData.chatType)

          // chatType=1 表示待办查询
          if (rawData.chatType === 1 && rawData.data !== null && rawData.data.count !== undefined) {
            const todos = rawData.data.data || []
            const count = rawData.data.count
            console.log('[AI回复] 待办查询结果，数量:', count)

            if (count === 0 || todos.length === 0) {
              content = '📋 暂无待办事项'
            } else {
              content = `📋 找到 ${count} 个待办事项:\n\n` +
                todos.map((todo: any, index: number) => {
                  const deadline = new Date(todo.deadlineAt * 1000).toLocaleString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                  const statusText = todo.status === 0 ? '📌 未发布' : todo.status === 1 ? '⏳ 进行中' : '✅ 已完成'
                  return `${index + 1}. 【${todo.title}】\n` +
                         `   👤 创建人: ${todo.creatorName}\n` +
                         `   ⏰ 截止: ${deadline}\n` +
                         `   ${statusText}\n` +
                         `   📝 描述: ${todo.desc || '无'}`
                }).join('\n\n')
            }
          }
          // chatType=3 表示审批查询
          else if (rawData.chatType === 3 && rawData.data !== null && rawData.data.count !== undefined) {
            const approvals = rawData.data.data || []
            const count = rawData.data.count
            console.log('[AI回复] 审批查询结果，数量:', count)

            if (count === 0 || approvals.length === 0) {
              content = '📝 暂无审批单'
            } else {
              // 审批类型映射（与后端保持一致: 1=通用, 2=请假, 3=补卡, 4=外出, 5=报销, 6=付款, 7=采购, 8=收款）
              const typeMap: Record<number, string> = {
                1: '通用', 2: '请假', 3: '补卡', 4: '外出',
                5: '报销', 6: '付款', 7: '采购', 8: '收款'
              }
              // 审批状态映射
              const statusMap: Record<number, string> = {
                0: '⏸️ 未开始', 1: '⏳ 进行中',
                2: '✅ 已通过', 3: '🔙 已撤销', 4: '❌ 已拒绝'
              }

              content = `📝 找到 ${count} 个审批单:\n\n` +
                approvals.map((approval: any, index: number) => {
                  const createTime = approval.createAt
                    ? new Date(approval.createAt * 1000).toLocaleString('zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : '无'
                  const typeText = typeMap[approval.type] || '未知'
                  const statusText = statusMap[approval.status] || '未知'

                  // 通过createId查找创建人名称
                  const creator = userList.value.find(u => u.id === approval.createId)
                  const creatorName = creator?.name || approval.creatorId || '未知'

                  return `${index + 1}. 【${approval.title || '无标题'}】\n` +
                         `   📂 类型: ${typeText}\n` +
                         `   👤 创建人: ${creatorName}\n` +
                         `   🕐 创建时间: ${createTime}\n` +
                         `   ${statusText}\n` +
                         `   📄 详情: ${approval.abstract || '无'}`
                }).join('\n\n')
            }
          } else {
            // 其他chatType类型，使用通用格式化
            content = JSON.stringify(rawData.data, null, 2)
          }
        }
        // 检查是否是嵌套结构的待办查询结果（兼容旧格式）
        else if (rawData.data && rawData.data.count !== undefined && Array.isArray(rawData.data.data)) {
          const todos = rawData.data.data
          const count = rawData.data.count
          console.log('[AI回复] 检测到嵌套待办结果，数量:', count)
          if (todos.length === 0) {
            content = '📋 暂无待办事项'
          } else {
            content = `📋 找到 ${count} 个待办事项:\n\n` +
              todos.map((todo: any, index: number) => {
                const deadline = new Date(todo.deadlineAt * 1000).toLocaleString('zh-CN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                })
                const statusText = todo.status === 0 ? '📌 未发布' : todo.status === 1 ? '⏳ 进行中' : '✅ 已完成'
                return `${index + 1}. 【${todo.title}】\n` +
                       `   👤 创建人: ${todo.creatorName}\n` +
                       `   ⏰ 截止: ${deadline}\n` +
                       `   ${statusText}\n` +
                       `   📝 描述: ${todo.desc || '无'}`
              }).join('\n\n')
          }
        } else if (Array.isArray(rawData)) {
          // 直接是数组的情况
          const todos = rawData
          console.log('[AI回复] 检测到数组格式，数量:', todos.length)
          if (todos.length === 0) {
            content = '暂无待办事项'
          } else {
            content = `找到 ${todos.length} 个待办事项:\n\n` +
              todos.map((todo: any, index: number) => {
                const deadline = new Date(todo.deadlineAt * 1000).toLocaleString('zh-CN')
                const statusText = todo.status === 0 ? '未发布' : todo.status === 1 ? '进行中' : '已完成'
                return `${index + 1}. ${todo.title}\n   创建人: ${todo.creatorName}\n   截止时间: ${deadline}\n   状态: ${statusText}\n   描述: ${todo.desc || '无'}`
              }).join('\n\n')
          }
        } else {
          // 其他对象类型,使用JSON格式
          console.log('[AI回复] 其他对象类型，使用JSON格式')
          content = JSON.stringify(rawData, null, 2)
        }
      }

      console.log('[AI回复] 最终格式化内容:', content.substring(0, 100))

      // 添加AI回复
      messages.value.push({
        sendId: 'ai',
        senderName: 'AI助手',
        content,
        contentType: 1,
        time: Date.now() / 1000,
        isSelf: false
      })
      scrollToBottom()
    }
  } catch (error) {
    ElMessage.error('AI请求失败')
  } finally {
    aiLoading.value = false
  }
}

// 发送群聊消息
const sendGroupMessage = async () => {
  if (!wsClient || !wsClient.isConnected) {
    ElMessage.warning('WebSocket未连接')
    return
  }

  const content = inputMessage.value.trim()
  if (!content) return

  // 获取当前群聊ID
  const currentGroupId = activeConversation.value

  const wsMessage: WsMessage = {
    conversationId: currentGroupId,
    recvId: '',
    sendId: userStore.userInfo?.id || '',
    chatType: 1, // 群聊
    content,
    contentType: 1
  }

  console.log('[发送群聊] 发送消息:', wsMessage)
  wsClient.send(wsMessage)
  inputMessage.value = ''

  // 注意: 不在这里做乐观更新,等待后端回传消息
  // 这样可以避免消息重复显示的问题
  // 群聊消息后端会回传给所有成员(包括发送者),所以不需要乐观更新
}

// 在群聊中 @AI
const sendAIMessageInGroup = async () => {
  const content = inputMessage.value.trim()
  if (!content) return

  // 获取当前群聊ID
  const currentGroupId = activeConversation.value

  // 移除 @AI助手 或 @AI 前缀
  const prompt = content.replace(/@AI助手\s*/gi, '').replace(/@AI\s*/gi, '')

  // 先发送用户消息到群聊
  if (wsClient && wsClient.isConnected) {
    const wsMessage: WsMessage = {
      conversationId: currentGroupId,
      recvId: '',
      sendId: userStore.userInfo?.id || '',
      chatType: 1,
      content,
      contentType: 1
    }
    wsClient.send(wsMessage)
    console.log('[群聊@AI] 用户消息已发送，等待WebSocket回传确认')
  }

  inputMessage.value = ''

  // 调用 AI 接口进行群消息总结
  aiLoading.value = true
  try {
    // 获取当前时间和24小时前的时间戳（用于总结最近的群消息）
    const now = Date.now()
    const oneDayAgo = now - 24 * 60 * 60 * 1000

    console.log('[群聊@AI] 准备调用API，当前群聊ID:', currentGroupId)

    const res = await chat({
      prompts: prompt,
      chatType: 0,  // 使用默认值0，让后端智能路由自动识别为群消息总结
      relationId: currentGroupId,  // 传递当前群聊的conversationId，后端会查询该群的消息
      startTime: Math.floor(oneDayAgo / 1000),  // 开始时间（秒级时间戳）
      endTime: Math.floor(now / 1000)  // 结束时间（秒级时间戳）
    })

    console.log('[群聊@AI] 后端API响应:', res)

    if (res.code === 200) {
      // 增强数据处理：支持多种返回格式
      let aiResponse = ''

      if (res.data && res.data.data) {
        // 如果返回的是数组（总结结果），格式化展示
        if (Array.isArray(res.data.data)) {
          const summaries = res.data.data.map((item: any, index: number) => {
            const typeLabel = item.Type === 1 ? '📋 待办任务' : '📝 审批事项'
            return `${index + 1}. ${typeLabel}: ${item.Title}\n   ${item.Content}`
          }).join('\n\n')
          aiResponse = summaries || '暂无总结内容'
        } else if (typeof res.data.data === 'string') {
          aiResponse = res.data.data
        } else {
          aiResponse = JSON.stringify(res.data.data, null, 2)
        }
      } else if (res.data && typeof res.data === 'string') {
        aiResponse = res.data
      } else {
        console.warn('[群聊@AI] 后端返回数据格式异常:', res.data)
        aiResponse = '暂无群消息总结'
      }

      console.log('[群聊@AI] 处理后的AI回复:', aiResponse)

      // 将 AI 回复发送到群聊
      if (wsClient && wsClient.isConnected) {
        const wsMessage: WsMessage = {
          conversationId: currentGroupId,
          recvId: '',
          sendId: 'ai',
          chatType: 1,
          content: `AI回复:\n${aiResponse}`,
          contentType: 1
        }
        wsClient.send(wsMessage)
        console.log('[群聊@AI] AI回复已发送到群聊，等待WebSocket回传确认')
      }
    } else {
      console.error('[群聊@AI] 后端返回错误:', res.code, res.msg)
      ElMessage.error(`AI总结失败: ${res.msg || '未知错误'}`)
    }
  } catch (error) {
    console.error('[群聊@AI] AI请求失败:', error)
    ElMessage.error('AI请求失败，请检查网络连接')
  } finally {
    aiLoading.value = false
  }
}

// 发送私聊消息
const sendPrivateMessage = async () => {
  if (!wsClient || !wsClient.isConnected) {
    ElMessage.warning('WebSocket未连接')
    return
  }

  const content = inputMessage.value.trim()
  if (!content) return

  // 从当前会话中获取对方用户ID
  const currentConv = conversations.value.find(c => c.id === activeConversation.value)
  if (!currentConv || currentConv.type !== 'private') {
    ElMessage.error('无效的私聊会话')
    return
  }

  // 从 memberIds 中找到对方的用户ID（排除自己）
  const recvId = currentConv.memberIds?.find(id => id !== userStore.userInfo?.id)
  if (!recvId) {
    console.error('[发送私聊] 无法找到接收者ID:', {
      当前会话: currentConv,
      当前用户ID: userStore.userInfo?.id,
      memberIds: currentConv.memberIds
    })
    ElMessage.error('无法找到接收者ID')
    return
  }

  const wsMessage: WsMessage = {
    conversationId: '', // 不发送 conversationId，让后端自己生成
    recvId,
    sendId: userStore.userInfo?.id || '',
    chatType: 2,
    content,
    contentType: 1
  }

  console.log('[发送私聊] 发送消息:', { conversationId: '(由后端生成)', recvId, content })
  wsClient.send(wsMessage)
  inputMessage.value = ''

  // 立即添加到本地消息列表(乐观更新)
  // 私聊时后端不会回传给发送者，所以必须在本地显示
  const message: Message = {
    sendId: userStore.userInfo?.id || '',
    senderName: '我',
    content,
    contentType: 1,
    time: Date.now() / 1000,
    isSelf: true
  }

  // 关键修复：使用对方用户ID作为会话存储的键，而不是临时会话ID
  // 这样可以确保与同一个人的所有消息都存储在同一个地方
  const storageKey = `private_${recvId}` // 使用统一的存储键格式

  if (!conversationMessages[storageKey]) {
    conversationMessages[storageKey] = []
  }

  console.log('[发送私聊] 使用存储键:', storageKey, '当前会话ID:', activeConversation.value)

  // 去重检查再添加
  const recentMessages = conversationMessages[storageKey].slice(-10)
  const isDuplicate = recentMessages.some(m =>
    m.sendId === message.sendId &&
    m.content === message.content &&
    m.contentType === message.contentType &&
    Math.abs(m.time - message.time) < 3
  )

  if (!isDuplicate) {
    console.log('[发送私聊] 乐观更新：添加到本地消息存储')
    console.log('[发送私聊] 乐观更新消息详情:', {
      sendId: message.sendId,
      content: message.content,
      time: message.time,
      storageKey: storageKey
    })
    conversationMessages[storageKey].push(message)

    // 只有在当前会话中才添加到显示列表
    if (activeConversation.value === currentConv.id) {
      console.log('[发送私聊] 乐观更新：添加到当前显示列表')
      console.log('[发送私聊] 乐观更新前messages.value长度:', messages.value.length)

      // 检查显示列表中是否已存在该消息（避免重复显示）
      const displayMessageExists = messages.value.some(existingMsg =>
        existingMsg.sendId === message.sendId &&
        existingMsg.content === message.content &&
        existingMsg.time === message.time
      )

      if (!displayMessageExists) {
        console.log('[发送私聊] 乐观更新：消息不存在于显示列表，添加')
        messages.value.push(message)
        console.log('[发送私聊] 乐观更新后messages.value长度:', messages.value.length)
        scrollToBottom()
      } else {
        console.log('[发送私聊] 乐观更新：消息已存在于显示列表，跳过添加')
      }
    } else {
      console.log('[发送私聊] 乐观更新：不在当前会话，消息已保存但不显示')
    }
  } else {
    console.log('[发送私聊] 检测到重复消息，跳过乐观更新')
  }
}

// 上传图片
const handleUploadImage = async (file: File) => {
  try {
    const res = await uploadFile(file)
    if (res.code === 200) {
      const imageUrl = `${res.data.host}/${res.data.file}`

      if (currentChatType.value === 'group' && wsClient?.isConnected) {
        // 发送图片消息到群聊
        const wsMessage: WsMessage = {
          conversationId: 'all',
          recvId: '',
          sendId: userStore.userInfo?.id || '',
          chatType: 1,
          content: imageUrl,
          contentType: 2
        }
        wsClient.send(wsMessage)

        messages.value.push({
          sendId: userStore.userInfo?.id || '',
          senderName: '我',
          content: imageUrl,
          contentType: 2,
          time: Date.now() / 1000,
          isSelf: true
        })
        scrollToBottom()
      }
    }
  } catch (error) {
    ElMessage.error('上传失败')
  }

  return false
}

// 切换会话
const switchConversation = (conv: Conversation) => {
  activeConversation.value = conv.id
  currentChatType.value = conv.type

  // 加载该会话的历史消息
  messages.value = conversationMessages[conv.id] || []
  scrollToBottom()

  // 如果切换到群聊或私聊，确保WebSocket已连接
  if ((conv.type === 'group' || conv.type === 'private') && !wsConnected.value) {
    initWebSocket()
  }
}

// 创建私聊会话
const startPrivateChat = (user: User) => {
  userSelectDialogVisible.value = false
  userSearchKeyword.value = ''

  // 检查是否已经存在与该用户的私聊会话
  let conv = conversations.value.find(c =>
    c.type === 'private' &&
    c.memberIds?.includes(user.id) &&
    c.memberIds?.includes(userStore.userInfo?.id || '')
  )

  if (!conv) {
    // 关键修复：使用统一的会话ID格式 private_${对方用户ID}
    // 这样会话ID、存储键、显示都使用同一个标识符
    const conversationId = `private_${user.id}`
    conv = {
      id: conversationId,
      name: user.name,
      type: 'private',
      lastMessage: '',
      memberIds: [userStore.userInfo?.id || '', user.id] // 添加成员ID列表
    }
    conversations.value.push(conv)
    console.log('[创建私聊] 创建会话（使用统一ID格式）:', conv)
  }

  // 切换到该会话
  switchConversation(conv)
}

// 加载用户列表
const loadUserList = async () => {
  try {
    const res = await getUserList({ page: 1, count: 100 })
    console.log('用户列表接口响应:', res)
    if (res.code === 200) {
      // 处理不同的响应格式
      if (res.data && Array.isArray(res.data)) {
        // 如果 data 直接是数组
        userList.value = res.data
      } else if (res.data && res.data.data && Array.isArray(res.data.data)) {
        // 如果 data.data 是数组
        userList.value = res.data.data
      } else if (res.data === null || res.data === undefined) {
        console.warn('用户列表为空，接口返回 null')
        userList.value = []
      } else {
        console.warn('未知的用户列表响应格式:', res.data)
        userList.value = []
      }
      console.log('加载的用户列表:', userList.value)
    }
  } catch (error) {
    console.error('加载用户列表失败:', error)
    ElMessage.error('加载用户列表失败')
  }
}

// 处理菜单命令
const handleMenuCommand = (command: string) => {
  if (command === 'ai') {
    switchConversation(conversations.value[0])
  } else if (command === 'group') {
    // 打开创建群聊对话框
    isCreatingGroup.value = true
    selectedUserIds.value = []
    userSearchKeyword.value = ''
    userSelectDialogVisible.value = true
  } else if (command === 'private') {
    // 打开私聊对话框
    isCreatingGroup.value = false
    selectedUserIds.value = []
    userSearchKeyword.value = ''
    userSelectDialogVisible.value = true
  }
}

// 处理用户选择
const handleUserSelect = (user: User) => {
  if (isCreatingGroup.value) {
    // 群聊模式：切换选中状态
    toggleUserSelection(user.id)
  } else {
    // 私聊模式：直接开始私聊
    startPrivateChat(user)
  }
}

// 切换用户选中状态
const toggleUserSelection = (userId: string) => {
  const index = selectedUserIds.value.indexOf(userId)
  if (index > -1) {
    selectedUserIds.value.splice(index, 1)
  } else {
    selectedUserIds.value.push(userId)
  }
}

// 创建群聊
const createGroupChat = async () => {
  if (selectedUserIds.value.length < 2) {
    ElMessage.warning('至少选择2个用户')
    return
  }

  if (!wsClient || !wsClient.isConnected) {
    ElMessage.warning('WebSocket未连接，无法创建群聊')
    return
  }

  // 生成群ID和群名称
  const groupId = `group_${Date.now()}`

  // 获取所有成员（包括创建者自己）的名称
  const allMemberIds = [userStore.userInfo?.id || '', ...selectedUserIds.value]
  const memberNames = allMemberIds
    .map(id => userList.value.find(u => u.id === id)?.name || (id === userStore.userInfo?.id ? userStore.userInfo?.name : ''))
    .filter(Boolean)
    .slice(0, 5) // 最多显示5个名字
  const groupName = memberNames.join('、') + (allMemberIds.length > 5 ? '...' : '')

  console.log('[创建群聊] 准备创建群聊:', {
    groupId,
    groupName,
    memberIds: [...selectedUserIds.value, userStore.userInfo?.id || '']
  })

  // 不在本地立即创建会话，等待 WebSocket 回传后自动创建
  // 这样可以避免创建者看到重复的群聊图标

  // 只发送一条普通群消息
  const welcomeMessage: WsMessage = {
    conversationId: groupId,
    recvId: '',
    sendId: userStore.userInfo?.id || '',
    chatType: 1, // 普通群聊消息
    content: `${userStore.userInfo?.name}创建了群聊"${groupName}"，成员：${memberNames.join('、')}${allMemberIds.length > 5 ? '...' : ''}`,
    contentType: 1
  }

  console.log('[创建群聊] 发送欢迎消息（等待WebSocket回传创建会话）:', welcomeMessage)
  wsClient.send(welcomeMessage)

  // 关闭对话框
  userSelectDialogVisible.value = false
  selectedUserIds.value = []

  ElMessage.success(`正在创建群聊"${groupName}"...`)
}

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messageListRef.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight
    }
  })
}

onMounted(() => {
  // 加载用户列表
  loadUserList()
  // 自动连接 WebSocket
  initWebSocket()
  // 默认显示AI对话
  switchConversation(conversations.value[0])
})

onBeforeUnmount(() => {
  // 断开WebSocket连接并清理所有监听器
  console.log('[组件销毁] 清理WebSocket连接')

  // 先移除消息处理器
  if (wsClient && messageHandler) {
    wsClient.offMessage(messageHandler)
    messageHandler = null
  }

  // 关闭连接
  if (wsClient) {
    wsClient.close()
    wsClient = null
  }

  wsConnected.value = false
})
</script>

<style scoped>
.chat-page {
  height: calc(100vh - 140px);
}

.chat-sidebar,
.chat-main {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chat-main :deep(.el-card__body) {
  flex: 1;
  overflow: hidden;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.conversation-list {
  overflow-y: auto;
  height: calc(100% - 60px);
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px 8px;
  font-size: 13px;
  font-weight: 600;
  color: #606266;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

.user-count {
  font-size: 12px;
  color: #909399;
  font-weight: normal;
}

.conversation-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s;
  gap: 12px;
}

.conversation-item:hover {
  background-color: #f5f7fa;
}

.conversation-item.active {
  background-color: #ecf5ff;
  border-left: 3px solid #409eff;
}


.conversation-info {
  flex: 1;
  overflow: hidden;
}

.conversation-name {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.conversation-last {
  font-size: 12px;
  color: #909399;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-info {
  flex: 1;
  overflow: hidden;
}

.user-name {
  font-size: 14px;
  color: #303133;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 0;
}

.message-item {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.message-item.self {
  flex-direction: row-reverse;
}

.message-content {
  max-width: 60%;
  display: flex;
  flex-direction: column;
}

.message-item.self .message-content {
  align-items: flex-end;
}

.message-meta {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
  font-size: 12px;
  color: #909399;
}

.message-item.self .message-meta {
  flex-direction: row-reverse;
}

.message-bubble {
  background-color: #ffffff;
  padding: 10px 14px;
  border-radius: 8px;
  word-break: break-word;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.message-item.self .message-bubble {
  background-color: #409eff;
  color: #ffffff;
}

.text-message {
  line-height: 1.5;
  white-space: pre-wrap;
}

.image-message {
  max-width: 300px;
  border-radius: 4px;
}

.message-input-area {
  border-top: 1px solid #dcdfe6;
  padding: 16px;
  background-color: #ffffff;
}

.input-toolbar {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.input-box {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.input-box :deep(.el-textarea) {
  flex: 1;
}

/* 用户选择对话框样式 */
.selected-users {
  margin-bottom: 16px;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
  min-height: 40px;
}

.user-list {
  max-height: 400px;
  overflow-y: auto;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  position: relative;
}

.user-item:hover {
  background-color: #f5f7fa;
}

.user-item.selected {
  background-color: #ecf5ff;
  border-left: 3px solid #409eff;
}

.check-icon {
  margin-left: auto;
  color: #409eff;
  font-size: 18px;
}

.user-name {
  font-size: 14px;
  color: #303133;
  flex: 1;
}

.empty-text {
  text-align: center;
  padding: 40px 0;
  color: #909399;
  font-size: 14px;
}

/* @ 提及选择器样式 */
.mention-list {
  position: absolute;
  left: 0;
  right: 50px;
  background: white;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
}

.mention-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.mention-item:hover,
.mention-item.active {
  background-color: #f5f7fa;
}

.mention-name {
  font-size: 14px;
  color: #303133;
}

.mention-empty {
  padding: 12px;
  text-align: center;
  color: #909399;
  font-size: 13px;
}
</style>
