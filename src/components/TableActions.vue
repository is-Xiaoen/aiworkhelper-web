<template>
  <div class="table-actions">
    <button
      v-for="(action, index) in actions"
      :key="index"
      class="table-action-btn"
      :class="[action.type || 'default']"
      :disabled="action.disabled"
      @click="handleClick(action)"
    >
      <el-icon v-if="action.icon" class="action-icon">
        <component :is="action.icon" />
      </el-icon>
      <span>{{ action.label }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { Component } from "vue";

interface Action {
  label: string;
  type?: "default" | "primary" | "success" | "warning" | "danger";
  icon?: Component;
  disabled?: boolean;
  key: string;
}

interface Props {
  actions: Action[];
}

defineProps<Props>();

const emit = defineEmits<{
  action: [key: string];
}>();

const handleClick = (action: Action) => {
  if (!action.disabled) {
    emit("action", action.key);
  }
};
</script>

<style scoped>
.table-actions {
  display: flex;
  gap: 4px;
  flex-wrap: nowrap;
}

.table-action-btn {
  padding: 4px 8px;
  background: transparent;
  border: none;
  font-size: 13px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  white-space: nowrap;
  font-family: inherit;
}

.table-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.table-action-btn.default {
  color: var(--color-primary);
}
.table-action-btn.default:hover:not(:disabled) {
  background: var(--color-secondary-light);
}

.table-action-btn.primary {
  color: var(--color-info);
}
.table-action-btn.primary:hover:not(:disabled) {
  background: var(--color-info-light);
}

.table-action-btn.success {
  color: var(--color-success);
}
.table-action-btn.success:hover:not(:disabled) {
  background: var(--color-success-light);
}

.table-action-btn.warning {
  color: var(--color-warning);
}
.table-action-btn.warning:hover:not(:disabled) {
  background: var(--color-warning-light);
}

.table-action-btn.danger {
  color: var(--color-danger);
}
.table-action-btn.danger:hover:not(:disabled) {
  background: var(--color-danger-light);
}

.action-icon {
  font-size: 14px;
}
</style>
