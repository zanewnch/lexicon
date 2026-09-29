<script setup lang="ts">
/**
 * NotesView — Markdown 筆記專區頁面
 *
 * 双欄布局（左側小板與右側內容區）的筆記專區。
 *
 * **功能包含**：
 * - 筆記列表（左側）：搜尋、類別筛選、置頂排序
 * - 筆記內容頁（右側）：內建 Markdown 渲染器
 *   - 支援：標題(##/###)、粗體、斜體、程式碼、清單、分隔線
 *   - Markdown 小鏈接 `[text](/path)` 跳轉路由
 * - 筆記 CRUD：建立 / 編輯 / 刪除 / 置頂<br/>
 * - 類別：學習概念 / 選股策略 / 產業研究 / 個股筆記 / 操盤日誌 / 其他
 *
 * 資料來源：`/notes/` API，支援完整 CRUD。
 */
import { ref, computed, nextTick, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Note, NoteCategory } from '@/types/notes'
import api from '@/api'

const router = useRouter()
const route = useRoute()

// ---- State ----

const notes = ref<Note[]>([])
const selectedId = ref<string | null>(null)

onMounted(async () => {
  const { data } = await api.get<Note[]>('/notes/')
  notes.value = data
  selectFromRoute()
})
watch(() => route.query.note, selectFromRoute)
const searchQuery = ref('')
const activeCategory = ref<NoteCategory | null>(null)
const isEditing = ref(false)
const editTitle = ref('')
const editContent = ref('')
const editCategory = ref<NoteCategory>('其他')
const editTags = ref('')
const editorRef = ref<HTMLTextAreaElement | null>(null)

const CATEGORIES: NoteCategory[] = ['學習概念', '選股策略', '產業研究', '個股筆記', '操盤日誌', '其他']

const CATEGORY_COLORS: Record<NoteCategory, string> = {
  '學習概念': 'teal',
  '選股策略': 'accent',
  '產業研究': 'teal',
  '個股筆記': 'amber',
  '操盤日誌': 'purple',
  '其他': 'gray',
}

// ---- Computed ----

const filteredNotes = computed(() => {
  let list = notes.value
  if (activeCategory.value) {
    list = list.filter(n => n.category === activeCategory.value)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(n =>
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q) ||
      n.tags.some(t => t.toLowerCase().includes(q)),
    )
  }
  return [...list].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })
})

const selectedNote = computed(() => notes.value.find(n => n.id === selectedId.value) ?? null)

const renderedContent = computed(() => {
  if (!selectedNote.value) return ''
  return renderMarkdown(selectedNote.value.content)
})

// ---- Markdown Renderer (lightweight) ----

function renderMarkdown(text: string): string {
  const lines = text.split('\n')
  const result: string[] = []
  let inList = false

  for (const line of lines) {

    // Headings
    if (line.startsWith('## ')) {
      if (inList) { result.push('</ul>'); inList = false }
      result.push(`<h2>${escapeHtml(line.slice(3))}</h2>`)
      continue
    }
    if (line.startsWith('### ')) {
      if (inList) { result.push('</ul>'); inList = false }
      result.push(`<h3>${escapeHtml(line.slice(4))}</h3>`)
      continue
    }

    // Horizontal rule
    if (line.trim() === '---') {
      if (inList) { result.push('</ul>'); inList = false }
      result.push('<hr />')
      continue
    }

    // Bullet list
    if (line.startsWith('- ')) {
      if (!inList) { result.push('<ul>'); inList = true }
      result.push(`<li>${inlineMarkdown(line.slice(2))}</li>`)
      continue
    }

    // Close list
    if (inList && line.trim() === '') {
      result.push('</ul>')
      inList = false
      result.push('<br />')
      continue
    }

    // Empty line -> paragraph break
    if (line.trim() === '') {
      result.push('<br />')
      continue
    }

    result.push(`<p>${inlineMarkdown(line)}</p>`)
  }

  if (inList) result.push('</ul>')
  return result.join('\n')
}

function inlineMarkdown(text: string): string {
  text = escapeHtml(text)
  // Links [text](/path) → in-app nav button
  text = text.replace(/\[([^\]]+)\]\((\/.+?)\)/g,
    '<a class="notes__nav-btn" data-route="$2">$1 →</a>')
  // Bold **text**
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  // Italic *text*
  text = text.replace(/\*(.+?)\*/g, '<em>$1</em>')
  // Inline code `code`
  text = text.replace(/`(.+?)`/g, '<code>$1</code>')
  return text
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// ---- Actions ----

