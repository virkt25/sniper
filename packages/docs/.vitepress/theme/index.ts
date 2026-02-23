import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import { useData } from 'vitepress'
import { nextTick, provide } from 'vue'
import PersonaCard from './components/PersonaCard.vue'
import TeamDiagram from './components/TeamDiagram.vue'
import Layout from './components/Layout.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component('PersonaCard', PersonaCard)
    app.component('TeamDiagram', TeamDiagram)
  },
  setup() {
    const { isDark } = useData()

    const enableTransitions = () =>
      'startViewTransition' in document &&
      window.matchMedia('(prefers-reduced-motion: no-preference)').matches

    provide('toggle-appearance', async ({ clientX: x, clientY: y }: MouseEvent) => {
      if (!enableTransitions()) {
        isDark.value = !isDark.value
        return
      }

      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${Math.hypot(
          Math.max(x, innerWidth - x),
          Math.max(y, innerHeight - y)
        )}px at ${x}px ${y}px)`,
      ]

      // @ts-expect-error View Transitions API
      await document.startViewTransition(async () => {
        isDark.value = !isDark.value
        await nextTick()
      }).ready

      document.documentElement.animate(
        { clipPath: isDark.value ? clipPath.reverse() : clipPath },
        {
          duration: 400,
          easing: 'ease-in',
          pseudoElement: `::view-transition-${isDark.value ? 'old' : 'new'}(root)`,
        }
      )
    })
  },
} satisfies Theme
