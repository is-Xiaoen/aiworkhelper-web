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

            <!-- 群聊 -->
            <div
              :class="['conversation-item', { active: activeConversation === 'all' }]"
              @click="switchConversation(conversations[1])"
            >
              <el-avatar :size="40" style="background-color: #67c23a;">群</el-avatar>
              <div class="conversation-info">
                <div class="conversation-name">群聊</div>
                <div class="conversation-last">{{ conversations[1].lastMessage || '暂无消息' }}</div>
              </div>
            </div>

            <!-- 已有私聊会话列表（按最新消息时间排序） -->
            <div
              v-for="conv in sortedPrivateConversations"
              :key="conv.id"
              :class="['conversation-item', 'user-item', {
                active: activeConversation === conv.id,
                'user-offline': !isUserOnline(conv.id.replace('private_', ''))
              }]"
              @click="switchConversation(conv)"
            >
              <div class="user-avatar-wrapper">
                <el-avatar :size="40">{{ conv.name[0] }}</el-avatar>
                <span :class="['user-status-dot', { online: isUserOnline(conv.id.replace('private_', '')) }]"></span>
              </div>
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
              :class="['conversation-item', 'user-item', {
                active: activeConversation === `private_${user.id}`,
                'user-offline': !isUserOnline(user.id)
              }]"
              @click="startPrivateChatWithUser(user)"
            >
              <div class="user-avatar-wrapper">
                <el-avatar :size="40">{{ user.name[0] }}</el-avatar>
                <span :class="['user-status-dot', { online: isUserOnline(user.id) }]"></span>
              </div>
              <div class="conversation-info">
                <div class="conversation-name">{{ user.name }}</div>
                <div class="user-status-text">
                  {{ isUserOnline(user.id) ? '在线' : '离线' }}
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧聊天区域 -->
      <el-col :xs="24" :sm="16" :md="18" style="height: 100%;">
        <el-card class="chat-main" body-style="padding: 0; height: 100%;">
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
                v-for="(msg, index) in messages"
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
              <div class="input-toolbar">
                <el-upload
                  :show-file-list="false"
                  :before-upload="handleUploadImage"
                  accept="image/*"
                >
                  <el-button circle size="small">
                    <el-icon><Picture /></el-icon>
                  </el-button>
                </el-upload>

                <el-select
                  v-if="currentChatType === 'ai'"
                  v-model="aiChatType"
                  size="small"
                  style="width: 150px; margin-left: 10px;"
                >
                  <el-option label="默认对话" :value="0" />
                  <el-option label="待办查询" :value="1" />
                  <el-option label="待办添加" :value="2" />
                  <el-option label="审批查询" :value="3" />
                  <el-option label="群消息总结" :value="4" />
                </el-select>
              </div>

              <div class="input-box">
                <el-input
                  v-model="inputMessage"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入消息..."
                  @keydown.enter.ctrl="handleSend"
                />
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
      title="选择用户"
      width="500px"
    >
      <el-input
        v-model="userSearchKeyword"
        placeholder="搜索用户"
        prefix-icon="Search"
        style="margin-bottom: 16px;"
      />
      <div class="user-list">
        <div
          v-for="user in filteredUsers"
          :key="user.id"
          class="user-item"
          @click="startPrivateChat(user)"
        >
          <el-avatar :size="36">{{ user.name[0] }}</el-avatar>
          <span class="user-name">{{ user.name }}</span>
        </div>
      </div>
      <div v-if="filteredUsers.length === 0" class="empty-text">
        暂无用户
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Picture, Loading } from '@element-plus/icons-vue'
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
}

const messageListRef = ref<HTMLElement>()
const messages = ref<Message[]>([])
const inputMessage = ref('')
const sending = ref(false)
const aiLoading = ref(false)

// 用户列表相关
const userList = ref<User[]>([])
const userSelectDialogVisible = ref(false)
const userSearchKeyword = ref('')

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
  },
  {
    id: 'all',
    name: '群聊',
    type: 'group',
    lastMessage: ''
  }
])

const activeConversation = ref('ai')
const currentChatType = ref<'ai' | 'group' | 'private'>('ai')
const aiChatType = ref(0)

