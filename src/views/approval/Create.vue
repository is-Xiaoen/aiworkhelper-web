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
            <el-radio :label="2">请假</el-radio>
            <el-radio :label="3">补卡</el-radio>
            <el-radio :label="4">外出</el-radio>
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
        <template v-if="form.type === 2">
          <el-form-item label="请假类型" prop="leave.type">
            <el-select v-model="form.leave!.type" placeholder="请选择请假类型" style="width: 100%;">
              <el-option label="事假" :value="1" />
              <el-option label="调休" :value="2" />
              <el-option label="病假" :value="3" />
              <el-option label="年假" :value="4" />
              <el-option label="产假" :value="5" />
              <el-option label="陪产假" :value="6" />
              <el-option label="婚假" :value="7" />
              <el-option label="丧假" :value="8" />
              <el-option label="哺乳假" :value="9" />
            </el-select>
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
        <template v-if="form.type === 3">
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
        <template v-if="form.type === 4">
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
  type: 2, // 默认请假类型
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
          finishAt: Math.floor(Date.now() / 1000)
        }

        // 转换时间字段为数字类型
        if (submitData.leave) {
          submitData.leave = {
            ...submitData.leave,
            reason: form.reason, // 将原因字段复制到请假详情中
            startTime: typeof submitData.leave.startTime === 'string'
              ? parseInt(submitData.leave.startTime)
              : submitData.leave.startTime,
            endTime: typeof submitData.leave.endTime === 'string'
              ? parseInt(submitData.leave.endTime)
              : submitData.leave.endTime
          }
        }

        if (submitData.goOut) {
          submitData.goOut = {
            ...submitData.goOut,
            reason: form.reason, // 将原因字段复制到外出详情中
            startTime: typeof submitData.goOut.startTime === 'string'
              ? parseInt(submitData.goOut.startTime)
              : submitData.goOut.startTime,
            endTime: typeof submitData.goOut.endTime === 'string'
              ? parseInt(submitData.goOut.endTime)
              : submitData.goOut.endTime
          }
        }

        if (submitData.makeCard) {
          submitData.makeCard = {
            ...submitData.makeCard,
            reason: form.reason, // 将原因字段复制到补卡详情中
            date: typeof submitData.makeCard.date === 'string'
              ? parseInt(submitData.makeCard.date)
              : submitData.makeCard.date
          }
        }

        // 根据类型只保留对应的数据
        if (form.type === 2) {
          // 请假：只保留 leave
          delete submitData.makeCard
          delete submitData.goOut
        } else if (form.type === 3) {
          // 补卡：只保留 makeCard
          delete submitData.leave
          delete submitData.goOut
        } else if (form.type === 4) {
          // 外出：只保留 goOut
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
