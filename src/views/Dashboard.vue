<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #409eff;">
              <el-icon :size="32"><List /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.todoCount }}</div>
              <div class="stat-label">待办事项</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #67c23a;">
              <el-icon :size="32"><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.approvalCount }}</div>
              <div class="stat-label">审批申请</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #e6a23c;">
              <el-icon :size="32"><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.userCount }}</div>
              <div class="stat-label">用户数量</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #f56c6c;">
              <el-icon :size="32"><OfficeBuilding /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.depCount }}</div>
              <div class="stat-label">部门数量</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :xs="24" :lg="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>待办事项</span>
              <el-button text @click="$router.push('/todo')">查看更多</el-button>
            </div>
          </template>
          <el-empty v-if="todoList.length === 0" description="暂无待办事项" />
          <div v-else class="todo-list">
            <div
              v-for="todo in todoList"
              :key="todo.id"
              class="todo-item"
            >
              <div class="todo-title">{{ todo.title }}</div>
              <div class="todo-time">{{ formatDate(todo.deadlineAt) }}</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>审批申请</span>
              <el-button text @click="$router.push('/approval')">查看更多</el-button>
            </div>
          </template>
          <el-empty v-if="approvalList.length === 0" description="暂无审批申请" />
          <div v-else class="approval-list">
            <div
              v-for="approval in approvalList"
              :key="approval.id"
              class="approval-item"
            >
              <div class="approval-title">{{ approval.title }}</div>
              <el-tag :type="getApprovalStatusType(approval.status)" size="small">
                {{ getApprovalStatusText(approval.status) }}
              </el-tag>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row style="margin-top: 20px;">
      <el-col :span="24">
        <el-card>
          <template #header>
            <span>快速操作</span>
          </template>
          <div class="quick-actions">
            <el-button type="primary" @click="$router.push('/todo')">
              <el-icon><Plus /></el-icon>
              创建待办
            </el-button>
            <el-button type="success" @click="$router.push('/approval/create')">
              <el-icon><Plus /></el-icon>
              发起审批
            </el-button>
            <el-button type="info" @click="$router.push('/chat')">
              <el-icon><ChatDotRound /></el-icon>
              AI助手
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { List, Document, User, OfficeBuilding, Plus, ChatDotRound } from '@element-plus/icons-vue'
import { getTodoList } from '@/api/todo'
import { getApprovalList } from '@/api/approval'
import { getUserList } from '@/api/user'
import { getDepSoa } from '@/api/department'
import { useUserStore } from '@/stores/user'
import dayjs from 'dayjs'
import type { Todo, Approval } from '@/types'

const userStore = useUserStore()

const stats = ref({
  todoCount: 0,
  approvalCount: 0,
  userCount: 0,
  depCount: 0
})

const todoList = ref<Todo[]>([])
const approvalList = ref<Approval[]>([])

const formatDate = (timestamp: number) => {
  return dayjs.unix(timestamp).format('YYYY-MM-DD HH:mm')
}

const getApprovalStatusType = (status: number) => {
  // 后端状态: 0=未开始, 1=处理中, 2=通过, 3=拒绝, 4=撤销, 5=自动通过
  const types: any = {
    0: 'info',
    1: 'warning',
    2: 'success',
    3: 'danger',
    4: 'info',
    5: 'success'
  }
  return types[status] || 'info'
}

const getApprovalStatusText = (status: number) => {
  // 后端状态: 0=未开始, 1=处理中, 2=通过, 3=拒绝, 4=撤销, 5=自动通过
  const texts: any = {
    0: '未开始',
    1: '处理中',
    2: '已通过',
    3: '已拒绝',
    4: '已撤销',
    5: '自动通过'
  }
  return texts[status] || '未知'
}

// 递归统计部门数量
const countDepartments = (departments: any[]): number => {
  if (!departments || departments.length === 0) return 0

  let count = departments.length
  departments.forEach(dep => {
    if (dep.child && Array.isArray(dep.child)) {
      count += countDepartments(dep.child)
    }
  })
  return count
}

const loadData = async () => {
  try {
    // 加载待办事项
    const todoRes = await getTodoList({
      userId: userStore.userInfo?.id,
      page: 1,
      count: 5
    })
    if (todoRes.code === 200) {
      todoList.value = todoRes.data.data
      stats.value.todoCount = todoRes.data.count
    }

    // 加载审批申请
    const approvalRes = await getApprovalList({
      userId: userStore.userInfo?.id,
      page: 1,
      count: 5
    })
    if (approvalRes.code === 200) {
      approvalList.value = approvalRes.data.data
      stats.value.approvalCount = approvalRes.data.count
    }

    // 加载用户统计
    const userRes = await getUserList({ page: 1, count: 1 })
    if (userRes.code === 200) {
      stats.value.userCount = userRes.data.count
    }

    // 加载部门统计
    const depRes = await getDepSoa()
    if (depRes.code === 200) {
      const departments = depRes.data?.child || []
      stats.value.depCount = countDepartments(departments)
    }
  } catch (error) {
    console.error('加载数据失败:', error)
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.stat-card {
  margin-bottom: 20px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 8px;
  color: #ffffff;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.todo-list,
.approval-list {
  max-height: 300px;
  overflow-y: auto;
}

.todo-item,
.approval-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.todo-item:last-child,
.approval-item:last-child {
  border-bottom: none;
}

.todo-title,
.approval-title {
  flex: 1;
  font-size: 14px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.todo-time {
  font-size: 12px;
  color: #909399;
}

.quick-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
</style>
