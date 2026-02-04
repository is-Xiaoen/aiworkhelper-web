<template>
  <div class="login-container">
    <!-- 背景装饰 -->
    <div class="bg-shapes">
      <div class="shape shape-1"></div>
      <div class="shape shape-2"></div>
      <div class="shape shape-3"></div>
    </div>

    <main class="login-card">
      <!-- 左侧装饰区 -->
      <div class="brand-panel">
        <div class="brand-content">
          <!-- Logo -->
          <div class="logo-box">
            <svg viewBox="0 0 48 48" fill="none">
              <rect x="6" y="6" width="36" height="36" rx="8" stroke="currentColor" stroke-width="3"/>
              <circle cx="18" cy="20" r="4" fill="currentColor"/>
              <circle cx="30" cy="20" r="4" fill="currentColor"/>
              <path d="M16 32c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
            </svg>
          </div>

          <!-- 品牌信息 -->
          <h1 class="brand-name">AI智能办公</h1>
          <p class="brand-desc">您的智能工作伙伴</p>

          <!-- 特性列表 -->
          <div class="feature-list">
            <div class="feature-item">
              <span class="check-icon">✓</span>
              <span>智能对话助手</span>
            </div>
            <div class="feature-item">
              <span class="check-icon">✓</span>
              <span>高效任务管理</span>
            </div>
            <div class="feature-item">
              <span class="check-icon">✓</span>
              <span>知识库检索</span>
            </div>
          </div>
        </div>

        <!-- 底部装饰线 -->
        <div class="brand-footer">
          <div class="line"></div>
          <span>AI Powered</span>
          <div class="line"></div>
        </div>
      </div>

      <!-- 右侧登录区 -->
      <div class="login-panel">
        <div class="login-content">
          <!-- 标题 -->
          <div class="login-header">
            <h2>登录系统</h2>
            <p>欢迎回来，请输入账号继续</p>
          </div>

          <!-- 表单 -->
          <el-form
            ref="loginFormRef"
            :model="loginForm"
            :rules="rules"
            class="login-form"
            @keyup.enter="handleLogin"
          >
            <el-form-item prop="name" label="账号">
              <el-input
                v-model="loginForm.name"
                placeholder="请输入用户名"
                size="large"
                class="custom-input"
              >
                <template #prefix>
                  <div class="icon-box">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item prop="password" label="密码">
              <el-input
                v-model="loginForm.password"
                type="password"
                placeholder="请输入密码"
                size="large"
                show-password
                class="custom-input"
              >
                <template #prefix>
                  <div class="icon-box">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item>
              <button
                type="button"
                class="submit-btn"
                :disabled="loading"
                @click="handleLogin"
              >
                <span v-if="loading" class="loading-spinner"></span>
                <span>{{ loading ? '正在登录...' : '登 录' }}</span>
              </button>
            </el-form-item>
          </el-form>

          <!-- 提示 -->
          <div class="login-tip">
            <span class="tip-icon">💡</span>
            <span>首次使用？请联系管理员获取账号</span>
          </div>
        </div>
      </div>
    </main>

    <!-- 版权 -->
    <footer class="copyright">
      © {{ new Date().getFullYear() }} AI智能办公系统
    </footer>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, FormInstance, FormRules } from 'element-plus'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const loginFormRef = ref<FormInstance>()
const loading = ref(false)

