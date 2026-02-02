<template>
  <div class="user-page">
    <!-- 背景装饰 -->
    <div class="bg-blob blob-1"></div>
    <div class="bg-blob blob-2"></div>

    <div class="page-container">
      <!-- 页面头部 -->
      <header class="page-header">
        <div class="header-info">
          <h1>用户管理</h1>
          <p>管理系统用户和权限</p>
        </div>
        <AppButton type="primary" :icon="Plus" @click="handleAdd"
          >新增用户</AppButton
        >
      </header>

      <!-- 统计卡片 -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-icon">
            <el-icon><UserIcon /></el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ total }}</span>
            <span class="stat-label">用户总数</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon active">
            <el-icon><CircleCheck /></el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ activeCount }}</span>
            <span class="stat-label">已启用</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon disabled">
            <el-icon><CircleClose /></el-icon>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ disabledCount }}</span>
            <span class="stat-label">已禁用</span>
          </div>
        </div>
      </div>

      <!-- 搜索和表格区域 -->
      <div class="table-card">
        <div class="card-header">
          <h3 class="card-title">
            <span class="title-marker"></span>
            用户列表
          </h3>
          <div class="search-area">
            <el-input
              v-model="queryParams.name"
              placeholder="搜索用户名..."
              clearable
              class="search-input"
              @keyup.enter="loadData"
            />
            <AppButton type="primary" @click="loadData">查询</AppButton>
            <AppButton @click="handleReset">重置</AppButton>
          </div>
        </div>

        <!-- 骨架屏 -->
        <div v-if="loading" class="skeleton-table">
          <div class="skeleton-header">
            <div class="skeleton-cell" style="flex: 1"></div>
            <div class="skeleton-cell" style="flex: 2"></div>
            <div class="skeleton-cell" style="flex: 1"></div>
            <div class="skeleton-cell" style="flex: 1"></div>
          </div>
          <div v-for="i in 5" :key="i" class="skeleton-row">
            <div class="skeleton-cell" style="flex: 1"></div>
            <div class="skeleton-cell" style="flex: 2"></div>
            <div class="skeleton-cell" style="flex: 1"></div>
            <div class="skeleton-cell" style="flex: 1"></div>
          </div>
        </div>

        <!-- 表格 -->
        <el-table v-else :data="tableData" class="data-table">
          <el-table-column prop="name" label="用户名" min-width="150">
            <template #default="{ row }">
              <div class="user-cell">
                <span class="user-avatar">{{
                  row.name?.charAt(0) || "?"
                }}</span>
                <span class="user-name">{{ row.name }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="400" align="center">
            <template #default="{ row }">
              <span
                class="status-badge"
                :class="row.status === 1 ? 'active' : 'disabled'"
              >
                {{ row.status === 1 ? "启用" : "禁用" }}
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
                <button class="action-btn" @click="handleEdit(row)">
                  编辑
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
      width="480px"
      class="user-dialog"
      destroy-on-close
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
        class="user-form"
      >
        <el-form-item label="用户名" prop="name">
          <el-input v-model="form.name" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            :placeholder="form.id ? '留空则不修改密码' : '请输入密码'"
            show-password
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import {
  Plus,
  User as UserIcon,
  CircleCheck,
  CircleClose,
} from "@element-plus/icons-vue";
import { getUserList, createUser, updateUser, deleteUser } from "@/api/user";
import AppButton from "@/components/AppButton.vue";
import type { User } from "@/types";

const loading = ref(false);
const tableData = ref<User[]>([]);
const total = ref(0);

const queryParams = reactive({
  name: "",
  page: 1,
  count: 10,
});

// 统计数据
const activeCount = computed(
  () => tableData.value.filter((u) => u.status === 1).length,
);
const disabledCount = computed(
  () => tableData.value.filter((u) => u.status !== 1).length,
);

const dialogVisible = ref(false);
const dialogTitle = ref("新增用户");
const formRef = ref<FormInstance>();

const form = reactive<Partial<User>>({
  name: "",
  password: "",
  status: 1,
});

const rules: FormRules = {
  name: [{ required: true, message: "请输入用户名", trigger: "blur" }],
  password: [
    {
      validator: (
        _rule: unknown,
        value: string,
        callback: (error?: Error) => void,
      ) => {
        if (!form.id && !value) {
          callback(new Error("请输入密码"));
        } else if (value && value.length < 6) {
          callback(new Error("密码长度不能小于6位"));
        } else {
          callback();
        }
      },
      trigger: "blur",
    },
  ],
};

const loadData = async () => {
  loading.value = true;
  try {
    const res = await getUserList(queryParams);
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

const handleReset = () => {
  queryParams.name = "";
  queryParams.page = 1;
  loadData();
};

const handleAdd = () => {
  dialogTitle.value = "新增用户";
  Object.assign(form, {
    id: undefined,
    name: "",
    password: "",
    phone: "",
    status: 1,
  });
  dialogVisible.value = true;
};

const handleEdit = (row: User) => {
  dialogTitle.value = "编辑用户";
  Object.assign(form, {
    ...row,
    password: "",
  });
  dialogVisible.value = true;
};

const handleDelete = (row: User) => {
  ElMessageBox.confirm(`确定要删除用户「${row.name}」吗？`, "删除确认", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(async () => {
      try {
        await deleteUser(row.id);
        ElMessage.success("删除成功");
        loadData();
      } catch {
        ElMessage.error("删除失败");
      }
    })
    .catch(() => {});
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const submitData = { ...form };
        if (form.id && !form.password) {
          delete submitData.password;
        }
        if (form.id) {
          await updateUser(submitData as User);
          ElMessage.success("更新成功");
        } else {
          await createUser(submitData as User);
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

const handleDialogClose = () => {
  formRef.value?.resetFields();
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
/* 页面容器 */
.user-page {
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

/* 统计卡片 */
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  background: var(--glass-bg);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-soft);
  transition: transform 0.2s;
}
.stat-card:hover {
  transform: translateY(-2px);
}
.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-lg);
  background: var(--color-secondary-light);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  flex-shrink: 0;
}
.stat-icon.active {
  background: var(--color-success-light);
  color: var(--color-success-dark);
}
.stat-icon.disabled {
  background: var(--color-danger-light);
  color: var(--color-danger-dark);
}
.stat-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}
.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
}

/* 表格卡片 */
.table-card {
  background: var(--glass-bg);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-soft);
  overflow: hidden;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-lighter);
  background: var(--bg-overlay);
}
.card-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-primary);
  display: flex;
  align-items: center;
  gap: 10px;
}
.title-marker {
  width: 4px;
  height: 18px;
  background: var(--color-primary);
  border-radius: 2px;
}
.search-area {
  display: flex;
  align-items: center;
  gap: 12px;
}
.search-input {
  width: 200px;
}
.search-input :deep(.el-input__wrapper) {
  border-radius: var(--radius-base);
  box-shadow: none;
  border: 1px solid var(--border-light);
  background: var(--bg-card);
}

