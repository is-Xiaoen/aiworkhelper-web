<template>
  <div class="page-wrapper workspace-page">
    <!-- 背景装饰 -->
    <div class="page-blob page-blob-1"></div>
    <div class="page-blob page-blob-2"></div>

    <div class="page-content">
      <!-- 页面头部 -->
      <div class="page-header">
        <div class="page-header-info">
          <h1>知识库</h1>
          <p>管理您的知识文档，支持智能检索</p>
        </div>
        <div class="header-actions">
          <button class="primary-btn" @click="showCreateDialog = true">
            <el-icon class="btn-icon"><Plus /></el-icon>
            新建工作空间
          </button>
        </div>
      </div>

      <!-- 工作空间卡片网格 -->
      <div class="workspace-grid" v-if="!loading && workspaces.length > 0">
        <div
          v-for="workspace in workspaces"
          :key="workspace.id"
          class="workspace-card"
          @click="navigateToWorkspace(workspace.id)"
        >
          <div class="workspace-card-header">
            <div class="workspace-icon">
              <el-icon :size="24"><Folder /></el-icon>
            </div>
            <div class="workspace-actions" @click.stop>
              <el-popconfirm
                title="删除工作空间将同时删除其下所有文档，确定吗？"
                confirm-button-text="确定删除"
                cancel-button-text="取消"
                @confirm="handleDeleteWorkspace(workspace)"
              >
                <template #reference>
                  <button class="card-action-btn" :disabled="deletingId === workspace.id">
                    <el-icon :size="16"><Delete /></el-icon>
                  </button>
                </template>
              </el-popconfirm>
            </div>
          </div>
          <div class="workspace-card-body">
            <h3 class="workspace-name">{{ workspace.name }}</h3>
            <p class="workspace-desc" v-if="workspace.description">
              {{ workspace.description }}
            </p>
            <p class="workspace-desc placeholder" v-else>暂无描述</p>
          </div>
          <div class="workspace-card-footer">
            <div class="workspace-stat">
              <el-icon class="stat-icon"><Document /></el-icon>
              <span class="stat-value">{{ workspace.documentCount }}</span>
              <span class="stat-label">个文档</span>
            </div>
            <div class="workspace-time">
              {{ formatTime(workspace.createAt) }}
            </div>
          </div>
        </div>

        <!-- 未分类文档卡片 -->
        <div
          class="workspace-card uncategorized"
          @click="navigateToWorkspace('uncategorized')"
        >
          <div class="workspace-card-header">
            <div class="workspace-icon uncategorized">
              <el-icon :size="24"><Box /></el-icon>
            </div>
          </div>
          <div class="workspace-card-body">
            <h3 class="workspace-name">未分类文档</h3>
            <p class="workspace-desc placeholder">未归入任何工作空间的文档</p>
          </div>
          <div class="workspace-card-footer">
            <div class="workspace-stat">
              <el-icon class="stat-icon"><Document /></el-icon>
              <span class="stat-value">{{ uncategorizedCount }}</span>
              <span class="stat-label">个文档</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 加载状态 -->
      <div class="loading-state" v-if="loading">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>

      <!-- 空状态 -->
      <div class="empty-state" v-if="!loading && workspaces.length === 0">
        <div class="empty-icon">
          <el-icon :size="40"><FolderOpened /></el-icon>
        </div>
        <h3>还没有工作空间</h3>
        <p>创建一个工作空间来组织您的知识文档</p>
        <button class="primary-btn" @click="showCreateDialog = true">
          <el-icon class="btn-icon"><Plus /></el-icon>
          创建第一个工作空间
        </button>
      </div>
    </div>

    <!-- 创建工作空间对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      title="新建工作空间"
      width="450px"
      class="glass-dialog"
      :close-on-click-modal="false"
    >
      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="createRules"
        label-width="80px"
        class="styled-form"
      >
        <el-form-item label="名称" prop="name">
          <el-input
            v-model="createForm.name"
            placeholder="请输入工作空间名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="createForm.description"
            type="textarea"
            placeholder="简要描述工作空间用途（可选）"
            maxlength="200"
            show-word-limit
            :rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <button class="secondary-btn" @click="showCreateDialog = false">取消</button>
          <button class="primary-btn" :disabled="creating" @click="handleCreate">
            {{ creating ? '创建中...' : '创建' }}
          </button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import {
  Plus,
  Folder,
  FolderOpened,
  Delete,
  Document,
  Box
} from '@element-plus/icons-vue'
import {
  getKnowledgeWorkspaces,
  createKnowledgeWorkspace,
  deleteKnowledgeWorkspace,
  getKnowledgeList
} from '@/api/knowledge'
import type { KnowledgeWorkspaceVO } from '@/types'
import dayjs from 'dayjs'

const router = useRouter()

// 状态
const loading = ref(false)
const workspaces = ref<KnowledgeWorkspaceVO[]>([])
const uncategorizedCount = ref(0)
const showCreateDialog = ref(false)
const creating = ref(false)
const deletingId = ref('')
const createFormRef = ref<FormInstance>()

