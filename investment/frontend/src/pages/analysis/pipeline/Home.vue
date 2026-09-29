<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

onMounted(() => {
  router.replace('/pipeline/step1')
})
</script>

<template>
  <div></div>
</template>
