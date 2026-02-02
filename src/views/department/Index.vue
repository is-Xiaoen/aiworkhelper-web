<template>
  <div class="department-page">
    <!-- 背景装饰 -->
    <div class="bg-blob blob-1"></div>
    <div class="bg-blob blob-2"></div>

    <div class="page-container">
      <!-- 页面头部 -->
      <header class="page-header">
        <div class="header-info">
          <h1>部门管理</h1>
          <p>管理组织架构和部门人员</p>
        </div>
        <AppButton type="primary" :icon="Plus" @click="handleAdd">新增部门</AppButton>
      </header>

      <!-- 统计卡片 -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-icon">
            <el-icon><OfficeBuilding /></el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ totalDepartments }}</span>
            <span class="stat-label">部门总数</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon users">
            <el-icon><UserIcon /></el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ totalMembers }}</span>
            <span class="stat-label">员工总数</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon level">
            <el-icon><Share /></el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ maxLevel }}</span>
            <span class="stat-label">最大层级</span>
          </div>
        </div>
      </div>

      <!-- 部门树区域 -->
      <div class="tree-card">
        <div class="card-header">
          <h3 class="card-title">
            <span class="title-marker"></span>
            组织架构
          </h3>
          <el-input
            v-model="searchText"
            placeholder="搜索部门..."
            clearable
            class="search-input"
          />
        </div>

        <!-- 骨架屏 -->
        <div v-if="loading" class="skeleton-tree">
          <div v-for="i in 5" :key="i" class="skeleton-node" :style="{ paddingLeft: `${(i % 3) * 28}px` }">
            <div class="skeleton-title"></div>
            <div class="skeleton-meta"></div>
          </div>
        </div>

        <!-- 部门树 -->
        <div v-else class="tree-wrapper">
          <el-tree
            ref="treeRef"
            :data="filteredTreeData"
            :props="treeProps"
            node-key="id"
            :indent="28"
            default-expand-all
            :expand-on-click-node="false"
            :filter-node-method="filterNode"
          >
            <template #default="{ data }">
              <div class="tree-node">
                <div class="node-content">
                  <span class="node-name">{{ data.name }}</span>
                  <span class="node-meta">
                    {{ data.leader || '暂无负责人' }} · {{ data.count || 0 }}人
                  </span>
                </div>
                <div class="node-actions">
                  <button class="action-btn" @click.stop="handleView(data)">查看</button>
                  <button class="action-btn" @click.stop="handleEdit(data)">编辑</button>
                  <button class="action-btn" @click.stop="handleAddUser(data)">添加员工</button>
                  <button class="action-btn warning" @click.stop="handleRemoveUser(data)">移除员工</button>
                  <button class="action-btn danger" @click.stop="handleDelete(data)">删除</button>
                </div>
              </div>
            </template>
          </el-tree>

          <!-- 空状态 -->
          <div v-if="!filteredTreeData.length" class="empty-state">
            <p>暂无部门数据</p>
            <AppButton type="primary" size="small" @click="handleAdd">创建第一个部门</AppButton>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      class="dept-dialog"
      destroy-on-close
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="90px"
        class="dept-form"
      >
        <el-form-item label="部门名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入部门名称" />
        </el-form-item>
        <el-form-item label="上级部门" prop="parentId">
          <el-tree-select
            v-model="form.parentId"
            :data="treeData"
            :props="treeProps"
            placeholder="请选择上级部门（可选）"
            check-strictly
            clearable
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="负责人" prop="leaderId">
          <el-select v-model="form.leaderId" placeholder="请选择负责人" clearable filterable style="width: 100%">
            <el-option
              v-for="user in userList"
              :key="user.id"
              :label="user.name"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <AppButton @click="dialogVisible = false">取消</AppButton>
          <AppButton type="primary" @click="handleSubmit">确定</AppButton>
        </div>
      </template>
    </el-dialog>

    <!-- 添加员工对话框 -->
    <el-dialog v-model="addUserDialogVisible" title="添加部门员工" width="500px" class="dept-dialog">
      <div class="user-panel">
        <p class="panel-desc">选择要添加到「{{ currentDepartment?.name }}」的员工</p>
        <el-select
          v-model="selectedAddUserIds"
          placeholder="搜索并选择员工"
          filterable
          multiple
          style="width: 100%"
        >
          <el-option
            v-for="user in availableUsersForAdd"
            :key="user.id"
            :label="user.name"
            :value="user.id"
          />
        </el-select>
        <div v-if="selectedAddUserIds.length" class="selected-tags">
          <el-tag
            v-for="userId in selectedAddUserIds"
            :key="userId"
            closable
            @close="selectedAddUserIds = selectedAddUserIds.filter(id => id !== userId)"
          >
            {{ getUserName(userId) }}
          </el-tag>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <AppButton @click="addUserDialogVisible = false">取消</AppButton>
          <AppButton type="primary" :disabled="!selectedAddUserIds.length" @click="handleSubmitAddUser">
            确定添加
          </AppButton>
        </div>
      </template>
    </el-dialog>

    <!-- 移除员工对话框 -->
    <el-dialog v-model="removeUserDialogVisible" title="移除部门员工" width="500px" class="dept-dialog">
      <div class="user-panel">
        <p class="panel-desc">从「{{ currentDepartment?.name }}」移除员工</p>
        <el-alert type="warning" :closable="false" show-icon style="margin-bottom: 16px">
          部门负责人无法被移除
        </el-alert>
        <el-select
          v-model="selectedRemoveUserIds"
          placeholder="选择要移除的员工"
          filterable
          multiple
          style="width: 100%"
        >
          <el-option
            v-for="user in availableUsersForRemove"
            :key="user.id"
            :label="user.name"
            :value="user.id"
            :disabled="user.id === currentDepartment?.leaderId"
          />
        </el-select>
        <div v-if="selectedRemoveUserIds.length" class="selected-tags danger">
          <el-tag
            v-for="userId in selectedRemoveUserIds"
            :key="userId"
            type="danger"
            closable
            @close="selectedRemoveUserIds = selectedRemoveUserIds.filter(id => id !== userId)"
          >
            {{ getUserName(userId) }}
          </el-tag>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <AppButton @click="removeUserDialogVisible = false">取消</AppButton>
          <AppButton type="danger" :disabled="!selectedRemoveUserIds.length" @click="handleSubmitRemoveUser">
            确定移除
          </AppButton>
        </div>
      </template>
    </el-dialog>

    <!-- 查看详情对话框 -->
    <el-dialog v-model="viewDialogVisible" title="部门详情" width="560px" class="dept-dialog">
      <div class="detail-content">
        <div class="detail-header">
          <h3>{{ viewData.name }}</h3>
          <span class="level-tag">第 {{ viewData.level }} 层级</span>
        </div>

        <div class="detail-info">
          <div class="info-item">
            <label>负责人</label>
            <span>{{ viewData.leader || '暂无' }}</span>
          </div>
          <div class="info-item">
            <label>员工人数</label>
            <span>{{ viewData.count || 0 }} 人</span>
          </div>
        </div>

        <div v-if="viewData.users?.length" class="members-section">
          <h4>部门成员 ({{ viewData.users.length }})</h4>
          <div class="members-list">
            <div v-for="user in viewData.users" :key="user.id" class="member-item">
              <span class="member-avatar">{{ user.userName?.charAt(0) || '?' }}</span>
              <span class="member-name">{{ user.userName }}</span>
              <span v-if="user.user === viewData.leaderId" class="leader-tag">负责人</span>
            </div>
          </div>
        </div>

        <div v-else class="empty-members">
          <p>暂无部门成员</p>
          <AppButton type="primary" size="small" @click="viewDialogVisible = false; handleAddUser(viewData as Department)">
            添加员工
          </AppButton>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import { Plus, OfficeBuilding, User as UserIcon, Share } from '@element-plus/icons-vue'
