<template>
  <button
    class="app-btn"
    :class="[
      `app-btn--${type}`,
      `app-btn--${size}`,
      { 'app-btn--disabled': disabled, 'app-btn--loading': loading },
    ]"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <span v-if="loading" class="app-btn__loading">
      <span class="loading-dot"></span>
      <span class="loading-dot"></span>
      <span class="loading-dot"></span>
    </span>
    <el-icon v-if="icon && !loading" class="app-btn__icon">
      <component :is="icon" />
    </el-icon>
    <span class="app-btn__text"><slot /></span>
  </button>
</template>

<script setup lang="ts">
import type { Component } from "vue";

interface Props {
  type?: "default" | "primary" | "success" | "warning" | "danger" | "text";
  size?: "small" | "medium" | "large";
  icon?: Component;
  disabled?: boolean;
  loading?: boolean;
}

withDefaults(defineProps<Props>(), {
  type: "default",
  size: "medium",
  disabled: false,
  loading: false,
});

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

const handleClick = (event: MouseEvent) => {
  emit("click", event);
};
</script>

<style scoped>
.app-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  outline: none;
  transition: all 0.3s ease;
  font-family: inherit;
  white-space: nowrap;
}

/* 尺寸 */
.app-btn--small {
  padding: 6px 14px;
  font-size: 12px;
  border-radius: var(--radius-sm);
}
.app-btn--medium {
  padding: 10px 20px;
  font-size: 14px;
  border-radius: 8px;
}
.app-btn--large {
  padding: 12px 28px;
  font-size: 16px;
  border-radius: 10px;
}

/* 默认样式 */
.app-btn--default {
  background: var(--bg-card);
  color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}
.app-btn--default:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-base);
  background: var(--color-primary);
  color: var(--bg-card);
}

/* 主色样式 */
.app-btn--primary {
  background: var(--gradient-primary);
  color: var(--bg-card);
  box-shadow: 0 4px 12px rgba(52, 68, 91, 0.25);
}
.app-btn--primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(52, 68, 91, 0.35);
  filter: brightness(1.1);
}

/* 成功样式 */
.app-btn--success {
  background: linear-gradient(
    135deg,
    var(--color-success) 0%,
    var(--color-success-dark) 100%
  );
  color: #fff;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
}
.app-btn--success:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.35);
  filter: brightness(1.1);
}

/* 警告样式 */
.app-btn--warning {
  background: linear-gradient(
    135deg,
    var(--color-warning) 0%,
    var(--color-warning-dark) 100%
  );
  color: #fff;
  box-shadow: 0 4px 12px rgba(230, 162, 60, 0.25);
}
.app-btn--warning:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(230, 162, 60, 0.35);
  filter: brightness(1.1);
}

/* 危险样式 */
.app-btn--danger {
  background: linear-gradient(
    135deg,
    var(--color-danger) 0%,
    var(--color-danger-dark) 100%
  );
  color: #fff;
  box-shadow: 0 4px 12px rgba(245, 108, 108, 0.25);
}
.app-btn--danger:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(245, 108, 108, 0.35);
  filter: brightness(1.1);
}

/* 文字按钮 */
.app-btn--text {
  background: transparent;
  color: var(--color-primary);
  box-shadow: none;
  padding-left: 8px;
  padding-right: 8px;
}
.app-btn--text:hover {
  background: var(--color-secondary-light);
  color: var(--color-primary-dark);
}

/* 禁用状态 */
.app-btn--disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

/* Loading状态 */
.app-btn--loading {
  cursor: wait;
}
.app-btn__loading {
  display: flex;
  align-items: center;
  gap: 4px;
}
.loading-dot {
  width: 6px;
  height: 6px;
  background: currentColor;
  border-radius: 50%;
  animation: loadingBounce 1.4s infinite ease-in-out both;
}
.loading-dot:nth-child(1) {
  animation-delay: -0.32s;
}
.loading-dot:nth-child(2) {
  animation-delay: -0.16s;
}
@keyframes loadingBounce {
  0%,
  80%,
  100% {
    transform: scale(0.6);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 图标 */
.app-btn__icon {
  font-size: 1.1em;
}
</style>
