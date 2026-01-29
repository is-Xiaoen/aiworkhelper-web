<template>
  <div class="meeting-page">
    <el-card class="meeting-container">
      <template #header>
        <div class="meeting-header">
          <span>会议助手</span>
          <el-tag type="info" size="small">AI智能纪要</el-tag>
        </div>
      </template>

      <div class="meeting-content">
        <!-- 左侧：上传区域 -->
        <div class="upload-section">
          <el-card shadow="hover">
            <template #header>
              <div class="section-title">
                <el-icon><Upload /></el-icon>
                <span>上传会议记录</span>
              </div>
            </template>

            <el-upload
              class="upload-dragger"
              drag
              :before-upload="handleUploadFile"
              :show-file-list="false"
              accept=".txt,.md,.pdf"
            >
              <el-icon class="upload-icon"><UploadFilled /></el-icon>
              <div class="upload-text">
                拖拽文件到此处或
                <em>点击上传</em>
              </div>
              <div class="upload-tip">
                支持 TXT、Markdown、PDF 格式
              </div>
            </el-upload>

            <!-- 已上传文件 -->
            <div v-if="currentFile" class="current-file">
              <div class="file-info-card">
                <el-icon class="file-icon"><Document /></el-icon>
                <div class="file-details">
                  <div class="file-name">{{ currentFile.filename }}</div>
                  <div class="file-meta">
                    <span>{{ currentFile.contentType }}</span>
                    <span>•</span>
                    <span>{{ currentFile.contentLen }} 字符</span>
                  </div>
                </div>
                <el-tag :type="getStatusType(currentFile.status)" size="small">
                  {{ getStatusText(currentFile.status) }}
                </el-tag>
              </div>

              <!-- 内容预览 -->
              <div class="file-preview">
                <div class="preview-label">内容预览</div>
                <div class="preview-content">{{ currentFile.preview }}...</div>
              </div>
            </div>
          </el-card>

          <!-- 操作按钮 -->
          <el-card v-if="currentFile" shadow="hover" class="action-card">
            <template #header>
              <div class="section-title">
                <el-icon><Operation /></el-icon>
                <span>AI 处理</span>
              </div>
            </template>

            <div class="action-buttons">
              <el-button
                type="primary"
                size="large"
                :loading="generatingSummary"
                :disabled="!currentFile"
                @click="handleGenerateSummary"
              >
                <el-icon><DocumentCopy /></el-icon>
                生成会议纪要
              </el-button>

              <el-button
                type="success"
                size="large"
                :loading="extractingTodos"
                :disabled="!currentFile"
                @click="handleExtractTodos"
              >
                <el-icon><List /></el-icon>
                提取待办事项
              </el-button>
            </div>
          </el-card>

          <!-- 使用说明 -->
          <el-card shadow="hover" class="tips-card">
            <template #header>
              <div class="section-title">
                <el-icon><InfoFilled /></el-icon>
                <span>使用说明</span>
              </div>
            </template>
            <div class="tips-content">
              <p>1. 上传会议记录文件（支持文本、Markdown、PDF）</p>
              <p>2. 点击"生成会议纪要"获取结构化纪要</p>
              <p>3. 点击"提取待办事项"自动识别任务</p>
              <p>4. 可将待办一键添加到待办管理</p>
            </div>
          </el-card>
        </div>

        <!-- 右侧：结果展示区域 -->
        <div class="result-section">
          <el-card class="result-card" :body-style="{ padding: 0, display: 'flex', flexDirection: 'column', flex: 1 }">
            <template #header>
              <div class="result-header">
                <el-tabs v-model="activeTab" class="result-tabs">
                  <el-tab-pane label="会议纪要" name="summary">
                    <template #label>
                      <span>
                        <el-icon><DocumentCopy /></el-icon>
                        会议纪要
                      </span>
                    </template>
                  </el-tab-pane>
                  <el-tab-pane label="待办事项" name="todos">
                    <template #label>
                      <span>
                        <el-icon><List /></el-icon>
                        待办事项
                        <el-badge
                          v-if="todosResult && todosResult.todoCount > 0"
                          :value="todosResult.todoCount"
                          class="todo-badge"
                        />
                      </span>
                    </template>
                  </el-tab-pane>
                </el-tabs>
              </div>
            </template>

            <div class="result-container">
              <!-- 会议纪要结果 -->
              <div v-if="activeTab === 'summary'" class="result-content">
                <div v-if="generatingSummary" class="loading-state">
                  <el-icon class="is-loading loading-icon"><Loading /></el-icon>
                  <span>AI 正在生成会议纪要...</span>
                </div>
                <div v-else-if="summaryResult" class="summary-result">
                  <div class="result-markdown" v-html="renderedSummary"></div>
                </div>
                <div v-else class="empty-state">
                  <el-icon class="empty-icon"><DocumentCopy /></el-icon>
                  <p>上传会议记录后，点击"生成会议纪要"</p>
                  <p class="empty-hint">AI 将自动提取会议主题、参会人、讨论要点、决议等</p>
                </div>
              </div>

              <!-- 待办事项结果 -->
              <div v-if="activeTab === 'todos'" class="result-content">
                <div v-if="extractingTodos" class="loading-state">
                  <el-icon class="is-loading loading-icon"><Loading /></el-icon>
                  <span>AI 正在提取待办事项...</span>
                </div>
                <div v-else-if="todosResult && todosResult.todoItems.length > 0" class="todos-result">
                  <div class="todos-header">
                    <span>来源会议：{{ todosResult.meetingTitle || '未知' }}</span>
                    <el-button type="primary" size="small" @click="handleCreateAllTodos">
                      <el-icon><Plus /></el-icon>
                      一键创建到待办
                    </el-button>
                  </div>

                  <div class="todo-list">
                    <div
                      v-for="(todo, index) in todosResult.todoItems"
                      :key="index"
                      class="todo-item"
                    >
                      <div class="todo-header">
                        <span class="todo-priority" :class="todo.priority">
                          {{ getPriorityIcon(todo.priority) }}
                        </span>
                        <span class="todo-title">{{ todo.title }}</span>
                      </div>
                      <div v-if="todo.description" class="todo-desc">{{ todo.description }}</div>
                      <div class="todo-meta">
                        <span v-if="todo.assignee">
                          <el-icon><User /></el-icon>
                          {{ todo.assignee }}
                        </span>
                        <span v-if="todo.deadline">
                          <el-icon><Calendar /></el-icon>
                          {{ todo.deadline }}
                        </span>
                        <el-tag :type="getPriorityTagType(todo.priority)" size="small">
                          {{ getPriorityText(todo.priority) }}
                        </el-tag>
                      </div>
                      <div v-if="todo.context" class="todo-context">
                        <span class="context-label">背景：</span>
                        {{ todo.context }}
                      </div>
                    </div>
                  </div>

                  <div v-if="todosResult.notes" class="todos-notes">
                    <el-icon><InfoFilled /></el-icon>
                    {{ todosResult.notes }}
                  </div>
                </div>
                <div v-else class="empty-state">
                  <el-icon class="empty-icon"><List /></el-icon>
                  <p>上传会议记录后，点击"提取待办事项"</p>
                  <p class="empty-hint">AI 将自动识别任务、责任人、截止时间等</p>
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
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Upload,
  UploadFilled,
  Document,
  DocumentCopy,
  List,
  Operation,
  InfoFilled,
  Loading,
  Plus,
  User,
  Calendar
} from '@element-plus/icons-vue'
import { uploadMeeting, generateSummary, extractTodos } from '@/api/meeting'
import { formatMeetingSummary } from '@/utils/response-parser'
import type { MeetingRecord, MeetingSummaryResp, MeetingTodosResp, MeetingStatus } from '@/types'

