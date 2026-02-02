<template>
  <div class="todo-page">
    <!-- 背景装饰 -->
    <div class="bg-blob blob-1"></div>
    <div class="bg-blob blob-2"></div>

    <div class="page-container">
      <!-- 页面头部 -->
      <header class="page-header">
        <div class="header-info">
          <h1>待办事项</h1>
          <p>管理您的任务和待办</p>
        </div>
        <AppButton type="primary" :icon="Plus" @click="handleAdd"
          >新增待办</AppButton
        >
      </header>

      <!-- 搜索区域 -->
      <div class="search-card">
        <el-form :model="queryParams" inline class="search-form">
          <el-form-item label="开始时间">
            <el-date-picker
              v-model="queryParams.startTime"
              type="datetime"
              placeholder="选择开始时间"
              value-format="X"
              style="width: 200px"
            />
          </el-form-item>
          <el-form-item label="结束时间">
            <el-date-picker
              v-model="queryParams.endTime"
              type="datetime"
              placeholder="选择结束时间"
              value-format="X"
              style="width: 200px"
            />
          </el-form-item>
          <el-form-item class="search-btns">
            <AppButton
              :style="{ marginRight: '20px' }"
              type="primary"
              :icon="Search"
              @click="loadData"
              >查询</AppButton
            >
            <AppButton :icon="Refresh" @click="handleReset">重置</AppButton>
          </el-form-item>
        </el-form>
      </div>

      <!-- 表格区域 -->
      <div class="table-card">
        <!-- Loading骨架屏 -->
        <div v-if="loading" class="skeleton-table">
          <div class="skeleton-header">
            <div class="skeleton-cell" style="flex: 2"></div>
            <div class="skeleton-cell" style="flex: 3"></div>
            <div class="skeleton-cell" style="flex: 1"></div>
            <div class="skeleton-cell" style="flex: 1"></div>
            <div class="skeleton-cell" style="flex: 1.5"></div>
            <div class="skeleton-cell" style="flex: 1"></div>
            <div class="skeleton-cell" style="flex: 1.5"></div>
          </div>
          <div v-for="i in 6" :key="i" class="skeleton-row">
            <div class="skeleton-cell" style="flex: 2"></div>
            <div class="skeleton-cell" style="flex: 3"></div>
            <div class="skeleton-cell" style="flex: 1"></div>
            <div class="skeleton-cell" style="flex: 1"></div>
            <div class="skeleton-cell" style="flex: 1.5"></div>
            <div class="skeleton-cell" style="flex: 1"></div>
            <div class="skeleton-cell" style="flex: 1.5"></div>
          </div>
        </div>

        <el-table v-else :data="tableData" class="data-table" stripe>
          <el-table-column prop="title" label="标题" min-width="150">
            <template #default="{ row }">
              <span class="cell-title">{{ row.title }}</span>
            </template>
          </el-table-column>
          <el-table-column
            prop="desc"
            label="描述"
            min-width="200"
            show-overflow-tooltip
          >
            <template #default="{ row }">
              <span class="cell-desc">{{ row.desc || "-" }}</span>
            </template>
          </el-table-column>
          <el-table-column
            prop="creatorName"
            label="创建人"
            width="90"
            align="center"
          >
            <template #default="{ row }">
              <span class="cell-user">{{ row.creatorName || "-" }}</span>
            </template>
          </el-table-column>
          <el-table-column
            label="执行人"
            width="100"
            align="center"
            show-overflow-tooltip
          >
            <template #default="{ row }">
              <span v-if="row.executeIds?.length" class="cell-user">
                {{
                  row.executeIds.length > 1
                    ? `${row.executeIds.length}人`
                    : getExecutorNames(row.executeIds)
                }}
              </span>
              <span v-else class="cell-empty">-</span>
            </template>
          </el-table-column>
          <el-table-column label="截止时间" width="160" align="center">
            <template #default="{ row }">
              <span class="cell-time">{{ formatDate(row.deadlineAt) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="130" align="center">
            <template #default="{ row }">
              <span class="status-badge" :class="getStatusClass(row.status)">
                {{ getStatusText(row.status) }}
              </span>
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
                <button class="action-btn" @click="handleEdit(row)">
                  编辑
                </button>
                <button
                  v-if="row.status !== 3"
                  class="action-btn success"
                  @click="handleFinish(row)"
                >
                  完成
                </button>
                <button class="action-btn danger" @click="handleDelete(row)">
                  删除
                </button>
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

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="520px"
      class="todo-dialog"
      destroy-on-close
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
        class="todo-form"
      >
        <el-form-item label="标题" prop="title">
          <el-input
            v-model="form.title"
            placeholder="请输入待办标题"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="描述" prop="desc">
          <el-input
            v-model="form.desc"
            type="textarea"
            :rows="3"
            placeholder="请输入待办描述"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="截止时间" prop="deadlineAt">
          <el-date-picker
            v-model="form.deadlineAt"
            type="datetime"
            placeholder="选择截止时间"
            value-format="X"
            :disabled-date="disabledDate"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="执行人" prop="executeIds">
          <el-select
            v-model="form.executeIds"
            multiple
            placeholder="请选择执行人"
            style="width: 100%"
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
        <div class="dialog-actions">
          <AppButton @click="dialogVisible = false">取消</AppButton>
          <AppButton type="primary" @click="handleSubmit">确定</AppButton>
        </div>
      </template>
    </el-dialog>

    <!-- 查看对话框 -->
    <el-dialog
      v-model="viewDialogVisible"
      title="待办详情"
      width="520px"
      class="todo-dialog"
    >
      <div class="detail-panel">
        <div class="detail-item">
          <label>标题</label>
          <span>{{ viewData.title }}</span>
        </div>
        <div class="detail-item">
          <label>描述</label>
          <span>{{ viewData.desc || "暂无描述" }}</span>
        </div>
        <div class="detail-item">
          <label>创建人</label>
          <span>{{ viewData.creatorName }}</span>
        </div>
        <div class="detail-item">
          <label>执行人</label>
          <span>{{
            viewData.executeIds?.length
              ? getExecutorNames(viewData.executeIds)
              : "暂无执行人"
          }}</span>
        </div>
        <div class="detail-item">
          <label>截止时间</label>
          <span>{{ formatDate(viewData.deadlineAt) }}</span>
        </div>
        <div class="detail-item">
          <label>状态</label>
          <span class="status-badge" :class="getStatusClass(viewData.status)">{{
            getStatusText(viewData.status)
          }}</span>
        </div>
      </div>

      <div v-if="viewData.records?.length" class="records-panel">
        <h4>操作记录</h4>
        <div class="records-list">
          <div
            v-for="record in viewData.records"
            :key="record.createAt"
            class="record-item"
          >
            <div class="record-dot"></div>
            <div class="record-body">
              <div class="record-meta">
                <span class="record-user">{{ record.userName }}</span>
                <span class="record-time">{{
                  formatDate(record.createAt)
                }}</span>
              </div>
              <p class="record-content">{{ record.content }}</p>
              <img v-if="record.image" :src="record.image" class="record-img" />
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox, FormInstance, FormRules } from "element-plus";
import { Plus, Search, Refresh } from "@element-plus/icons-vue";
import {
  getTodoList,
  createTodo,
  updateTodo,
  deleteTodo,
  finishTodo,
} from "@/api/todo";
import { getUserList } from "@/api/user";
import { useUserStore } from "@/stores/user";
import dayjs from "dayjs";
import type { Todo, User } from "@/types";

const userStore = useUserStore();

const loading = ref(false);
const tableData = ref<Todo[]>([]);
const total = ref(0);
const userList = ref<User[]>([]);

const queryParams = reactive({
  userId: userStore.userInfo?.id,
  page: 1,
  count: 10,
  startTime: undefined as number | undefined,
  endTime: undefined as number | undefined,
});

const dialogVisible = ref(false);
const dialogTitle = ref("新增待办");
const formRef = ref<FormInstance>();

const form = reactive<Partial<Todo>>({
  title: "",
  desc: "",
  deadlineAt: 0,
  executeIds: [],
  status: 1,
  creatorId: userStore.userInfo?.id || "",
  creatorName: userStore.userInfo?.name || "",
  todoStatus: 1,
});

const rules: FormRules = {
  title: [{ required: true, message: "请输入待办标题", trigger: "blur" }],
  desc: [{ required: true, message: "请输入待办描述", trigger: "blur" }],
  deadlineAt: [
    { required: true, message: "请选择截止时间", trigger: "change" },
  ],
  executeIds: [{ required: true, message: "请选择执行人", trigger: "change" }],
};

const viewDialogVisible = ref(false);
const viewData = ref<Partial<Todo>>({});

const formatDate = (timestamp?: number) =>
  timestamp ? dayjs.unix(timestamp).format("YYYY-MM-DD HH:mm") : "-";

const disabledDate = (time: Date) =>
  time.getTime() < Date.now() - 24 * 60 * 60 * 1000;

const getStatusClass = (status?: number) => {
  const classes: Record<number, string> = {
    1: "pending",
    2: "progress",
    3: "done",
    4: "cancel",
    5: "timeout",
  };
  return classes[status || 0] || "pending";
};

const getStatusText = (status?: number) => {
  const texts: Record<number, string> = {
    1: "待处理",
    2: "进行中",
    3: "已完成",
    4: "已取消",
    5: "已超时",
  };
  return texts[status || 0] || "未知";
};

const getExecutorNames = (executeIds: string[]) => {
  if (!executeIds?.length) return "暂无执行人";
  return executeIds
    .map((id) => userList.value.find((u) => u.id === id)?.name || id)
    .join("、");
};

const loadData = async () => {
  loading.value = true;
  try {
    const res = await getTodoList(queryParams);
    if (res.code === 200) {
      tableData.value = res.data.data;
      total.value = res.data.count;
    }
  } catch {
    ElMessage.error("加载数据失败");
  } finally {
    loading.value = false;
  }
};

const loadUsers = async () => {
  try {
    const res = await getUserList({ page: 1, count: 100 });
    if (res.code === 200) userList.value = res.data.data;
  } catch (error) {
    console.error("加载用户列表失败:", error);
  }
};

const handleReset = () => {
  queryParams.startTime = undefined;
  queryParams.endTime = undefined;
  queryParams.page = 1;
  loadData();
};

const handleAdd = () => {
  dialogTitle.value = "新增待办";
  Object.assign(form, {
    id: undefined,
    title: "",
    desc: "",
    deadlineAt: 0,
    executeIds: [],
    status: 1,
    creatorId: userStore.userInfo?.id || "",
    creatorName: userStore.userInfo?.name || "",
    todoStatus: 1,
  });
  dialogVisible.value = true;
};

const handleEdit = (row: Todo) => {
  dialogTitle.value = "编辑待办";
  Object.assign(form, { ...row });
  dialogVisible.value = true;
};

const handleView = (row: Todo) => {
  viewData.value = { ...row };
  viewDialogVisible.value = true;
};

const handleFinish = (row: Todo) => {
  ElMessageBox.confirm("确定要完成该待办事项吗？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(async () => {
    try {
      await finishTodo({
        userId: userStore.userInfo?.id || "",
        todoId: row.id,
      });
      ElMessage.success("操作成功");
      loadData();
    } catch {
      ElMessage.error("操作失败");
    }
  });
};

