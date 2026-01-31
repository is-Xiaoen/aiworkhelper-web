<template>
  <el-container class="layout-container">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapse ? '64px' : '200px'" class="layout-aside">
      <div class="logo">
        <span v-if="!isCollapse">AI智能办公系统</span>
        <span v-else>AI</span>
      </div>

      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :collapse-transition="false"
        router
        class="layout-menu"
      >
        <template v-for="menuRoute in menuRoutes" :key="menuRoute.path">
          <el-menu-item
            v-if="!menuRoute.meta?.hidden"
            :index="menuRoute.path"
          >
            <el-icon v-if="getIconComponent(menuRoute.meta?.icon as string)">
              <component :is="getIconComponent(menuRoute.meta?.icon as string)" />
            </el-icon>
            <template #title>{{ menuRoute.meta?.title }}</template>
          </el-menu-item>
        </template>
      </el-menu>
    </el-aside>

    <!-- 主体区域 -->
    <el-container class="layout-main">
      <!-- 头部 -->
      <el-header class="layout-header">
        <div class="header-left">
          <el-icon class="collapse-icon" @click="toggleCollapse">
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
        </div>

        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <div class="user-info">
              <div class="user-avatar">
                <el-icon><User /></el-icon>
              </div>
              <span class="username">{{ userStore.userInfo?.name }}</span>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="password">修改密码</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 内容区域 -->
      <el-main class="layout-content">
        <router-view v-slot="{ Component, route: viewRoute }">
          <transition name="fade-transform" mode="out-in">
            <component :is="Component" :key="viewRoute.path" />
          </transition>
        </router-view>
      </el-main>
    </el-container>

    <!-- 修改密码对话框 -->
    <el-dialog
      v-model="passwordDialogVisible"
      title="修改密码"
      width="500px"
    >
      <el-form
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        label-width="80px"
      >
        <el-form-item label="原密码" prop="oldPwd">
          <el-input
            v-model="passwordForm.oldPwd"
            type="password"
            show-password
          />
        </el-form-item>
        <el-form-item label="新密码" prop="newPwd">
          <el-input
            v-model="passwordForm.newPwd"
            type="password"
            show-password
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPwd">
          <el-input
            v-model="passwordForm.confirmPwd"
            type="password"
            show-password
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleChangePassword">确定</el-button>
      </template>
    </el-dialog>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed, markRaw, type Component } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import {
  Fold,
  Expand,
  HomeFilled,
  List,
  Document,
  OfficeBuilding,
  User,
  ChatDotRound,
  Reading,
  Microphone
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { changePassword } from '@/api/user'

// 图标映射表：将字符串名称映射到实际组件
const iconMap: Record<string, Component> = {
  HomeFilled: markRaw(HomeFilled),
  List: markRaw(List),
  Document: markRaw(Document),
  OfficeBuilding: markRaw(OfficeBuilding),
  User: markRaw(User),
  ChatDotRound: markRaw(ChatDotRound),
  Reading: markRaw(Reading),
  Microphone: markRaw(Microphone)
}

// 根据名称获取图标组件
const getIconComponent = (iconName: string | undefined): Component | null => {
  if (!iconName) return null
  return iconMap[iconName] || null
}

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const isCollapse = ref(false)
const passwordDialogVisible = ref(false)
const passwordFormRef = ref<FormInstance>()

const passwordForm = ref({
  oldPwd: '',
  newPwd: '',
  confirmPwd: ''
})

const passwordRules: FormRules = {
  oldPwd: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPwd: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
  ],
  confirmPwd: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value !== passwordForm.value.newPwd) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 当前激活的菜单
const activeMenu = computed(() => route.path)

// 菜单路由 - 使用原始路由配置而非 getRoutes()
// getRoutes() 返回扁平化的标准化路由，children 结构不可靠
const menuRoutes = computed(() => {
  const rootRoute = router.options.routes.find(r => r.path === '/')
  return rootRoute?.children || []
})

// 切换侧边栏折叠状态
const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}

// 处理下拉菜单命令
const handleCommand = (command: string) => {
  switch (command) {
    case 'password':
      passwordDialogVisible.value = true
      break
    case 'logout':
      handleLogout()
      break
  }
}

