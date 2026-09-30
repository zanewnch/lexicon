<script setup lang="ts">
import Button from '@/components/ui/Button.vue'
defineProps<{ label?: string; loading?: boolean; disable?: boolean; color?: string; flat?: boolean; outline?: boolean; dense?: boolean; type?: 'button' | 'submit' | 'reset' | 'a'; icon?: string; href?: string; target?: string }>()
</script>
<template><a v-if="type === 'a'" class="btn-base btn-base--secondary btn-base--md" :href="href" :target="target" rel="noopener noreferrer"><slot>{{ label }}</slot></a><Button v-else :variant="color === 'negative' ? 'danger' : flat ? 'ghost' : outline ? 'secondary' : 'primary'" :size="dense ? 'sm' : 'md'" :loading="loading" :disabled="disable" :type="type"><slot>{{ label || icon }}</slot></Button></template>