const handleDelete = (row: Todo) => {
  ElMessageBox.confirm("确定要删除该待办事项吗？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(async () => {
    try {
      await deleteTodo(row.id);
      ElMessage.success("删除成功");
      loadData();
    } catch {
      ElMessage.error("删除失败");
    }
  });
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const submitData = {
          ...form,
          deadlineAt:
            typeof form.deadlineAt === "string"
              ? parseInt(form.deadlineAt)
              : form.deadlineAt,
        };
        if (form.id) {
          await updateTodo(submitData as Todo);
          ElMessage.success("更新成功");
        } else {
          await createTodo(submitData as Todo);
          ElMessage.success("创建成功");
        }
        dialogVisible.value = false;
        loadData();
      } catch {
        ElMessage.error("操作失败");
      }
    }
  });
};

const handleDialogClose = () => formRef.value?.resetFields();

onMounted(() => {
  loadData();
  loadUsers();
});
</script>

<style scoped>
/* 页面容器 */
.todo-page {
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

/* 卡片基础样式 */
.search-card,
.table-card {
  background: var(--glass-bg);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-soft);
}

/* 搜索区域 */
.search-card {
  padding: 20px 24px;
}
.search-form {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}
.search-form :deep(.el-form-item) {
  margin-bottom: 0;
}
.search-form :deep(.el-form-item__label) {
  color: var(--text-primary);
  font-weight: 500;
}
.search-form :deep(.el-input__wrapper) {
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
  margin-left: auto;
  display: flex;
  gap: 20px;
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
.data-table :deep(.el-table__row--striped .el-table__cell) {
  background: rgba(0, 0, 0, 0.01) !important;
}

/* 单元格样式 */
.cell-title {
  font-weight: 600;
  color: var(--text-primary);
}
.cell-desc {
  color: var(--text-regular);
  font-size: 13px;
}
.cell-user {
  color: var(--text-primary);
  font-size: 13px;
}
.cell-time {
  color: var(--text-secondary);
  font-size: 13px;
  font-family: "SF Mono", Monaco, monospace;
}
.cell-empty {
  color: var(--text-placeholder);
}

/* 状态标签 */
.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}
.status-badge.pending {
  background: var(--color-secondary-light);
  color: var(--text-secondary);
}
.status-badge.progress {
  background: var(--color-info-light);
  color: var(--color-info-dark);
}
.status-badge.done {
  background: var(--color-success-light);
  color: var(--color-success-dark);
}
.status-badge.cancel {
  background: var(--color-secondary);
  color: var(--text-secondary);
}
.status-badge.timeout {
  background: var(--color-danger-light);
  color: var(--color-danger-dark);
}

