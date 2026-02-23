/**
 * Custom container plugin for markdown-it.
 * Registers ::: sniper-pro-tip and ::: phase-note containers
 * without requiring the markdown-it-container dependency.
 */
import type MarkdownIt from 'markdown-it'
import type StateBlock from 'markdown-it/lib/rules_block/state_block.mjs'

interface ContainerDef {
  name: string
  defaultTitle: string
  cssClass: string
}

const containers: ContainerDef[] = [
  { name: 'sniper-pro-tip', defaultTitle: 'Pro Tip', cssClass: 'sniper-pro-tip' },
  { name: 'phase-note', defaultTitle: 'Phase Note', cssClass: 'sniper-phase-note' },
]

function createContainerRule(container: ContainerDef) {
  const markerStr = ':::'
  const markerLen = markerStr.length

  return function containerRule(
    state: StateBlock,
    startLine: number,
    endLine: number,
    silent: boolean,
  ): boolean {
    const pos = state.bMarks[startLine] + state.tShift[startLine]
    const max = state.eMarks[startLine]

    // Check opening marker
    if (pos + markerLen > max) return false
    const marker = state.src.slice(pos, pos + markerLen)
    if (marker !== markerStr) return false

    const info = state.src.slice(pos + markerLen, max).trim()
    if (!info.startsWith(container.name)) return false

    if (silent) return true

    const customTitle = info.slice(container.name.length).trim() || container.defaultTitle

    // Find closing marker
    let nextLine = startLine
    let hasEnding = false

    while (nextLine < endLine) {
      nextLine++
      const linePos = state.bMarks[nextLine] + state.tShift[nextLine]
      const lineMax = state.eMarks[nextLine]
      const line = state.src.slice(linePos, lineMax).trim()

      if (line === markerStr) {
        hasEnding = true
        break
      }
    }

    if (!hasEnding) return false

    const token_o = state.push(`container_${container.name}_open`, 'div', 1)
    token_o.markup = markerStr
    token_o.block = true
    token_o.info = customTitle
    token_o.map = [startLine, nextLine]

    // Parse inner content
    const oldParent = state.parentType
    const oldLineMax = state.lineMax
    state.parentType = 'reference' as any
    state.lineMax = nextLine

    // Add title token
    const titleToken = state.push('html_block', '', 0)
    titleToken.content = `<p class="sniper-callout-title">${escapeHtml(customTitle)}</p>\n`

    state.md.block.tokenize(state, startLine + 1, nextLine)

    state.parentType = oldParent
    state.lineMax = oldLineMax

    const token_c = state.push(`container_${container.name}_close`, 'div', -1)
    token_c.markup = markerStr
    token_c.block = true

    state.line = nextLine + 1

    return true
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export function containersPlugin(md: MarkdownIt) {
  for (const container of containers) {
    md.block.ruler.before('fence', `container_${container.name}`, createContainerRule(container))

    md.renderer.rules[`container_${container.name}_open`] = (tokens, idx) => {
      return `<div class="sniper-callout ${container.cssClass}">\n`
    }

    md.renderer.rules[`container_${container.name}_close`] = () => {
      return '</div>\n'
    }
  }
}
