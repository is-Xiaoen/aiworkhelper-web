<template>
  <div class="todo-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>待办事项管理</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增待办
          </el-button>
        </div>
      </template>

      <!-- 搜索区域 -->
      <el-form :model="queryParams" inline>
        <el-form-item label="开始时间">
          <el-date-picker
            v-model="queryParams.startTime"
            type="datetime"
            placeholder="选择开始时间"
            value-format="X"
          />
        </el-form-item>
        <el-form-item label="结束时间">
          <el-date-picker
            v-model="queryParams.endTime"
            type="datetime"
            placeholder="选择结束时间"
            value-format="X"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 表格 -->
      <el-table
        v-loading="loading"
        :data="tableData"
        stripe
        style="width: 100%; margin-top: 20px;"
      >
        <el-table-column prop="title" label="标题" min-width="200" />
        <el-table-column prop="desc" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="creatorName" label="创建人" width="120" />
        <el-table-column label="执行人" width="150">
          <template #default="{ row }">
            <span v-if="row.executeIds && row.executeIds.length > 0">
              {{ row.executeIds.join(', ') }}
            </span>
            <span v-else style="color: #999;">-</span>
          </template>
        </el-table-column>
        <el-table-column label="截止时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.deadlineAt) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" @click="handleView(row)">查看</el-button>
            <el-button text type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button
              v-if="row.status !== 3"
              text
              type="success"
              @click="handleFinish(row)"
            >
              完成
            </el-button>
            <el-button text type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="queryParams.page"
        v-model:page-size="queryParams.count"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        style="margin-top: 20px; justify-content: flex-end;"
        @size-change="loadData"
        @current-change="loadData"
      />
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入待办标题" />
        </el-form-item>
        <el-form-item label="描述" prop="desc">
          <el-input
            v-model="form.desc"
            type="textarea"
            :rows="4"
            placeholder="请输入待办描述"
          />
        </el-form-item>
        <el-form-item label="截止时间" prop="deadlineAt">
          <el-date-picker
            v-model="form.deadlineAt"
            type="datetime"
            placeholder="选择截止时间"
            value-format="X"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="执行人" prop="executeIds">
          <el-select
            v-model="form.executeIds"
            multiple
            placeholder="请选择执行人"
            style="width: 100%;"
          >
            <el-option
              v-for="user in userList"
              :key="user.id"
              :label="user.name"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">待处理</el-radio>
            <el-radio :label="2">进行中</el-radio>
            <el-radio :label="3">已完成</el-radio>
            <el-radio :label="4">已取消</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 查看对话框 -->
    <el-dialog v-model="viewDialogVisible" title="待办详情" width="600px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="标题">{{ viewData.title }}</el-descriptions-item>
        <el-descriptions-item label="描述">{{ viewData.desc }}</el-descriptions-item>
        <el-descriptions-item label="创建人">{{ viewData.creatorName }}</el-descriptions-item>
        <el-descriptions-item label="执行人">
          <span v-if="viewData.executeIds && viewData.executeIds.length > 0">
            {{ getExecutorNames(viewData.executeIds) }}
          </span>
          <span v-else style="color: #999;">暂无执行人</span>
        </el-descriptions-item>
        <el-descriptions-item label="截止时间">
          {{ formatDate(viewData.deadlineAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(viewData.status)" size="small">
            {{ getStatusText(viewData.status) }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>

      <div v-if="viewData.records && viewData.records.length > 0" style="margin-top: 20px;">
        <h4>操作记录</h4>
        <el-timeline style="margin-top: 10px;">
          <el-timeline-item
            v-for="record in viewData.records"
            :key="record.createAt"
            :timestamp="formatDate(record.createAt)"
          >
            <p><strong>{{ record.userName }}</strong>: {{ record.content }}</p>
            <img v-if="record.image" :src="record.image" style="max-width: 200px; margin-top: 10px;" />
          </el-timeline-item>
        </el-timeline>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getTodoList, createTodo, updateTodo, deleteTodo, finishTodo } from '@/api/todo'
import { getUserList } from '@/api/user'
import { useUserStore } from '@/stores/user'
import dayjs from 'dayjs'
import type { Todo, User } from '@/types'

const userStore = useUserStore()

const loading = ref(false)
const tableData = ref<Todo[]>([])
const total = ref(0)
const userList = ref<User[]>([])

const queryParams = reactive({
  userId: userStore.userInfo?.id,
  page: 1,
  count: 10,
  startTime: undefined as number | undefined,
  endTime: undefined as number | undefined
})

const dialogVisible = ref(false)
const dialogTitle = ref('新增待办')
const formRef = ref<FormInstance>()

const form = reactive<Partial<Todo>>({
  title: '',
  desc: '',
  deadlineAt: 0,
  executeIds: [],
  status: 1,
  creatorId: userStore.userInfo?.id || '',
  creatorName: userStore.userInfo?.name || '',
  todoStatus: 1
})

const rules: FormRules = {
  title: [{ required: true, message: '请输入待办标题', trigger: 'blur' }],
  desc: [{ required: true, message: '请输入待办描述', trigger: 'blur' }],
  deadlineAt: [{ required: true, message: '请选择截止时间', trigger: 'change' }],
  executeIds: [{ required: true, message: '请选择执行人', trigger: 'change' }]
}

const viewDialogVisible = ref(false)
const viewData = ref<Partial<Todo>>({})

const formatDate = (timestamp: number) => {
  return dayjs.unix(timestamp).format('YYYY-MM-DD HH:mm')
}

const getStatusType = (status: number) => {
  const types: any = { 1: 'info', 2: 'warning', 3: 'success', 4: 'info', 5: 'danger' }
  return types[status] || 'info'
}

const getStatusText = (status: number) => {
  const texts: any = { 1: '待处理', 2: '进行中', 3: '已完成', 4: '已取消', 5: '已超时' }
  return texts[status] || '未知'
}

const getExecutorNames = (executeIds: string[]) => {
  if (!executeIds || executeIds.length === 0) return '暂无执行人'
  const names = executeIds.map(id => {
    const user = userList.value.find(u => u.id === id)
    return user ? user.name : id
  })
  return names.join('、')
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await getTodoList(queryParams)
    if (res.code === 200) {
      tableData.value = res.data.data
      total.value = res.data.count
    }
  } catch (error) {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const loadUsers = async () => {
  try {
    const res = await getUserList({ page: 1, count: 100 })
    if (res.code === 200) {
      userList.value = res.data.data
    }
  } catch (error) {
    console.error('加载用户列表失败:', error)
  }
}

const handleReset = () => {
  queryParams.startTime = undefined
  queryParams.endTime = undefined
  queryParams.page = 1
  loadData()
}

const handleAdd = () => {
  dialogTitle.value = '新增待办'
  Object.assign(form, {
    id: undefined,
    title: '',
    desc: '',
    deadlineAt: 0,
    executeIds: [],
    status: 1,
    creatorId: userStore.userInfo?.id || '',
    creatorName: userStore.userInfo?.name || '',
    todoStatus: 1
  })
  dialogVisible.value = true
}

const handleEdit = (row: Todo) => {
  dialogTitle.value = '编辑待办'
  Object.assign(form, { ...row })
  dialogVisible.value = true
}

const handleView = (row: Todo) => {
  viewData.value = { ...row }
  viewDialogVisible.value = true
}

const handleFinish = (row: Todo) => {
  ElMessageBox.confirm('确定要完成该待办事项吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await finishTodo({ userId: userStore.userInfo?.id || '', todoId: row.id })
      ElMessage.success('操作成功')
      loadData()
    } catch (error) {
      ElMessage.error('操作失败')
    }
  })
}

const handleDelete = (row: Todo) => {
  ElMessageBox.confirm('确定要删除该待办事项吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteTodo(row.id)
      ElMessage.success('删除成功')
      loadData()
    } catch (error) {
      ElMessage.error('删除失败')
    }
  })
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // 确保 deadlineAt 是数字类型
        const submitData = {
          ...form,
          deadlineAt: typeof form.deadlineAt === 'string' ? parseInt(form.deadlineAt) : form.deadlineAt
        }

        if (form.id) {
          await updateTodo(submitData as Todo)
          ElMessage.success('更新成功')
        } else {
          await createTodo(submitData as Todo)
          ElMessage.success('创建成功')
        }
        dialogVisible.value = false
        loadData()
      } catch (error) {
        ElMessage.error('操作失败')
      }
    }
  })
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
.todo-page {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
