<template>
  <div class="approval-page">
    <!-- 背景装饰 -->
    <div class="bg-blob blob-1"></div>
    <div class="bg-blob blob-2"></div>

    <div class="page-container">
      <!-- 页面头部 -->
      <header class="page-header">
        <div class="header-info">
          <h1>审批管理</h1>
          <p>处理和跟踪审批流程</p>
        </div>
        <AppButton
          type="primary"
          :icon="Plus"
          @click="$router.push('/approval/create')"
          >发起审批</AppButton
        >
      </header>

      <!-- 筛选区域：选项卡 + 搜索 -->
      <div class="filter-card">
        <div class="filter-row">
          <!-- 左侧选项卡 -->
          <div class="custom-tabs">
            <button
              class="tab-btn"
              :class="{ active: activeTab === 'submit' }"
              @click="handleTabChange('submit')"
            >
              <el-icon><Document /></el-icon>
              我提交的
              <span v-if="submitCount" class="tab-count">{{
                submitCount
              }}</span>
            </button>
            <button
              class="tab-btn"
              :class="{ active: activeTab === 'audit' }"
              @click="handleTabChange('audit')"
            >
              <el-icon><Stamp /></el-icon>
              待我审批
              <span v-if="auditCount" class="tab-count highlight">{{
                auditCount
              }}</span>
            </button>
          </div>

          <!-- 右侧搜索 -->
          <div class="search-area">
            <el-form :model="queryParams" inline class="search-form">
              <el-form-item label="审批类型">
                <el-select
                  v-model="queryParams.approvalType"
                  placeholder="全部类型"
                  clearable
                  style="width: 140px"
                >
                  <el-option label="请假" :value="2" />
                  <el-option label="补卡" :value="3" />
                  <el-option label="外出" :value="4" />
                </el-select>
              </el-form-item>
              <el-form-item label="审批状态">
                <el-select
                  v-model="queryParams.status"
                  placeholder="全部状态"
                  clearable
                  style="width: 140px"
                >
                  <el-option label="处理中" :value="1" />
                  <el-option label="已通过" :value="2" />
                  <el-option label="已拒绝" :value="3" />
                  <el-option label="已撤销" :value="4" />
                </el-select>
              </el-form-item>
              <el-form-item class="search-btns">
                <AppButton type="primary" :icon="Search" @click="loadData"
                  >查询</AppButton
                >
                <AppButton :icon="Refresh" @click="handleReset">重置</AppButton>
              </el-form-item>
            </el-form>
          </div>
        </div>
      </div>

      <!-- 表格区域 -->
      <div class="table-card">
        <!-- 骨架屏 -->
        <div v-if="loading" class="skeleton-table">
          <div class="skeleton-header">
            <div class="skeleton-cell" style="flex: 2"></div>
            <div class="skeleton-cell" style="flex: 3"></div>
            <div class="skeleton-cell" style="flex: 1"></div>
            <div class="skeleton-cell" style="flex: 1"></div>
            <div class="skeleton-cell" style="flex: 2"></div>
            <div class="skeleton-cell" style="flex: 1.5"></div>
          </div>
          <div v-for="i in 5" :key="i" class="skeleton-row">
            <div class="skeleton-cell" style="flex: 2"></div>
            <div class="skeleton-cell" style="flex: 3"></div>
            <div class="skeleton-cell" style="flex: 1"></div>
            <div class="skeleton-cell" style="flex: 1"></div>
            <div class="skeleton-cell" style="flex: 2"></div>
            <div class="skeleton-cell" style="flex: 1.5"></div>
          </div>
        </div>

        <el-table v-else :data="tableData" class="data-table" stripe>
          <el-table-column prop="no" label="审批编号" width="180">
            <template #default="{ row }">
              <span class="cell-code">{{ row.no }}</span>
            </template>
          </el-table-column>
          <el-table-column
            prop="title"
            label="标题"
            min-width="200"
            show-overflow-tooltip
          >
            <template #default="{ row }">
              <span class="cell-title">{{ row.title }}</span>
            </template>
          </el-table-column>
          <el-table-column label="类型" width="160" align="center">
            <template #default="{ row }">
              <span class="type-badge" :class="getTypeClass(row.type)">
                {{ getTypeText(row.type) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="160" align="center">
            <template #default="{ row }">
              <span class="status-badge" :class="getStatusClass(row.status)">
                <span class="status-dot"></span>
                {{ getStatusText(row.status) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" width="160" align="center">
            <template #default="{ row }">
              <span class="cell-time">{{ formatDate(row.createAt) }}</span>
            </template>
          </el-table-column>
          <el-table-column
            label="操作"
            width="240"
            align="center"
            fixed="right"
          >
            <template #default="{ row }">
              <div class="action-btns">
                <button class="action-btn" @click="handleView(row)">
                  查看
                </button>
                <template
                  v-if="
                    activeTab === 'audit' &&
                    row.status === 1 &&
                    row.participatingId === userStore.userInfo?.id
                  "
                >
                  <button
                    class="action-btn success"
                    @click="handleApprove(row, 2)"
                  >
                    通过
                  </button>
                  <button
                    class="action-btn danger"
                    @click="handleApprove(row, 3)"
                  >
                    拒绝
                  </button>
                </template>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="table-footer">
          <div class="table-info">共 {{ total }} 条记录</div>
          <el-pagination
            v-model:current-page="queryParams.page"
            v-model:page-size="queryParams.count"
            :total="total"
            :page-sizes="[10, 20, 50]"
            layout="sizes, prev, pager, next"
            @size-change="loadData"
            @current-change="loadData"
          />
        </div>
      </div>
    </div>

    <!-- 查看详情对话框 -->
    <el-dialog
      v-model="viewDialogVisible"
      title="审批详情"
      width="680px"
      class="approval-dialog"
      destroy-on-close
    >
      <div class="detail-wrapper">
        <!-- 基础信息 -->
        <div class="detail-section">
          <h4 class="section-title">
            <span class="title-marker"></span>
            基本信息
          </h4>
          <div class="detail-grid">
            <div class="detail-item">
              <label>审批编号</label>
              <span class="code">{{ viewData.no }}</span>
            </div>
            <div class="detail-item">
              <label>审批类型</label>
              <span class="type-badge" :class="getTypeClass(viewData.type)">{{
                getTypeText(viewData.type)
              }}</span>
            </div>
            <div class="detail-item full">
              <label>标题</label>
              <span>{{ viewData.title }}</span>
            </div>
            <div class="detail-item full">
              <label>摘要</label>
              <span>{{ viewData.abstract || "-" }}</span>
            </div>
            <div class="detail-item">
              <label>当前状态</label>
              <span
                class="status-badge"
                :class="getStatusClass(viewData.status)"
              >
                <span class="status-dot"></span>
                {{ getStatusText(viewData.status) }}
              </span>
            </div>
            <div class="detail-item">
              <label>创建时间</label>
              <span>{{ formatDate(viewData.createAt) }}</span>
            </div>
          </div>
        </div>

        <!-- 请假信息 -->
        <div
          v-if="viewData.type === 2 && viewData.leave"
          class="detail-section"
        >
          <h4 class="section-title">
            <span class="title-marker leave"></span>
            请假信息
          </h4>
          <div class="detail-grid">
            <div class="detail-item">
              <label>请假类型</label>
              <span>{{ getLeaveTypeText(viewData.leave.type) }}</span>
            </div>
            <div class="detail-item">
              <label>时长类型</label>
              <span
                >按{{ viewData.leave.timeType === 1 ? "小时" : "天" }}计算</span
              >
            </div>
            <div class="detail-item">
              <label>开始时间</label>
              <span>{{ formatDate(viewData.leave.startTime) }}</span>
            </div>
            <div class="detail-item">
              <label>结束时间</label>
              <span>{{ formatDate(viewData.leave.endTime) }}</span>
            </div>
            <div class="detail-item full">
              <label>请假原因</label>
              <span>{{ viewData.leave.reason || "-" }}</span>
            </div>
          </div>
        </div>

        <!-- 补卡信息 -->
        <div
          v-if="viewData.type === 3 && viewData.makeCard"
          class="detail-section"
        >
          <h4 class="section-title">
            <span class="title-marker card"></span>
            补卡信息
          </h4>
          <div class="detail-grid">
            <div class="detail-item">
              <label>补卡日期</label>
              <span>{{ formatDate(viewData.makeCard.date) }}</span>
            </div>
            <div class="detail-item">
              <label>打卡类型</label>
              <span>{{
                getWorkCheckTypeText(viewData.makeCard.workCheckType)
              }}</span>
            </div>
            <div class="detail-item full">
              <label>补卡原因</label>
              <span>{{ viewData.makeCard.reason || "-" }}</span>
            </div>
          </div>
        </div>

        <!-- 外出信息 -->
        <div
          v-if="viewData.type === 4 && viewData.goOut"
          class="detail-section"
        >
          <h4 class="section-title">
            <span class="title-marker out"></span>
            外出信息
          </h4>
          <div class="detail-grid">
            <div class="detail-item">
              <label>外出时长</label>
              <span>{{ viewData.goOut.duration || 0 }} 小时</span>
            </div>
            <div class="detail-item">
              <label>开始时间</label>
              <span>{{ formatDate(viewData.goOut.startTime) }}</span>
            </div>
            <div class="detail-item">
              <label>结束时间</label>
              <span>{{ formatDate(viewData.goOut.endTime) }}</span>
            </div>
            <div class="detail-item full">
              <label>外出原因</label>
              <span>{{ viewData.goOut.reason || "-" }}</span>
            </div>
          </div>
        </div>

        <!-- 审批流程 -->
        <div v-if="viewData.approvers?.length" class="detail-section">
          <h4 class="section-title">
            <span class="title-marker flow"></span>
            审批流程
          </h4>
          <div class="flow-timeline">
            <div
              v-for="(approver, index) in viewData.approvers"
              :key="index"
              class="flow-item"
              :class="getApproverClass(approver.status)"
            >
              <div class="flow-node">
                <div class="node-icon">
                  <el-icon v-if="approver.status === 2"
                    ><CircleCheck
                  /></el-icon>
                  <el-icon v-else-if="approver.status === 3"
                    ><CircleClose
                  /></el-icon>
                  <el-icon v-else-if="approver.status === 1"><Clock /></el-icon>
                  <el-icon v-else><User /></el-icon>
                </div>
                <div
                  class="node-line"
                  v-if="index < viewData.approvers.length - 1"
                ></div>
              </div>
              <div class="flow-content">
                <div class="flow-header">
                  <span class="flow-name">{{ approver.userName }}</span>
                  <span class="flow-status">{{
                    getApproverStatusLabel(approver.status)
                  }}</span>
                </div>
                <p v-if="approver.reason" class="flow-reason">
                  {{ approver.reason }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 审批处理对话框 -->
    <el-dialog
      v-model="approveDialogVisible"
      :title="approveTitle"
      width="480px"
      class="approval-dialog"
    >
      <div class="approve-form">
        <div class="approve-info">
          <el-icon :class="approveForm.status === 2 ? 'success' : 'danger'">
            <CircleCheck v-if="approveForm.status === 2" />
            <CircleClose v-else />
          </el-icon>
          <span>{{
            approveForm.status === 2 ? "确认通过此审批？" : "确认拒绝此审批？"
          }}</span>
        </div>
        <el-form :model="approveForm" label-width="80px">
          <el-form-item
            :label="approveForm.status === 2 ? '审批意见' : '拒绝理由'"
            :required="approveForm.status === 3"
          >
            <el-input
              v-model="approveForm.reason"
              type="textarea"
              :rows="3"
              :placeholder="
                approveForm.status === 2
                  ? '选填，可输入审批意见'
                  : '必填，请输入拒绝理由'
              "
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <div class="dialog-actions">
          <AppButton @click="approveDialogVisible = false">取消</AppButton>
          <AppButton
            :type="approveForm.status === 2 ? 'success' : 'danger'"
            @click="handleConfirmApprove"
          >
            {{ approveForm.status === 2 ? "确认通过" : "确认拒绝" }}
          </AppButton>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";
import {
  Plus,
  Search,
  Refresh,
  Document,
  Stamp,
  CircleCheck,
  CircleClose,
  Clock,
  User,
} from "@element-plus/icons-vue";
import { getApprovalList, disposeApproval, getApproval } from "@/api/approval";
import { useUserStore } from "@/stores/user";
import dayjs from "dayjs";
import type { Approval } from "@/types";

const userStore = useUserStore();

const loading = ref(false);
const tableData = ref<Approval[]>([]);
const total = ref(0);
const submitCount = ref(0);
const auditCount = ref(0);
const activeTab = ref("submit");

const queryParams = reactive({
  userId: userStore.userInfo?.id,
  type: 1,
  approvalType: undefined as number | undefined,
  status: undefined as number | undefined,
  page: 1,
  count: 10,
});

const viewDialogVisible = ref(false);
const viewData = ref<Partial<Approval>>({});

const approveDialogVisible = ref(false);
const approveTitle = ref("");
const approveForm = reactive({
  approvalId: "",
  status: 0,
  reason: "",
});

const formatDate = (timestamp?: number) =>
  timestamp ? dayjs.unix(timestamp).format("YYYY-MM-DD HH:mm") : "-";

const getTypeText = (type?: number) => {
  const texts: Record<number, string> = {
    1: "通用",
    2: "请假",
    3: "补卡",
    4: "外出",
    5: "报销",
    6: "付款",
    7: "采购",
    8: "收款",
  };
  return texts[type || 0] || "未知";
};

const getTypeClass = (type?: number) => {
  const classes: Record<number, string> = {
    2: "leave",
    3: "card",
    4: "out",
    5: "expense",
  };
  return classes[type || 0] || "default";
};

const getStatusText = (status?: number) => {
  const texts: Record<number, string> = {
    0: "未开始",
    1: "处理中",
    2: "已通过",
    3: "已拒绝",
    4: "已撤销",
    5: "自动通过",
  };
  return texts[status || 0] || "未知";
};

const getStatusClass = (status?: number) => {
  const classes: Record<number, string> = {
    0: "default",
    1: "progress",
    2: "success",
    3: "danger",
    4: "cancel",
    5: "success",
  };
  return classes[status || 0] || "default";
};

const getLeaveTypeText = (type?: number) => {
  const texts: Record<number, string> = {
    1: "事假",
    2: "调休",
    3: "病假",
    4: "年假",
    5: "产假",
    6: "陪产假",
    7: "婚假",
    8: "丧假",
    9: "哺乳假",
  };
  return texts[type || 0] || "未知";
};

const getWorkCheckTypeText = (type?: number) => {
  const texts: Record<number, string> = { 1: "上班卡", 2: "下班卡" };
  return texts[type || 0] || "未知";
};

const getApproverClass = (status?: number) => {
  const classes: Record<number, string> = {
    0: "pending",
    1: "current",
    2: "approved",
    3: "rejected",
  };
  return classes[status || 0] || "pending";
};

const getApproverStatusLabel = (status?: number) => {
  const labels: Record<number, string> = {
    0: "待审批",
    1: "审批中",
    2: "已通过",
    3: "已拒绝",
  };
  return labels[status || 0] || "待审批";
};

const loadData = async () => {
  loading.value = true;
  try {
    const res = await getApprovalList(queryParams);
    if (res.code === 200) {
      tableData.value = res.data.data;
      total.value = res.data.count;
      if (activeTab.value === "submit") {
        submitCount.value = res.data.count;
      } else {
        auditCount.value = res.data.count;
      }
    }
  } catch {
    ElMessage.error("加载数据失败");
  } finally {
    loading.value = false;
  }
};

const handleTabChange = (tab: string) => {
  activeTab.value = tab;
  queryParams.type = tab === "submit" ? 1 : 2;
  queryParams.page = 1;
  loadData();
};

const handleReset = () => {
  queryParams.approvalType = undefined;
  queryParams.status = undefined;
  queryParams.page = 1;
  loadData();
};

const handleView = async (row: Approval) => {
  try {
    const res = await getApproval(row.id);
    if (res.code === 200) {
      viewData.value = res.data;
      viewDialogVisible.value = true;
    }
  } catch {
    ElMessage.error("加载详情失败");
  }
};

const handleApprove = (row: Approval, status: number) => {
  approveTitle.value = status === 2 ? "审批通过" : "审批拒绝";
  approveForm.approvalId = row.id;
  approveForm.status = status;
  approveForm.reason = "";
  approveDialogVisible.value = true;
};

const handleConfirmApprove = async () => {
  if (approveForm.status === 3 && !approveForm.reason) {
    ElMessage.warning("拒绝审批时必须填写理由");
    return;
  }
  try {
    await disposeApproval(approveForm);
    ElMessage.success("操作成功");
    approveDialogVisible.value = false;
    loadData();
  } catch {
    ElMessage.error("操作失败");
  }
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
/* 页面容器 */
.approval-page {
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
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(30px, 20px) scale(1.05);
  }
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

/* 卡片基础 */
.filter-card,
.table-card {
  background: var(--glass-bg);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-soft);
}

/* 筛选卡片 */
.filter-card {
  padding: 12px 20px;
}
.filter-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}
.custom-tabs {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}
.tab-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 18px;
  background: transparent;
  border: none;
  border-radius: var(--radius-base);
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.25s;
  font-family: inherit;
  white-space: nowrap;
}
.tab-btn:hover {
  color: var(--color-primary);
  background: var(--color-secondary-light);
}
.tab-btn.active {
  color: var(--color-primary);
  background: var(--bg-card);
  box-shadow: var(--shadow-sm);
  font-weight: 600;
}
.tab-btn .el-icon {
  font-size: 16px;
}
.tab-count {
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 600;
  background: var(--color-secondary);
  color: var(--text-secondary);
  border-radius: 10px;
}
.tab-count.highlight {
  background: var(--color-danger);
  color: #fff;
}

/* 搜索区域 */
.search-area {
  flex: 1;
  display: flex;
  justify-content: flex-end;
}
.search-form {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.search-form :deep(.el-form-item) {
  margin-bottom: 0;
}
.search-form :deep(.el-form-item__label) {
  color: var(--text-primary);
  font-weight: 500;
  font-size: 13px;
}
.search-form :deep(.el-input__wrapper),
.search-form :deep(.el-select .el-input__wrapper) {
  border-radius: var(--radius-base);
  box-shadow: none;
  border: 1px solid var(--border-light);
  background: var(--bg-card);
}
.search-form :deep(.el-input__wrapper:hover) {
  border-color: var(--color-primary-light);
}
.search-form :deep(.el-input__wrapper.is-focus) {
  border-color: var(--color-primary);
}
.search-btns {
  display: flex;
  gap: 12px;
}

/* 表格区域 */
.table-card {
  overflow: hidden;
}
.data-table {
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: var(--bg-overlay);
  --el-table-row-hover-bg-color: var(--bg-hover);
  --el-table-border-color: var(--border-lighter);
}
.data-table :deep(.el-table__header th) {
  background: var(--bg-overlay) !important;
  color: var(--text-primary);
  font-weight: 600;
  font-size: 14px;
  padding: 16px 12px;
  border-bottom: 1px solid var(--border-light);
}
.data-table :deep(.el-table__body td) {
  padding: 14px 12px;
  border-bottom: 1px solid var(--border-lighter);
}
.data-table :deep(.el-table__inner-wrapper::before) {
  display: none;
}

/* 单元格样式 */
.cell-code {
  font-family: "SF Mono", Monaco, monospace;
  font-size: 13px;
  color: var(--text-secondary);
}
.cell-title {
  font-weight: 600;
  color: var(--text-primary);
}
.cell-time {
  font-size: 13px;
  color: var(--text-secondary);
  font-family: "SF Mono", Monaco, monospace;
}

/* 类型标签 */
.type-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}
.type-badge.default {
  background: var(--color-secondary-light);
  color: var(--text-secondary);
}
.type-badge.leave {
  background: var(--color-info-light);
  color: var(--color-info-dark);
}
.type-badge.card {
  background: var(--color-warning-light);
  color: var(--color-warning-dark);
}
.type-badge.out {
  background: var(--color-success-light);
  color: var(--color-success-dark);
}
.type-badge.expense {
  background: var(--color-danger-light);
  color: var(--color-danger-dark);
}

/* 状态标签 */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}
.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}
.status-badge.default {
  background: var(--color-secondary-light);
  color: var(--text-secondary);
}
.status-badge.progress {
  background: var(--color-warning-light);
  color: var(--color-warning-dark);
}
.status-badge.success {
  background: var(--color-success-light);
  color: var(--color-success-dark);
}
.status-badge.danger {
  background: var(--color-danger-light);
  color: var(--color-danger-dark);
}
.status-badge.cancel {
  background: var(--color-secondary);
  color: var(--text-secondary);
}

/* 操作按钮 */
.action-btns {
  display: flex;
  gap: 4px;
  justify-content: center;
}
.action-btn {
  padding: 4px 10px;
  font-size: 12px;
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
.action-btn.success {
  color: var(--color-success);
}
.action-btn.success:hover {
  background: var(--color-success-light);
}
.action-btn.danger {
  color: var(--color-danger);
}
.action-btn.danger:hover {
  background: var(--color-danger-light);
}

/* 表格底部 */
.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-top: 1px solid var(--border-lighter);
  background: var(--bg-overlay);
}
.table-info {
  font-size: 13px;
  color: var(--text-secondary);
}
.table-footer :deep(.el-pagination) {
  --el-pagination-bg-color: var(--bg-card);
  --el-pagination-text-color: var(--text-regular);
  --el-pagination-button-color: var(--text-primary);
  --el-pagination-button-bg-color: var(--bg-card);
  --el-pagination-hover-color: var(--color-primary);
  --el-pagination-fill-background-color: var(--color-primary);
  gap: 6px;
}
.table-footer :deep(.el-pagination .el-select .el-input__wrapper) {
  box-shadow: none !important;
}

/* 骨架屏 */
.skeleton-table {
  padding: 0;
}
.skeleton-header,
.skeleton-row {
  display: flex;
  gap: 12px;
  padding: 16px 24px;
}
.skeleton-header {
  background: var(--bg-overlay);
  border-bottom: 1px solid var(--border-light);
}
.skeleton-row {
  border-bottom: 1px solid var(--border-lighter);
}
.skeleton-cell {
  height: 18px;
  background: linear-gradient(
    90deg,
    var(--color-secondary) 25%,
    var(--color-secondary-light) 50%,
    var(--color-secondary) 75%
  );
  background-size: 200% 100%;
  border-radius: 4px;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* 对话框 */
:deep(.approval-dialog) {
  --el-dialog-bg-color: var(--bg-card);
  border-radius: var(--radius-lg) !important;
  box-shadow: var(--shadow-lg);
}
:deep(.approval-dialog .el-dialog__header) {
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-lighter);
  margin: 0;
}
:deep(.approval-dialog .el-dialog__title) {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-primary);
}
:deep(.approval-dialog .el-dialog__body) {
  padding: 0;
}
:deep(.approval-dialog .el-dialog__footer) {
  padding: 16px 24px;
  border-top: 1px solid var(--border-lighter);
}

