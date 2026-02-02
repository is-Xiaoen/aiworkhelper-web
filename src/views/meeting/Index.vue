<template>
  <div class="page-wrapper meeting-page">
    <!-- 背景装饰 -->
    <div class="page-blob page-blob-1"></div>
    <div class="page-blob page-blob-2"></div>

    <div class="page-content">
      <!-- 页面头部 -->
      <div class="page-header">
        <div class="page-header-info">
          <h1>会议助手</h1>
          <p>AI 智能会议纪要生成与待办事项提取</p>
        </div>
        <div class="header-badge">
          <span class="badge-dot"></span>
          <span>AI 智能处理</span>
        </div>
      </div>

      <!-- 统计卡片 -->
      <div class="stats-grid" v-if="currentFile">
        <div class="stat-card">
          <div class="stat-icon file">
            <span class="icon-shape"></span>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ currentFile.filename }}</div>
            <div class="stat-label">当前文件</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon chars">
            <span class="icon-shape"></span>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ currentFile.contentLen.toLocaleString() }}</div>
            <div class="stat-label">字符数</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" :class="currentFile.status">
            <span class="icon-shape"></span>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ getStatusText(currentFile.status) }}</div>
            <div class="stat-label">处理状态</div>
          </div>
        </div>
      </div>

      <!-- 主内容区 -->
      <div class="meeting-content">
        <!-- 左侧：上传与操作区 -->
        <div class="left-panel">
          <!-- 上传卡片 -->
          <div class="glass-card upload-card">
            <div class="panel-header">
              <h3 class="panel-title">
                <span class="panel-title-marker"></span>
                上传会议记录
              </h3>
            </div>

            <el-upload
              class="upload-area"
              drag
              :before-upload="handleUploadFile"
              :show-file-list="false"
              accept=".txt,.md,.pdf"
            >
              <div class="upload-inner">
                <div class="upload-icon">
                  <span class="upload-arrow"></span>
                </div>
                <div class="upload-text">
                  拖拽文件到此处或<em>点击上传</em>
                </div>
                <div class="upload-tip">
                  支持 TXT、Markdown、PDF 格式
                </div>
              </div>
            </el-upload>

            <!-- 文件预览 -->
            <div v-if="currentFile" class="file-preview">
              <div class="preview-header">
                <span class="preview-label">内容预览</span>
                <span class="file-type-badge">{{ currentFile.contentType }}</span>
              </div>
              <div class="preview-content">{{ currentFile.preview }}...</div>
            </div>
          </div>

          <!-- 操作卡片 -->
          <div class="glass-card action-card" v-if="currentFile">
            <div class="panel-header">
              <h3 class="panel-title">
                <span class="panel-title-marker"></span>
                AI 处理
              </h3>
            </div>

            <div class="action-buttons">
              <button
                class="action-btn primary"
                :class="{ loading: generatingSummary }"
                :disabled="!currentFile || generatingSummary"
                @click="handleGenerateSummary"
              >
                <span class="btn-loading" v-if="generatingSummary"></span>
                <span>{{ generatingSummary ? '生成中...' : '生成会议纪要' }}</span>
              </button>

              <button
                class="action-btn success"
                :class="{ loading: extractingTodos }"
                :disabled="!currentFile || extractingTodos"
                @click="handleExtractTodos"
              >
                <span class="btn-loading" v-if="extractingTodos"></span>
                <span>{{ extractingTodos ? '提取中...' : '提取待办事项' }}</span>
              </button>
            </div>
          </div>

          <!-- 使用说明 -->
          <div class="glass-card tips-card">
            <div class="panel-header">
              <h3 class="panel-title">
                <span class="panel-title-marker"></span>
                使用说明
              </h3>
            </div>
            <div class="tips-list">
              <div class="tip-item">
                <span class="tip-number">1</span>
                <span>上传会议记录文件（支持文本、Markdown、PDF）</span>
              </div>
              <div class="tip-item">
                <span class="tip-number">2</span>
                <span>点击"生成会议纪要"获取结构化纪要</span>
              </div>
              <div class="tip-item">
                <span class="tip-number">3</span>
                <span>点击"提取待办事项"自动识别任务</span>
              </div>
              <div class="tip-item">
                <span class="tip-number">4</span>
                <span>可将待办一键添加到待办管理</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：结果展示区 -->
        <div class="right-panel">
          <div class="glass-card result-card">
            <!-- Tab 切换 -->
            <div class="result-tabs">
              <button
                class="tab-btn"
                :class="{ active: activeTab === 'summary' }"
                @click="activeTab = 'summary'"
              >
                <span>会议纪要</span>
              </button>
              <button
                class="tab-btn"
                :class="{ active: activeTab === 'todos' }"
                @click="activeTab = 'todos'"
              >
                <span>待办事项</span>
                <span v-if="todosResult && todosResult.todoCount > 0" class="tab-badge">
                  {{ todosResult.todoCount }}
                </span>
              </button>
            </div>

            <div class="result-body">
              <!-- 会议纪要 -->
              <div v-if="activeTab === 'summary'" class="result-content">
                <!-- 加载状态 -->
                <div v-if="generatingSummary" class="loading-state">
                  <div class="loading-spinner"></div>
                  <span>AI 正在生成会议纪要...</span>
                </div>
                <!-- 结果内容 -->
                <div v-else-if="summaryResult" class="summary-content">
                  <div class="markdown-body" v-html="renderedSummary"></div>
                </div>
                <!-- 空状态 -->
                <div v-else class="empty-state">
                  <div class="empty-icon">
                    <span class="empty-doc"></span>
                  </div>
                  <p class="empty-title">暂无会议纪要</p>
                  <p class="empty-desc">上传会议记录后，点击"生成会议纪要"</p>
                </div>
              </div>

              <!-- 待办事项 -->
              <div v-if="activeTab === 'todos'" class="result-content">
                <!-- 加载状态 -->
                <div v-if="extractingTodos" class="loading-state">
                  <div class="loading-spinner"></div>
                  <span>AI 正在提取待办事项...</span>
                </div>
                <!-- 结果内容 -->
                <div v-else-if="todosResult && todosResult.todoItems.length > 0" class="todos-content">
                  <div class="todos-header">
                    <span class="meeting-source">来源会议：{{ todosResult.meetingTitle || '未知' }}</span>
                    <button class="create-all-btn" @click="handleCreateAllTodos">
                      一键创建到待办
                    </button>
                  </div>

                  <div class="todo-list">
                    <div
                      v-for="(todo, index) in todosResult.todoItems"
                      :key="index"
                      class="todo-item"
                      :class="todo.priority"
                    >
                      <div class="todo-header">
                        <span class="priority-dot"></span>
                        <span class="todo-title">{{ todo.title }}</span>
                        <span class="priority-tag" :class="todo.priority">
                          {{ getPriorityText(todo.priority) }}
                        </span>
                      </div>
                      <div v-if="todo.description" class="todo-desc">{{ todo.description }}</div>
                      <div class="todo-meta">
                        <span v-if="todo.assignee" class="meta-item">
                          <span class="meta-label">负责人</span>
                          {{ todo.assignee }}
                        </span>
                        <span v-if="todo.deadline" class="meta-item">
                          <span class="meta-label">截止</span>
                          {{ todo.deadline }}
                        </span>
                      </div>
                      <div v-if="todo.context" class="todo-context">
                        <span class="context-label">背景：</span>{{ todo.context }}
                      </div>
                    </div>
                  </div>

                  <div v-if="todosResult.notes" class="todos-notes">
                    {{ todosResult.notes }}
                  </div>
                </div>
                <!-- 空状态 -->
                <div v-else class="empty-state">
                  <div class="empty-icon">
                    <span class="empty-check"></span>
                  </div>
                  <p class="empty-title">暂无待办事项</p>
                  <p class="empty-desc">上传会议记录后，点击"提取待办事项"</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
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

