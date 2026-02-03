<template>
  <div class="page-wrapper knowledge-page">
    <!-- 背景装饰 -->
    <div class="page-blob page-blob-1"></div>
    <div class="page-blob page-blob-2"></div>

    <div class="page-content">
      <!-- 页面头部 -->
      <div class="page-header">
        <div class="page-header-info">
          <div class="breadcrumb">
            <span class="breadcrumb-link" @click="goBack">知识库</span>
            <span class="breadcrumb-separator">/</span>
            <span class="breadcrumb-current">{{ workspaceName }}</span>
          </div>
          <h1>{{ workspaceName }}</h1>
          <p v-if="!isUncategorized">管理此工作空间中的文档</p>
          <p v-else>未归入任何工作空间的文档</p>
        </div>
        <div class="header-actions">
          <!-- 返回按钮 -->
          <button class="secondary-btn" @click="goBack">
            <el-icon class="btn-icon"><Back /></el-icon>
            返回
          </button>
          <!-- 健康状态 -->
          <div v-if="healthData" class="health-status" :class="{ healthy: healthData.healthy }">
            <span class="health-dot"></span>
            <span class="health-text">{{ healthData.healthy ? '服务正常' : '部分异常' }}</span>
            <el-popover placement="bottom" :width="300" trigger="hover">
              <template #reference>
                <span class="health-detail">详情</span>
              </template>
              <div class="health-popover">
                <div class="health-title">索引服务状态</div>
                <div
                  v-for="(status, key) in healthData.adapters"
                  :key="key"
                  class="health-item"
                >
                  <span class="health-item-dot" :class="status.available ? 'ok' : 'error'"></span>
                  <span class="health-name">{{ status.name }}</span>
                  <span class="health-msg">{{ status.error || (status.available ? '正常' : '异常') }}</span>
                </div>
                <div v-if="!healthData.adapters || Object.keys(healthData.adapters).length === 0" class="health-empty">
                  暂无索引服务
                </div>
              </div>
            </el-popover>
          </div>
          <button class="primary-btn" @click="showUploadDialog = true">
            <span class="btn-icon upload-icon-shape"></span>
            上传文档
          </button>
        </div>
      </div>

      <!-- 统计卡片 -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon docs">
            <span class="icon-shape"></span>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ total }}</div>
            <div class="stat-label">文档总数</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon synced">
            <span class="icon-shape"></span>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ syncedCount }}</div>
            <div class="stat-label">已同步</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon pending">
            <span class="icon-shape"></span>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ pendingCount }}</div>
            <div class="stat-label">待同步</div>
          </div>
        </div>
      </div>

      <!-- 文件列表卡片 -->
      <div class="glass-card list-card">
        <div class="panel-header">
          <h3 class="panel-title">
            <span class="panel-title-marker"></span>
            文档列表
          </h3>
          <div class="panel-actions">
            <button class="refresh-btn" @click="loadFileList" :disabled="loading">
              <span class="refresh-icon" :class="{ spinning: loading }"></span>
              刷新
            </button>
          </div>
        </div>

        <!-- 骨架屏 -->
        <div v-if="loading && fileList.length === 0" class="skeleton-table">
          <div class="skeleton-header">
            <div class="skeleton-cell" style="flex: 2"></div>
            <div class="skeleton-cell" style="flex: 1"></div>
            <div class="skeleton-cell" style="flex: 1"></div>
            <div class="skeleton-cell" style="flex: 1.5"></div>
            <div class="skeleton-cell" style="flex: 1"></div>
          </div>
          <div v-for="i in 5" :key="i" class="skeleton-row">
            <div class="skeleton-cell" style="flex: 2"></div>
            <div class="skeleton-cell" style="flex: 1"></div>
            <div class="skeleton-cell" style="flex: 1"></div>
            <div class="skeleton-cell" style="flex: 1.5"></div>
            <div class="skeleton-cell" style="flex: 1"></div>
          </div>
        </div>

        <!-- 表格 -->
        <div v-else-if="fileList.length > 0" class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 30%">文档标题</th>
                <th style="width: 10%">类型</th>
                <th style="width: 10%">大小</th>
                <th style="width: 8%">分块</th>
                <th style="width: 22%">索引状态</th>
                <th style="width: 12%">上传时间</th>
                <th style="width: 8%">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in fileList" :key="row.id">
                <td>
                  <div class="file-cell">
                    <span class="file-icon"></span>
                    <span class="file-name">{{ row.title || row.filename }}</span>
                    <!-- PDF 解析状态指示器 -->
                    <span v-if="isPdfParsing(row)" class="parse-badge parsing">
                      <span class="parse-spinner"></span>
                      解析中
                    </span>
                    <span v-else-if="isPdfParseFailed(row)" class="parse-badge failed" :title="row.parseError">
                      解析失败
                    </span>
                  </div>
                </td>
                <td>
                  <span class="type-badge">{{ getFileType(row.contentType) }}</span>
                </td>
                <td class="cell-text">{{ formatFileSize(row.fileSize) }}</td>
                <td class="cell-center">
                  <span class="chunk-count">{{ row.chunkCount }}</span>
                </td>
                <td>
                  <div class="index-status">
                    <span class="status-tag" :class="getStatusClass(row.indexStatus?.meilisearch)">
                      <span class="status-dot"></span>
                      全文 {{ getStatusText(row.indexStatus?.meilisearch) }}
                    </span>
                    <span class="status-tag" :class="getStatusClass(row.indexStatus?.graphrag)">
                      <span class="status-dot"></span>
                      图谱 {{ getStatusText(row.indexStatus?.graphrag) }}
                    </span>
                  </div>
                  <div v-if="row.indexStatus?.errorMsg" class="error-msg">
                    {{ row.indexStatus.errorMsg }}
                  </div>
                </td>
                <td class="cell-text">{{ formatTime(row.createAt) }}</td>
                <td>
                  <div class="action-btns">
                    <button
                      v-if="hasIndexError(row)"
                      class="action-btn warning"
                      :disabled="reindexingIds.has(row.id)"
                      @click="handleReindex(row)"
                    >
                      {{ reindexingIds.has(row.id) ? '索引中...' : '重试' }}
                    </button>
                    <button
                      class="action-btn danger"
                      :disabled="deletingIds.has(row.id)"
                      @click="handleDeleteConfirm(row)"
                    >
                      删除
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 空状态 -->
        <div v-else class="empty-state">
          <div class="empty-icon">
            <span class="empty-doc"></span>
          </div>
          <p class="empty-title">暂无文档</p>
          <p class="empty-desc">上传文档开始构建您的知识库</p>
          <button class="primary-btn" @click="showUploadDialog = true">
            <span class="btn-icon upload-icon-shape"></span>
            上传文档
          </button>
        </div>

        <!-- 分页 -->
        <div v-if="total > 0" class="table-footer">
          <div class="table-info">共 {{ total }} 条记录</div>
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :total="total"
            :page-sizes="[10, 20, 50]"
            layout="sizes, prev, pager, next"
            @size-change="loadFileList"
            @current-change="loadFileList"
          />
        </div>
      </div>
    </div>

    <!-- 上传对话框 -->
    <el-dialog
      v-model="showUploadDialog"
      title="上传知识库文档"
      width="500px"
      class="glass-dialog"
      :close-on-click-modal="false"
    >
      <div class="upload-area">
        <el-upload
          class="upload-dragger"
          drag
          :before-upload="handleUpload"
          :show-file-list="false"
          accept=".txt,.md,.pdf"
          :disabled="uploading"
        >
          <div v-if="uploading" class="uploading-state">
            <div class="uploading-spinner"></div>
            <div class="upload-text">正在上传并索引...</div>
          </div>
          <div v-else class="upload-inner">
            <div class="upload-icon">
              <span class="upload-arrow"></span>
            </div>
            <div class="upload-text">
              拖拽文件到此处或<em>点击上传</em>
            </div>
            <div class="upload-tip">
              支持 .txt, .md, .pdf 格式文件
            </div>
          </div>
        </el-upload>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <button class="secondary-btn" @click="showUploadDialog = false" :disabled="uploading">关闭</button>
        </div>
      </template>
    </el-dialog>

    <!-- 删除确认对话框 -->
    <el-dialog
      v-model="showDeleteDialog"
      title="确认删除"
      width="400px"
      class="glass-dialog"
    >
      <p class="delete-confirm-text">确定要删除文档「{{ deleteTarget?.title || deleteTarget?.filename }}」吗？</p>
      <p class="delete-confirm-hint">删除后将同时移除所有索引数据，此操作不可恢复。</p>
      <template #footer>
        <div class="dialog-footer">
          <button class="secondary-btn" @click="showDeleteDialog = false">取消</button>
          <button class="danger-btn" @click="handleDelete" :disabled="deletingIds.has(deleteTarget?.id || '')">
            {{ deletingIds.has(deleteTarget?.id || '') ? '删除中...' : '确认删除' }}
          </button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Back } from '@element-plus/icons-vue'
