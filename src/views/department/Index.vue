<template>
  <div class="department-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>部门管理</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增部门
          </el-button>
        </div>
      </template>

      <!-- 部门树 -->
      <el-tree
        v-loading="loading"
        :data="treeData"
        :props="treeProps"
        node-key="id"
        :indent="24"
        default-expand-all
        :expand-on-click-node="false"
      >
        <template #default="{ node, data }">
          <div class="tree-node">
            <div class="node-info">
              <span class="node-label">{{ data.name }}</span>
              <span class="node-meta">负责人: {{ data.leader }} | 人数: {{ data.count }}</span>
            </div>
            <div class="node-actions">
              <el-button text type="primary" size="small" @click="handleView(data)">
                查看
              </el-button>
              <el-button text type="primary" size="small" @click="handleEdit(data)">
                编辑
              </el-button>
              <el-button text type="primary" size="small" @click="handleAddUser(data)">
                添加员工
              </el-button>
              <el-button text type="warning" size="small" @click="handleRemoveUser(data)">
                删除员工
              </el-button>
              <el-button text type="danger" size="small" @click="handleDelete(data)">
                删除
              </el-button>
            </div>
          </div>
        </template>
      </el-tree>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="部门名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入部门名称" />
        </el-form-item>
        <el-form-item label="父部门" prop="parentId">
          <el-tree-select
            v-model="form.parentId"
            :data="treeData"
            :props="treeProps"
            placeholder="请选择父部门"
            check-strictly
            clearable
          />
        </el-form-item>
        <el-form-item label="负责人" prop="leaderId">
          <el-select v-model="form.leaderId" placeholder="请选择负责人" clearable>
            <el-option
              v-for="user in userList"
              :key="user.id"
              :label="user.name"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="负责人名称" prop="leader">
          <el-input v-model="form.leader" placeholder="负责人名称会自动填充" disabled />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 添加员工对话框 -->
    <el-dialog v-model="addUserDialogVisible" title="添加部门员工" width="500px">
      <el-form label-width="100px">
        <el-form-item label="选择员工">
          <el-select v-model="selectedAddUserIds" placeholder="请选择要添加的员工" filterable multiple>
            <el-option
              v-for="user in availableUsersForAdd"
              :key="user.id"
              :label="user.name"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="addUserDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitAddUser">确定</el-button>
      </template>
    </el-dialog>

    <!-- 删除员工对话框 -->
    <el-dialog v-model="removeUserDialogVisible" title="删除部门员工" width="500px">
      <el-form label-width="100px">
        <el-form-item label="选择员工">
          <el-select v-model="selectedRemoveUserIds" placeholder="请选择要删除的员工" filterable multiple>
            <el-option
              v-for="user in availableUsersForRemove"
              :key="user.id"
              :label="user.name"
              :value="user.id"
              :disabled="user.id === currentDepartment?.leaderId"
            />
          </el-select>
        </el-form-item>
        <el-alert v-if="currentDepartment" type="warning" :closable="false" style="margin-bottom: 10px;">
          注意：不能删除部门负责人（{{ currentDepartment.leader }}）
        </el-alert>
      </el-form>

      <template #footer>
        <el-button @click="removeUserDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitRemoveUser">确定</el-button>
      </template>
    </el-dialog>

    <!-- 查看对话框 -->
    <el-dialog v-model="viewDialogVisible" title="部门详情" width="600px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="部门名称" :span="2">{{ viewData.name }}</el-descriptions-item>
        <el-descriptions-item label="负责人">{{ viewData.leader }}</el-descriptions-item>
        <el-descriptions-item label="人数">{{ viewData.count }}</el-descriptions-item>
        <el-descriptions-item label="层级">{{ viewData.level }}</el-descriptions-item>
      </el-descriptions>

      <div v-if="viewData.users && viewData.users.length > 0" style="margin-top: 20px;">
        <h4>部门成员</h4>
        <el-tag
          v-for="user in viewData.users"
          :key="user.id"
          style="margin: 5px;"
        >
          {{ user.userName }}
        </el-tag>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import {
  getDepSoa,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  setDepUser,
  addDepUser,
  removeDepUser
} from '@/api/department'
import { getUserList } from '@/api/user'
import type { Department, User } from '@/types'

const loading = ref(false)
const treeData = ref<Department[]>([])
const userList = ref<User[]>([])

const treeProps = {
  label: 'name',
  children: 'child',
  value: 'id'
}

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

const userDialogVisible = ref(false)
const selectedUserIds = ref<string[]>([])
const currentDepId = ref('')

const addUserDialogVisible = ref(false)
const removeUserDialogVisible = ref(false)
const selectedAddUserIds = ref<string[]>([])
const selectedRemoveUserIds = ref<string[]>([])
const currentDepartment = ref<Department | null>(null)
const currentDepartmentUserIds = ref<string[]>([])

const transferUserList = computed(() => {
  console.log('userList.value:', userList.value)
  if (!userList.value || !Array.isArray(userList.value)) {
    console.log('transferUserList result: [] (userList is null or not array)')
    return []
  }
  const result = userList.value.map(user => ({
    key: user.id,
    label: user.name
  }))
  console.log('transferUserList result:', result)
  return result
})