// 当前上传的文件
const currentFile = ref<MeetingRecord | null>(null)

// 处理状态
const generatingSummary = ref(false)
const extractingTodos = ref(false)

// 结果数据
const summaryResult = ref<MeetingSummaryResp | null>(null)
const todosResult = ref<MeetingTodosResp | null>(null)

// 当前 Tab
const activeTab = ref<'summary' | 'todos'>('summary')

// 渲染后的纪要 HTML（简单 Markdown 转换）
const renderedSummary = computed(() => {
  if (!summaryResult.value) return ''
  const markdown = summaryResult.value.markdown || formatMeetingSummary(summaryResult.value)
  return simpleMarkdownToHtml(markdown)
})

// 简单的 Markdown 转 HTML（无需外部依赖）
function simpleMarkdownToHtml(md: string): string {
  return md
    // 转义 HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // 标题
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // 加粗
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // 斜体
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // 有序列表项
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // 无序列表项
    .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
    // 引用块
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    // 换行转段落
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    // 包装
    .replace(/^/, '<p>')
    .replace(/$/, '</p>')
}

// 获取状态类型
const getStatusType = (status: MeetingStatus) => {
  const types: Record<MeetingStatus, string> = {
    uploaded: 'info',
    processing: 'warning',
    completed: 'success',
    failed: 'danger'
  }
  return types[status] || 'info'
}

