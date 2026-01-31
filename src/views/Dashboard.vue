<template>
  <div class="fluid-dashboard">
    <div class="bg-blob blob-1"></div>
    <div class="bg-blob blob-2"></div>

    <div class="main-container">
      <header class="glass-header">
        <div class="greeting-box">
          <div class="avatar-placeholder">
            <el-icon><UserFilled /></el-icon>
          </div>
          <div class="greeting-text">
            <h1>Hi, 同学</h1>
            <p>今天是 {{ currentDate }}，状态不错！</p>
          </div>
        </div>

        <div class="quick-capsules">
          <div class="capsule" @click="handleNav('/todo')">
            <el-icon><Plus /></el-icon> 记一笔
          </div>
          <div class="capsule" @click="handleNav('/approval/create')">
            <el-icon><Position /></el-icon> 发起
          </div>
          <div class="capsule ai-capsule" @click="handleNav('/chat')">
            <el-icon><MagicStick /></el-icon> AI 助手
          </div>
        </div>
      </header>

      <div class="stats-scroller">
        <div
          class="stat-island"
          v-for="(item, index) in statItems"
          :key="index"
        >
          <div class="island-icon">
            <el-icon><component :is="item.icon" /></el-icon>
          </div>
          <div class="island-data">
            <span class="island-num">{{ item.value }}</span>
            <span class="island-label">{{ item.label }}</span>
          </div>
        </div>
      </div>

      <div class="content-grid">
        <div class="glass-panel todo-panel">
          <div class="panel-head">
            <h3><span class="marker"></span>待办事项</h3>
            <span class="link-text" @click="handleNav('/todo')">查看全部</span>
          </div>

          <div class="panel-body custom-scroll">
            <el-empty
              v-if="todoList.length === 0"
              :image-size="60"
              description="无事一身轻"
            />
            <div v-else class="fluid-list">
              <div
                v-for="todo in todoList"
                :key="todo.id"
                class="fluid-item"
                @click="handleNav('/todo')"
              >
                <div class="check-circle"></div>
                <div class="fluid-content">
                  <div class="fluid-title">{{ todo.title }}</div>
                  <div class="fluid-time">
                    {{ formatDate(todo.deadlineAt) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="glass-panel approval-panel">
          <div class="panel-head">
            <h3>审批动态</h3>
            <span class="link-text" @click="handleNav('/approval')"
              >进度中心</span
            >
          </div>

          <div class="panel-body custom-scroll">
            <el-empty
              v-if="approvalList.length === 0"
              :image-size="60"
              description="暂无记录"
            />
            <div v-else class="timeline-box">
              <div
                v-for="approval in approvalList"
                :key="approval.id"
                class="timeline-item"
              >
                <div
                  class="timeline-dot"
                  :class="getStatusColorClass(approval.status)"
                ></div>
                <div class="timeline-content">
                  <div class="t-head">
                    <span class="t-title">{{ approval.title }}</span>
                    <span
                      class="t-tag"
                      :class="getStatusColorClass(approval.status)"
                    >
                      {{ getApprovalStatusText(approval.status) }}
                    </span>
                  </div>
                  <div class="t-date">
                    更新于 {{ formatDate(Date.now() / 1000) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router"; // 引入路由钩子
import {
  List,
  Document,
  User,
  OfficeBuilding,
  Plus,
  MagicStick,
  Position,
  UserFilled,
} from "@element-plus/icons-vue";
import dayjs from "dayjs";
import { getTodoList } from "@/api/todo";
import { getApprovalList } from "@/api/approval";
import { getUserList } from "@/api/user";
import { getDepSoa } from "@/api/department";
import { useUserStore } from "@/stores/user";
import type { Todo, Approval } from "@/types";

// --- 核心逻辑 ---
const router = useRouter(); // 初始化路由实例
const userStore = useUserStore();

// 显式跳转函数 (解决跳转失效问题)
const handleNav = (path: string) => {
  console.log("Navigating to:", path);
  router.push(path).catch((err) => {
    console.error("Navigation failed:", err);
  });
};

// --- 数据状态 ---
const stats = ref({
  todoCount: 0,
  approvalCount: 0,
  userCount: 0,
  depCount: 0,
});
const todoList = ref<Todo[]>([]);
const approvalList = ref<Approval[]>([]);

const statItems = computed(() => [
  { label: "待办", value: stats.value.todoCount, icon: List },
  { label: "审批", value: stats.value.approvalCount, icon: Document },
  { label: "用户", value: stats.value.userCount, icon: User },
  { label: "部门", value: stats.value.depCount, icon: OfficeBuilding },
]);

const currentDate = dayjs().format("MM月DD日");
const formatDate = (ts: number) => dayjs.unix(ts).format("MM-DD HH:mm");

// 状态辅助函数
const getStatusColorClass = (status: number) => {
  const map: any = {
    0: "color-gray",
    1: "color-blue",
    2: "color-green",
    3: "color-red",
    5: "color-green",
  };
  return map[status] || "color-gray";
};

const getApprovalStatusText = (status: number) => {
  const texts: any = {
    0: "未开始",
    1: "审批中",
    2: "已通过",
    3: "驳回",
    4: "撤销",
    5: "自动通过",
  };
  return texts[status] || "未知";
};

// 递归统计
const countDepartments = (departments: any[]): number => {
  if (!departments || departments.length === 0) return 0;
  let count = departments.length;
  departments.forEach((dep) => {
    if (dep.child) count += countDepartments(dep.child);
  });
  return count;
};

// 数据加载
const loadData = async () => {
  try {
    const [todoRes, appRes, userRes, depRes] = await Promise.all([
      getTodoList({ userId: userStore.userInfo?.id, page: 1, count: 5 }),
      getApprovalList({ userId: userStore.userInfo?.id, page: 1, count: 5 }),
      getUserList({ page: 1, count: 1 }),
      getDepSoa(),
    ]);

    if (todoRes.code === 200) {
      todoList.value = todoRes.data.data;
      stats.value.todoCount = todoRes.data.count;
    }
    if (appRes.code === 200) {
      approvalList.value = appRes.data.data;
      stats.value.approvalCount = appRes.data.count;
    }
    if (userRes.code === 200) {
      stats.value.userCount = userRes.data.count;
    }
    if (depRes.code === 200) {
      stats.value.depCount = countDepartments(depRes.data?.child || []);
    }
  } catch (error) {
    console.error("Load data error", error);
  }
};

onMounted(() => loadData());
</script>

<style scoped>
/* 页面容器 - 占满内容区域 */
.fluid-dashboard {
  position: relative;
  margin: -20px;
  padding: 24px;
  width: calc(100% + 40px);
  height: calc(100% + 40px);
  background: var(--bg-page);
  overflow: hidden;
  box-sizing: border-box;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

/* 背景装饰 */
.bg-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  z-index: 0;
  animation: float 10s infinite ease-in-out;
}
.blob-1 {
  width: 400px;
  height: 400px;
  background: var(--color-secondary);
  top: -100px;
  right: -50px;
  opacity: 0.8;
}
.blob-2 {
  width: 300px;
  height: 300px;
  background: var(--color-secondary-light);
  bottom: 0;
  left: -50px;
  animation-delay: -5s;
}
@keyframes float {
  0%,
  100% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(20px, 30px);
  }
}

.main-container {
  position: relative;
  z-index: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 顶部区域 */
.glass-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 16px;
}
.greeting-box {
  display: flex;
  align-items: center;
  gap: 16px;
}
.avatar-placeholder {
  width: 46px;
  height: 46px;
  background: var(--color-secondary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
  font-size: 22px;
  border: 2px solid var(--bg-card);
  box-shadow: var(--shadow-sm);
}
.greeting-text h1 {
  margin: 0;
  font-size: 24px;
  color: var(--color-primary);
  font-weight: 700;
}
.greeting-text p {
  margin: 4px 0 0;
  color: var(--text-secondary);
  font-size: 14px;
}

/* 胶囊按钮 */
.quick-capsules {
  display: flex;
  gap: 12px;
}
.capsule {
  padding: 10px 20px;
  background: var(--bg-card);
  border-radius: var(--radius-round);
  font-size: 14px;
  font-weight: 600;
  color: var(--color-primary);
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
}
.capsule:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-base);
  background: var(--color-primary);
  color: var(--bg-card);
}
.ai-capsule {
  background: var(--gradient-primary);
  color: var(--bg-card);
}

/* 统计卡片 */
.stats-scroller {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  overflow-x: auto;
  padding-bottom: 10px;
}
.stats-scroller::-webkit-scrollbar {
  display: none;
}
.stat-island {
  flex: 1;
  min-width: 160px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-soft);
  transition: all 0.3s ease;
}
.stat-island:hover {
  transform: translateY(-5px) scale(1.02);
  background: var(--glass-bg-hover);
}
.island-icon {
  width: 50px;
  height: 50px;
  background: var(--gradient-primary);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--bg-card);
  font-size: 24px;
  box-shadow: var(--shadow-sm);
}
.island-data {
  display: flex;
  flex-direction: column;
}
.island-num {
  font-size: 22px;
  font-weight: 800;
  color: var(--color-primary);
}
.island-label {
  font-size: 12px;
  color: var(--text-secondary);
}

