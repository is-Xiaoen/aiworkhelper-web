<template>
  <div class="knowledge-page">
    <!-- 页面头部 -->
    <el-card class="header-card">
      <div class="page-header">
        <div class="header-left">
          <h2>知识库管理</h2>
          <el-tag type="info" size="small">文档索引中心</el-tag>
        </div>
        <div class="header-right">
          <!-- 健康状态 -->
          <el-popover
            v-if="healthData"
            placement="bottom"
            :width="280"
            trigger="hover"
          >
            <template #reference>
              <el-tag
                :type="healthData.healthy ? 'success' : 'danger'"
                effect="plain"
                class="health-tag"
              >
                <el-icon v-if="healthData.healthy"><CircleCheck /></el-icon>
                <el-icon v-else><Warning /></el-icon>
                <span>{{ healthData.healthy ? '系统正常' : '部分异常' }}</span>
              </el-tag>
            </template>
            <div class="health-popover">
              <div class="health-title">索引服务状态</div>
              <div
                v-for="(status, key) in healthData.adapters"
                :key="key"
                class="health-item"
              >
                <span :class="['health-dot', status.available ? 'healthy' : 'unhealthy']"></span>
                <span class="health-name">{{ status.name }}</span>
                <span class="health-msg">{{ status.error || (status.available ? '正常' : '异常') }}</span>
              </div>
              <div v-if="!healthData.adapters || Object.keys(healthData.adapters).length === 0" class="health-empty">
                暂无索引服务
              </div>
            </div>
          </el-popover>
          <el-button type="primary" @click="showUploadDialog = true">
            <el-icon><Upload /></el-icon>
            上传文档
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 文件列表 -->
    <el-card class="list-card">
      <el-table
        :data="fileList"
        v-loading="loading"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="title" label="文档标题" min-width="200">
          <template #default="{ row }">
            <div class="file-title">
              <el-icon class="file-icon"><Document /></el-icon>
              <span>{{ row.title || row.filename }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="contentType" label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ getFileType(row.contentType) }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="fileSize" label="大小" width="100">
          <template #default="{ row }">
            {{ formatFileSize(row.fileSize) }}
          </template>
        </el-table-column>

        <el-table-column prop="chunkCount" label="分块数" width="90" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ row.chunkCount }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="索引状态" width="220">
          <template #default="{ row }">
            <div class="index-status">
              <el-tooltip content="Meilisearch 全文检索" placement="top">
                <el-tag
                  :type="getStatusType(row.indexStatus?.meilisearch)"
                  size="small"
                  class="status-tag"
                >
                  <el-icon><Search /></el-icon>
                  {{ getStatusText(row.indexStatus?.meilisearch) }}
                </el-tag>
              </el-tooltip>
              <el-tooltip content="GraphRAG 知识图谱" placement="top">
                <el-tag
                  :type="getStatusType(row.indexStatus?.graphrag)"
                  size="small"
                  class="status-tag"
                >
                  <el-icon><Share /></el-icon>
                  {{ getStatusText(row.indexStatus?.graphrag) }}
                </el-tag>
              </el-tooltip>
            </div>
            <div v-if="row.indexStatus?.errorMsg" class="error-msg">
              <el-tooltip :content="row.indexStatus.errorMsg" placement="top">
                <span class="error-text">{{ row.indexStatus.errorMsg }}</span>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="createAt" label="上传时间" width="170">
          <template #default="{ row }">
            {{ formatTime(row.createAt) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="hasIndexError(row)"
              size="small"
              type="warning"
              :loading="reindexingIds.has(row.id)"
              @click="handleReindex(row)"
            >
              重新索引
            </el-button>
            <el-popconfirm
              title="确定要删除这个文档吗？"
              confirm-button-text="删除"
              cancel-button-text="取消"
              @confirm="handleDelete(row)"
            >
              <template #reference>
                <el-button size="small" type="danger" :loading="deletingIds.has(row.id)">
                  删除
                </el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper" v-if="total > 0">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="loadFileList"
          @current-change="loadFileList"
        />
      </div>

      <!-- 空状态 -->
      <el-empty v-if="!loading && fileList.length === 0" description="暂无文档，请上传">
        <el-button type="primary" @click="showUploadDialog = true">
          <el-icon><Upload /></el-icon>
          上传文档
        </el-button>
      </el-empty>
    </el-card>

    <!-- 上传对话框 -->
    <el-dialog
      v-model="showUploadDialog"
      title="上传知识库文档"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-upload
        class="upload-dragger"
        drag
        :before-upload="handleUpload"
        :show-file-list="false"
        accept=".txt,.md,.pdf"
        :disabled="uploading"
      >
        <div v-if="uploading" class="uploading-state">
          <el-icon class="is-loading"><Loading /></el-icon>
          <div class="upload-text">正在上传并索引...</div>
        </div>
        <div v-else>
          <el-icon class="upload-icon"><UploadFilled /></el-icon>
          <div class="upload-text">
            拖拽文件到此处或 <em>点击上传</em>
          </div>
          <div class="upload-tip">
            支持 .txt, .md, .pdf 格式文件
          </div>
        </div>
      </el-upload>

      <template #footer>
        <el-button @click="showUploadDialog = false" :disabled="uploading">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Upload,
  UploadFilled,
  Document,
  Search,
  Share,
  Loading,
  CircleCheck,
  Warning
} from '@element-plus/icons-vue'
import {
  uploadKnowledge,
  getKnowledgeList,
  deleteKnowledge,
  reindexKnowledge,
  getKnowledgeHealth
} from '@/api/knowledge'
import type { KnowledgeFileVO, KnowledgeHealthResp } from '@/types'
import dayjs from 'dayjs'

// 状态
const loading = ref(false)
const uploading = ref(false)
const showUploadDialog = ref(false)
const fileList = ref<KnowledgeFileVO[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const reindexingIds = ref<Set<string>>(new Set())
const deletingIds = ref<Set<string>>(new Set())
const healthData = ref<KnowledgeHealthResp | null>(null)


// 加载文件列表
const loadFileList = async () => {
  loading.value = true
  try {
    const res = await getKnowledgeList({
      page: currentPage.value,
      count: pageSize.value
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
    console.log('[DEBUG] Health API response:', JSON.stringify(res.data, null, 2))
    if (res.code === 200) {
      healthData.value = res.data
      console.log('[DEBUG] healthData.healthy =', res.data.healthy)
      console.log('[DEBUG] healthData.adapters =', res.data.adapters)
    }
  } catch (e) {
    console.error('[DEBUG] Health API error:', e)
  }
}

// 上传文件
const handleUpload = async (file: File) => {
  uploading.value = true
  try {
    const res = await uploadKnowledge(file)
    if (res.code === 200) {
      ElMessage.success(`文档 "${res.data.filename}" 上传成功，正在索引...`)
      showUploadDialog.value = false
      await loadFileList()

      // 异步索引完成后自动刷新状态（每2秒检查一次，最多30秒）
      let retryCount = 0
      const maxRetries = 15
      const checkIndexStatus = setInterval(async () => {
        retryCount++
        await loadFileList()

        // 检查是否所有文档都已同步完成
        const allSynced = fileList.value.every(f =>
          f.indexStatus?.meilisearch === 'synced' || f.indexStatus?.meilisearch === 'failed'
        )

        if (allSynced || retryCount >= maxRetries) {
          clearInterval(checkIndexStatus)
          if (allSynced && retryCount < maxRetries) {
            ElMessage.success('索引完成')
          }
        }
      }, 2000)
    } else {
      ElMessage.error(res.msg || '上传失败')
    }
  } catch (error: any) {
    ElMessage.error(error?.message || '上传失败')
  } finally {
    uploading.value = false
  }
  return false // 阻止默认上传行为
}

// 删除文件
const handleDelete = async (row: KnowledgeFileVO) => {
  deletingIds.value.add(row.id)
  try {
    const res = await deleteKnowledge(row.id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      await loadFileList()
    } else {
      ElMessage.error(res.msg || '删除失败')
    }
  } catch (error: any) {
    ElMessage.error(error?.message || '删除失败')
  } finally {
    deletingIds.value.delete(row.id)
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

// 判断是否有索引错误
const hasIndexError = (row: KnowledgeFileVO) => {
  const status = row.indexStatus
  return status?.meilisearch === 'failed' || status?.graphrag === 'failed'
}

// 格式化时间（后端返回秒级时间戳，dayjs 需要毫秒）
const formatTime = (timestamp: number) => {
  if (!timestamp) return '-'
  // 判断是秒级还是毫秒级时间戳（秒级时间戳小于 10000000000）
  const ms = timestamp < 10000000000 ? timestamp * 1000 : timestamp
  return dayjs(ms).format('YYYY-MM-DD HH:mm')
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

// 获取状态标签类型
const getStatusType = (status: string | undefined) => {
  switch (status) {
    case 'synced':
      return 'success'
    case 'pending':
      return 'warning'
    case 'failed':
      return 'danger'
    default:
      return 'info'
  }
}

// 获取状态文本
const getStatusText = (status: string | undefined) => {
  switch (status) {
    case 'synced':
      return '已同步'
    case 'pending':
      return '待同步'
    case 'failed':
      return '失败'
    default:
      return '未知'
  }
}

// 初始化
onMounted(() => {
  loadFileList()
  loadHealth()
})
</script>

<style scoped>
.knowledge-page {
  padding: 0;
}

.header-card {
  margin-bottom: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-left h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.health-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.health-popover {
  font-size: 13px;
}

.health-title {
  font-weight: 600;
  margin-bottom: 8px;
  color: #303133;
}

.health-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}

.health-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.health-dot.healthy {
  background-color: #67c23a;
}

.health-dot.unhealthy {
  background-color: #f56c6c;
}

.health-name {
  font-weight: 500;
  color: #606266;
}

.health-msg {
  color: #909399;
  font-size: 12px;
}

.health-empty {
  color: #909399;
  text-align: center;
  padding: 8px 0;
}

.list-card {
  min-height: 400px;
}

.file-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-icon {
  color: #409eff;
  font-size: 16px;
}

.index-status {
  display: flex;
  gap: 8px;
}

.status-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.error-msg {
  margin-top: 4px;
}

.error-text {
  font-size: 12px;
  color: #f56c6c;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
  display: inline-block;
}

.pagination-wrapper {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.upload-dragger {
  width: 100%;
}

.upload-dragger :deep(.el-upload-dragger) {
  width: 100%;
  padding: 40px 20px;
}

.uploading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.uploading-state .el-icon {
  font-size: 48px;
  color: #409eff;
}

.upload-icon {
  font-size: 48px;
  color: #c0c4cc;
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
</style>