// 获取状态文本
const getStatusText = (status: MeetingStatus) => {
  const texts: Record<MeetingStatus, string> = {
    uploaded: '已上传',
    processing: '处理中',
    completed: '已完成',
    failed: '处理失败'
  }
  return texts[status] || '未知'
}

// 获取优先级图标
const getPriorityIcon = (priority: string) => {
  const icons: Record<string, string> = {
    high: '🔴',
    medium: '🟡',
    low: '🟢'
  }
  return icons[priority] || '⚪'
}

// 获取优先级标签类型
const getPriorityTagType = (priority: string) => {
  const types: Record<string, string> = {
    high: 'danger',
    medium: 'warning',
    low: 'success'
  }
  return types[priority] || 'info'
}

// 获取优先级文本
const getPriorityText = (priority: string) => {
  const texts: Record<string, string> = {
    high: '高优先级',
    medium: '中优先级',
    low: '低优先级'
  }
  return texts[priority] || '未知'
}

// 上传文件
const handleUploadFile = async (file: File) => {
  try {
    ElMessage.info('正在上传会议记录...')

    const res = await uploadMeeting(file)

    if (res.code === 200) {
      currentFile.value = {
        fileId: res.data.fileId,
        filename: res.data.filename,
        contentLen: res.data.contentLen,
        preview: res.data.preview,
        contentType: res.data.contentType,
        uploadTime: Date.now(),
        status: 'uploaded'
      }

      // 清空之前的结果
      summaryResult.value = null
      todosResult.value = null

      ElMessage.success('会议记录上传成功！')
    }
  } catch (error) {
    ElMessage.error('文件上传失败')
  }

  return false // 阻止默认上传
}

// 生成会议纪要
const handleGenerateSummary = async () => {
  if (!currentFile.value) return

  generatingSummary.value = true
  currentFile.value.status = 'processing'
  activeTab.value = 'summary'

  try {
    const res = await generateSummary({ fileId: currentFile.value.fileId })

    if (res.code === 200) {
      summaryResult.value = res.data
      currentFile.value.status = 'completed'
      ElMessage.success('会议纪要生成成功！')
    }
  } catch (error: any) {
    currentFile.value.status = 'failed'
    ElMessage.error(error?.message || '生成会议纪要失败')
  } finally {
    generatingSummary.value = false
  }
}

// 提取待办事项
const handleExtractTodos = async () => {
  if (!currentFile.value) return

  extractingTodos.value = true
  currentFile.value.status = 'processing'
  activeTab.value = 'todos'

  try {
    const res = await extractTodos({ fileId: currentFile.value.fileId })

    if (res.code === 200) {
      todosResult.value = res.data
      currentFile.value.status = 'completed'
      ElMessage.success(`成功提取 ${res.data.todoCount} 条待办事项！`)
    }
  } catch (error: any) {
    currentFile.value.status = 'failed'
    ElMessage.error(error?.message || '提取待办事项失败')
  } finally {
    extractingTodos.value = false
  }
}

// 一键创建所有待办
const handleCreateAllTodos = () => {
  if (!todosResult.value || todosResult.value.todoItems.length === 0) return

  ElMessageBox.confirm(
    `确定要将 ${todosResult.value.todoItems.length} 条待办事项添加到待办管理吗？`,
    '确认创建',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    }
  ).then(() => {
    // TODO: 调用待办创建 API
    ElMessage.success('待办事项创建功能开发中，敬请期待！')
  }).catch(() => {
    // 取消操作
  })
}
</script>