// 修改密码
const handleChangePassword = async () => {
  if (!passwordFormRef.value) return

  await passwordFormRef.value.validate(async (valid) => {
    if (valid && userStore.userInfo?.id) {
      try {
        await changePassword({
          id: userStore.userInfo.id,
          oldPwd: passwordForm.value.oldPwd,
          newPwd: passwordForm.value.newPwd
        })
        ElMessage.success('密码修改成功，请重新登录')
        passwordDialogVisible.value = false
        handleLogout()
      } catch (error) {
        ElMessage.error('密码修改失败')
      }
    }
  })
}

// 退出登录
const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    userStore.logout()
    router.push('/login')
    ElMessage.success('已退出登录')
  })
}
</script>

<style scoped>
.layout-container { width: 100%; height: 100vh; }

/* 侧边栏 - 深色渐变 + 微光效果 */
.layout-aside {
  background: linear-gradient(180deg, #2d3a4f 0%, #1e2836 100%);
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.15);
  position: relative;
}
.layout-aside::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 120px;
  background: linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 100%);
  pointer-events: none;
}

/* Logo区域 */
.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 64px;
  font-size: 17px;
  font-weight: 600;
  color: #fff;
  background: rgba(255,255,255,0.05);
  border-bottom: 1px solid rgba(255,255,255,0.08);
  letter-spacing: 2px;
  position: relative;
  z-index: 1;
}

/* 菜单样式 */
.layout-menu {
  border-right: none;
  background: transparent;
  --el-menu-bg-color: transparent;
  --el-menu-text-color: rgba(255,255,255,0.7);
  --el-menu-hover-bg-color: rgba(255,255,255,0.1);
  --el-menu-active-color: #fff;
  padding: 12px 8px;
}
.layout-menu :deep(.el-menu-item) {
  margin: 4px 0;
  border-radius: 8px;
  height: 44px;
  line-height: 44px;
  transition: all 0.25s;
}
.layout-menu :deep(.el-menu-item:hover) {
  background: rgba(255,255,255,0.1);
  transform: translateX(4px);
}
.layout-menu :deep(.el-menu-item.is-active) {
  background: rgba(255,255,255,0.12);
  color: #fff;
  font-weight: 500;
}
.layout-menu :deep(.el-menu-item.is-active)::before {
  content: '';
  position: absolute;
  left: 0; top: 50%;
  transform: translateY(-50%);
  width: 3px; height: 18px;
  background: #fff;
  border-radius: 0 2px 2px 0;
}

/* 主体区域 */
.layout-main { background: var(--bg-layout); }

/* 头部 - 毛玻璃效果 */
.layout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 60px;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255,255,255,0.9);
  box-shadow: 0 1px 12px rgba(0,0,0,0.04);
}

.header-left { display: flex; align-items: center; gap: 16px; }

.collapse-icon {
  width: 38px; height: 38px;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px;
  cursor: pointer;
  border-radius: 10px;
  color: var(--text-primary);
  background: rgba(0,0,0,0.02);
  border: 1px solid rgba(0,0,0,0.04);
  transition: all 0.25s;
}
.collapse-icon:hover {
  background: var(--color-primary);
  color: #fff;
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(52,68,91,0.25);
}

.header-right { display: flex; align-items: center; }

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 14px 6px 6px;
  cursor: pointer;
  border-radius: 24px;
  background: rgba(0,0,0,0.02);
  border: 1px solid rgba(0,0,0,0.04);
  transition: all 0.25s;
}
.user-info:hover {
  background: var(--color-secondary-light);
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.user-avatar {
  width: 32px; height: 32px;
  background: linear-gradient(135deg, var(--color-info) 0%, #667eea 100%);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #fff;
  font-size: 14px;
  box-shadow: 0 2px 8px rgba(64,158,255,0.3);
}

.username {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

/* 内容区域 */
.layout-content { padding: 20px; overflow-y: auto; }

/* 路由过渡动画 */
.fade-transform-leave-active, .fade-transform-enter-active { transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
.fade-transform-enter-from { opacity: 0; transform: translateX(-20px); }
.fade-transform-leave-to { opacity: 0; transform: translateX(20px); }
</style>