const currentConversationName = computed(() => {
  return conversations.value.find(c => c.id === activeConversation.value)?.name || ''
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

// 没有私聊会话的用户列表
const usersWithoutConversation = computed(() => {
  const privateConvIds = conversations.value
    .filter(c => c.type === 'private')
    .map(c => c.id.replace('private_', ''))

  return userList.value.filter(u =>
    u.id !== userStore.userInfo?.id && !privateConvIds.includes(u.id)
  )
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

    // 创建消息处理器并保存引用
    messageHandler = (message: WsMessage) => {
      handleReceiveMessage(message)
    }

    // 监听消息（只添加一次）
    console.log('[WebSocket] 添加消息监听器')
    wsClient.onMessage(messageHandler)

    ElMessage.success('WebSocket连接成功')
  } catch (error) {
    console.error('WebSocket连接失败:', error)
    ElMessage.error('WebSocket连接失败')
  }
}

// 接收消息
const handleReceiveMessage = (wsMessage: WsMessage) => {
  console.log('[接收消息] 收到WebSocket消息:', wsMessage)

  // 获取发送者名称
  const senderUser = userList.value.find(u => u.id === wsMessage.sendId)
  const senderName = wsMessage.sendId === userStore.userInfo?.id
    ? '我'
    : (senderUser?.name || '用户' + wsMessage.sendId.slice(0, 4))

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
    const convId = 'all'
    if (!conversationMessages[convId]) {
      conversationMessages[convId] = []
    }

    // 去重检查：检查最近的消息中是否有相同内容的消息（防止乐观更新和WebSocket回传重复）
    const recentMessages = conversationMessages[convId].slice(-10) // 只检查最近10条
    const isDuplicate = recentMessages.some(m =>
      m.sendId === message.sendId &&
      m.content === message.content &&
      m.contentType === message.contentType &&
      Math.abs(m.time - message.time) < 3 // 3秒内的相同消息视为重复
    )

    console.log('[接收消息] 群聊消息处理:', {
      convId,
      isDuplicate,
      当前会话: activeConversation.value,
      是否在当前会话: activeConversation.value === convId,
      消息内容: message.content
    })

    if (!isDuplicate) {
      conversationMessages[convId].push(message)

      // 更新会话列表的最后一条消息
      const conv = conversations.value.find(c => c.id === convId)
      if (conv) {
        conv.lastMessage = message.contentType === 1 ? message.content : '[图片]'
      }

      // 如果当前在该会话，更新消息列表并滚动
      if (activeConversation.value === convId) {
        console.log('[接收消息] 添加消息到当前显示列表')
        messages.value.push(message)
        scrollToBottom()
      } else {
        console.log('[接收消息] 不在当前会话，消息已保存但不显示')
      }
    } else {
      console.log('[接收消息] 检测到重复消息，已忽略')
    }
  } else if (wsMessage.chatType === 2) {
    // 私聊消息处理
    // 确定对话的另一方用户ID
    const otherUserId = wsMessage.sendId === userStore.userInfo?.id ? wsMessage.recvId : wsMessage.sendId
    const convId = `private_${otherUserId}`

    console.log('[接收消息] 私聊消息:', {
      后端conversationId: wsMessage.conversationId,
      计算后的convId: convId,
      sendId: wsMessage.sendId,
      recvId: wsMessage.recvId,
      当前用户ID: userStore.userInfo?.id,
      对方用户ID: otherUserId,
      消息内容: wsMessage.content,
      是自己发的: wsMessage.sendId === userStore.userInfo?.id
    })

    if (!conversationMessages[convId]) {
      conversationMessages[convId] = []
    }

    // 去重检查：私聊消息也需要去重
    const recentMessages = conversationMessages[convId].slice(-10)
    const isDuplicate = recentMessages.some(m =>
      m.sendId === message.sendId &&
      m.content === message.content &&
      m.contentType === message.contentType &&
      Math.abs(m.time - message.time) < 3
    )

    if (isDuplicate) {
      console.log('[接收消息] 检测到重复的私聊消息，已忽略')
      return
    }

    conversationMessages[convId].push(message)

    // 查找或创建私聊会话
    let conv = conversations.value.find(c => c.id === convId)
    if (!conv) {
      // 从convId中提取对方用户ID
      const otherUserId = convId.replace('private_', '')
      const otherUser = userList.value.find(u => u.id === otherUserId)
      conv = {
        id: convId,
        name: otherUser?.name || '用户' + otherUserId.slice(0, 4),
        type: 'private',
        lastMessage: message.contentType === 1 ? message.content : '[图片]'
      }
      conversations.value.push(conv)
      console.log('[接收消息] 创建新的私聊会话:', conv)
    } else {
      conv.lastMessage = message.contentType === 1 ? message.content : '[图片]'
      console.log('[接收消息] 更新已有私聊会话:', conv)
    }

    // 如果当前在该会话，更新消息列表并滚动
    if (activeConversation.value === convId) {
      console.log('[接收消息] 添加私聊消息到当前显示列表')
      messages.value.push(message)
      scrollToBottom()
    } else {
      console.log('[接收消息] 不在当前会话，私聊消息已保存但不显示')
    }
  }
}

// 发送消息
const handleSend = async () => {
  if (!inputMessage.value.trim()) return

  if (currentChatType.value === 'ai') {
    // AI对话
    await sendAIMessage()
  } else if (currentChatType.value === 'group') {
    // 群聊 - 检查是否 @AI
    const content = inputMessage.value.trim()
    if (content.startsWith('@AI') || content.startsWith('@ai')) {
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
      // 添加AI回复
      messages.value.push({
        sendId: 'ai',
        senderName: 'AI助手',
        content: typeof res.data.data === 'string' ? res.data.data : JSON.stringify(res.data.data, null, 2),
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

  const wsMessage: WsMessage = {
    conversationId: 'all',
    recvId: '',
    sendId: userStore.userInfo?.id || '',
    chatType: 1,
    content,
    contentType: 1
  }

  wsClient.send(wsMessage)
  inputMessage.value = ''

  // 立即添加到本地消息列表(乐观更新)
  const message: Message = {
    sendId: userStore.userInfo?.id || '',
    senderName: '我',
    content,
    contentType: 1,
    time: Date.now() / 1000,
    isSelf: true
  }

  // 添加到会话消息记录
  const convId = 'all'
  if (!conversationMessages[convId]) {
    conversationMessages[convId] = []
  }
  conversationMessages[convId].push(message)

  // 添加到当前显示的消息列表
  messages.value.push(message)
  scrollToBottom()
}

// 在群聊中 @AI
const sendAIMessageInGroup = async () => {
  const content = inputMessage.value.trim()
  if (!content) return

  // 移除 @AI 前缀
  const prompt = content.replace(/^@AI\s*/i, '')

  // 先发送用户消息到群聊
  if (wsClient && wsClient.isConnected) {
    const wsMessage: WsMessage = {
      conversationId: 'all',
      recvId: '',
      sendId: userStore.userInfo?.id || '',
      chatType: 1,
      content,
      contentType: 1
    }
    wsClient.send(wsMessage)
    console.log('群聊@AI消息已发送，等待WebSocket回传确认')
  }

  inputMessage.value = ''

  // 调用 AI 接口
  aiLoading.value = true
  try {
    const res = await chat({
      prompts: prompt,
      chatType: aiChatType.value
    })

    if (res.code === 200) {
      const aiResponse = typeof res.data.data === 'string' ? res.data.data : JSON.stringify(res.data.data, null, 2)

      // 将 AI 回复发送到群聊
      if (wsClient && wsClient.isConnected) {
        const wsMessage: WsMessage = {
          conversationId: 'all',
          recvId: '',
          sendId: 'ai',
          chatType: 1,
          content: `AI回复: ${aiResponse}`,
          contentType: 1
        }
        wsClient.send(wsMessage)
        console.log('AI回复已发送到群聊，等待WebSocket回传确认')
      }
    }
  } catch (error) {
    ElMessage.error('AI请求失败')
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

  // 从会话ID中提取接收者ID
  const recvId = activeConversation.value.replace('private_', '')

  const wsMessage: WsMessage = {
    conversationId: activeConversation.value,
    recvId,
    sendId: userStore.userInfo?.id || '',
    chatType: 2,
    content,
    contentType: 1
  }

  console.log('[发送私聊] 发送消息:', wsMessage)
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

  // 添加到会话消息记录
  const convId = activeConversation.value
  if (!conversationMessages[convId]) {
    conversationMessages[convId] = []
  }

  // 去重检查再添加
  const recentMessages = conversationMessages[convId].slice(-10)
  const isDuplicate = recentMessages.some(m =>
    m.sendId === message.sendId &&
    m.content === message.content &&
    m.contentType === message.contentType &&
    Math.abs(m.time - message.time) < 3
  )

  if (!isDuplicate) {
    console.log('[发送私聊] 乐观更新：添加到本地消息列表')
    conversationMessages[convId].push(message)
    // 添加到当前显示的消息列表
    messages.value.push(message)
    scrollToBottom()
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

  const convId = `private_${user.id}`

  // 检查会话是否已存在
  let conv = conversations.value.find(c => c.id === convId)
  if (!conv) {
    // 创建新会话
    conv = {
      id: convId,
      name: user.name,
      type: 'private',
      lastMessage: ''
    }
    conversations.value.push(conv)
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
    switchConversation(conversations.value[1])
  } else if (command === 'private') {
    userSelectDialogVisible.value = true
  }
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

/* 离线用户样式 */
.conversation-item.user-item.user-offline {
  opacity: 0.6;
  filter: grayscale(100%);
}

.conversation-item.user-item.user-offline:hover {
  opacity: 0.8;
  filter: grayscale(80%);
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

.user-status-text {
  font-size: 12px;
  color: #909399;
}

.user-avatar-wrapper {
  position: relative;
}

.user-status-dot {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid #ffffff;
  background-color: #909399;
}

.user-status-dot.online {
  background-color: #67c23a;
  box-shadow: 0 0 4px rgba(103, 194, 58, 0.5);
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

.user-status-text {
  font-size: 12px;
  color: #909399;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background-color: #f5f7fa;
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
  transition: background-color 0.2s;
}

.user-item:hover {
  background-color: #f5f7fa;
}

.user-name {
  font-size: 14px;
  color: #303133;
}

.empty-text {
  text-align: center;
  padding: 40px 0;
  color: #909399;
  font-size: 14px;
}
</style>
