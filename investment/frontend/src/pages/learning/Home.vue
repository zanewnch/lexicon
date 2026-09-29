<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { getLearningPlan, getLearningProgress } from '@/api/learning'
import type { LearningNode, LearningPlan, LearningProgress, LearningStage, LearningStatus } from '@/types/learning'

const plan = ref<LearningPlan | null>(null)
const progress = ref<LearningProgress[]>([])
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    ;[plan.value, progress.value] = await Promise.all([getLearningPlan(), getLearningProgress()])
  } catch {
    error.value = '無法載入學習地圖，請確認後端服務後重試。'
  } finally {
    loading.value = false
  }
})

const statusByNode = computed(() => new Map(progress.value.map(item => [item.nodeId, item.status])))
const completeCount = computed(() => plan.value?.nodes.filter(node => status(node.id) === 'completed').length ?? 0)
const percent = computed(() => plan.value?.nodes.length ? Math.round(completeCount.value / plan.value.nodes.length * 100) : 0)
const nextNode = computed(() => plan.value?.nodes.find(node => status(node.id) !== 'completed'))

function status(id: string): LearningStatus {
  return statusByNode.value.get(id) ?? 'not_started'
}

function statusLabel(value: LearningStatus): string {
  return { not_started: '未開始', in_progress: '進行中', completed: '已完成' }[value]
}

function stageNodes(stage: LearningStage): LearningNode[] {
  return stage.nodeIds
    .map(id => plan.value?.nodes.find(node => node.id === id))
    .filter((node): node is LearningNode => Boolean(node))
}

function prerequisiteWeek(node: LearningNode): number | undefined {
  const prerequisiteId = node.prerequisiteIds?.[0]
  return prerequisiteId ? plan.value?.nodes.find(item => item.id === prerequisiteId)?.week : undefined
}
</script>

<template>
  <main class="learning-map">
    <p v-if="loading" class="learning-map__notice">正在載入學習地圖…</p>
    <div v-else-if="error" class="learning-map__notice learning-map__notice--error">
      {{ error }}
      <button type="button" @click="$router.go(0)">重試</button>
    </div>
    <template v-else-if="plan">
      <header class="learning-map__hero">
        <p class="learning-map__eyebrow">台股策略研究 · 10 週建議路線</p>
        <h1>{{ plan.title }}</h1>
        <p>{{ plan.description }}</p>
        <div class="learning-map__summary">
          <div>
            <strong>{{ completeCount }} / {{ plan.nodes.length }}</strong>
            <span>技能節點完成</span>
          </div>
          <div>
            <strong>{{ percent }}%</strong>
            <span>整體進度</span>
          </div>
          <div>
            <strong>{{ plan.weeklyHours }} 小時</strong>
            <span>每週建議投入</span>
          </div>
        </div>
        <div class="learning-map__progress" role="progressbar" :aria-valuenow="percent" aria-valuemin="0" aria-valuemax="100" aria-label="學習完成比例">
          <span :style="{ width: percent + '%' }"></span>
        </div>
        <RouterLink v-if="nextNode" class="learning-map__next" :to="`/learning/${nextNode.id}`">
          下一步：第 {{ nextNode.week }} 週 · {{ nextNode.title }} →
        </RouterLink>
        <p v-else class="learning-map__done">已完成全部節點。可回到任一週檢視或更新研究成果。</p>
      </header>

      <p class="learning-map__guidance">
        週次僅供安排時間，沒有截止日。可以自由開啟任何節點；提交成果與反思後才會計入完成。
      </p>

      <section v-for="stage in plan.stages" :key="stage.id" class="learning-map__stage">
        <div class="learning-map__stage-heading">
          <h2>{{ stage.title }}</h2>
          <span>{{ stage.nodeIds.filter(id => status(id) === 'completed').length }} / {{ stage.nodeIds.length }} 完成</span>
        </div>
        <div class="learning-map__nodes">
          <RouterLink
            v-for="node in stageNodes(stage)"
            :key="node.id"
            :to="`/learning/${node.id}`"
            class="learning-map__node"
            :class="`learning-map__node--${status(node.id)}`"
          >
            <div class="learning-map__node-top">
              <span>第 {{ node.week }} 週</span>
              <span class="learning-map__badge">{{ statusLabel(status(node.id)) }}</span>
            </div>
            <h3>{{ node.title }}</h3>
            <span v-if="prerequisiteWeek(node)" class="learning-map__prerequisite">建議先完成第 {{ prerequisiteWeek(node) }} 週</span>
            <p>{{ node.deliverable }}</p>
            <span class="learning-map__open">查看練習 →</span>
          </RouterLink>
        </div>
      </section>
      <aside class="learning-map__footer-note">
        現有策略頁的五日訊號績效適合觀察訊號；含成交時點與交易成本的研究，請依各週練習另外記錄。
      </aside>
    </template>
  </main>
</template>

<style scoped lang="scss">
.learning-map {
  max-width: 1160px;
  margin: 0 auto;
  padding-bottom: 48px;

  &__notice {
    padding: 24px;
    color: var(--color-text-muted);
    &--error { color: var(--color-down); }
    button { margin-left: 12px; text-decoration: underline; }
  }

  &__hero {
    padding: clamp(22px, 4vw, 40px);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-bg-card);
    h1 { font-size: clamp(24px, 3vw, 34px); margin: 8px 0 10px; }
    > p:not(.learning-map__eyebrow, .learning-map__done) { color: var(--color-text-muted); }
  }

  &__eyebrow { color: var(--color-accent); font-size: 13px; font-weight: 700; }
  &__summary { display: flex; flex-wrap: wrap; gap: 24px; margin-top: 28px; }
  &__summary > div { display: flex; flex-direction: column; min-width: 130px; gap: 4px; }
  &__summary strong { font-size: 22px; }
  &__summary span { color: var(--color-text-muted); font-size: 12px; }
  &__progress { height: 8px; margin: 22px 0; border-radius: 99px; background: var(--color-border); overflow: hidden; }
  &__progress span { display: block; height: 100%; border-radius: inherit; background: var(--color-accent); }
  &__next { display: inline-block; color: var(--color-accent); font-weight: 700; }
  &__done { color: var(--color-accent); font-weight: 700; }
  &__guidance { margin: 22px 0; color: var(--color-text-muted); line-height: 1.6; }
  &__stage { margin: 32px 0; }
  &__stage-heading { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; margin-bottom: 14px; }
  &__stage-heading h2 { font-size: 20px; }
  &__stage-heading span { color: var(--color-text-muted); font-size: 13px; }
  &__nodes { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 14px; }
  &__node {
    display: flex; flex-direction: column; gap: 10px; min-height: 190px; padding: 20px;
    border: 1px solid var(--color-border); border-radius: var(--radius-md);
    background: var(--color-bg-card); color: var(--color-text-primary); text-decoration: none;
    &:hover, &:focus-visible { border-color: var(--color-accent); }
    &--completed { border-color: var(--color-accent); }
    h3 { font-size: 17px; }
    p { color: var(--color-text-muted); font-size: 13px; line-height: 1.6; }
  }
  &__node-top { display: flex; justify-content: space-between; gap: 8px; color: var(--color-text-muted); font-size: 12px; }
  &__badge { color: var(--color-accent); }
  &__prerequisite { color: var(--color-text-muted); font-size: 12px; }
  &__open { margin-top: auto; color: var(--color-accent); font-size: 13px; font-weight: 600; }
  &__footer-note { padding: 16px 20px; border-left: 3px solid var(--color-accent); color: var(--color-text-muted); line-height: 1.6; }
}
</style>