import {
  getDepSoa,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  addDepUser,
  removeDepUser
} from '@/api/department'
import { getUserList } from '@/api/user'
import type { Department, User } from '@/types'

const loading = ref(false)
const treeData = ref<Department[]>([])
const userList = ref<User[]>([])
const searchText = ref('')
const treeRef = ref()

const treeProps = {
  label: 'name',
  children: 'child',
  value: 'id'
}

// 统计数据
const totalDepartments = computed(() => {
  const count = (nodes: Department[]): number => {
    return nodes.reduce((acc, node) => acc + 1 + (node.child ? count(node.child) : 0), 0)
  }
  return count(treeData.value)
})

const totalMembers = computed(() => {
  const count = (nodes: Department[]): number => {
    return nodes.reduce((acc, node) => acc + (node.count || 0) + (node.child ? count(node.child) : 0), 0)
  }
  return count(treeData.value)
})

const maxLevel = computed(() => {
  const getMax = (nodes: Department[], currentMax: number): number => {
    return nodes.reduce((max, node) => {
      const level = node.level || 1
      const childMax = node.child ? getMax(node.child, level) : level
      return Math.max(max, childMax)
    }, currentMax)
  }
  return getMax(treeData.value, 0)
})

const filteredTreeData = computed(() => treeData.value)

