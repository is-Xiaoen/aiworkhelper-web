<template>
  <div class="knowledge-page">
    <el-card class="knowledge-container">
      <template #header>
        <div class="knowledge-header">
          <span>知识库</span>
          <el-tag type="info" size="small">AI智能问答</el-tag>
        </div>
      </template>

      <div class="knowledge-content">
        <!-- 左侧：文件上传区域 -->
        <div class="upload-section">
          <el-card shadow="hover">
            <template #header>
              <div class="section-title">
                <el-icon><Upload /></el-icon>
                <span>上传文档</span>
              </div>
            </template>

            <el-upload
              class="upload-dragger"
              drag
              :before-upload="handleUploadFile"
              :show-file-list="false"
              accept=".pdf,.doc,.docx,.txt"
            >
              <el-icon class="upload-icon"><UploadFilled /></el-icon>
              <div class="upload-text">
                拖拽文件到此处或
                <em>点击上传</em>
              </div>
              <div class="upload-tip">
                支持 PDF、Word、TXT 格式文件
              </div>
            </el-upload>

            <div v-if="uploadedFiles.length > 0" class="file-list">
              <div class="file-list-header">
                <span>已上传文件</span>
                <el-tag size="small">{{ uploadedFiles.length }}</el-tag>
              </div>
              <div
                v-for="file in uploadedFiles"
                :key="file.id"
                class="file-item"
              >
                <el-icon><Document /></el-icon>
                <div class="file-info">
                  <div class="file-name">{{ file.filename }}</div>
                  <div class="file-time">{{ formatTime(file.uploadTime) }}</div>
                </div>
                <el-tag
                  v-if="file.status === 0"
                  type="warning"
                  size="small"
                >
                  处理中
                </el-tag>
                <el-tag
                  v-else-if="file.status === 1"
                  type="success"
                  size="small"
                >
                  已完成
                </el-tag>
              </div>
            </div>
          </el-card>

          <el-card shadow="hover" class="tips-card">
            <template #header>
              <div class="section-title">
                <el-icon><InfoFilled /></el-icon>
                <span>使用说明</span>
              </div>
            </template>
            <div class="tips-content">
              <p>1. 上传文档后,通过AI对话更新知识库</p>
              <p>2. ��新成功后,可询问文档相关内容</p>
              <p>3. AI会基于上传的文档进行智能回答</p>
              <p>4. 支持员工手册、规章制度等文档</p>
            </div>
          </el-card>
        </div>

        <!-- 右侧:AI 对话区域 -->
        <div class="chat-section">
          <el-card class="chat-card" body-style="padding: 0; height: 100%;">
            <template #header>
              <div class="chat-header">
                <span>AI 知识库助手</span>
                <el-tag type="success" size="small">在线</el-tag>
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
                    {{ msg.isSelf ? userStore.userInfo?.name?.[0] : 'AI' }}
                  </el-avatar>
                  <div class="message-content">
                    <div class="message-meta">
                      <span class="sender-name">{{ msg.isSelf ? '我' : 'AI助手' }}</span>
                      <span class="message-time">{{ formatMessageTime(msg.time) }}</span>
                    </div>
                    <div class="message-bubble">
                      <div class="text-message">{{ msg.content }}</div>
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
                  <el-radio-group v-model="chatMode" size="small">
                    <el-radio-button value="update">更新知识库</el-radio-button>
                    <el-radio-button value="query">查询知识</el-radio-button>
                  </el-radio-group>
                </div>

                <div class="input-box">
                  <el-input
                    ref="inputRef"
                    v-model="inputMessage"
                    type="textarea"
                    :rows="3"
                    :placeholder="chatMode === 'update' ? '例如: 根据我上传的文件更新知识库' : '请输入您的问题...'"
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
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Upload,
  UploadFilled,
  Document,
  InfoFilled,
  Loading
} from '@element-plus/icons-vue'
import { uploadKnowledgeFile, knowledgeChat } from '@/api/knowledge'
import { useUserStore } from '@/stores/user'
import dayjs from 'dayjs'
import type { KnowledgeFile } from '@/types'

const userStore = useUserStore()

interface Message {
  content: string
  time: number
  isSelf: boolean
}

const messageListRef = ref<HTMLElement>()
const inputRef = ref()
const messages = ref<Message[]>([
  {
    content: '你好!我是知识库AI助手。你可以上传文档并让我帮你更新知识库,或者直接向我询问已有知识库中的内容。',
    time: Date.now() / 1000,
    isSelf: false
  }
])
const inputMessage = ref('')
const sending = ref(false)
const aiLoading = ref(false)
const chatMode = ref<'update' | 'query'>('update') // update=更新知识库, query=查询知识
const uploadedFiles = ref<KnowledgeFile[]>([])

// 格式化时间
const formatTime = (timestamp: number) => {
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss')
}