/* 详情包装 */
.detail-wrapper {
  max-height: 65vh;
  overflow-y: auto;
}
.detail-section {
  padding: 24px;
  border-bottom: 1px solid var(--border-lighter);
}
.detail-section:last-child {
  border-bottom: none;
}
.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 16px;
  font-size: 15px;
  font-weight: 600;
  color: var(--color-primary);
}
.title-marker {
  width: 4px;
  height: 16px;
  border-radius: 2px;
  background: var(--color-primary);
}
.title-marker.leave {
  background: var(--color-info);
}
.title-marker.card {
  background: var(--color-warning);
}
.title-marker.out {
  background: var(--color-success);
}
.title-marker.flow {
  background: var(--color-info);
}

/* 详情网格 */
.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
.detail-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.detail-item.full {
  grid-column: span 2;
}
.detail-item label {
  font-size: 13px;
  color: var(--text-secondary);
}
.detail-item span {
  font-size: 14px;
  color: var(--text-primary);
  line-height: 1.5;
}
.detail-item .code {
  font-family: "SF Mono", Monaco, monospace;
  color: var(--text-secondary);
}

/* 审批流程 */
.flow-timeline {
  display: flex;
  flex-direction: column;
}
.flow-item {
  display: flex;
  gap: 16px;
}
.flow-node {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.node-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  background: var(--color-secondary-light);
  color: var(--text-secondary);
}
.flow-item.current .node-icon {
  background: var(--color-warning-light);
  color: var(--color-warning);
  animation: pulse 2s infinite;
}
.flow-item.approved .node-icon {
  background: var(--color-success-light);
  color: var(--color-success);
}
.flow-item.rejected .node-icon {
  background: var(--color-danger-light);
  color: var(--color-danger);
}
@keyframes pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(230, 162, 60, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(230, 162, 60, 0);
  }
}
.node-line {
  width: 2px;
  flex: 1;
  min-height: 24px;
  background: var(--border-light);
  margin: 6px 0;
}
.flow-content {
  flex: 1;
  padding-bottom: 20px;
}
.flow-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.flow-name {
  font-weight: 600;
  color: var(--text-primary);
}
.flow-status {
  font-size: 12px;
  color: var(--text-secondary);
}
.flow-item.approved .flow-status {
  color: var(--color-success);
}
.flow-item.rejected .flow-status {
  color: var(--color-danger);
}
.flow-item.current .flow-status {
  color: var(--color-warning);
}
.flow-reason {
  margin: 0;
  padding: 10px 12px;
  background: var(--bg-overlay);
  border-radius: var(--radius-base);
  font-size: 13px;
  color: var(--text-regular);
  line-height: 1.5;
}