/* 内容网格 */
.content-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 24px;
  flex: 1;
  min-height: 0;
}

/* 玻璃面板 */
.glass-panel {
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: 24px;
  box-shadow: var(--shadow-soft);
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}
.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.panel-head h3 {
  margin: 0;
  font-size: 18px;
  color: var(--color-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}
.marker {
  width: 6px;
  height: 18px;
  background: var(--color-primary);
  border-radius: var(--radius-sm);
}
.link-text {
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: color 0.2s;
}
.link-text:hover {
  color: var(--color-primary);
}
.panel-body {
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;
  min-height: 0;
}

/* 待办列表 */
.fluid-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.fluid-item {
  display: flex;
  align-items: center;
  padding: 16px;
  background: var(--glass-bg);
  border-radius: var(--radius-lg);
  transition: all 0.2s;
  cursor: pointer;
  border: 1px solid transparent;
}
.fluid-item:hover {
  background: var(--bg-card);
  transform: translateX(6px);
  border-color: var(--color-secondary);
  box-shadow: var(--shadow-sm);
}
.check-circle {
  width: 18px;
  height: 18px;
  border: 2px solid var(--color-secondary);
  border-radius: 50%;
  margin-right: 14px;
  box-sizing: border-box;
}
.fluid-content {
  flex: 1;
}
.fluid-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 4px;
}
.fluid-time {
  font-size: 12px;
  color: var(--text-secondary);
}