// 创建表单
const createForm = reactive({
  name: '',
  description: ''
})

const createRules: FormRules = {
  name: [
    { required: true, message: '请输入工作空间名称', trigger: 'blur' },
    { min: 1, max: 50, message: '名称长度为 1-50 个字符', trigger: 'blur' }
  ],
  description: [
    { max: 200, message: '描述最多 200 个字符', trigger: 'blur' }
  ]
}

const loadWorkspaces = async () => {
  loading.value = true
  try {
    const res = await getKnowledgeWorkspaces()
    if (res.code === 200) {
      workspaces.value = res.data.list || []
    }
  } catch (e) {
    console.error('Load workspaces error:', e)
    ElMessage.error('加载工作空间失败')
  } finally {
    loading.value = false
  }
}

const loadUncategorizedCount = async () => {
  try {
    const res = await getKnowledgeList({ workspaceId: 'uncategorized', count: 1 })
    if (res.code === 200) {
      uncategorizedCount.value = res.data.total || 0
    }
  } catch (e) {
    console.error('Load uncategorized count error:', e)
  }
}

const handleCreate = async () => {
  const form = createFormRef.value
  if (!form) return

  await form.validate(async (valid) => {
    if (!valid) return

    creating.value = true
    try {
      const res = await createKnowledgeWorkspace({
        name: createForm.name.trim(),
        description: createForm.description.trim() || undefined
      })
      if (res.code === 200) {
        ElMessage.success('工作空间创建成功')
        showCreateDialog.value = false
        createForm.name = ''
        createForm.description = ''
        await loadWorkspaces()
      } else {
        ElMessage.error(res.msg || '创建失败')
      }
    } catch (error: any) {
      ElMessage.error(error?.message || '创建失败')
    } finally {
      creating.value = false
    }
  })
}

const handleDeleteWorkspace = async (workspace: KnowledgeWorkspaceVO) => {
  deletingId.value = workspace.id
  try {
    const res = await deleteKnowledgeWorkspace(workspace.id)
    if (res.code === 200) {
      ElMessage.success('工作空间已删除')
      await loadWorkspaces()
    } else {
      ElMessage.error(res.msg || '删除失败')
    }
  } catch (error: any) {
    ElMessage.error(error?.message || '删除失败')
  } finally {
    deletingId.value = ''
  }
}

const navigateToWorkspace = (workspaceId: string) => {
  router.push(`/knowledge/${workspaceId}`)
}

const formatTime = (timestamp: number) => {
  if (!timestamp) return '-'
  const ms = timestamp < 10000000000 ? timestamp * 1000 : timestamp
  return dayjs(ms).format('YYYY-MM-DD')
}

onMounted(() => {
  loadWorkspaces()
  loadUncategorizedCount()
})
</script>

<style scoped>
.workspace-page {
  min-height: 100%;
}

/* 头部操作区 */
.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* 工作空间网格布局 */
.workspace-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

/* 工作空间卡片 */
.workspace-card {
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.workspace-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--color-primary-light);
}

.workspace-card.uncategorized {
  background: var(--bg-overlay);
  border-style: dashed;
}

.workspace-card.uncategorized:hover {
  border-color: var(--color-secondary-dark);
}

/* 卡片头部 */
.workspace-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.workspace-icon {
  width: 48px;
  height: 48px;
  background: var(--gradient-primary);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.workspace-icon.uncategorized {
  background: var(--color-secondary);
  color: var(--text-secondary);
}

.workspace-actions {
  opacity: 0;
  transition: opacity 0.2s;
}

.workspace-card:hover .workspace-actions {
  opacity: 1;
}

.card-action-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: var(--radius-base);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.card-action-btn:hover {
  background: var(--color-danger-light);
  color: var(--color-danger-dark);
}

.card-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 卡片内容 */
.workspace-card-body {
  flex: 1;
  margin-bottom: 16px;
}

.workspace-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workspace-desc {
  font-size: 13px;
  color: var(--text-regular);
  margin: 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.workspace-desc.placeholder {
  color: var(--text-placeholder);
  font-style: italic;
}

/* 卡片底部 */
.workspace-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid var(--border-lighter);
}

.workspace-stat {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stat-icon {
  font-size: 14px;
  color: var(--text-secondary);
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-primary);
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.workspace-time {
  font-size: 12px;
  color: var(--text-placeholder);
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
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

.loading-state p {
  margin-top: 16px;
  color: var(--text-secondary);
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  text-align: center;
}

.empty-icon {
  width: 80px;
  height: 80px;
  background: var(--color-secondary-light);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  color: var(--text-secondary);
}

.empty-state h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.empty-state p {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 0 24px 0;
}

/* 按钮样式 */
.primary-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: var(--color-primary);
  color: white;
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

.primary-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
  cursor: pointer;
  transition: all 0.2s;
}

.secondary-btn:hover {
  border-color: var(--color-primary-light);
  color: var(--color-primary);
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 对话框底部 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 响应式 */
@media (max-width: 768px) {
  .workspace-grid {
    grid-template-columns: 1fr;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .workspace-card {
    padding: 16px;
  }
}
</style>
