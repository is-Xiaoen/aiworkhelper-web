<template>
  <div class="approval-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>审批管理</span>
          <el-button type="primary" @click="$router.push('/approval/create')">
            <el-icon><Plus /></el-icon>
            发起审批
          </el-button>
        </div>
      </template>

      <!-- 筛选区域 -->
      <el-form :model="queryParams" inline>
        <el-form-item label="审批类型">
          <el-select v-model="queryParams.type" placeholder="全部" clearable>
            <el-option label="请假" :value="1" />
            <el-option label="补卡" :value="2" />
            <el-option label="外出" :value="3" />
          </el-select>
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
        <el-table-column prop="no" label="审批编号" width="180" />
        <el-table-column prop="title" label="标题" min-width="200" />
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ getTypeText(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" @click="handleView(row)">查看</el-button>
            <el-button
              v-if="row.status === 0"
              text
              type="success"
              @click="handleApprove(row, 1)"
            >
              通过
            </el-button>
            <el-button
              v-if="row.status === 0"
              text
              type="danger"
              @click="handleApprove(row, 2)"
            >
              拒绝
            </el-button>
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

    <!-- 查看对话框 -->
    <el-dialog v-model="viewDialogVisible" title="审批详情" width="700px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="审批编号" :span="2">{{ viewData.no }}</el-descriptions-item>
        <el-descriptions-item label="标题" :span="2">{{ viewData.title }}</el-descriptions-item>
        <el-descriptions-item label="类型">
          <el-tag size="small">{{ getTypeText(viewData.type) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(viewData.status)" size="small">
            {{ getStatusText(viewData.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="摘要" :span="2">{{ viewData.abstract }}</el-descriptions-item>
        <el-descriptions-item label="原因" :span="2">{{ viewData.reason }}</el-descriptions-item>

        <!-- 请假信息 -->
        <template v-if="viewData.type === 1 && viewData.leave">
          <el-descriptions-item label="请假类型">{{ viewData.leave.type }}</el-descriptions-item>
          <el-descriptions-item label="时长">{{ viewData.leave.duration }} {{ viewData.leave.timeType === 1 ? '小时' : '天' }}</el-descriptions-item>
          <el-descriptions-item label="开始时间" :span="2">
            {{ formatDate(viewData.leave.startTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="结束时间" :span="2">
            {{ formatDate(viewData.leave.endTime) }}
          </el-descriptions-item>
        </template>

        <!-- 补卡信息 -->
        <template v-if="viewData.type === 2 && viewData.makeCard">
          <el-descriptions-item label="补卡日期" :span="2">
            {{ formatDate(viewData.makeCard.date) }}
          </el-descriptions-item>
          <el-descriptions-item label="补卡原因" :span="2">
            {{ viewData.makeCard.reason }}
          </el-descriptions-item>
        </template>

        <!-- 外出信息 -->
        <template v-if="viewData.type === 3 && viewData.goOut">
          <el-descriptions-item label="时长">{{ viewData.goOut.duration }} 小时</el-descriptions-item>
          <el-descriptions-item label="外出原因" :span="2">{{ viewData.goOut.reason }}</el-descriptions-item>
          <el-descriptions-item label="开始时间" :span="2">
            {{ formatDate(viewData.goOut.startTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="结束时间" :span="2">
            {{ formatDate(viewData.goOut.endTime) }}
          </el-descriptions-item>
        </template>

        <el-descriptions-item label="创建时间" :span="2">
          {{ formatDate(viewData.createAt) }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- 审批处理对话框 -->
    <el-dialog v-model="approveDialogVisible" :title="approveTitle" width="500px">
      <el-form :model="approveForm" label-width="80px">
        <el-form-item label="审批意见">
          <el-input
            v-model="approveForm.reason"
            type="textarea"
            :rows="4"
            placeholder="请输入审批意见（拒绝时必填）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approveDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmApprove">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getApprovalList, disposeApproval, getApproval } from '@/api/approval'
import { useUserStore } from '@/stores/user'
import dayjs from 'dayjs'
import type { Approval } from '@/types'

const userStore = useUserStore()

const loading = ref(false)
const tableData = ref<Approval[]>([])
const total = ref(0)

const queryParams = reactive({
  userId: userStore.userInfo?.id,
  type: undefined as number | undefined,
  page: 1,
  count: 10
})

const viewDialogVisible = ref(false)
const viewData = ref<Partial<Approval>>({})

const approveDialogVisible = ref(false)
const approveTitle = ref('')
const approveForm = reactive({
  approvalId: '',
  status: 0,
  reason: ''
})

const formatDate = (timestamp?: number) => {
  return timestamp ? dayjs.unix(timestamp).format('YYYY-MM-DD HH:mm') : '-'
}

const getTypeText = (type?: number) => {
  const texts: any = { 1: '请假', 2: '补卡', 3: '外出' }
  return texts[type || 0] || '未知'
}

const getStatusType = (status?: number) => {
  const types: any = { 0: 'warning', 1: 'success', 2: 'danger', 3: 'info' }
  return types[status || 0] || 'info'
}

const getStatusText = (status?: number) => {
  const texts: any = { 0: '待审批', 1: '已通过', 2: '已拒绝', 3: '已撤销' }
  return texts[status || 0] || '未知'
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await getApprovalList(queryParams)
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

const handleReset = () => {
  queryParams.type = undefined
  queryParams.page = 1
  loadData()
}

const handleView = async (row: Approval) => {
  try {
    const res = await getApproval(row.id)
    if (res.code === 200) {
      viewData.value = res.data
      viewDialogVisible.value = true
    }
  } catch (error) {
    ElMessage.error('加载详情失败')
  }
}

const handleApprove = (row: Approval, status: number) => {
  approveTitle.value = status === 1 ? '审批通过' : '审批拒绝'
  approveForm.approvalId = row.id
  approveForm.status = status
  approveForm.reason = ''
  approveDialogVisible.value = true
}

const handleConfirmApprove = async () => {
  if (approveForm.status === 2 && !approveForm.reason) {
    ElMessage.warning('拒绝审批时必须填写理由')
    return
  }

  try {
    await disposeApproval(approveForm)
    ElMessage.success('操作成功')
    approveDialogVisible.value = false
    loadData()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.approval-page {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
