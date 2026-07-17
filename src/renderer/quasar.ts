import { createApp, type Component } from 'vue'
import {
  Quasar,
  QBadge,
  QBtn,
  QCard,
  QCardActions,
  QCardSection,
  QCheckbox,
  QDrawer,
  QForm,
  QIcon,
  QInput,
  QItem,
  QItemLabel,
  QItemSection,
  QLayout,
  QLinearProgress,
  QList,
  QOptionGroup,
  QPage,
  QPageContainer,
  QSelect,
  QSeparator
} from 'quasar'
import 'quasar/src/css/index.sass'
import '@quasar/extras/material-icons/material-icons.css'
import './shared.css'
import './quasar.css'

export function mount(component: Component): void {
  const app = createApp(component)
  app.use(Quasar, { config: { brand: { primary: '#60a5fa' } } })
  app.component('QBadge', QBadge)
  app.component('QBtn', QBtn)
  app.component('QCard', QCard)
  app.component('QCardActions', QCardActions)
  app.component('QCardSection', QCardSection)
  app.component('QCheckbox', QCheckbox)
  app.component('QDrawer', QDrawer)
  app.component('QForm', QForm)
  app.component('QIcon', QIcon)
  app.component('QInput', QInput)
  app.component('QItem', QItem)
  app.component('QItemLabel', QItemLabel)
  app.component('QItemSection', QItemSection)
  app.component('QLayout', QLayout)
  app.component('QLinearProgress', QLinearProgress)
  app.component('QList', QList)
  app.component('QOptionGroup', QOptionGroup)
  app.component('QPage', QPage)
  app.component('QPageContainer', QPageContainer)
  app.component('QSelect', QSelect)
  app.component('QSeparator', QSeparator)
  app.mount('#app')
}
