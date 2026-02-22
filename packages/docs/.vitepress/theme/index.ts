import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import PersonaCard from './components/PersonaCard.vue'
import TeamDiagram from './components/TeamDiagram.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('PersonaCard', PersonaCard)
    app.component('TeamDiagram', TeamDiagram)
  },
} satisfies Theme
