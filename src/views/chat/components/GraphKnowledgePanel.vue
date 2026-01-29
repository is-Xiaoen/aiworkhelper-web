<template>
  <div v-if="hasContent" class="graph-knowledge-panel">
    <div class="panel-header" @click="toggleExpanded">
      <div class="header-left">
        <el-icon :class="{ rotated: expanded }"><ArrowRight /></el-icon>
        <el-icon class="graph-icon"><Share /></el-icon>
        <span>知识图谱</span>
      </div>
      <div class="header-stats">
        <el-tag v-if="entities.length > 0" size="small" type="success">
          {{ entities.length }} 实体
        </el-tag>
        <el-tag v-if="relations.length > 0" size="small" type="warning">
          {{ relations.length }} 关系
        </el-tag>
      </div>
    </div>

    <transition name="expand">
      <div v-show="expanded" class="panel-content">
        <!-- 实体列表 -->
        <div v-if="entities.length > 0" class="section entities-section">
          <div class="section-title">
            <el-icon><UserFilled /></el-icon>
            <span>相关实体</span>
          </div>
          <div class="entities-grid">
            <div
              v-for="(entity, index) in entities"
              :key="index"
              class="entity-card"
            >
              <div class="entity-header">
                <span class="entity-name">{{ entity.name }}</span>
                <el-tag v-if="entity.type" size="small">{{ entity.type }}</el-tag>
              </div>
              <div v-if="entity.description" class="entity-desc">
                {{ entity.description }}
              </div>
            </div>
          </div>
        </div>

        <!-- 关系列表 -->
        <div v-if="relations.length > 0" class="section relations-section">
          <div class="section-title">
            <el-icon><Connection /></el-icon>
            <span>实体关系</span>
          </div>
          <div class="relations-list">
            <div
              v-for="(relation, index) in relations"
              :key="index"
              class="relation-item"
            >
              <span class="relation-source">{{ relation.source }}</span>
              <div class="relation-arrow">
                <span class="relation-type">{{ relation.relation }}</span>
                <el-icon><ArrowRight /></el-icon>
              </div>
              <span class="relation-target">{{ relation.target }}</span>
              <div v-if="relation.description" class="relation-desc">
                {{ relation.description }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ArrowRight, Share, UserFilled, Connection } from '@element-plus/icons-vue'
import type { GraphEntity, GraphRelation } from '@/types'

interface Props {
  entities: GraphEntity[]
  relations: GraphRelation[]
}

const props = defineProps<Props>()

const expanded = ref(false)

const hasContent = computed(() => {
  return props.entities.length > 0 || props.relations.length > 0
})

const toggleExpanded = () => {
  expanded.value = !expanded.value
}
</script>

<style scoped>
.graph-knowledge-panel {
  margin-top: 12px;
  background: linear-gradient(135deg, var(--el-color-info-light-9) 0%, var(--el-fill-color-light) 100%);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.panel-header:hover {
  background: var(--el-fill-color);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.header-left .el-icon {
  transition: transform 0.2s ease;
}

.header-left .el-icon.rotated {
  transform: rotate(90deg);
}

.graph-icon {
  color: var(--el-color-primary);
}

.header-stats {
  display: flex;
  gap: 6px;
}

.panel-content {
  padding: 0 12px 12px;
}

.section {
  margin-top: 12px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
}

/* 实体卡片网格 */
.entities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 8px;
}

.entity-card {
  padding: 10px;
  background: var(--el-bg-color);
  border-radius: 6px;
  border: 1px solid var(--el-border-color-lighter);
}

.entity-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.entity-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.entity-desc {
  margin-top: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 关系列表 */
.relations-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.relation-item {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 10px;
  background: var(--el-bg-color);
  border-radius: 6px;
  border: 1px solid var(--el-border-color-lighter);
}

.relation-source,
.relation-target {
  padding: 4px 8px;
  background: var(--el-color-primary-light-9);
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  color: var(--el-color-primary);
}

.relation-arrow {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--el-text-color-secondary);
}

.relation-type {
  font-size: 11px;
  padding: 2px 6px;
  background: var(--el-fill-color);
  border-radius: 3px;
}

.relation-desc {
  width: 100%;
  margin-top: 4px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

/* 展开动画 */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 500px;
}
</style>
