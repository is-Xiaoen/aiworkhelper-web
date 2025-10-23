<template>
  <div class="create-approval-page">
    <el-card>
      <template #header>
        <span>发起审批</span>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        style="max-width: 600px;"
      >
        <el-form-item label="审批类型" prop="type">
          <el-radio-group v-model="form.type" @change="handleTypeChange">
            <el-radio :label="1">请假</el-radio>
            <el-radio :label="2">补卡</el-radio>
            <el-radio :label="3">外出</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入审批标题" />
        </el-form-item>

        <el-form-item label="摘要" prop="abstract">
          <el-input v-model="form.abstract" placeholder="请输入摘要" />
        </el-form-item>

        <el-form-item label="原因" prop="reason">
          <el-input
            v-model="form.reason"
            type="textarea"
            :rows="4"
            placeholder="请输入原因"
          />
        </el-form-item>

        <!-- 请假表单 -->
        <template v-if="form.type === 1">
          <el-form-item label="请假类型" prop="leave.type">
            <el-input-number v-model="form.leave!.type" :min="1" />
          </el-form-item>
          <el-form-item label="开始时间" prop="leave.startTime">
            <el-date-picker
              v-model="form.leave!.startTime"
              type="datetime"
              placeholder="选择开始时间"
              value-format="X"
              style="width: 100%;"
            />
          </el-form-item>
          <el-form-item label="结束时间" prop="leave.endTime">
            <el-date-picker
              v-model="form.leave!.endTime"
              type="datetime"
              placeholder="选择结束时间"
              value-format="X"
              style="width: 100%;"
            />
          </el-form-item>
          <el-form-item label="时长单位" prop="leave.timeType">
            <el-radio-group v-model="form.leave!.timeType">
              <el-radio :label="1">小时</el-radio>
              <el-radio :label="2">天</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="时长" prop="leave.duration">
            <el-input-number v-model="form.leave!.duration" :min="0" :step="0.5" />
          </el-form-item>
        </template>

        <!-- 补卡表单 -->
        <template v-if="form.type === 2">
          <el-form-item label="补卡日期" prop="makeCard.date">
            <el-date-picker
              v-model="form.makeCard!.date"
              type="datetime"
              placeholder="选择补卡日期"
              value-format="X"
              style="width: 100%;"
            />
          </el-form-item>
          <el-form-item label="补卡原因" prop="makeCard.reason">
            <el-input v-model="form.makeCard!.reason" placeholder="请输入补卡原因" />
          </el-form-item>
          <el-form-item label="打卡类型" prop="makeCard.workCheckType">
            <el-input-number v-model="form.makeCard!.workCheckType" :min="1" />
          </el-form-item>
        </template>

        <!-- 外出表单 -->
        <template v-if="form.type === 3">
          <el-form-item label="开始时间" prop="goOut.startTime">
            <el-date-picker
              v-model="form.goOut!.startTime"
              type="datetime"
              placeholder="选择开始时间"
              value-format="X"
              style="width: 100%;"
            />
          </el-form-item>
          <el-form-item label="结束时间" prop="goOut.endTime">
            <el-date-picker
              v-model="form.goOut!.endTime"
              type="datetime"
              placeholder="选择结束时间"
              value-format="X"
              style="width: 100%;"
            />
          </el-form-item>
          <el-form-item label="时长（小时）" prop="goOut.duration">
            <el-input-number v-model="form.goOut!.duration" :min="0" :step="0.5" />
          </el-form-item>
        </template>

        <el-form-item>
          <el-button type="primary" @click="handleSubmit">提交审批</el-button>
          <el-button @click="$router.back()">返回</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, FormInstance, FormRules } from 'element-plus'
import { createApproval } from '@/api/approval'
import { useUserStore } from '@/stores/user'
import type { Approval } from '@/types'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref<FormInstance>()

const form = reactive<Partial<Approval>>({
  type: 1,
  title: '',
  abstract: '',
  reason: '',
  userId: userStore.userInfo?.id || '',
  no: `SP${Date.now()}`,
  status: 0,
  leave: {
    type: 1,
    startTime: 0,
    endTime: 0,
    duration: 0,
    reason: '',
    timeType: 2
  },
  makeCard: {
    date: 0,
    reason: '',
    day: 0,
    workCheckType: 1
  },
  goOut: {
    startTime: 0,
    endTime: 0,
    duration: 0,
    reason: ''
  }
})

const rules: FormRules = {
  type: [{ required: true, message: '请选择审批类型', trigger: 'change' }],
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  abstract: [{ required: true, message: '请输入摘要', trigger: 'blur' }],
  reason: [{ required: true, message: '请输入原因', trigger: 'blur' }]
}

const handleTypeChange = () => {
  // 重置表单数据
  form.leave = {
    type: 1,
    startTime: 0,
    endTime: 0,
    duration: 0,
    reason: '',
    timeType: 2
  }
  form.makeCard = {
    date: 0,
    reason: '',
    day: 0,
    workCheckType: 1
  }
  form.goOut = {
    startTime: 0,
    endTime: 0,
    duration: 0,
    reason: ''
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const submitData: Partial<Approval> = {
          ...form,
          finishAt: Date.now() / 1000
        }

        // 根据类型只保留对应的数据
        if (form.type === 1) {
          delete submitData.makeCard
          delete submitData.goOut
        } else if (form.type === 2) {
          delete submitData.leave
          delete submitData.goOut
        } else if (form.type === 3) {
          delete submitData.leave
          delete submitData.makeCard
        }

        await createApproval(submitData as Approval)
        ElMessage.success('审批提交成功')
        router.back()
      } catch (error) {
        ElMessage.error('提交失败')
      }
    }
  })
}
</script>

<style scoped>
.create-approval-page {
  height: 100%;
}
</style>