/* 审批表单 */
.approve-form {
  padding: 24px;
}
.approve-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  margin-bottom: 20px;
  background: var(--bg-overlay);
  border-radius: var(--radius-base);
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
}
.approve-info .el-icon {
  font-size: 24px;
}
.approve-info .el-icon.success {
  color: var(--color-success);
}
.approve-info .el-icon.danger {
  color: var(--color-danger);
}
.approve-form :deep(.el-form-item__label) {
  color: var(--text-primary);
  font-weight: 500;
}
.approve-form :deep(.el-textarea__inner) {
  border-radius: var(--radius-base);
  border: 1px solid var(--border-light);
}
.approve-form :deep(.el-textarea__inner:focus) {
  border-color: var(--color-primary);
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 响应式 */
@media (max-width: 1024px) {
  .filter-row {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  .custom-tabs {
    justify-content: center;
  }
  .search-area {
    justify-content: center;
  }
}
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  .custom-tabs {
    flex-direction: column;
    width: 100%;
  }
  .tab-btn {
    width: 100%;
  }
  .search-form {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
  }
  .search-form :deep(.el-form-item) {
    width: 100%;
  }
  .search-form :deep(.el-select) {
    width: 100% !important;
  }
  .search-btns {
    justify-content: center;
  }
  .detail-grid {
    grid-template-columns: 1fr;
  }
  .detail-item.full {
    grid-column: span 1;
  }
}
</style>