const loginForm = reactive({
  name: '',
  password: ''
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return

  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const success = await userStore.login(loginForm)
        if (success) {
          ElMessage.success('登录成功')
          router.push('/dashboard')
        } else {
          ElMessage.error('用户名或密码错误')
        }
      } catch (error) {
        ElMessage.error('登录失败，请稍后重试')
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped>
/* ========== 容器 ========== */
.login-container {
  min-height: 100vh;
  width: 100%;
  background: linear-gradient(135deg, #ffffff 0%, #ffffff 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;
  overflow: hidden;
}

/* ========== 背景装饰 ========== */
.bg-shapes {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.shape {
  position: absolute;
  border-radius: 50%;
  opacity: 0.6;
}

.shape-1 {
  width: 300px;
  height: 300px;
  top: -100px;
  left: -100px;
  filter: blur(60px);
}

.shape-2 {
  width: 250px;
  height: 250px;
  bottom: -80px;
  right: -80px;
  filter: blur(50px);
}

.shape-3 {
  width: 150px;
  height: 150px;
  background: var(--color-primary);
  opacity: 0.1;
  top: 50%;
  left: 60%;
  filter: blur(40px);
}

/* ========== 主卡片 ========== */
.login-card {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 1050px;
  min-height: 600px;
  background: var(--bg-card);
  border-radius: 24px;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.12);
  display: flex;
  overflow: hidden;
}

@media (max-width: 900px) {
  .login-card {
    flex-direction: column;
    max-width: 450px;
    min-height: auto;
  }
}

/* ========== 左侧品牌区 ========== */
.brand-panel {
  width: 42%;
  background: linear-gradient(160deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  padding: 3.5rem 2.5rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: white;
}

@media (max-width: 900px) {
  .brand-panel {
    width: 100%;
    padding: 2.5rem;
  }
}

.brand-content {
  text-align: center;
}

.logo-box {
  width: 90px;
  height: 90px;
  margin: 0 auto 1.75rem;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
}

.logo-box svg {
  width: 54px;
  height: 54px;
  color: white;
}

.brand-name {
  margin: 0 0 0.6rem;
  font-size: 1.8rem;
  font-weight: 700;
  letter-spacing: 1px;
}

.brand-desc {
  margin: 0 0 2.5rem;
  font-size: 1rem;
  opacity: 0.85;
}

.feature-list {
  text-align: left;
  max-width: 180px;
  margin: 0 auto;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  font-size: 0.9rem;
  opacity: 0.9;
}

.check-icon {
  width: 20px;
  height: 20px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.brand-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 0.75rem;
  opacity: 0.6;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.brand-footer .line {
  width: 30px;
  height: 1px;
  background: rgba(255, 255, 255, 0.4);
}

@media (max-width: 900px) {
  .feature-list,
  .brand-footer {
    display: none;
  }
}

/* ========== 右侧登录区 ========== */
.login-panel {
  flex: 1;
  padding: 3.5rem 4rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 900px) {
  .login-panel {
    padding: 2.5rem;
  }
}

.login-content {
  width: 100%;
  max-width: 380px;
}

.login-header {
  margin-bottom: 2.5rem;
}

.login-header h2 {
  margin: 0 0 0.6rem;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
}

.login-header p {
  margin: 0;
  font-size: 1rem;
  color: var(--text-secondary);
}

/* ========== 表单样式 ========== */
.login-form :deep(.el-form-item) {
  margin-bottom: 1.5rem;
}

.login-form :deep(.el-form-item__label) {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.login-form :deep(.el-form-item__error) {
  padding-top: 4px;
}

/* 图标容器 - 与 loginn 一致 */
.icon-box {
  width: 44px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.icon-box svg {
  width: 20px;
  height: 20px;
}

.login-content:focus-within .icon-box {
  color: var(--color-primary);
}

/* 输入框样式 - 与 loginn 完全一致 */
.custom-input :deep(.el-input__wrapper) {
  padding: 0;
  padding-right: 14px;
  height: 48px;
  background-color: #eaf2fc;
  border: 1px solid transparent;
  border-radius: 8px;
  box-shadow: none;
  transition: all 0.2s;
}

.custom-input :deep(.el-input__wrapper:hover),
.custom-input :deep(.el-input__wrapper.is-focus) {
  background-color: #ffffff;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(74, 101, 128, 0.1);
}

.custom-input :deep(.el-input__inner) {
  font-size: 15px;
  color: var(--text-primary);
  font-weight: 500;
}

.custom-input :deep(.el-input__inner::placeholder) {
  color: var(--text-placeholder);
  font-weight: 400;
}

/* 处理浏览器自动填充背景色 */
.custom-input :deep(.el-input__inner:-webkit-autofill) {
  -webkit-box-shadow: 0 0 0 1000px #eaf2fc inset !important;
  transition: background-color 0.2s, box-shadow 0.2s;
}

.custom-input :deep(.el-input__wrapper:hover .el-input__inner:-webkit-autofill),
.custom-input :deep(.el-input__wrapper.is-focus .el-input__inner:-webkit-autofill) {
  -webkit-box-shadow: 0 0 0 1000px #ffffff inset !important;
}

/* 隐藏浏览器默认的密码查看图标 */
.custom-input :deep(.el-input__inner::-ms-reveal),
.custom-input :deep(.el-input__inner::-ms-clear) {
  display: none;
}

.custom-input :deep(.el-input__prefix) {
  padding: 0;
}

.custom-input :deep(.el-input__prefix-inner) {
  padding: 0;
}

.custom-input :deep(.el-input__suffix) {
  padding-right: 8px;
}

/* 提交按钮 */
.submit-btn {
  width: 100%;
  height: 46px;
  margin-top: 0.5rem;
  font-size: 15px;
  font-weight: 600;
  color: white;
  background: var(--color-primary);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.submit-btn:hover:not(:disabled) {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(74, 101, 128, 0.3);
}

.submit-btn:active:not(:disabled) {
  transform: translateY(0);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 提示 */
.login-tip {
  margin-top: 1.5rem;
  padding: 12px 16px;
  background: var(--color-info-light);
  border-radius: 8px;
  font-size: 13px;
  color: var(--color-info-dark);
  display: flex;
  align-items: center;
  gap: 8px;
}

.tip-icon {
  font-size: 14px;
}

/* ========== 版权 ========== */
.copyright {
  margin-top: 2rem;
  font-size: 12px;
  color: var(--text-secondary);
  opacity: 0.7;
}
</style>