/* 表格样式 */
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

/* 用户单元格 */
.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}
.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
}
.user-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}
.cell-id {
  font-size: 13px;
  color: var(--text-secondary);
  font-family: "SF Mono", Monaco, monospace;
}
.cell-text {
  font-size: 14px;
  color: var(--text-regular);
}

/* 状态标签 */
.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}
.status-badge.active {
  background: var(--color-success-light);
  color: var(--color-success-dark);
}
.status-badge.disabled {
  background: var(--color-danger-light);
  color: var(--color-danger-dark);
}

/* 操作按钮 */
.action-btns {
  display: flex;
  gap: 4px;
  justify-content: center;
}
.action-btn {
  padding: 5px 12px;
  font-size: 13px;
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
:deep(.user-dialog) {
  --el-dialog-bg-color: var(--bg-card);
  border-radius: var(--radius-lg) !important;
  box-shadow: var(--shadow-lg);
}
:deep(.user-dialog .el-dialog__header) {
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-lighter);
  margin: 0;
}
:deep(.user-dialog .el-dialog__title) {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-primary);
}
:deep(.user-dialog .el-dialog__body) {
  padding: 24px;
}
:deep(.user-dialog .el-dialog__footer) {
  padding: 16px 24px;
  border-top: 1px solid var(--border-lighter);
}

/* 表单 */
.user-form :deep(.el-form-item) {
  margin-bottom: 20px;
}
.user-form :deep(.el-form-item__label) {
  color: var(--text-primary);
  font-weight: 500;
}
.user-form :deep(.el-input__wrapper) {
  border-radius: var(--radius-base);
  box-shadow: none;
  border: 1px solid var(--border-light);
}
.user-form :deep(.el-input__wrapper:hover) {
  border-color: var(--color-primary-light);
}
.user-form :deep(.el-input__wrapper.is-focus) {
  border-color: var(--color-primary);
}
.user-form :deep(.el-radio__input.is-checked .el-radio__inner) {
  background: var(--color-primary);
  border-color: var(--color-primary);
}
.user-form :deep(.el-radio__input.is-checked + .el-radio__label) {
  color: var(--color-primary);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 响应式 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  .stats-row {
    grid-template-columns: 1fr;
  }
  .card-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  .search-area {
    flex-wrap: wrap;
  }
  .search-input {
    width: 100%;
  }
  .table-footer {
    flex-direction: column;
    gap: 12px;
  }
}
</style>
