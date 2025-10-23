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
              <el-button text type="primary" size="small" @click="handleSetUser(data)">
                设置成员
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

    <!-- 设置成员对话框 -->
    <el-dialog v-model="userDialogVisible" title="设置部门成员" width="500px">
      <el-transfer
        v-model="selectedUserIds"
        :data="transferUserList"
        :titles="['全部用户', '部门成员']"
        filterable
      />

      <template #footer>
        <el-button @click="userDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitUsers">确定</el-button>
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
  setDepUser
} from '@/api/department'
import { getUserList } from '@/api/user'
import type { Department, User } from '@/types'

const loading = ref(false)
const treeData = ref<Department[]>([])
const userList = ref<User[]>([])

const treeProps = {
  label: 'name',
  children: 'child'
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

const transferUserList = computed(() => {
  return userList.value.map(user => ({
    key: user.id,
    label: user.name
  }))
})

const viewDialogVisible = ref(false)
const viewData = ref<Partial<Department>>({})

// 监听负责人选择，自动填充负责人名称
watch(() => form.leaderId, (newVal) => {
  const user = userList.value.find(u => u.id === newVal)
  if (user) {
    form.leader = user.name
  }
})

const loadData = async () => {
  loading.value = true
  try {
    const res = await getDepSoa()
    if (res.code === 200) {
      treeData.value = res.data ? [res.data] : []
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

const handleSetUser = (data: Department) => {
  currentDepId.value = data.id
  selectedUserIds.value = data.users?.map(u => u.user) || []
  userDialogVisible.value = true
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
    await setDepUser({
      depId: currentDepId.value,
      userIds: selectedUserIds.value
    })
    ElMessage.success('设置成功')
    userDialogVisible.value = false
    loadData()
  } catch (error) {
    ElMessage.error('设置失败')
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

.tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 8px;
}

.node-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.node-label {
  font-size: 14px;
  font-weight: 500;
}

.node-meta {
  font-size: 12px;
  color: #909399;
}

.node-actions {
  display: flex;
  gap: 8px;
}
</style>
