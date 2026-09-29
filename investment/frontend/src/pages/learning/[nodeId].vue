<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import api from '@/api'
import { getLearningPlan, getLearningProgress, saveLearningProgress } from '@/api/learning'
import type { LearningNode, LearningPlan, LearningProgress, LearningProgressInput, LearningStatus } from '@/types/learning'

const route = useRoute()
const nodeId = computed(() => String(route.params.nodeId))
const plan = ref<LearningPlan | null>(null)
const progress = ref<LearningProgress[]>([])
const notes = ref<{ id: string; title: string }[]>([])
const strategies = ref<{ id: string; name: string }[]>([])
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const success = ref('')
const form = reactive<LearningProgressInput>({
  status: 'not_started',
  artifactSummary: '',
  reflection: '',
  noteId: '',
  strategyId: '',
  externalUrl: '',
})

const node = computed<LearningNode | undefined>(() => plan.value?.nodes.find(item => item.id === nodeId.value))
const previous = computed(() => {
  const index = plan.value?.nodes.findIndex(item => item.id === nodeId.value) ?? -1
  return index > 0 ? plan.value?.nodes[index - 1] : undefined
})
const next = computed(() => {
  const index = plan.value?.nodes.findIndex(item => item.id === nodeId.value) ?? -1
  return index >= 0 ? plan.value?.nodes[index + 1] : undefined
})

onMounted(async () => {
  try {
    const [loadedPlan, loadedProgress] = await Promise.all([getLearningPlan(), getLearningProgress()])
    plan.value = loadedPlan
    progress.value = loadedProgress
    loadNodeProgress()
    const [noteResult, strategyResult] = await Promise.allSettled([
      api.get<{ id: string; title: string }[]>('/notes/'),
      api.get<{ id: string; name: string }[]>('/strategies/'),
    ])
    if (noteResult.status === 'fulfilled') notes.value = noteResult.value.data
    if (strategyResult.status === 'fulfilled') strategies.value = strategyResult.value.data
  } catch {
    error.value = '無法載入課程資料，請確認後端服務後重試。'
  } finally {
    loading.value = false
  }
})

watch(nodeId, () => {
  error.value = ''
  success.value = ''
  loadNodeProgress()
})

function loadNodeProgress() {
  const saved = progress.value.find(item => item.nodeId === nodeId.value)
  form.status = saved?.status ?? 'not_started'
  form.artifactSummary = saved?.artifactSummary ?? ''
  form.reflection = saved?.reflection ?? ''
  form.noteId = saved?.noteId ?? ''
  form.strategyId = saved?.strategyId ?? ''
  form.externalUrl = saved?.externalUrl ?? ''
}

