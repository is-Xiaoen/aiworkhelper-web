<template>
  <div v-if="citations && citations.length > 0" class="citation-list">
    <div class="citation-header">
      <el-icon><Document /></el-icon>
      <span>来源引用</span>
      <el-tag size="small" type="info">{{ citations.length }} 个来源</el-tag>
    </div>
    <div class="citation-items">
      <div
        v-for="citation in citations"
        :key="citation.index"
        class="citation-item"
        @click="toggleSnippet(citation.index)"
      >
        <div class="citation-main">
          <span class="citation-index">[{{ citation.index }}]</span>
          <span class="citation-title">{{ citation.title || '未命名文档' }}</span>
          <el-tag size="small" :type="getSourceTagType(citation.source)">
            {{ getSourceLabel(citation.source) }}
          </el-tag>
        </div>
        <div v-if="citation.pageNumber" class="citation-page">
          <el-icon><Document /></el-icon>
          <span>第 {{ citation.pageNumber }} 页</span>
        </div>
        <transition name="fade">
          <div
            v-if="citation.snippet && expandedIndex === citation.index"
            class="citation-snippet"
          >
            <span class="snippet-label">引用片段：</span>
            <span class="snippet-text">{{ citation.snippet }}</span>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Document } from '@element-plus/icons-vue'
import type { Citation } from '@/types'

interface Props {
  citations: Citation[]
}

defineProps<Props>()

const expandedIndex = ref<number | null>(null)

const toggleSnippet = (index: number) => {
  if (expandedIndex.value === index) {
    expandedIndex.value = null
  } else {
    expandedIndex.value = index
  }
}

const getSourceTagType = (source: string): 'success' | 'warning' | 'info' => {
  switch (source) {
    case 'vector':
      return 'success'
    case 'bm25':
      return 'warning'
    case 'graph':
      return 'info'
    default:
      return 'info'
  }
}

const getSourceLabel = (source: string): string => {
  switch (source) {
    case 'vector':
      return '语义匹配'
    case 'bm25':
      return '关键词'
    case 'graph':
      return '知识图谱'
    default:
      return source
  }
}
</script>

<style scoped>
.citation-list {
  margin-top: 12px;
  padding: 12px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
}

.citation-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.citation-header .el-icon {
  color: var(--el-color-primary);
}

.citation-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.citation-item {
  padding: 8px 12px;
  background: var(--el-bg-color);
  border-radius: 6px;
  border: 1px solid var(--el-border-color-lighter);
  cursor: pointer;
  transition: all 0.2s ease;
}

.citation-item:hover {
  border-color: var(--el-color-primary-light-5);
  background: var(--el-color-primary-light-9);
}

.citation-main {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.citation-index {
  font-weight: 600;
  color: var(--el-color-primary);
  font-size: 12px;
  min-width: 24px;
}

.citation-title {
  flex: 1;
  font-size: 13px;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.citation-page {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.citation-snippet {
  margin-top: 8px;
  padding: 8px;
  background: var(--el-fill-color-lighter);
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.5;
}

.snippet-label {
  color: var(--el-text-color-secondary);
}

.snippet-text {
  color: var(--el-text-color-regular);
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, max-height 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  max-height: 0;
}
</style>
