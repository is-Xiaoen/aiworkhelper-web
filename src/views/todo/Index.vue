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
      <div class="glass-panel search-panel">
        <el-form :model="queryParams" inline class="search-form">
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
          <el-form-item class="search-btns">
            <AppButton type="primary" :icon="Search" @click="loadData"
              >查询</AppButton
            >
            <AppButton :icon="Refresh" @click="handleReset">重置</AppButton>
          </el-form-item>
        </el-form>
      </div>

      <!-- 表格区域 -->
      <div class="glass-panel table-panel">
        <!-- Loading骨架屏 -->
        <div v-if="loading" class="skeleton-table">
          <div v-for="i in 5" :key="i" class="skeleton-row">
            <div class="skeleton-cell" style="width: 25%"></div>
            <div class="skeleton-cell" style="width: 20%"></div>
            <div class="skeleton-cell" style="width: 15%"></div>
            <div class="skeleton-cell" style="width: 15%"></div>
            <div class="skeleton-cell" style="width: 10%"></div>
            <div class="skeleton-cell" style="width: 15%"></div>
          </div>
        </div>

        <el-table
          v-else
          :data="tableData"
          class="custom-table"
          :header-cell-style="{
            background: 'var(--bg-overlay)',
            color: 'var(--text-primary)',
            fontWeight: 600,
          }"
        >
          <el-table-column prop="title" label="标题" width="140" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="title-text">{{ row.title }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="desc" label="描述" min-width="120" show-overflow-tooltip />
          <el-table-column prop="creatorName" label="创建人" width="80" />
          <el-table-column label="执行人" width="100" show-overflow-tooltip>
            <template #default="{ row }">
              <span v-if="row.executeIds?.length">{{ row.executeIds.join(", ") }}</span>
              <span v-else class="text-muted">-</span>
            </template>
          </el-table-column>
          <el-table-column label="截止时间" width="140">
            <template #default="{ row }">
              <span class="time-text">{{ formatDate(row.deadlineAt) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="80">
            <template #default="{ row }">
              <span class="status-tag" :class="getStatusClass(row.status)">
                {{ getStatusText(row.status) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <TableActions
                :actions="getRowActions(row)"
                @action="(key) => handleAction(key, row)"
              />
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="queryParams.page"
            v-model:page-size="queryParams.count"
            :total="total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
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
      width="560px"
      class="custom-dialog"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
        class="custom-form"
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
        <div class="dialog-footer">
          <AppButton @click="dialogVisible = false">取消</AppButton>
          <AppButton type="primary" @click="handleSubmit">确定</AppButton>
        </div>
      </template>
    </el-dialog>

    <!-- 查看对话框 -->
    <el-dialog
      v-model="viewDialogVisible"
      title="待办详情"
      width="560px"
      class="custom-dialog"
    >
      <div class="detail-card">
        <div class="detail-row">
          <span class="detail-label">标题</span>
          <span class="detail-value">{{ viewData.title }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">描述</span>
          <span class="detail-value">{{ viewData.desc }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">创建人</span>
          <span class="detail-value">{{ viewData.creatorName }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">执行人</span>
          <span class="detail-value">
            <template v-if="viewData.executeIds?.length">{{
              getExecutorNames(viewData.executeIds)
            }}</template>
            <span v-else class="text-muted">暂无执行人</span>
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-label">截止时间</span>
          <span class="detail-value">{{
            formatDate(viewData.deadlineAt)
          }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">状态</span>
          <span class="status-tag" :class="getStatusClass(viewData.status)">
            {{ getStatusText(viewData.status) }}
          </span>
        </div>
      </div>

      <div v-if="viewData.records?.length" class="records-section">
        <h4 class="section-title">操作记录</h4>
        <div class="timeline-list">
          <div
            v-for="record in viewData.records"
            :key="record.createAt"
            class="timeline-item"
          >
            <div class="timeline-dot"></div>
            <div class="timeline-content">
              <div class="record-header">
                <span class="record-user">{{ record.userName }}</span>
                <span class="record-time">{{
                  formatDate(record.createAt)
                }}</span>
              </div>
              <p class="record-text">{{ record.content }}</p>
              <img
                v-if="record.image"
                :src="record.image"
                class="record-image"
              />
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

const formatDate = (timestamp: number) =>
  dayjs.unix(timestamp).format("YYYY-MM-DD HH:mm");

// 禁用今天之前的日期
const disabledDate = (time: Date) => {
  return time.getTime() < Date.now() - 24 * 60 * 60 * 1000;
};

const getStatusClass = (status: number) => {
  const classes: Record<number, string> = {
    1: "status-pending",
    2: "status-progress",
    3: "status-done",
    4: "status-cancel",
    5: "status-timeout",
  };
  return classes[status] || "status-pending";
};

const getStatusText = (status: number) => {
  const texts: Record<number, string> = {
    1: "待处理",
    2: "进行中",
    3: "已完成",
    4: "已取消",
    5: "已超时",
  };
  return texts[status] || "未知";
};

const getExecutorNames = (executeIds: string[]) => {
  if (!executeIds?.length) return "暂无执行人";
  return executeIds
    .map((id) => userList.value.find((u) => u.id === id)?.name || id)
    .join("、");
};

// 获取行操作按钮配置
const getRowActions = (row: Todo) => {
  const actions = [
    { label: "查看", key: "view" },
    { label: "编辑", key: "edit" },
  ];
  if (row.status !== 3) {
    actions.push({ label: "完成", key: "finish", type: "success" as const });
  }
  actions.push({ label: "删除", key: "delete", type: "danger" as const });
  return actions;
};

// 处理操作按钮点击
const handleAction = (key: string, row: Todo) => {
  switch (key) {
    case "view":
      handleView(row);
      break;
    case "edit":
      handleEdit(row);
      break;
    case "finish":
      handleFinish(row);
      break;
    case "delete":
      handleDelete(row);
      break;
  }
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
.todo-page {
  position: relative;
  margin: -20px;
  padding: 24px;
  min-height: calc(100% + 40px);
  background: var(--bg-page);
  overflow: hidden;
}

/* 背景装饰 */
.bg-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  z-index: 0;
  pointer-events: none;
}
.blob-1 {
  width: 300px;
  height: 300px;
  background: var(--color-secondary);
  top: -80px;
  right: -50px;
  opacity: 0.6;
}
.blob-2 {
  width: 250px;
  height: 250px;
  background: var(--color-secondary-light);
  bottom: -50px;
  left: -50px;
  opacity: 0.5;
}

.page-container {
  position: relative;
  z-index: 1;
}

/* 页面头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.header-info h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--color-primary);
}
.header-info p {
  margin: 4px 0 0;
  font-size: 14px;
  color: var(--text-secondary);
}

/* 玻璃面板 */
.glass-panel {
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-soft);
}

/* 搜索区域 */
.search-panel {
  margin-bottom: 20px;
}
.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-end;
}
.search-form :deep(.el-form-item) {
  margin-bottom: 0;
}
.search-form :deep(.el-form-item__label) {
  color: var(--text-primary);
  font-weight: 500;
}
.search-btns {
  margin-left: auto;
}

/* 表格区域 */
.table-panel {
  padding: 0;
  overflow: hidden;
}
.custom-table {
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: var(--bg-overlay);
}
.custom-table :deep(.el-table__inner-wrapper::before) {
  display: none;
}
.custom-table :deep(th.el-table__cell) {
  border-bottom: 1px solid var(--border-light);
}
.custom-table :deep(td.el-table__cell) {
  border-bottom: 1px solid var(--border-lighter);
}
.custom-table :deep(.el-table__row:hover > td) {
  background: var(--bg-hover) !important;
}

.title-text {
  font-weight: 500;
  color: var(--text-primary);
}
.time-text {
  color: var(--text-secondary);
  font-size: 13px;
}
.text-muted {
  color: var(--text-placeholder);
}

/* 状态标签 */
.status-tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}
.status-pending {
  background: var(--color-secondary-light);
  color: var(--text-secondary);
}
.status-progress {
  background: var(--color-warning-light);
  color: var(--color-warning-dark);
}
.status-done {
  background: var(--color-success-light);
  color: var(--color-success-dark);
}
.status-cancel {
  background: var(--color-secondary);
  color: var(--text-secondary);
}
.status-timeout {
  background: var(--color-danger-light);
  color: var(--color-danger-dark);
}

/* 分页 */
.pagination-wrapper {
  padding: 16px 20px;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid var(--border-lighter);
}

/* 骨架屏 */
.skeleton-table {
  padding: 20px;
}
.skeleton-row {
  display: flex;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid var(--border-lighter);
}
.skeleton-cell {
  height: 16px;
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
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* 对话框样式 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
.custom-form :deep(.el-form-item__label) {
  color: var(--text-primary);
  font-weight: 500;
}

/* 详情卡片 */
.detail-card {
  background: var(--bg-overlay);
  border-radius: var(--radius-base);
  padding: 16px;
}
.detail-row {
  display: flex;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-lighter);
}
.detail-row:last-child {
  border-bottom: none;
}
.detail-label {
  width: 80px;
  color: var(--text-secondary);
  font-size: 14px;
  flex-shrink: 0;
}
.detail-value {
  flex: 1;
  color: var(--text-primary);
  font-size: 14px;
}

/* 操作记录 */
.records-section {
  margin-top: 20px;
}
.section-title {
  margin: 0 0 16px;
  font-size: 15px;
  font-weight: 600;
  color: var(--color-primary);
}
.timeline-list {
  position: relative;
  padding-left: 20px;
}
.timeline-list::before {
  content: "";
  position: absolute;
  left: 5px;
  top: 8px;
  bottom: 8px;
  width: 2px;
  background: var(--color-secondary);
  border-radius: 1px;
}
.timeline-item {
  position: relative;
  padding-bottom: 16px;
}
.timeline-item:last-child {
  padding-bottom: 0;
}
.timeline-dot {
  position: absolute;
  left: -20px;
  top: 6px;
  width: 12px;
  height: 12px;
  background: var(--color-primary);
  border-radius: 50%;
  border: 2px solid var(--bg-card);
}
.timeline-content {
  background: var(--bg-overlay);
  border-radius: var(--radius-base);
  padding: 12px;
}
.record-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}
.record-user {
  font-weight: 500;
  color: var(--color-primary);
  font-size: 14px;
}
.record-time {
  font-size: 12px;
  color: var(--text-secondary);
}
.record-text {
  margin: 0;
  font-size: 14px;
  color: var(--text-regular);
}
.record-image {
  max-width: 200px;
  margin-top: 10px;
  border-radius: var(--radius-sm);
}
</style>