async function save(status: LearningStatus) {
  error.value = ''
  success.value = ''
  if (status === 'completed' && (!form.artifactSummary.trim() || !form.reflection.trim())) {
    error.value = '完成節點前，請填寫成果摘要與反思。'
    return
  }
  saving.value = true
  try {
    const saved = await saveLearningProgress(nodeId.value, { ...form, status })
    progress.value = [...progress.value.filter(item => item.nodeId !== saved.nodeId), saved]
    form.status = saved.status
    success.value = status === 'completed' ? '成果已保存，節點已完成。' : '進度已保存。'
  } catch {
    error.value = '儲存失敗。請檢查欄位與後端服務後重試。'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <main class="learning-detail">
    <RouterLink class="learning-detail__back" to="/learning">← 返回學習地圖</RouterLink>
    <p v-if="loading" class="learning-detail__message">正在載入節點…</p>
    <div v-else-if="!node" class="learning-detail__message">
      <h1>找不到這個學習節點</h1>
      <p>{{ error || '請從學習地圖選擇節點。' }}</p>
    </div>
    <template v-else>
      <header class="learning-detail__header">
        <p>第 {{ node.week }} 週 · {{ plan?.stages.find(stage => stage.id === node?.stageId)?.title }}</p>
        <h1>{{ node.title }}</h1>
        <span class="learning-detail__status">
          {{ form.status === 'completed' ? '已完成' : form.status === 'in_progress' ? '進行中' : '未開始' }}
        </span>
        <p v-if="previous" class="learning-detail__prerequisite">建議先完成：第 {{ previous.week }} 週 · {{ previous.title }}；也可以直接開始本週。</p>
      </header>

      <div class="learning-detail__grid">
        <article class="learning-detail__content">
          <section>
            <h2>先理解這件事</h2>
            <p>{{ node.concept }}</p>
          </section>
          <section>
            <h2>動手做</h2>
            <ol>
              <li v-for="step in node.steps" :key="step">{{ step }}</li>
            </ol>
          </section>
          <section>
            <h2>本週提交成果</h2>
            <p>{{ node.deliverable }}</p>
            <div class="learning-detail__example"><strong>參考寫法</strong><br />{{ node.example }}</div>
          </section>
          <section>
            <h2>完成條件</h2>
            <ul>
              <li v-for="criterion in node.completionCriteria" :key="criterion">{{ criterion }}</li>
            </ul>
          </section>
          <section>
            <h2>精選來源</h2>
            <ul class="learning-detail__resources">
              <li v-for="resource in node.resources" :key="resource.url">
                <a :href="resource.url" target="_blank" rel="noopener noreferrer">{{ resource.title }} ↗</a>
              </li>
            </ul>
          </section>
        </article>

        <aside class="learning-detail__submission">
          <h2>記錄你的成果</h2>
          <p>可先儲存進行中。標記完成時需填寫成果摘要與反思；連結為選填。</p>
          <form @submit.prevent="save('completed')">
            <label for="learning-artifact">成果摘要 *</label>
            <textarea id="learning-artifact" v-model="form.artifactSummary" rows="5" placeholder="做了什麼、使用哪些資料、得到什麼結果" />
            <label for="learning-reflection">反思 *</label>
            <textarea id="learning-reflection" v-model="form.reflection" rows="4" placeholder="哪裡還不確定？下一步要驗證什麼？" />
            <label for="learning-note">連結筆記</label>
            <select id="learning-note" v-model="form.noteId">
              <option value="">不連結</option>
              <option v-for="note in notes" :key="note.id" :value="note.id">{{ note.title }}</option>
            </select>
            <label for="learning-strategy">連結策略</label>
            <select id="learning-strategy" v-model="form.strategyId">
              <option value="">不連結</option>
              <option v-for="strategy in strategies" :key="strategy.id" :value="strategy.id">{{ strategy.name }}</option>
            </select>
            <label for="learning-url">外部成果網址</label>
            <input id="learning-url" v-model="form.externalUrl" type="url" placeholder="https://…" />
            <div v-if="form.noteId || form.strategyId || form.externalUrl" class="learning-detail__links">
              <RouterLink v-if="form.noteId" :to="{ path: '/analysis/notes', query: { note: form.noteId } }">開啟連結筆記 →</RouterLink>
              <RouterLink v-if="form.strategyId" :to="`/strategy/${form.strategyId}`">開啟策略 →</RouterLink>
              <a v-if="form.externalUrl" :href="form.externalUrl" target="_blank" rel="noopener noreferrer">開啟外部成果 ↗</a>
            </div>
            <p v-if="error" role="alert" class="learning-detail__error">{{ error }}</p>
            <p v-if="success" role="status" class="learning-detail__success">{{ success }}</p>
            <div class="learning-detail__actions">
              <button type="submit" :disabled="saving">{{ form.status === 'completed' ? '更新已完成成果' : '提交並標記完成' }}</button>
              <button type="button" :disabled="saving" @click="save('in_progress')">{{ form.status === 'completed' ? '撤回完成' : '儲存進行中' }}</button>
              <button v-if="form.status !== 'not_started'" type="button" :disabled="saving" @click="save('not_started')">改為未開始</button>
            </div>
          </form>
        </aside>
      </div>

      <nav class="learning-detail__navigation" aria-label="學習節點導覽">
        <RouterLink v-if="previous" :to="`/learning/${previous.id}`">← 第 {{ previous.week }} 週</RouterLink>
        <span v-else></span>
        <RouterLink v-if="next" :to="`/learning/${next.id}`">第 {{ next.week }} 週 →</RouterLink>
      </nav>
    </template>
  </main>
</template>

<style scoped lang="scss">
.learning-detail {
  max-width: 1180px; margin: 0 auto; padding-bottom: 48px;
  &__back { display: inline-block; margin-bottom: 18px; color: var(--color-accent); text-decoration: none; }
  &__message { padding: 24px; color: var(--color-text-muted); }
  &__header { margin-bottom: 24px; }
  &__header p { color: var(--color-accent); font-size: 13px; font-weight: 700; }
  &__header h1 { margin: 8px 0; font-size: clamp(24px, 3vw, 32px); }
  &__status { color: var(--color-text-muted); font-size: 13px; }
  &__prerequisite { margin-top: 10px; color: var(--color-text-muted) !important; font-size: 13px !important; font-weight: 400 !important; }
  &__grid { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(300px, 1fr); align-items: start; gap: 20px; }
  &__content, &__submission { border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-bg-card); padding: clamp(18px, 3vw, 28px); }
  &__content section + section { margin-top: 30px; padding-top: 26px; border-top: 1px solid var(--color-border); }
  h2 { margin-bottom: 12px; font-size: 18px; }
  p, li { line-height: 1.75; }
  ol, ul { padding-left: 22px; }
  li + li { margin-top: 8px; }
  &__example { margin-top: 14px; padding: 14px; border-radius: var(--radius-sm); background: var(--color-bg-hover); line-height: 1.7; }
  &__resources a, &__links a { color: var(--color-accent); }
  &__submission > p { color: var(--color-text-muted); font-size: 13px; }
  form { display: flex; flex-direction: column; margin-top: 20px; }
  label { margin: 15px 0 7px; font-size: 13px; font-weight: 700; }
  textarea, input, select { width: 100%; min-width: 0; padding: 10px 12px; border: 1px solid var(--color-border); border-radius: var(--radius-sm); background: var(--color-bg-primary); color: var(--color-text-primary); font: inherit; }
  textarea { resize: vertical; }
  &__links { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 12px; font-size: 13px; }
  &__error { margin-top: 14px; color: var(--color-down); }
  &__success { margin-top: 14px; color: var(--color-accent); }
  &__actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 20px; }
  &__actions button { padding: 9px 13px; border: 1px solid var(--color-accent); border-radius: var(--radius-sm); color: var(--color-accent); cursor: pointer; }
  &__actions button:first-child { background: var(--color-accent); color: white; }
  &__actions button:disabled { opacity: .5; cursor: wait; }
  &__navigation { display: flex; justify-content: space-between; margin-top: 24px; }
  &__navigation a { color: var(--color-accent); }
  @media (max-width: 800px) { &__grid { grid-template-columns: 1fr; } }
}
</style>
