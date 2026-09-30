import { defineComponent, h, type Component } from 'vue'
import Card from '@/components/ui/Card.vue'
export { default as EnglishInput } from './EnglishInput.vue'
export { default as EnglishSelect } from './EnglishSelect.vue'
export { default as EnglishButton } from './EnglishButton.vue'
export { default as EnglishChoice } from './EnglishChoice.vue'
export { default as EnglishDialog } from './EnglishDialog.vue'

function block(name: string, tag: string | Component = 'div', extra: Record<string, unknown> = {}) {
  return defineComponent({ name: 'English' + name, inheritAttrs: false, setup: (_props, { attrs, slots }) => () => h(tag, { ...attrs, class: ['english-ui__' + name, attrs.class], ...extra }, typeof tag === 'string' ? slots.default?.() : slots) })
}
export const EnglishCard = block('card', Card, { hoverable: false, padding: '0' })
export const EnglishSection = block('section')
export const EnglishActions = block('actions')
export const EnglishForm = block('form', 'form')
export const EnglishBanner = block('banner')
export const EnglishList = block('list')
export const EnglishItemSection = block('item-section')
export const EnglishItemLabel = block('item-label')
export const EnglishSeparator = block('separator', 'hr')
export const EnglishItem = defineComponent({ inheritAttrs: false, props: { clickable: Boolean, active: Boolean }, setup: (props, { slots, attrs }) => () => h(props.clickable ? 'button' : 'div', { ...attrs, type: props.clickable ? 'button' : undefined, class: ['english-ui__item', { 'english-ui__item--active': props.active }, attrs.class] }, slots.default?.()) })
export const EnglishBadge = defineComponent({ props: { label: String, color: String }, setup: (props, { slots }) => () => h('span', { class: 'english-ui__badge', 'data-color': props.color }, slots.default?.() ?? props.label) })
export const EnglishChip = EnglishBadge
export const EnglishProgress = defineComponent({ props: { value: { type: Number, default: 0 } }, setup: (props) => () => h('progress', { class: 'english-ui__progress', max: 1, value: props.value }) })
export const EnglishIcon = defineComponent({ props: { name: String }, setup: (props) => () => h('span', { class: 'english-ui__icon', 'aria-hidden': true }, ({ check_circle: '✓', lock: '🔒', star: '★', play_arrow: '▶', pause: 'Ⅱ', school: '◇', volume_up: '♪' } as Record<string, string>)[props.name ?? ''] ?? '•') })
export const EnglishTooltip = block('tooltip', 'span', { role: 'tooltip' })