const dialogVisible = ref(false)
const dialogTitle = ref('新增部门')
const formRef = ref<FormInstance>()

const form = reactive<Partial<Department>>({
  name: '',
  parentId: '',
  leaderId: '',
  leader: '',
  level: 1
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入部门名称', trigger: 'blur' }],
  leaderId: [{ required: true, message: '请选择负责人', trigger: 'change' }]
}

const addUserDialogVisible = ref(false)
const removeUserDialogVisible = ref(false)
const selectedAddUserIds = ref<string[]>([])
const selectedRemoveUserIds = ref<string[]>([])
const currentDepartment = ref<Department | null>(null)
const currentDepId = ref('')
const currentDepartmentUserIds = ref<string[]>([])

const viewDialogVisible = ref(false)
const viewData = ref<Partial<Department>>({})

const availableUsersForAdd = computed(() => {
  if (!userList.value) return []
  return userList.value.filter(user => !currentDepartmentUserIds.value.includes(user.id))
})

const availableUsersForRemove = computed(() => {
  if (!userList.value) return []
  return userList.value.filter(user => currentDepartmentUserIds.value.includes(user.id))
})

watch(() => form.leaderId, (newVal) => {
  const user = userList.value.find(u => u.id === newVal)
  if (user) form.leader = user.name
})

watch(searchText, (val) => {
  treeRef.value?.filter(val)
})

const filterNode = (value: string, data: Department) => {
  if (!value) return true
  return data.name.toLowerCase().includes(value.toLowerCase())
}

const getUserName = (userId: string) => userList.value.find(u => u.id === userId)?.name || userId

const processTreeData = (nodes: Department[]): Department[] => {
  return nodes.map(node => {
    const processed = { ...node }
    if (processed.child === null) {
      delete processed.child
    } else if (Array.isArray(processed.child) && processed.child.length > 0) {
      processed.child = processTreeData(processed.child)
    }
    return processed
  })
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await getDepSoa()
    if (res.code === 200) {
      treeData.value = processTreeData(res.data?.child || [])
    }
  } catch {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const loadUsers = async () => {
  try {
    const res = await getUserList({ page: 1, count: 100 })
    if (res.code === 200 && res.data?.data) {
      userList.value = res.data.data
    }
  } catch {
    ElMessage.error('加载用户列表失败')
  }
}

const handleAdd = () => {
  dialogTitle.value = '新增部门'
  Object.assign(form, { id: undefined, name: '', parentId: '', leaderId: '', leader: '', level: 1 })
  dialogVisible.value = true
}

const handleEdit = (data: Department) => {
  dialogTitle.value = '编辑部门'
  Object.assign(form, { ...data })
  dialogVisible.value = true
}

const handleView = (data: Department) => {
  viewData.value = { ...data }
  viewDialogVisible.value = true
}

const handleAddUser = (data: Department) => {
  currentDepartment.value = data
  currentDepId.value = data.id
  selectedAddUserIds.value = []
  currentDepartmentUserIds.value = data.users?.map(u => u.user) || []
  addUserDialogVisible.value = true
}

const handleRemoveUser = (data: Department) => {
  currentDepartment.value = data
  currentDepId.value = data.id
  selectedRemoveUserIds.value = []
  currentDepartmentUserIds.value = data.users?.map(u => u.user) || []
  removeUserDialogVisible.value = true
}

const handleDelete = (data: Department) => {
  ElMessageBox.confirm(`确定要删除部门「${data.name}」吗？`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteDepartment(data.id)
      ElMessage.success('删除成功')
      loadData()
    } catch {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (form.id) {
          await updateDepartment(form as Department)
          ElMessage.success('更新成功')
        } else {
          await createDepartment(form as Department)
          ElMessage.success('创建成功')
        }
        dialogVisible.value = false
        loadData()
      } catch {
        ElMessage.error('操作失败')
      }
    }
  })
}