import {
  uploadKnowledge,
  getKnowledgeList,
  deleteKnowledge,
  reindexKnowledge,
  getKnowledgeHealth,
  getKnowledgeWorkspace
} from '@/api/knowledge'
import type { KnowledgeFileVO, KnowledgeHealthResp } from '@/types'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()

// 工作空间相关
const workspaceId = ref('')
const workspaceName = ref('')
const isUncategorized = ref(false)

// 状态
const loading = ref(false)
const uploading = ref(false)
const showUploadDialog = ref(false)
const showDeleteDialog = ref(false)
const deleteTarget = ref<KnowledgeFileVO | null>(null)
const fileList = ref<KnowledgeFileVO[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const reindexingIds = ref<Set<string>>(new Set())
const deletingIds = ref<Set<string>>(new Set())
const healthData = ref<KnowledgeHealthResp | null>(null)

// 统计数据
const syncedCount = computed(() =>
  fileList.value.filter(f => f.indexStatus?.meilisearch === 'synced').length
)
const pendingCount = computed(() =>
  fileList.value.filter(f =>
    f.indexStatus?.meilisearch === 'pending' ||
    (f.contentType === 'application/pdf' && f.parseStatus === 'processing')
  ).length
)

// 加载工作空间信息
const loadWorkspaceInfo = async () => {
  const id = route.params.workspaceId as string
  workspaceId.value = id

  if (id === 'uncategorized') {
    isUncategorized.value = true
    workspaceName.value = '未分类文档'
    return
  }

  isUncategorized.value = false
  try {
    const res = await getKnowledgeWorkspace(id)
    if (res.code === 200) {
      workspaceName.value = res.data.name
    }
  } catch (e) {
    console.error('Load workspace info error:', e)
    workspaceName.value = '知识库'
  }
}

// 返回工作空间列表
const goBack = () => {
  router.push('/knowledge')
}

// 加载文件列表
const loadFileList = async () => {
  loading.value = true
  try {
    const res = await getKnowledgeList({
      page: currentPage.value,
      count: pageSize.value,
      workspaceId: workspaceId.value
    })
    if (res.code === 200) {
      fileList.value = res.data.list || []
      total.value = res.data.total
    } else {
      ElMessage.error(res.msg || '加载失败')
    }
  } catch (error: any) {
    ElMessage.error(error?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

// 加载健康状态
const loadHealth = async () => {
  try {
    const res = await getKnowledgeHealth()
    if (res.code === 200) {
      healthData.value = res.data
    }
  } catch (e) {
    console.error('Health API error:', e)
  }
}

// 上传文件
const handleUpload = async (file: File) => {
  uploading.value = true
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')

  try {
    // 未分类文档不传 workspaceId
    const res = await uploadKnowledge(
      file,
      isUncategorized.value ? undefined : workspaceId.value
    )
    if (res.code === 200) {
      // 根据文件类型和解析状态显示不同提示
      if (isPdf && res.data.parseStatus === 'processing') {
        ElMessage.success(`PDF "${res.data.filename}" 已上传，正在后台解析...`)
      } else {
        ElMessage.success(`文档 "${res.data.filename}" 上传成功，正在索引...`)
      }
      showUploadDialog.value = false
      await loadFileList()

      // 异步状态轮询：同时检查解析状态和索引状态
      let retryCount = 0
      const maxRetries = 60  // PDF 解析可能需要较长时间，增加重试次数
      const checkStatus = setInterval(async () => {
        retryCount++
        await loadFileList()

        // 检查是否所有文档都完成处理
        const allCompleted = fileList.value.every(f => {
          // PDF 需要先完成解析
          if (f.contentType === 'application/pdf') {
            if (f.parseStatus === 'processing') return false
          }
          // 再检查索引状态
          return f.indexStatus?.meilisearch === 'synced' || f.indexStatus?.meilisearch === 'failed'
        })

        if (allCompleted || retryCount >= maxRetries) {
          clearInterval(checkStatus)
          if (allCompleted && retryCount < maxRetries) {
            ElMessage.success('处理完成')
          }
        }
      }, 3000)  // 每 3 秒轮询一次
    } else {
      ElMessage.error(res.msg || '上传失败')
    }
  } catch (error: any) {
    ElMessage.error(error?.message || '上传失败')
  } finally {
    uploading.value = false
  }
  return false
}

// 删除确认
const handleDeleteConfirm = (row: KnowledgeFileVO) => {
  deleteTarget.value = row
  showDeleteDialog.value = true
}

// 删除文件
const handleDelete = async () => {
  if (!deleteTarget.value) return

  deletingIds.value.add(deleteTarget.value.id)
  try {
    const res = await deleteKnowledge(deleteTarget.value.id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      showDeleteDialog.value = false
      await loadFileList()
    } else {
      ElMessage.error(res.msg || '删除失败')
    }
  } catch (error: any) {
    ElMessage.error(error?.message || '删除失败')
  } finally {
    deletingIds.value.delete(deleteTarget.value?.id || '')
  }
}

// 重新索引
const handleReindex = async (row: KnowledgeFileVO) => {
  reindexingIds.value.add(row.id)
  try {
    const res = await reindexKnowledge(row.id)
    if (res.code === 200 && res.data.success) {
      ElMessage.success('重新索引成功')
      await loadFileList()
    } else {
      const errors = res.data.errors
      const errorMsg = Object.values(errors || {}).join('; ')
      ElMessage.error(errorMsg || res.msg || '索引失败')
    }
  } catch (error: any) {
    ElMessage.error(error?.message || '索引失败')
  } finally {
    reindexingIds.value.delete(row.id)
  }
}

// 判断是否有索引错误或解析错误
const hasIndexError = (row: KnowledgeFileVO) => {
  const status = row.indexStatus
  const indexFailed = status?.meilisearch === 'failed' || status?.graphrag === 'failed'
  const parseFailed = row.contentType === 'application/pdf' && row.parseStatus === 'failed'
  return indexFailed || parseFailed
}

// 格式化时间
const formatTime = (timestamp: number) => {
  if (!timestamp) return '-'
  const ms = timestamp < 10000000000 ? timestamp * 1000 : timestamp
  return dayjs(ms).format('MM-DD HH:mm')
}

// 格式化文件大小
const formatFileSize = (bytes: number) => {
  if (!bytes) return '-'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// 获取文件类型显示名
const getFileType = (contentType: string) => {
  const typeMap: Record<string, string> = {
    'text/plain': 'TXT',
    'text/markdown': 'MD',
    'application/pdf': 'PDF'
  }
  return typeMap[contentType] || contentType || '-'
}

// 获取状态样式类
const getStatusClass = (status: string | undefined) => {
  switch (status) {
    case 'synced': return 'success'
    case 'pending': return 'warning'
    case 'failed': return 'danger'
    default: return 'info'
  }
}

// 获取状态文本
const getStatusText = (status: string | undefined) => {
  switch (status) {
    case 'synced': return '已同步'
    case 'pending': return '待同步'
    case 'failed': return '失败'
    default: return '未知'
  }
}

// 判断 PDF 是否正在解析
const isPdfParsing = (row: KnowledgeFileVO) => {
  return row.contentType === 'application/pdf' && row.parseStatus === 'processing'
}

// 判断 PDF 解析是否失败
const isPdfParseFailed = (row: KnowledgeFileVO) => {
  return row.contentType === 'application/pdf' && row.parseStatus === 'failed'
}

// 初始化
onMounted(async () => {
  await loadWorkspaceInfo()
  loadFileList()
  loadHealth()
})
</script>

<style scoped>
.knowledge-page {
  min-height: 100%;
}

/* 面包屑 */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 13px;
}

.breadcrumb-link {
  color: var(--color-primary);
  cursor: pointer;
  transition: opacity 0.2s;
}

.breadcrumb-link:hover {
  opacity: 0.8;
}

.breadcrumb-separator {
  color: var(--text-placeholder);
}

.breadcrumb-current {
  color: var(--text-secondary);
}

/* 页面头部 */
.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.secondary-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: var(--bg-card);
  color: var(--text-regular);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-base);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.secondary-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

/* 健康状态 */
.health-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--color-danger-light);
  border-radius: var(--radius-round);
  font-size: 13px;
  color: var(--color-danger-dark);
}

.health-status.healthy {
  background: var(--color-success-light);
  color: var(--color-success-dark);
}

.health-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-danger);
}