/* 审批时间轴 */
.timeline-box {
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
  padding-left: 24px;
}
.timeline-box::before {
  content: "";
  position: absolute;
  left: 20px;
  top: 24px;
  bottom: 24px;
  width: 2px;
  background: var(--color-secondary);
  border-radius: 1px;
}
.timeline-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  position: relative;
  background: var(--glass-bg);
  border-radius: var(--radius-lg);
  transition: all 0.2s;
  cursor: pointer;
  border: 1px solid transparent;
}
.timeline-item:hover {
  background: var(--bg-card);
  transform: translateX(6px);
  border-color: var(--color-secondary);
  box-shadow: var(--shadow-sm);
}
.timeline-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
  position: absolute;
  left: -11px;
  top: 50%;
  transform: translateY(-50%);
  border: 2px solid var(--bg-page);
  box-sizing: content-box;
}
.timeline-content {
  flex: 1;
}
.t-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.t-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
}
.t-tag {
  font-size: 12px;
  font-weight: 600;
}
.t-date {
  font-size: 12px;
  color: var(--text-secondary);
}

/* 状态颜色 */
.color-gray {
  background: var(--color-secondary);
  color: var(--text-secondary);
}
.timeline-dot.color-gray {
  background: var(--color-secondary-dark);
}
.color-blue {
  background: #6b8cae;
  color: #6b8cae;
}
.timeline-dot.color-blue {
  background: #6b8cae;
}
.t-tag.color-blue {
  background: transparent;
}
.color-green {
  background: #7dab8f;
  color: #7dab8f;
}
.timeline-dot.color-green {
  background: #7dab8f;
}
.t-tag.color-green {
  background: transparent;
}
.color-red {
  background: #c48a8a;
  color: #c48a8a;
}
.timeline-dot.color-red {
  background: #c48a8a;
}
.t-tag.color-red {
  background: transparent;
}

/* 响应式 */
@media (max-width: 900px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
  .greeting-text h1 {
    font-size: 20px;
  }
}

/* 滚动条 */
.custom-scroll::-webkit-scrollbar {
  width: 4px;
}
.custom-scroll::-webkit-scrollbar-thumb {
  background: var(--border-base);
  border-radius: var(--radius-sm);
}
</style>