// 渲染后的纪要 HTML
const renderedSummary = computed(() => {
  if (!summaryResult.value) return ''
  const markdown = summaryResult.value.markdown || formatMeetingSummary(summaryResult.value)
  return simpleMarkdownToHtml(markdown)
})

// 简单的 Markdown 转 HTML
function simpleMarkdownToHtml(md: string): string {
  return md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>')
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

// 获取优先级文本
const getPriorityText = (priority: string) => {
  const texts: Record<string, string> = {
    high: '高优',
    medium: '中优',
    low: '低优'
  }
  return texts[priority] || '普通'
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
      summaryResult.value = null
      todosResult.value = null
      ElMessage.success('会议记录上传成功！')
    }
  } catch (error) {
    ElMessage.error('文件上传失败')
  }
  return false
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
    ElMessage.success('待办事项创建功能开发中，敬请期待！')
  }).catch(() => {})
}
</script>

<style scoped>
.meeting-page {
  min-height: 100%;
}

/* 页面头部徽章 */
.header-badge {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  background: var(--glass-bg);
  backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-round);
  font-size: 14px;
  color: var(--color-primary);
  font-weight: 500;
}

.badge-dot {
  width: 8px;
  height: 8px;
  background: var(--color-success);
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon.file {
  background: var(--color-info-light);
}

.stat-icon.file .icon-shape {
  width: 24px;
  height: 28px;
  background: var(--color-info-dark);
  border-radius: 2px 6px 2px 2px;
  position: relative;
}

.stat-icon.file .icon-shape::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 8px;
  height: 8px;
  background: var(--color-info-light);
  border-bottom-left-radius: 2px;
}