const handleSubmitAddUser = async () => {
  if (!selectedAddUserIds.value.length) return
  try {
    for (const userId of selectedAddUserIds.value) {
      await addDepUser({ depId: currentDepId.value, userId })
    }
    ElMessage.success(`成功添加 ${selectedAddUserIds.value.length} 名员工`)
    addUserDialogVisible.value = false
    loadData()
  } catch {
    ElMessage.error('添加失败')
  }
}

const handleSubmitRemoveUser = async () => {
  if (!selectedRemoveUserIds.value.length) return
  try {
    for (const userId of selectedRemoveUserIds.value) {
      await removeDepUser({ depId: currentDepId.value, userId })
    }
    ElMessage.success(`成功移除 ${selectedRemoveUserIds.value.length} 名员工`)
    removeUserDialogVisible.value = false
    loadData()
  } catch {
    ElMessage.error('移除失败')
  }
}

const handleDialogClose = () => {
  formRef.value?.resetFields()
}

onMounted(() => {
  loadData()
  loadUsers()
})
</script>

<style scoped>
/* 页面容器 */
.department-page {
  position: relative;
  margin: -20px;
  padding: 24px;
  min-height: calc(100% + 40px);
  background: var(--bg-page);
  overflow-x: hidden;
}

/* 背景装饰 */
.bg-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  z-index: 0;
  pointer-events: none;
  animation: blobFloat 12s infinite ease-in-out;
}
.blob-1 {
  width: 400px;
  height: 400px;
  background: var(--color-secondary);
  top: -150px;
  right: -100px;
  opacity: 0.5;
}
.blob-2 {
  width: 300px;
  height: 300px;
  background: var(--color-secondary-light);
  bottom: -100px;
  left: -100px;
  opacity: 0.4;
  animation-delay: -6s;
}
@keyframes blobFloat {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(30px, 20px) scale(1.05); }
}

.page-container {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 页面头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-info h1 {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  color: var(--color-primary);
}
.header-info p {
  margin: 6px 0 0;
  font-size: 14px;
  color: var(--text-secondary);
}

/* 统计卡片 */
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  background: var(--glass-bg);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-soft);
  transition: transform 0.2s;
}
.stat-card:hover {
  transform: translateY(-2px);
}
.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-lg);
  background: var(--color-secondary-light);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  flex-shrink: 0;
}
.stat-icon.users {
  background: var(--color-success-light);
  color: var(--color-success-dark);
}
.stat-icon.level {
  background: var(--color-info-light);
  color: var(--color-info-dark);
}
.stat-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
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
}

/* 树卡片 */
.tree-card {
  background: var(--glass-bg);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-soft);
  overflow: hidden;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-lighter);
  background: var(--bg-overlay);
}
.card-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-primary);
  display: flex;
  align-items: center;
  gap: 10px;
}
.title-marker {
  width: 4px;
  height: 18px;
  background: var(--color-primary);
  border-radius: 2px;
}
.search-input {
  width: 200px;
}
.search-input :deep(.el-input__wrapper) {
  border-radius: var(--radius-base);
  box-shadow: none;
  border: 1px solid var(--border-light);
  background: var(--bg-card);
}

/* 树包装 */
.tree-wrapper {
  padding: 16px 24px 24px;
  min-height: 300px;
}

/* 树节点样式 */
:deep(.el-tree) {
  background: transparent;
}
:deep(.el-tree-node__content) {
  height: auto !important;
  padding: 12px 16px !important;
  border-radius: var(--radius-base);
  margin-bottom: 4px;
  transition: background 0.2s;
}
:deep(.el-tree-node__content:hover) {
  background: var(--bg-hover);
}
:deep(.el-tree-node__expand-icon) {
  color: var(--text-secondary);
}

.tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}
.node-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.node-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}
.node-meta {
  font-size: 13px;
  color: var(--text-secondary);
}