const viewDialogVisible = ref(false)
const viewData = ref<Partial<Department>>({})

// 可添加的用户列表（不在当前部门的用户）
const availableUsersForAdd = computed(() => {
  if (!userList.value) return []
  return userList.value.filter(user => !currentDepartmentUserIds.value.includes(user.id))
})

// 可删除的用户列表（在当前部门的用户）
const availableUsersForRemove = computed(() => {
  if (!userList.value) return []
  return userList.value.filter(user => currentDepartmentUserIds.value.includes(user.id))
})

// 监听负责人选择，自动填充负责人名称
watch(() => form.leaderId, (newVal) => {
  const user = userList.value.find(u => u.id === newVal)
  if (user) {
    form.leader = user.name
  }
})

// 处理树数据，移除 null 的 child 字段
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
      // 后端返回的data是根节点，真正的部门数据在child数组中
      const rawData = res.data?.child || []
      treeData.value = processTreeData(rawData)
      console.log('处理后的部门树数据:', JSON.stringify(treeData.value, null, 2))
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
    console.log('getUserList response:', res)
    if (res.code === 200) {
      console.log('res.data:', res.data)
      // 处理 res.data 为 null 或者 res.data.data 为 null/undefined 的情况
      if (res.data && res.data.data) {
        userList.value = res.data.data
        console.log('userList.value after assignment:', userList.value)
      } else {
        userList.value = []
        console.log('用户列表数据为空，设置为空数组')
      }
    }
  } catch (error) {
    console.error('加载用户列表失败:', error)
    ElMessage.error('加载用户列表失败')
  }
}

const handleAdd = () => {
  dialogTitle.value = '新增部门'
  Object.assign(form, {
    id: undefined,
    name: '',
    parentId: '',
    leaderId: '',
    leader: '',
    level: 1
  })
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

  // 从部门数据中提取用户ID列表
  currentDepartmentUserIds.value = data.users?.map(u => u.user) || []

  addUserDialogVisible.value = true
}

const handleRemoveUser = (data: Department) => {
  currentDepartment.value = data
  currentDepId.value = data.id
  selectedRemoveUserIds.value = []

  // 从部门数据中提取用户ID列表
  currentDepartmentUserIds.value = data.users?.map(u => u.user) || []

  removeUserDialogVisible.value = true
}

const handleDelete = (data: Department) => {
  ElMessageBox.confirm('确定要删除该部门吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteDepartment(data.id)
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
        if (form.id) {
          await updateDepartment(form as Department)
          ElMessage.success('更新成功')
        } else {
          await createDepartment(form as Department)
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

const handleSubmitUsers = async () => {
  try {
    // 后端要求至少有一个用户，如果为空则给出提示
    if (!selectedUserIds.value || selectedUserIds.value.length === 0) {
      ElMessage.warning('请先将左侧用户移动到右侧"部门成员"列表中（点击中间的箭头按钮）')
      return
    }

    await setDepUser({
      depId: currentDepId.value,
      userIds: selectedUserIds.value
    })
    ElMessage.success('设置成功')
    userDialogVisible.value = false
    loadData()
  } catch (error: any) {
    console.error('设置部门用户失败:', error)
    ElMessage.error(error?.response?.data?.msg || '设置失败')
  }
}

const handleSubmitAddUser = async () => {
  try {
    if (!selectedAddUserIds.value || selectedAddUserIds.value.length === 0) {
      ElMessage.warning('请选择要添加的员工')
      return
    }

    // 批量添加员工
    for (const userId of selectedAddUserIds.value) {
      await addDepUser({
        depId: currentDepId.value,
        userId: userId
      })
    }

    ElMessage.success(`成功添加${selectedAddUserIds.value.length}个员工`)
    addUserDialogVisible.value = false
    loadData()
  } catch (error: any) {
    console.error('添加部门员工失败:', error)
    ElMessage.error(error?.response?.data?.msg || '添加失败')
  }
}

const handleSubmitRemoveUser = async () => {
  try {
    if (!selectedRemoveUserIds.value || selectedRemoveUserIds.value.length === 0) {
      ElMessage.warning('请选择要删除的员工')
      return
    }

    // 批量删除员工
    for (const userId of selectedRemoveUserIds.value) {
      await removeDepUser({
        depId: currentDepId.value,
        userId: userId
      })
    }

    ElMessage.success(`成功删除${selectedRemoveUserIds.value.length}个员工`)
    removeUserDialogVisible.value = false
    loadData()
  } catch (error: any) {
    console.error('删除部门员工失败:', error)
    ElMessage.error(error?.response?.data?.msg || '删除失败')
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
.department-page {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 重置 el-tree 节点样式，保留缩进 */
:deep(.el-tree-node__content) {
  height: auto !important;
  padding-top: 8px !important;
  padding-bottom: 8px !important;
  /* 不要覆盖 padding-left，让 Element Plus 控制缩进 */
}

.tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0;
  width: 100%;
  min-width: 0;
}

.node-info {
  flex: 0 1 auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  max-width: 60%;
}

.node-label {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.node-meta {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.node-actions {
  flex: 0 0 auto;
  display: flex;
  gap: 8px;
  margin-left: auto;
  padding-left: 16px;
}
</style>