.stat-icon.chars {
  background: var(--color-success-light);
}

.stat-icon.chars .icon-shape {
  width: 20px;
  height: 20px;
  border: 3px solid var(--color-success-dark);
  border-radius: 50%;
  position: relative;
}

.stat-icon.chars .icon-shape::after {
  content: '';
  position: absolute;
  bottom: -6px;
  right: -4px;
  width: 10px;
  height: 3px;
  background: var(--color-success-dark);
  transform: rotate(45deg);
}

.stat-icon.uploaded {
  background: var(--color-secondary-light);
}

.stat-icon.uploaded .icon-shape {
  width: 20px;
  height: 20px;
  border: 3px solid var(--color-primary);
  border-top-color: transparent;
  border-radius: 50%;
}

.stat-icon.processing {
  background: var(--color-warning-light);
}

.stat-icon.processing .icon-shape {
  width: 20px;
  height: 20px;
  border: 3px solid var(--color-warning-dark);
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.stat-icon.completed {
  background: var(--color-success-light);
}

.stat-icon.completed .icon-shape {
  width: 12px;
  height: 20px;
  border-right: 4px solid var(--color-success-dark);
  border-bottom: 4px solid var(--color-success-dark);
  transform: rotate(45deg) translateY(-2px);
}

.stat-icon.failed {
  background: var(--color-danger-light);
}

.stat-icon.failed .icon-shape {
  width: 20px;
  height: 20px;
  position: relative;
}

.stat-icon.failed .icon-shape::before,
.stat-icon.failed .icon-shape::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 4px;
  background: var(--color-danger-dark);
  border-radius: 2px;
}

.stat-icon.failed .icon-shape::before {
  transform: translate(-50%, -50%) rotate(45deg);
}

.stat-icon.failed .icon-shape::after {
  transform: translate(-50%, -50%) rotate(-45deg);
}

.stat-info {
  flex: 1;
  min-width: 0;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 4px;
}

/* 主内容布局 */
.meeting-content {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 24px;
  min-height: 500px;
}

.left-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.right-panel {
  min-height: 500px;
}

/* 上传区域 */
.upload-card {
  padding: 24px;
}

.upload-area {
  width: 100%;
}

.upload-area :deep(.el-upload) {
  width: 100%;
}

