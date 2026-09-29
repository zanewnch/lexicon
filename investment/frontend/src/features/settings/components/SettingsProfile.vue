<script setup lang="ts">
import { ref, computed } from 'vue'
import { Camera, User, Save, Trash2 } from 'lucide-vue-next'
import Card from '@/components/ui/Card.vue'
import { useProfileStore } from '@/store/profile'

const profile = useProfileStore()

const displayName = ref(profile.displayName)
const previewUrl = ref(profile.avatarUrl)
const selectedFile = ref<File | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const saving = ref(false)
const saveSuccess = ref(false)

const hasAvatar = computed(() => !!previewUrl.value)

function triggerFileInput() {
  fileInputRef.value?.click()
}

function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  selectedFile.value = file
  const reader = new FileReader()
  reader.onload = (ev) => { previewUrl.value = ev.target?.result as string }
  reader.readAsDataURL(file)
}

async function removeAvatar() {
  await profile.removeAvatar()
  previewUrl.value = ''
  selectedFile.value = null
  if (fileInputRef.value) fileInputRef.value.value = ''
}

async function save() {
  saving.value = true
  try {
    if (selectedFile.value) {
      await profile.uploadAvatar(selectedFile.value)
      previewUrl.value = profile.avatarUrl
      selectedFile.value = null
    }
    await profile.saveName(displayName.value)
    saveSuccess.value = true
    setTimeout(() => (saveSuccess.value = false), 2000)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="profile">
    <div class="profile__layout">
      <Card>
        <h2 class="section-title">頭貼</h2>
        <div class="avatar-section">
          <div class="avatar-section__preview">
            <img v-if="hasAvatar" :src="previewUrl" class="avatar-section__img" alt="大頭貼" />
            <div v-else class="avatar-section__placeholder">
              <User :size="48" stroke-width="1.5" />
            </div>
          </div>
          <div class="avatar-section__actions">
            <button class="btn btn--primary" @click="triggerFileInput">
              <Camera :size="16" />
              上傳圖片
            </button>
            <button v-if="hasAvatar" class="btn btn--danger" @click="removeAvatar">
              <Trash2 :size="16" />
              移除
            </button>
            <p class="avatar-section__hint">支援 JPG、PNG、GIF，建議 200×200 px 以上</p>
          </div>
          <input
            ref="fileInputRef"
            type="file"
            accept="image/*"
            class="avatar-section__file-input"
            @change="onFileChange"
          />
        </div>
      </Card>

      <Card>
        <h2 class="section-title">基本資訊</h2>
        <div class="form-list">
          <div class="form-row">
            <label class="form-row__label">顯示名稱</label>
            <input
              v-model="displayName"
              type="text"
              class="form-row__input"
              placeholder="輸入你的名稱"
              maxlength="30"
            />
          </div>
          <div class="form-row">
            <label class="form-row__label">電子郵件</label>
            <span class="form-row__value form-row__value--muted">zanewnch@gmail.com</span>
          </div>
        </div>
      </Card>
    </div>

    <div class="profile__footer">
      <button class="btn btn--primary btn--lg" :disabled="saving" @click="save">
        <Save :size="16" />
        <span>{{ saving ? '儲存中…' : saveSuccess ? '已儲存！' : '儲存變更' }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.profile {
  &__layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--gap-lg);

    @media (max-width: 1100px) {
      grid-template-columns: 1fr;
    }
  }

  &__footer {
    margin-top: var(--gap-lg);
    display: flex;
    justify-content: flex-end;
  }
}

.section-title {
  font-size: var(--font-size-md);
  font-weight: 700;
  margin-bottom: var(--gap-md);
  color: var(--color-text-primary);
}

// ---- Avatar ----
.avatar-section {
  display: flex;
  align-items: flex-start;
  gap: var(--gap-lg);

  &__preview {
    width: 96px;
    height: 96px;
    flex-shrink: 0;
    border-radius: 50%;
    overflow: hidden;
    background: var(--color-bg-hover);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid var(--glass-border);
  }

  &__img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__placeholder {
    color: var(--color-text-muted);
  }

  &__actions {
    display: flex;
    flex-direction: column;
    gap: var(--gap-sm);
    align-items: flex-start;
  }

  &__hint {
    font-size: 12px;
    color: var(--color-text-muted);
    margin: 0;
  }

  &__file-input {
    display: none;
  }
}

// ---- Form ----
.form-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.form-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--color-border);

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  &:first-child {
    padding-top: 0;
  }

  &__label {
    font-size: var(--font-size-base);
    font-weight: 600;
    color: var(--color-text-secondary);
    flex-shrink: 0;
    margin-right: var(--gap-md);
  }

  &__input {
    flex: 1;
    max-width: 220px;
    background: var(--color-bg-input, var(--color-bg-hover));
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: 6px 10px;
    color: var(--color-text-primary);
    font-size: var(--font-size-base);

    &:focus {
      outline: none;
      border-color: var(--color-accent);
    }
  }

  &__value {
    &--muted {
      color: var(--color-text-muted);
      font-size: var(--font-size-base);
    }
  }
}

// ---- Buttons ----
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-base);
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all var(--duration-fast);

  &--primary {
    background: var(--color-accent);
    color: #fff;

    &:hover {
      opacity: 0.85;
    }
  }

  &--danger {
    background: transparent;
    color: var(--color-error, #ef4444);
    border: 1px solid var(--color-error, #ef4444);

    &:hover {
      background: rgba(239, 68, 68, 0.08);
    }
  }

  &--lg {
    padding: 10px 20px;
    font-size: var(--font-size-md);
  }
}

// ---- Responsive ----
@media (max-width: 768px) {
  .profile {
    &__layout {
      gap: var(--gap-md);
    }

    &__title {
      font-size: var(--font-size-lg);
    }
  }

  .avatar-section {
    flex-direction: column;
    align-items: center;

    &__actions {
      align-items: center;
    }
  }
}
</style>