/* 操作按钮 */
.action-btns {
  display: flex;
  gap: 4px;
  justify-content: center;
  flex-wrap: wrap;
}
.action-btn {
  padding: 4px 8px;
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
/* 分页器 - 使用 CSS 变量统一控制 */
.table-footer :deep(.el-pagination) {
  --el-pagination-bg-color: var(--bg-card);
  --el-pagination-text-color: var(--text-regular);
  --el-pagination-button-color: var(--text-primary);
  --el-pagination-button-bg-color: var(--bg-card);
  --el-pagination-button-disabled-color: var(--text-placeholder);
  --el-pagination-button-disabled-bg-color: var(--bg-card);
  --el-pagination-hover-color: var(--color-primary);
  --el-pagination-fill-background-color: var(--color-primary);
  gap: 6px;
}
.table-footer :deep(.el-pagination .el-select) {
  --el-select-input-focus-border-color: var(--color-primary);
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
:deep(.todo-dialog) {
  --el-dialog-bg-color: var(--bg-card);
  border-radius: var(--radius-lg) !important;
  box-shadow: var(--shadow-lg);
}
:deep(.todo-dialog .el-dialog__header) {
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-lighter);
  margin: 0;
}
:deep(.todo-dialog .el-dialog__title) {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-primary);
}
:deep(.todo-dialog .el-dialog__body) {
  padding: 24px;
}
:deep(.todo-dialog .el-dialog__footer) {
  padding: 16px 24px;
  border-top: 1px solid var(--border-lighter);
}