.health-status.healthy .health-dot {
  background: var(--color-success);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.health-text {
  font-weight: 500;
}

.health-detail {
  color: inherit;
  opacity: 0.7;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.health-detail:hover {
  opacity: 1;
}

/* 健康状态弹出层 */
.health-popover {
  font-size: 13px;
}

.health-title {
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--text-primary);
}

.health-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid var(--border-lighter);
}

.health-item:last-child {
  border-bottom: none;
}

.health-item-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.health-item-dot.ok {
  background: var(--color-success);
}

.health-item-dot.error {
  background: var(--color-danger);
}

.health-name {
  font-weight: 500;
  color: var(--text-primary);
  flex: 1;
}

.health-msg {
  color: var(--text-secondary);
  font-size: 12px;
}

.health-empty {
  color: var(--text-secondary);
  text-align: center;
  padding: 16px 0;
}

/* 主要按钮 */
.primary-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-base);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.primary-btn:hover {
  background: var(--color-primary-dark);
}

.btn-icon {
  width: 16px;
  height: 16px;
  position: relative;
}

.upload-icon-shape::before {
  content: '';
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 3px;
  height: 10px;
  background: currentColor;
  border-radius: 1px;
}

.upload-icon-shape::after {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-bottom: 6px solid currentColor;
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

.stat-icon.docs {
  background: var(--color-info-light);
}

.stat-icon.docs .icon-shape {
  width: 24px;
  height: 28px;
  background: var(--color-info-dark);
  border-radius: 2px 6px 2px 2px;
  position: relative;
}

.stat-icon.docs .icon-shape::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 8px;
  height: 8px;
  background: var(--color-info-light);
  border-bottom-left-radius: 2px;
}

