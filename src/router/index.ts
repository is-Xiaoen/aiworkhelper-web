import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

NProgress.configure({ showSpinner: false })

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false, title: '登录' }
  },
  {
    path: '/',
    redirect: '/dashboard',
    component: () => import('@/layout/Index.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '/dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '工作台', icon: 'HomeFilled' }
      },
      {
        path: '/todo',
        name: 'Todo',
        component: () => import('@/views/todo/Index.vue'),
        meta: { title: '待办事项', icon: 'List' }
      },
      {
        path: '/approval',
        name: 'Approval',
        component: () => import('@/views/approval/Index.vue'),
        meta: { title: '审批管理', icon: 'Document' }
      },
      {
        path: '/approval/create',
        name: 'ApprovalCreate',
        component: () => import('@/views/approval/Create.vue'),
        meta: { title: '发起审批', hidden: true }
      },
      {
        path: '/department',
        name: 'Department',
        component: () => import('@/views/department/Index.vue'),
        meta: { title: '部门管理', icon: 'OfficeBuilding' }
      },
      {
        path: '/user',
        name: 'User',
        component: () => import('@/views/user/Index.vue'),
        meta: { title: '用户管理', icon: 'User' }
      },
      {
        path: '/chat',
        name: 'Chat',
        component: () => import('@/views/chat/Index.vue'),
        meta: { title: '聊天', icon: 'ChatDotRound' }
      },
      {
        path: '/knowledge',
        name: 'Knowledge',
        component: () => import('@/views/knowledge/Index.vue'),
        meta: { title: '知识库', icon: 'Reading' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  NProgress.start()

  const userStore = useUserStore()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth !== false)

  if (requiresAuth && !userStore.token) {
    // 需要认证但未登录，跳转到登录页
    next('/login')
  } else if (to.path === '/login' && userStore.token) {
    // 已登录用户访问登录页，跳转到首页
    next('/dashboard')
  } else {
    next()
  }
})

router.afterEach(() => {
  NProgress.done()
})

export default router