.upload-area :deep(.el-upload-dragger) {
  width: 100%;
  border: 2px dashed var(--border-light);
  border-radius: var(--radius-lg);
  background: var(--bg-overlay);
  padding: 40px 20px;
  transition: all 0.3s;
}

.upload-area :deep(.el-upload-dragger:hover) {
  border-color: var(--color-primary);
  background: var(--color-secondary-light);
}

.upload-inner {
  text-align: center;
}

.upload-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 20px;
  background: var(--color-secondary-light);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-arrow {
  width: 24px;
  height: 24px;
  position: relative;
}

.upload-arrow::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 16px;
  background: var(--color-primary);
  border-radius: 2px;
}

.upload-arrow::after {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 10px solid var(--color-primary);
}

.upload-text {
  font-size: 15px;
  color: var(--text-regular);
  margin-bottom: 8px;
}

.upload-text em {
  color: var(--color-info);
  font-style: normal;
  font-weight: 500;
}

.upload-tip {
  font-size: 13px;
  color: var(--text-secondary);
}

/* 文件预览 */
.file-preview {
  margin-top: 20px;
  padding: 16px;
  background: var(--bg-overlay);
  border-radius: var(--radius-base);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.preview-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.file-type-badge {
  font-size: 12px;
  padding: 2px 8px;
  background: var(--color-info-light);
  color: var(--color-info-dark);
  border-radius: var(--radius-sm);
}

.preview-content {
  font-size: 13px;
  color: var(--text-regular);
  line-height: 1.7;
  max-height: 100px;
  overflow: hidden;
}

/* 操作按钮 */
.action-card {
  padding: 24px;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 14px 20px;
  border: none;
  border-radius: var(--radius-base);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn.primary {
  background: var(--color-primary);
  color: #fff;
}

.action-btn.primary:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.action-btn.success {
  background: var(--color-success);
  color: #fff;
}

.action-btn.success:hover:not(:disabled) {
  background: var(--color-success-dark);
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-loading {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* 使用说明 */
.tips-card {
  padding: 24px;
}

.tips-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  font-size: 14px;
  color: var(--text-regular);
  line-height: 1.6;
}

.tip-number {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-secondary-light);
  color: var(--color-primary);
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

/* 结果区域 */
.result-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
}

.result-tabs {
  display: flex;
  border-bottom: 1px solid var(--border-lighter);
  padding: 0 24px;
  background: var(--bg-overlay);
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 24px;
  border: none;
  background: transparent;
  font-size: 15px;
  color: var(--text-secondary);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: var(--color-primary);
}

.tab-btn.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
  font-weight: 500;
}

.tab-badge {
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: var(--color-danger);
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.result-body {
  flex: 1;
  overflow-y: auto;
}

.result-content {
  padding: 24px;
  min-height: 400px;
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  gap: 20px;
  color: var(--text-secondary);
  font-size: 15px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-light);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  text-align: center;
}

.empty-icon {
  width: 80px;
  height: 80px;
  margin-bottom: 20px;
  background: var(--bg-overlay);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-doc {
  width: 32px;
  height: 40px;
  background: var(--border-light);
  border-radius: 3px 8px 3px 3px;
  position: relative;
}

.empty-doc::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 12px;
  height: 12px;
  background: var(--bg-overlay);
  border-bottom-left-radius: 3px;
}

.empty-doc::after {
  content: '';
  position: absolute;
  top: 18px;
  left: 6px;
  width: 20px;
  height: 3px;
  background: var(--border-base);
  border-radius: 1px;
  box-shadow: 0 6px 0 var(--border-base), 0 12px 0 var(--border-base);
}

.empty-check {
  width: 16px;
  height: 28px;
  border-right: 4px solid var(--border-light);
  border-bottom: 4px solid var(--border-light);
  transform: rotate(45deg) translateY(-4px);
}

.empty-title {
  font-size: 16px;
  color: var(--text-primary);
  margin: 0 0 8px;
}

.empty-desc {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

/* 会议纪要 Markdown */
.markdown-body {
  line-height: 1.8;
  color: var(--text-primary);
}

.markdown-body :deep(h1) {
  font-size: 22px;
  color: var(--color-primary);
  border-bottom: 2px solid var(--color-primary);
  padding-bottom: 10px;
  margin-bottom: 20px;
}

.markdown-body :deep(h2) {
  font-size: 18px;
  color: var(--color-primary);
  margin-top: 24px;
  margin-bottom: 12px;
}

.markdown-body :deep(h3) {
  font-size: 16px;
  color: var(--text-primary);
  margin-top: 20px;
  margin-bottom: 10px;
}

.markdown-body :deep(p) {
  margin: 10px 0;
}

.markdown-body :deep(li) {
  margin: 6px 0;
  padding-left: 8px;
}

.markdown-body :deep(blockquote) {
  margin: 16px 0;
  padding: 12px 16px;
  background: var(--bg-overlay);
  border-left: 4px solid var(--color-primary);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  color: var(--text-regular);
}

.markdown-body :deep(strong) {
  color: var(--color-primary);
}

/* 待办事项 */
.todos-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.todos-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-lighter);
}