/* 操作按钮 */
.node-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}
:deep(.el-tree-node__content:hover) .node-actions {
  opacity: 1;
}
.action-btn {
  padding: 5px 12px;
  font-size: 13px;
  color: var(--color-primary);
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.action-btn:hover {
  background: var(--color-secondary-light);
}
.action-btn.warning {
  color: var(--color-warning);
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

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--text-secondary);
}
.empty-state p {
  margin: 0 0 16px;
  font-size: 14px;
}

/* 骨架屏 */
.skeleton-tree {
  padding: 16px 24px 24px;
}
.skeleton-node {
  padding: 14px 16px;
  margin-bottom: 8px;
}
.skeleton-title {
  width: 120px;
  height: 14px;
  margin-bottom: 8px;
  border-radius: 4px;
  background: linear-gradient(90deg, var(--color-secondary) 25%, var(--color-secondary-light) 50%, var(--color-secondary) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
.skeleton-meta {
  width: 180px;
  height: 12px;
  border-radius: 4px;
  background: linear-gradient(90deg, var(--color-secondary) 25%, var(--color-secondary-light) 50%, var(--color-secondary) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* 对话框 */
:deep(.dept-dialog) {
  --el-dialog-bg-color: var(--bg-card);
  border-radius: var(--radius-lg) !important;
  box-shadow: var(--shadow-lg);
}
:deep(.dept-dialog .el-dialog__header) {
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-lighter);
  margin: 0;
}
:deep(.dept-dialog .el-dialog__title) {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-primary);
}
:deep(.dept-dialog .el-dialog__body) {
  padding: 24px;
}
:deep(.dept-dialog .el-dialog__footer) {
  padding: 16px 24px;
  border-top: 1px solid var(--border-lighter);
}

/* 表单 */
.dept-form :deep(.el-form-item) {
  margin-bottom: 20px;
}
.dept-form :deep(.el-form-item__label) {
  color: var(--text-primary);
  font-weight: 500;
}
.dept-form :deep(.el-input__wrapper),
.dept-form :deep(.el-select .el-input__wrapper) {
  border-radius: var(--radius-base);
  box-shadow: none;
  border: 1px solid var(--border-light);
}
.dept-form :deep(.el-input__wrapper:hover) {
  border-color: var(--color-primary-light);
}
.dept-form :deep(.el-input__wrapper.is-focus) {
  border-color: var(--color-primary);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 用户面板 */
.user-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.panel-desc {
  margin: 0;
  font-size: 14px;
  color: var(--text-regular);
}
.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px;
  background: var(--color-secondary-light);
  border-radius: var(--radius-base);
}
.selected-tags.danger {
  background: var(--color-danger-light);
}

/* 详情内容 */
.detail-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-lighter);
}
.detail-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
}
.level-tag {
  padding: 4px 10px;
  font-size: 12px;
  background: var(--color-secondary-light);
  color: var(--text-secondary);
  border-radius: 4px;
}

.detail-info {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
.info-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px;
  background: var(--bg-overlay);
  border-radius: var(--radius-base);
}
.info-item label {
  font-size: 12px;
  color: var(--text-secondary);
}
.info-item span {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
}

/* 成员区域 */
.members-section h4 {
  margin: 0 0 16px;
  font-size: 15px;
  font-weight: 600;
  color: var(--color-primary);
}
.members-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.member-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--bg-overlay);
  border-radius: var(--radius-base);
}
.member-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}
.member-name {
  font-size: 13px;
  color: var(--text-primary);
}
.leader-tag {
  font-size: 11px;
  padding: 2px 6px;
  background: var(--color-warning-light);
  color: var(--color-warning-dark);
  border-radius: 4px;
}

/* 空成员 */
.empty-members {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  background: var(--bg-overlay);
  border-radius: var(--radius-base);
  color: var(--text-secondary);
}
.empty-members p {
  margin: 0 0 12px;
  font-size: 14px;
}

/* 响应式 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  .stats-row {
    grid-template-columns: 1fr;
  }
  .card-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  .search-input {
    width: 100%;
  }
  .node-actions {
    opacity: 1;
    flex-wrap: wrap;
  }
  .detail-info {
    grid-template-columns: 1fr;
  }
}
</style>
