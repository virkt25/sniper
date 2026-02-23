/**
 * markdown-it plugin: collapsible code blocks + line-count badges.
 *
 * Wraps code blocks with >20 lines in a collapsible container that
 * shows a "Show more / Show less" toggle and a line-count badge.
 */
import type MarkdownIt from 'markdown-it'

const LINE_THRESHOLD = 20

export function codeBlocksPlugin(md: MarkdownIt) {
  const defaultFenceRenderer = md.renderer.rules.fence!

  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    const content = token.content
    const lineCount = content.split('\n').filter((l) => l !== '' || content.endsWith('\n')).length
    // Count actual newlines for a more accurate count
    const lines = content.endsWith('\n') ? content.split('\n').length - 1 : content.split('\n').length

    // Render the original code block first
    const rendered = defaultFenceRenderer(tokens, idx, options, env, self)

    if (lines <= LINE_THRESHOLD) {
      // Just add the line-count badge
      if (lines > 1) {
        return `<div class="sniper-code-wrapper"><span class="sniper-line-badge">${lines} lines</span>${rendered}</div>`
      }
      return rendered
    }

    // Collapsible wrapper for long code blocks
    return `<div class="sniper-code-wrapper sniper-code-collapsible">` +
      `<span class="sniper-line-badge">${lines} lines</span>` +
      `<div class="sniper-code-content">${rendered}</div>` +
      `<button class="sniper-code-toggle" onclick="this.parentElement.classList.toggle('is-expanded');this.textContent=this.parentElement.classList.contains('is-expanded')?'Show less':'Show more'">Show more</button>` +
      `</div>`
  }
}