<style scoped>
.meeting-page {
  min-height: calc(100vh - 140px);
  padding-bottom: 20px;
}

.meeting-container {
  height: auto;
  min-height: 100%;
}

.meeting-container :deep(.el-card__body) {
  overflow: visible;
}

.meeting-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.meeting-content {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 20px;
  min-height: 500px;
}

.upload-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
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

.current-file {
  margin-top: 20px;
}

.file-info-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  color: #fff;
}

.file-icon {
  font-size: 32px;
}

.file-details {
  flex: 1;
}

.file-name {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.file-meta {
  font-size: 12px;
  opacity: 0.9;
  display: flex;
  gap: 8px;
}

.file-preview {
  margin-top: 12px;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.preview-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.preview-content {
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
  max-height: 100px;
  overflow: hidden;
}

.action-card {
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-buttons .el-button {
  width: 100%;
  justify-content: center;
}

.tips-card {
  margin-top: 0;
}

.tips-content {
  font-size: 13px;
  color: #606266;
  line-height: 1.8;
}

.tips-content p {
  margin: 8px 0;
}

.result-section {
  min-height: 500px;
}

.result-card {
  min-height: 500px;
  display: flex;
  flex-direction: column;
}

.result-header {
  padding: 0;
}

.result-tabs {
  margin: -12px -20px;
}

.result-tabs :deep(.el-tabs__header) {
  margin: 0;
}

.result-tabs :deep(.el-tabs__item) {
  padding: 0 20px;
  height: 48px;
  line-height: 48px;
}

.result-tabs :deep(.el-tabs__item span) {
  display: flex;
  align-items: center;
  gap: 6px;
}

.todo-badge {
  margin-left: 6px;
}

.result-container {
  flex: 1;
  overflow: visible;
  display: flex;
  flex-direction: column;
}

.result-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  min-height: 300px;
  max-height: calc(100vh - 300px);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  gap: 16px;
  color: #606266;
}

.loading-icon {
  font-size: 32px;
  color: #409eff;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #909399;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-hint {
  font-size: 12px;
  margin-top: 8px;
}

.summary-result {
  background-color: #fff;
}

.result-markdown {
  line-height: 1.8;
  color: #303133;
}

.result-markdown :deep(h2) {
  font-size: 20px;
  border-bottom: 2px solid #409eff;
  padding-bottom: 8px;
  margin-bottom: 16px;
}

.result-markdown :deep(h3) {
  font-size: 16px;
  margin-top: 20px;
  margin-bottom: 12px;
  color: #303133;
}

.result-markdown :deep(p) {
  margin: 8px 0;
}

.result-markdown :deep(ol),
.result-markdown :deep(ul) {
  padding-left: 20px;
  margin: 8px 0;
}

.result-markdown :deep(li) {
  margin: 4px 0;
}

.todos-result {
  background-color: #fff;
}

.todos-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
  color: #606266;
  font-size: 14px;
}

.todo-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.todo-item {
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 8px;
  border-left: 4px solid #409eff;
  transition: all 0.2s;
}

.todo-item:hover {
  background-color: #ecf5ff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.todo-item .todo-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.todo-priority {
  font-size: 16px;
}

.todo-title {
  font-size: 15px;
  font-weight: 500;
  color: #303133;
}

.todo-desc {
  font-size: 13px;
  color: #606266;
  margin-bottom: 12px;
  padding: 8px 12px;
  background-color: #fff;
  border-radius: 4px;
}

.todo-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 13px;
  color: #909399;
}

.todo-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.todo-context {
  margin-top: 12px;
  font-size: 12px;
  color: #909399;
  padding: 8px;
  background-color: #fafafa;
  border-radius: 4px;
}

.context-label {
  font-weight: 500;
}

.todos-notes {
  margin-top: 16px;
  padding: 12px;
  background-color: #fdf6ec;
  border-radius: 4px;
  font-size: 13px;
  color: #e6a23c;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 响应式 */
@media (max-width: 1200px) {
  .meeting-content {
    grid-template-columns: 300px 1fr;
  }
}

@media (max-width: 900px) {
  .meeting-content {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .result-section {
    min-height: 400px;
  }

  .result-content {
    max-height: none;
  }
}
</style>