function selectNote(id: string) {
  if (isEditing.value) return
  selectedId.value = id
  router.replace({ path: route.path, query: { ...route.query, note: id } })
}

function selectFromRoute() {
  const noteId = typeof route.query.note === 'string' ? route.query.note : null
  selectedId.value = notes.value.find(note => note.id === noteId)?.id ?? notes.value[0]?.id ?? null
}

const CONCEPT_TEMPLATE = `## 今天要弄懂

## 概念

## 具體例子

## 容易搞混的地方

## 我自己的理解

## 還有什麼不懂
`

function startNew(kind: 'blank' | 'concept' = 'blank') {
  isEditing.value = true
  selectedId.value = null
  editTitle.value = ''
  editContent.value = kind === 'concept' ? CONCEPT_TEMPLATE : ''
  editCategory.value = kind === 'concept' ? '學習概念' : '其他'
  editTags.value = ''
  nextTick(() => editorRef.value?.focus())
}

function startEdit() {
  if (!selectedNote.value) return
  isEditing.value = true
  editTitle.value = selectedNote.value.title
  editContent.value = selectedNote.value.content
  editCategory.value = selectedNote.value.category
  editTags.value = selectedNote.value.tags.join(', ')
  nextTick(() => editorRef.value?.focus())
}

function cancelEdit() {
  isEditing.value = false
  if (!selectedId.value) selectFromRoute()
}

async function saveEdit() {
  const tags = editTags.value.split(',').map(t => t.trim()).filter(Boolean)

  if (selectedId.value) {
    const note = notes.value.find(n => n.id === selectedId.value)
    if (!note) return
    const { data } = await api.put<Note>(`/notes/${selectedId.value}/`, {
      ...note,
      title: editTitle.value || '無標題',
      content: editContent.value,
      category: editCategory.value,
      tags,
    })
    const idx = notes.value.findIndex(n => n.id === selectedId.value)
    if (idx !== -1) notes.value[idx] = data
  } else {
    const { data } = await api.post<Note>('/notes/', {
      title: editTitle.value || '無標題',
      content: editContent.value,
      category: editCategory.value,
      tags,
      pinned: false,
    })
    notes.value.unshift(data)
    selectedId.value = data.id
    router.replace({ path: route.path, query: { ...route.query, note: data.id } })
  }

  isEditing.value = false
}

async function deleteNote() {
  if (!selectedNote.value) return
  if (!confirm(`確定要刪除「${selectedNote.value.title}」？`)) return
  await api.delete(`/notes/${selectedId.value}/`)
  notes.value = notes.value.filter(n => n.id !== selectedId.value)
  selectedId.value = filteredNotes.value[0]?.id ?? null
  router.replace({ path: route.path, query: { ...route.query, note: selectedId.value ?? undefined } })
}

async function togglePin() {
  if (!selectedNote.value) return
  const idx = notes.value.findIndex(n => n.id === selectedId.value)
  if (idx === -1) return
  const { data } = await api.put<Note>(`/notes/${selectedId.value}/`, {
    ...notes.value[idx],
    pinned: !notes.value[idx]!.pinned,
  })
  notes.value[idx] = data
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function categoryColor(cat: NoteCategory) {
  return CATEGORY_COLORS[cat] ?? 'gray'
}

function handleBodyClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (target.classList.contains('notes__nav-btn')) {
    e.preventDefault()
    const route = target.dataset.route
    if (route) router.push(route)
  }
}
</script>