.stat-icon.synced {
  background: var(--color-success-light);
}

.stat-icon.synced .icon-shape {
  width: 12px;
  height: 20px;
  border-right: 4px solid var(--color-success-dark);
  border-bottom: 4px solid var(--color-success-dark);
  transform: rotate(45deg) translateY(-2px);
}

.stat-icon.pending {
  background: var(--color-warning-light);
}

.stat-icon.pending .icon-shape {
  width: 20px;
  height: 20px;
  border: 3px solid var(--color-warning-dark);
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.stat-info {
  flex: 1;
  min-width: 0;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 6px;
}

/* 列表卡片 */
.list-card {
  padding: 0;
  overflow: hidden;
}

/* 面板操作 */
.panel-actions {
  display: flex;
  gap: 12px;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: transparent;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.refresh-icon {
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
}

.refresh-icon.spinning {
  animation: spin 0.8s linear infinite;
}

/* 表格 */
.table-wrapper {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.data-table th {
  padding: 14px 16px;
  background: var(--bg-overlay);
  color: var(--text-primary);
  font-weight: 600;
  text-align: left;
  border-bottom: 1px solid var(--border-light);
  white-space: nowrap;
}

.data-table td {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-lighter);
  vertical-align: middle;
}

.data-table tr:hover td {
  background: var(--bg-hover);
}

/* 文件单元格 */
.file-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.file-icon {
  width: 32px;
  height: 38px;
  background: var(--color-secondary-light);
  border-radius: 3px 8px 3px 3px;
  position: relative;
  flex-shrink: 0;
}

.file-icon::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 10px;
  height: 10px;
  background: var(--bg-card);
  border-bottom-left-radius: 2px;
}

.file-icon::after {
  content: '';
  position: absolute;
  top: 14px;
  left: 6px;
  width: 20px;
  height: 2px;
  background: var(--border-base);
  border-radius: 1px;
  box-shadow: 0 5px 0 var(--border-base), 0 10px 0 var(--border-base);
}

.file-name {
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* PDF 解析状态徽章 */
.parse-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-weight: 500;
  flex-shrink: 0;
  margin-left: 8px;
}

.parse-badge.parsing {
  background: var(--color-info-light);
  color: var(--color-info-dark);
}

.parse-badge.failed {
  background: var(--color-danger-light);
  color: var(--color-danger-dark);
  cursor: help;
}

.parse-spinner {
  width: 10px;
  height: 10px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* 类型标签 */
.type-badge {
  display: inline-block;
  padding: 2px 8px;
  background: var(--color-secondary-light);
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 500;
}

.cell-text {
  color: var(--text-regular);
  font-size: 13px;
}

.cell-center {
  text-align: center;
}

.chunk-count {
  display: inline-block;
  min-width: 24px;
  padding: 2px 8px;
  background: var(--color-info-light);
  color: var(--color-info-dark);
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 500;
  text-align: center;
}

/* 索引状态 */
.index-status {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.status-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 500;
}

.status-tag.success {
  background: var(--color-success-light);
  color: var(--color-success-dark);
}

.status-tag.warning {
  background: var(--color-warning-light);
  color: var(--color-warning-dark);
}

.status-tag.danger {
  background: var(--color-danger-light);
  color: var(--color-danger-dark);
}

.status-tag.info {
  background: var(--color-secondary-light);
  color: var(--text-secondary);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.error-msg {
  margin-top: 6px;
  font-size: 12px;
  color: var(--color-danger);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 180px;
}

/* 操作按钮 */
.action-btns {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 4px 10px;
  font-size: 12px;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s;
  background: transparent;
}

.action-btn.warning {
  color: var(--color-warning-dark);
}

.action-btn.warning:hover {
  background: var(--color-warning-light);
}

.action-btn.danger {
  color: var(--color-danger);
}

.action-btn.danger:hover {
  background: var(--color-danger-light);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 表格底部 */
.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-top: 1px solid var(--border-lighter);
  background: var(--bg-overlay);
}

.table-info {
  font-size: 13px;
  color: var(--text-secondary);
}

/* 骨架屏 */
.skeleton-table {
  padding: 0;
}

.skeleton-header,
.skeleton-row {
  display: flex;
  gap: 16px;
  padding: 16px 24px;
}

.skeleton-header {
  background: var(--bg-overlay);
  border-bottom: 1px solid var(--border-light);
}

.skeleton-row {
  border-bottom: 1px solid var(--border-lighter);
}

.skeleton-cell {
  height: 18px;
  background: linear-gradient(
    90deg,
    var(--color-secondary) 25%,
    var(--color-secondary-light) 50%,
    var(--color-secondary) 75%
  );
  background-size: 200% 100%;
  border-radius: 4px;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
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
  box-shadow: 0 6px 0 var(--border-base);
}

.empty-title {
  font-size: 16px;
  color: var(--text-primary);
  margin: 0 0 8px;
}

.empty-desc {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 0 24px;
}

/* 上传区域 */
.upload-area {
  padding: 0;
}

.upload-dragger {
  width: 100%;
}

.upload-dragger :deep(.el-upload) {
  width: 100%;
}

.upload-dragger :deep(.el-upload-dragger) {
  width: 100%;
  border: 2px dashed var(--border-light);
  border-radius: var(--radius-lg);
  background: var(--bg-overlay);
  padding: 40px 20px;
  transition: all 0.3s;
}

.upload-dragger :deep(.el-upload-dragger:hover) {
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

.uploading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.uploading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-light);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* 对话框 */
:deep(.glass-dialog) {
  --el-dialog-bg-color: var(--bg-card);
  border-radius: var(--radius-lg) !important;
  box-shadow: var(--shadow-lg);
}

:deep(.glass-dialog .el-dialog__header) {
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-lighter);
  margin: 0;
}

:deep(.glass-dialog .el-dialog__title) {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-primary);
}

:deep(.glass-dialog .el-dialog__body) {
  padding: 24px;
}

:deep(.glass-dialog .el-dialog__footer) {
  padding: 16px 24px;
  border-top: 1px solid var(--border-lighter);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.secondary-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.danger-btn {
  padding: 10px 20px;
  background: var(--color-danger);
  color: #fff;
  border: none;
  border-radius: var(--radius-base);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.danger-btn:hover {
  background: var(--color-danger-dark);
}

.danger-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.delete-confirm-text {
  font-size: 15px;
  color: var(--text-primary);
  margin: 0 0 8px;
}

.delete-confirm-hint {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
}

/* 响应式 */
@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 992px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .header-actions {
    width: 100%;
    flex-wrap: wrap;
  }
}

@media (max-width: 768px) {
  .health-status {
    display: none;
  }

  .table-footer {
    flex-direction: column;
    gap: 12px;
  }
}
</style>