// 格式化消息时间
const formatMessageTime = (timestamp: number) => {
  return dayjs.unix(timestamp).format('HH:mm:ss')
}

// 上传文件
const handleUploadFile = async (file: File) => {
  try {
    ElMessage.info('正在上传文件...')
    const res = await uploadKnowledgeFile(file)

    if (res.code === 200) {
      const uploadedFile: KnowledgeFile = {
        id: Date.now().toString(),
        filename: res.data.filename,
        filepath: res.data.file, // 使用相对路径,后端会自动转换为绝对路径
        uploadTime: Date.now(),
        status: 0 // 处理中
      }
      uploadedFiles.value.unshift(uploadedFile)

      ElMessage.success('文件上传成功!')

      // 自动添加提示消息
      messages.value.push({
        content: `文件 "${file.name}" 已上传成功并记住文件路径,我将帮你更新知识库。\n\n文件路径: ${uploadedFile.filepath}`,
        time: Date.now() / 1000,
        isSelf: false
      })

      // 自动填充更新命令 - 使用简单命令,后端通过记忆机制自动找到文件
      inputMessage.value = `根据我上传的文件更新知识库`
      chatMode.value = 'update'

      scrollToBottom()
    }
  } catch (error) {
    ElMessage.error('文件上传失败')
  }

  return false
}

// 发送消息
const handleSend = async () => {
  if (!inputMessage.value.trim()) return

  const content = inputMessage.value.trim()

  // 添加用户消息
  messages.value.push({
    content,
    time: Date.now() / 1000,
    isSelf: true
  })

  inputMessage.value = ''
  scrollToBottom()

  // 根据模式调用不同的AI功能
  aiLoading.value = true
  sending.value = true

  try {
    // chatType: 0 默认对话模式,后端会通过智能路由自动识别
    // 根据消息内容自动路由到 knowledge_update 或 knowledge_retrieval_qa
    const res = await knowledgeChat({
      prompts: content,
      chatType: 0
    })

    if (res.code === 200) {
      // 如果是更新知识库成功,更新文件状态
      if (chatMode.value === 'update' && res.data.data?.includes('成功')) {
        const updatingFiles = uploadedFiles.value.filter(f => f.status === 0)
        updatingFiles.forEach(f => {
          f.status = 1
        })
      }

      // 添加 AI 回复
      messages.value.push({
        content: typeof res.data.data === 'string' ? res.data.data : JSON.stringify(res.data.data, null, 2),
        time: Date.now() / 1000,
        isSelf: false
      })

      scrollToBottom()
    }
  } catch (error: any) {
    ElMessage.error(error?.message || 'AI请求失败')

    // 添加错误提示消息
    messages.value.push({
      content: '抱歉,请求失败了。请稍后重试。',
      time: Date.now() / 1000,
      isSelf: false
    })
  } finally {
    aiLoading.value = false
    sending.value = false
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
</script>

<style scoped>
.knowledge-page {
  height: calc(100vh - 140px);
}

.knowledge-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.knowledge-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.knowledge-content {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 20px;
  height: calc(100vh - 220px);
}

.upload-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.upload-dragger {
  width: 100%;
}

.upload-dragger :deep(.el-upload-dragger) {
  width: 100%;
  padding: 30px 20px;
}

.upload-icon {
  font-size: 48px;
  color: #409eff;
  margin-bottom: 12px;
}

.upload-text {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.upload-text em {
  color: #409eff;
  font-style: normal;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
}

.file-list {
  margin-top: 20px;
}

.file-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-weight: 500;
  color: #303133;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 8px;
  transition: all 0.2s;
}

.file-item:hover {
  background-color: #ecf5ff;
}

.file-info {
  flex: 1;
  overflow: hidden;
}

.file-name {
  font-size: 14px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-time {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.tips-card {
  margin-top: auto;
}

.tips-content {
  font-size: 13px;
  color: #606266;
  line-height: 1.8;
}

.tips-content p {
  margin: 8px 0;
}

.chat-section {
  height: 100%;
}

.chat-card {
  height: 100%;
  display: flex;
  flex-direction: column;
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
  max-width: 70%;
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
  padding: 12px 16px;
  border-radius: 8px;
  word-break: break-word;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.message-item.self .message-bubble {
  background-color: #409eff;
  color: #ffffff;
}

.text-message {
  line-height: 1.6;
  white-space: pre-wrap;
}

.message-input-area {
  border-top: 1px solid #dcdfe6;
  padding: 16px;
  background-color: #ffffff;
}

.input-toolbar {
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

@media (max-width: 1200px) {
  .knowledge-content {
    grid-template-columns: 300px 1fr;
  }
}

@media (max-width: 768px) {
  .knowledge-content {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .upload-section {
    max-height: 400px;
  }
}
</style>