.meeting-source {
  font-size: 14px;
  color: var(--text-secondary);
}

.create-all-btn {
  padding: 8px 16px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-base);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.create-all-btn:hover {
  background: var(--color-primary-dark);
}

.todo-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.todo-item {
  padding: 16px 20px;
  background: var(--bg-overlay);
  border-radius: var(--radius-base);
  border-left: 4px solid var(--border-base);
  transition: all 0.2s;
}

.todo-item:hover {
  background: var(--bg-hover);
  box-shadow: var(--shadow-sm);
}

.todo-item.high {
  border-left-color: var(--color-danger);
}

.todo-item.medium {
  border-left-color: var(--color-warning);
}

.todo-item.low {
  border-left-color: var(--color-success);
}

.todo-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.priority-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--border-base);
}

.todo-item.high .priority-dot {
  background: var(--color-danger);
}

.todo-item.medium .priority-dot {
  background: var(--color-warning);
}

.todo-item.low .priority-dot {
  background: var(--color-success);
}

.todo-title {
  flex: 1;
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
}

.priority-tag {
  padding: 2px 10px;
  font-size: 12px;
  border-radius: var(--radius-sm);
  background: var(--bg-overlay);
  color: var(--text-secondary);
}

.priority-tag.high {
  background: var(--color-danger-light);
  color: var(--color-danger-dark);
}

.priority-tag.medium {
  background: var(--color-warning-light);
  color: var(--color-warning-dark);
}

.priority-tag.low {
  background: var(--color-success-light);
  color: var(--color-success-dark);
}

.todo-desc {
  font-size: 14px;
  color: var(--text-regular);
  margin-bottom: 12px;
  padding: 10px 12px;
  background: var(--bg-card);
  border-radius: var(--radius-sm);
  line-height: 1.6;
}

.todo-meta {
  display: flex;
  align-items: center;
  gap: 20px;
  font-size: 13px;
  color: var(--text-primary);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.meta-label {
  color: var(--text-secondary);
}

.todo-context {
  margin-top: 12px;
  padding: 10px 12px;
  background: var(--color-secondary-light);
  border-radius: var(--radius-sm);
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.context-label {
  font-weight: 500;
  color: var(--text-regular);
}

.todos-notes {
  padding: 14px 16px;
  background: var(--color-warning-light);
  border-radius: var(--radius-base);
  font-size: 14px;
  color: var(--color-warning-dark);
  line-height: 1.6;
}

/* 响应式 */
@media (max-width: 1200px) {
  .meeting-content {
    grid-template-columns: 340px 1fr;
  }
}

@media (max-width: 992px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .meeting-content {
    grid-template-columns: 1fr;
  }

  .right-panel {
    min-height: 400px;
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-badge {
    align-self: flex-start;
  }
}
</style>