<template>
  <div class="notes">
    <!-- Sidebar: list -->
    <aside class="notes__sidebar">
      <div class="notes__sidebar-header">
        <h1 class="notes__title">筆記專區</h1>
        <div class="notes__sidebar-actions">
          <button class="notes__btn-new" @click="startNew('concept')">+ 概念</button>
          <button class="notes__btn-new" @click="startNew()">+ 新增</button>
        </div>
      </div>

      <input
        v-model="searchQuery"
        class="notes__search"
        type="text"
        placeholder="搜尋筆記..."
      />

      <div class="notes__cats">
        <button
          class="notes__cat"
          :class="{ 'notes__cat--active': activeCategory === null }"
          @click="activeCategory = null"
        >全部</button>
        <button
          v-for="cat in CATEGORIES"
          :key="cat"
          class="notes__cat"
          :class="{ 'notes__cat--active': activeCategory === cat }"
          @click="activeCategory = activeCategory === cat ? null : cat"
        >{{ cat }}</button>
      </div>

      <ul class="notes__list">
        <li
          v-for="note in filteredNotes"
          :key="note.id"
          class="notes__item"
          :class="{ 'notes__item--active': selectedId === note.id }"
          @click="selectNote(note.id)"
        >
          <div class="notes__item-top">
            <span class="notes__item-pin" v-if="note.pinned">📌</span>
            <span class="notes__item-title">{{ note.title }}</span>
          </div>
          <div class="notes__item-meta">
            <span
              class="notes__item-cat"
              :class="`notes__item-cat--${categoryColor(note.category)}`"
            >{{ note.category }}</span>
            <span class="notes__item-date">{{ formatDate(note.updatedAt) }}</span>
          </div>
          <p class="notes__item-preview">{{ note.content.replace(/[#\-*`]/g, '').slice(0, 60) }}…</p>
        </li>
        <li v-if="filteredNotes.length === 0" class="notes__empty-list">
          沒有符合的筆記
        </li>
      </ul>
    </aside>

    <!-- Main: detail / editor -->
    <div class="notes__main">
      <!-- Editor Mode -->
      <template v-if="isEditing">
        <div class="notes__editor">
          <div class="notes__editor-toolbar">
            <input
              v-model="editTitle"
              class="notes__editor-title-input"
              type="text"
              placeholder="筆記標題..."
            />
            <div class="notes__editor-actions">
              <button class="notes__btn notes__btn--ghost" @click="cancelEdit">取消</button>
              <button class="notes__btn notes__btn--primary" @click="saveEdit">儲存</button>
            </div>
          </div>

          <div class="notes__editor-meta-row">
            <select v-model="editCategory" class="notes__select">
              <option v-for="cat in CATEGORIES" :key="cat" :value="cat">{{ cat }}</option>
            </select>
            <input
              v-model="editTags"
              class="notes__tag-input"
              type="text"
              placeholder="標籤（逗號分隔，如：AI, 半導體）"
            />
          </div>

          <textarea
            ref="editorRef"
            v-model="editContent"
            class="notes__editor-body"
            placeholder="開始記錄你的想法...

支援 Markdown 語法：
## 大標題
**粗體**  *斜體*  `程式碼`
- 清單項目
---（分隔線）"
          />
        </div>
      </template>

      <!-- View Mode -->
      <template v-else-if="selectedNote">
        <div class="notes__detail">
          <div class="notes__detail-header">
            <div class="notes__detail-title-row">
              <span class="notes__detail-pin" v-if="selectedNote.pinned">📌</span>
              <h2 class="notes__detail-title">{{ selectedNote.title }}</h2>
            </div>
            <div class="notes__detail-actions">
              <button
                class="notes__btn notes__btn--ghost notes__btn--icon"
                :title="selectedNote.pinned ? '取消固定' : '固定置頂'"
                @click="togglePin"
              >{{ selectedNote.pinned ? '📌' : '📍' }}</button>
              <button class="notes__btn notes__btn--ghost" @click="startEdit">編輯</button>
              <button class="notes__btn notes__btn--danger" @click="deleteNote">刪除</button>
            </div>
          </div>

          <div class="notes__detail-meta">
            <span
              class="notes__item-cat"
              :class="`notes__item-cat--${categoryColor(selectedNote.category)}`"
            >{{ selectedNote.category }}</span>
            <span
              v-for="tag in selectedNote.tags"
              :key="tag"
              class="notes__tag"
            >#{{ tag }}</span>
            <span class="notes__detail-date">更新於 {{ formatDate(selectedNote.updatedAt) }}</span>
          </div>

          <div class="notes__detail-body" v-html="renderedContent" @click="handleBodyClick" />
        </div>
      </template>

      <!-- Empty -->
      <template v-else>
        <div class="notes__placeholder">
          <div class="notes__placeholder-icon">📝</div>
          <p class="notes__placeholder-text">選擇左側筆記，或點擊「+ 新增」建立第一篇筆記</p>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
.notes {
  display: flex;
  height: calc(100vh - var(--header-height) - 48px);
  gap: 0;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;

  // ---- Sidebar ----

  &__sidebar {
    width: 280px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--color-border);
    background: var(--color-bg-secondary);
    overflow: hidden;
  }

  &__sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 16px 12px;
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
  }

  &__title {
    font-size: 16px;
    font-weight: 700;
  }

  &__sidebar-actions {
    display: flex;
    gap: 6px;
  }

  &__btn-new {
    font-size: 12px;
    font-weight: 600;
    padding: 5px 10px;
    border-radius: var(--radius-sm);
    background: var(--color-accent-soft);
    color: var(--color-accent);
    border: none;
    cursor: pointer;
    transition: background 0.15s;

    &:hover {
      background: var(--color-accent);
      color: #fff;
    }
  }

  &__search {
    margin: 10px 12px 8px;
    padding: 8px 12px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-bg-card);
    color: var(--color-text-primary);
    font-size: 13px;
    outline: none;
    flex-shrink: 0;

    &:focus {
      border-color: var(--color-accent);
    }

    &::placeholder {
      color: var(--color-text-muted);
    }
  }

  &__cats {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    padding: 0 12px 10px;
    flex-shrink: 0;
  }

  &__cat {
    font-size: 11px;
    font-weight: 500;
    padding: 3px 8px;
    border-radius: 10px;
    color: var(--color-text-muted);
    border: 1px solid var(--color-border);
    background: transparent;
    cursor: pointer;
    transition: all 0.15s;

    &:hover {
      background: var(--color-bg-hover);
      color: var(--color-text-primary);
    }

    &--active {
      background: var(--color-accent-soft);
      color: var(--color-accent);
      border-color: var(--color-accent);
    }
  }

  &__list {
    list-style: none;
    overflow-y: auto;
    flex: 1;
    padding: 4px 8px 12px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__item {
    padding: 10px 10px 8px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: background 0.12s;
    border: 1px solid transparent;

    &:hover {
      background: var(--color-bg-hover);
    }

    &--active {
      background: var(--color-accent-soft);
      border-color: var(--color-accent);
    }

    &-top {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-bottom: 4px;
    }

    &-pin {
      font-size: 11px;
    }

    &-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--color-text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    &-meta {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;
    }

    &-cat {
      font-size: 10px;
      font-weight: 600;
      padding: 1px 6px;
      border-radius: 3px;

      &--accent { background: var(--color-accent-soft); color: var(--color-accent); }
      &--teal   { background: #0d3d3d; color: #2dd4bf; }
      &--amber  { background: #3d2e0d; color: #fbbf24; }
      &--purple { background: #2e0d3d; color: #c084fc; }
      &--gray   { background: var(--color-bg-hover); color: var(--color-text-muted); }
    }

    &-date {
      font-size: 11px;
      color: var(--color-text-muted);
      margin-left: auto;
    }

    &-preview {
      font-size: 12px;
      color: var(--color-text-muted);
      line-height: 1.5;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
  }

  &__empty-list {
    padding: 32px;
    text-align: center;
    font-size: 13px;
    color: var(--color-text-muted);
  }

  // ---- Main Panel ----

  &__main {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  // ---- Detail View ----

  &__detail {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    &-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px 12px;
      border-bottom: 1px solid var(--color-border);
      flex-shrink: 0;
    }

    &-title-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    &-pin {
      font-size: 16px;
    }

    &-title {
      font-size: 20px;
      font-weight: 700;
    }

    &-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    &-meta {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      padding: 10px 24px;
      border-bottom: 1px solid var(--color-border);
      flex-shrink: 0;
    }

    &-date {
      font-size: 12px;
      color: var(--color-text-muted);
      margin-left: auto;
    }

    &-body {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
      font-size: 14px;
      line-height: 1.8;
      color: var(--color-text-secondary);

      :deep(h2) {
        font-size: 17px;
        font-weight: 700;
        color: var(--color-text-primary);
        margin: 24px 0 12px;
        padding-bottom: 6px;
        border-bottom: 1px solid var(--color-border);

        &:first-child { margin-top: 0; }
      }

      :deep(h3) {
        font-size: 15px;
        font-weight: 600;
        color: var(--color-text-primary);
        margin: 18px 0 8px;
      }

      :deep(p) {
        margin: 0 0 2px;
      }

      :deep(strong) {
        color: var(--color-text-primary);
        font-weight: 600;
      }

      :deep(em) {
        color: var(--color-accent);
        font-style: normal;
      }

      :deep(code) {
        font-family: 'Fira Code', monospace;
        font-size: 12px;
        background: var(--color-bg-hover);
        border-radius: 3px;
        padding: 1px 5px;
        color: var(--color-accent);
      }

      :deep(ul) {
        padding-left: 20px;
        margin: 8px 0 12px;

        li {
          margin-bottom: 4px;
          line-height: 1.7;
        }
      }

      :deep(hr) {
        border: none;
        border-top: 1px solid var(--color-border);
        margin: 20px 0;
      }

      :deep(.notes__nav-btn) {
        display: inline-block;
        font-size: 11px;
        font-weight: 600;
        padding: 3px 10px;
        margin: 2px 4px 2px 0;
        border-radius: 10px;
        background: var(--color-accent-soft);
        color: var(--color-accent);
        text-decoration: none;
        cursor: pointer;
        transition: all 0.15s;

        &:hover {
          background: var(--color-accent);
          color: #fff;
        }
      }
    }
  }

  // ---- Tags ----

  &__tag {
    font-size: 11px;
    padding: 2px 7px;
    border-radius: 10px;
    background: var(--color-bg-hover);
    color: var(--color-text-muted);
  }

  // ---- Buttons ----

  &__btn {
    font-size: 13px;
    font-weight: 500;
    padding: 6px 14px;
    border-radius: var(--radius-sm);
    border: none;
    cursor: pointer;
    transition: all 0.15s;

    &--primary {
      background: var(--color-accent);
      color: #fff;

      &:hover { opacity: 0.9; }
    }

    &--ghost {
      background: transparent;
      color: var(--color-text-secondary);
      border: 1px solid var(--color-border);

      &:hover {
        background: var(--color-bg-hover);
        color: var(--color-text-primary);
      }
    }

    &--danger {
      background: transparent;
      color: var(--color-down);
      border: 1px solid var(--color-down);

      &:hover {
        background: rgba(239, 68, 68, 0.1);
      }
    }

    &--icon {
      padding: 6px 8px;
      font-size: 14px;
    }
  }

  // ---- Editor ----

  &__editor {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    &-toolbar {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      border-bottom: 1px solid var(--color-border);
      flex-shrink: 0;
    }

    &-title-input {
      flex: 1;
      font-size: 18px;
      font-weight: 700;
      background: transparent;
      border: none;
      color: var(--color-text-primary);
      outline: none;
      padding: 0;

      &::placeholder {
        color: var(--color-text-muted);
        font-weight: 400;
      }
    }

    &-actions {
      display: flex;
      gap: 8px;
      flex-shrink: 0;
    }

    &-meta-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 20px;
      border-bottom: 1px solid var(--color-border);
      flex-shrink: 0;
    }

    &-body {
      flex: 1;
      padding: 20px;
      background: transparent;
      border: none;
      color: var(--color-text-secondary);
      font-size: 14px;
      font-family: 'Fira Code', 'Consolas', monospace;
      line-height: 1.9;
      outline: none;
      resize: none;

      &::placeholder {
        color: var(--color-text-muted);
        font-family: inherit;
      }
    }
  }

  &__select {
    padding: 6px 10px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-bg-card);
    color: var(--color-text-primary);
    font-size: 13px;
    outline: none;
    cursor: pointer;

    &:focus {
      border-color: var(--color-accent);
    }
  }

  &__tag-input {
    flex: 1;
    padding: 6px 10px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-bg-card);
    color: var(--color-text-primary);
    font-size: 13px;
    outline: none;

    &:focus {
      border-color: var(--color-accent);
    }

    &::placeholder {
      color: var(--color-text-muted);
    }
  }

  // ---- Placeholder ----

  &__placeholder {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;

    &-icon {
      font-size: 48px;
      opacity: 0.4;
    }

    &-text {
      font-size: 14px;
      color: var(--color-text-muted);
    }
  }
}
</style>