/* 表单 */
.todo-form :deep(.el-form-item) {
  margin-bottom: 20px;
}
.todo-form :deep(.el-form-item__label) {
  color: var(--text-primary);
  font-weight: 500;
}
.todo-form :deep(.el-input__wrapper),
.todo-form :deep(.el-textarea__inner),
.todo-form :deep(.el-select .el-input__wrapper) {
  border-radius: var(--radius-base);
  box-shadow: none;
  border: 1px solid var(--border-light);
}
.todo-form :deep(.el-input__wrapper:hover),
.todo-form :deep(.el-textarea__inner:hover) {
  border-color: var(--color-primary-light);
}
.todo-form :deep(.el-input__wrapper.is-focus),
.todo-form :deep(.el-textarea__inner:focus) {
  border-color: var(--color-primary);
}
.todo-form :deep(.el-radio__input.is-checked .el-radio__inner) {
  background: var(--color-primary);
  border-color: var(--color-primary);
}
.todo-form :deep(.el-radio__input.is-checked + .el-radio__label) {
  color: var(--color-primary);
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 详情面板 */
.detail-panel {
  background: var(--bg-overlay);
  border-radius: var(--radius-base);
  padding: 20px;
}
.detail-item {
  display: flex;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-lighter);
}
.detail-item:first-child {
  padding-top: 0;
}
.detail-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}
.detail-item label {
  width: 80px;
  flex-shrink: 0;
  color: var(--text-secondary);
  font-size: 14px;
}
.detail-item span {
  flex: 1;
  color: var(--text-primary);
  font-size: 14px;
  line-height: 1.5;
}

/* 操作记录 */
.records-panel {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--border-lighter);
}
.records-panel h4 {
  margin: 0 0 16px;
  font-size: 15px;
  font-weight: 600;
  color: var(--color-primary);
}
.records-list {
  position: relative;
  padding-left: 20px;
}
.records-list::before {
  content: "";
  position: absolute;
  left: 4px;
  top: 8px;
  bottom: 8px;
  width: 2px;
  background: var(--color-secondary);
  border-radius: 1px;
}
.record-item {
  position: relative;
  padding-bottom: 16px;
}
.record-item:last-child {
  padding-bottom: 0;
}
.record-dot {
  position: absolute;
  left: -20px;
  top: 6px;
  width: 10px;
  height: 10px;
  background: var(--color-primary);
  border-radius: 50%;
  border: 2px solid var(--bg-card);
}
.record-body {
  background: var(--bg-overlay);
  border-radius: var(--radius-base);
  padding: 12px;
}
.record-meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}
.record-user {
  font-weight: 500;
  color: var(--color-primary);
  font-size: 13px;
}
.record-time {
  font-size: 12px;
  color: var(--text-secondary);
}
.record-content {
  margin: 0;
  font-size: 13px;
  color: var(--text-regular);
  line-height: 1.5;
}
.record-img {
  max-width: 180px;
  margin-top: 8px;
  border-radius: var(--radius-sm);
}

/* 响应式 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  .search-form {
    flex-direction: column;
    align-items: stretch;
  }
  .search-btns {
    margin-left: 0;
  }
  .table-footer {
    flex-direction: column;
    gap: 12px;
  }
}
</style>
