import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'
import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { codeBlocksPlugin } from './plugins/codeBlocks'
import { containersPlugin } from './plugins/containers'

function loadSidebarData() {
  const sidebarPath = resolve(__dirname, '../generated/sidebar-data.json')
  if (existsSync(sidebarPath)) {
    return JSON.parse(readFileSync(sidebarPath, 'utf-8'))
  }
  console.warn('⚠ sidebar-data.json not found. Run "pnpm generate" first.')
  return {}
}

const generated = loadSidebarData()

export default withMermaid(defineConfig({
  title: 'SNIPER',
  description: 'AI-Powered Project Lifecycle Framework for Claude Code',
  base: '/',
  cleanUrls: true,
  ignoreDeadLinks: true, // TODO: remove once all reference pages are regenerated for v3
  sitemap: { hostname: 'https://sniperai.dev' },

  buildEnd(siteConfig) {
    execFileSync('npx', [
      'pagefind',
      '--site', siteConfig.outDir,
      '--exclude-selectors', 'div.aside,a.header-anchor,.VPNav,.VPFooter',
    ], { stdio: 'inherit' })
  },

  vite: {
    optimizeDeps: {
      include: ['mermaid'],
    },
    ssr: {
      noExternal: ['mermaid'],
    },
    build: {
      rollupOptions: {
        external: [/\/pagefind\//],
      },
    },
  },

  head: [
    ['link', { rel: 'icon', type: 'image/png', href: '/logo.png' }],
    ['link', { rel: 'apple-touch-icon', href: '/logo.png' }],
    ['meta', { name: 'theme-color', content: '#6366f1' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: 'SNIPER' }],
    ['meta', { property: 'og:image', content: 'https://sniperai.dev/og.png' }],
    ['meta', { property: 'og:image:width', content: '1200' }],
    ['meta', { property: 'og:image:height', content: '630' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:image', content: 'https://sniperai.dev/og.png' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    ['link', { href: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap', rel: 'stylesheet' }],
    ['script', { type: 'application/ld+json' }, JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'SNIPER',
      url: 'https://sniperai.dev',
      description: 'AI-Powered Project Lifecycle Framework for Claude Code',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://sniperai.dev/?q={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    })],
  ],

  transformPageData(pageData) {
    const canonicalUrl = `https://sniperai.dev/${pageData.relativePath}`
      .replace(/index\.md$/, '')
      .replace(/\.md$/, '')

    const description = pageData.frontmatter.description
      || pageData.description
      || 'AI-Powered Project Lifecycle Framework for Claude Code'

    pageData.frontmatter.head ??= []
    pageData.frontmatter.head.push(
      ['link', { rel: 'canonical', href: canonicalUrl }],
      ['meta', { property: 'og:url', content: canonicalUrl }],
      ['meta', { property: 'og:title', content: `${pageData.title} | SNIPER` }],
      ['meta', { property: 'og:description', content: description }],
      ['meta', { name: 'twitter:title', content: `${pageData.title} | SNIPER` }],
      ['meta', { name: 'twitter:description', content: description }],
    )
  },

  rewrites: {
    'generated/commands/:slug.md': 'reference/commands/:slug.md',
    'generated/personas/:layer/:slug.md': 'reference/personas/:layer/:slug.md',
    'generated/checklists/:slug.md': 'reference/checklists/:slug.md',
    'generated/templates/:slug.md': 'reference/templates/:slug.md',
    'generated/cli/:slug.md': 'reference/cli/:slug.md',
    'generated/schemas/:slug.md': 'reference/schemas/:slug.md',
    'generated/hooks/:slug.md': 'reference/hooks/:slug.md',
    'generated/config/:slug.md': 'reference/config/:slug.md',
  },

  markdown: {
    config: (md) => {
      md.use(codeBlocksPlugin)
      md.use(containersPlugin)
    },
  },

  themeConfig: {
    logo: '/logo.png',
    siteTitle: 'SNIPER',

    nav: [
      { text: 'Guide', link: '/guide/why-sniper' },
      { text: 'Reference', link: '/reference/commands/' },
      {
        text: 'GitHub',
        link: 'https://github.com/virkt25/sniper',
      },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'Why SNIPER?', link: '/guide/why-sniper' },
            { text: 'What is SNIPER?', link: '/guide/what-is-sniper' },
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Core Concepts', link: '/guide/core-concepts' },
            { text: 'Architecture', link: '/guide/architecture' },
          ],
        },
        {
          text: 'Using SNIPER',
          items: [
            { text: 'Configuration', link: '/guide/configuration' },
            { text: 'Full Lifecycle', link: '/guide/full-lifecycle' },
            { text: 'Review Gates', link: '/guide/review-gates' },
            { text: 'Headless & CI/CD', link: '/guide/headless-ci' },
            { text: 'Custom Protocols', link: '/guide/custom-protocols' },
          ],
        },
        {
          text: 'Deep Dives',
          items: [
            { text: 'Personas', link: '/guide/personas' },
            { text: 'Teams', link: '/guide/teams' },
            { text: 'Domain Packs', link: '/guide/domain-packs' },
            { text: 'Workspace Mode', link: '/guide/workspace-mode' },
            { text: 'Memory System', link: '/guide/memory' },
            { text: 'Signals & Learning', link: '/guide/signals-and-learning' },
            { text: 'Advanced Features', link: '/guide/advanced-features' },
          ],
        },
        {
          text: 'Extending',
          items: [
            { text: 'Ecosystem', link: '/guide/ecosystem' },
            { text: 'Plugin Development', link: '/guide/plugin-development' },
            { text: 'Migration from v2', link: '/guide/migration-from-v2' },
          ],
        },
        {
          text: 'Help',
          items: [
            { text: 'Troubleshooting', link: '/guide/troubleshooting' },
            { text: 'Glossary', link: '/guide/glossary' },
          ],
        },
        {
          text: 'Cheatsheets',
          items: [
            { text: 'Commands', link: '/guide/cheatsheet-commands' },
            { text: 'Teams', link: '/guide/cheatsheet-teams' },
            { text: 'Personas', link: '/guide/cheatsheet-personas' },
          ],
        },
      ],
      '/reference/': [
        {
          text: 'Commands',
          collapsed: false,
          items: [
            { text: 'Overview', link: '/reference/commands/' },
            ...(generated.commands ?? []),
          ],
        },
        {
          text: 'Personas',
          collapsed: false,
          items: [
            { text: 'Overview', link: '/reference/personas/' },
            ...(generated.personas ?? []),
          ],
        },
        {
          text: 'Checklists',
          collapsed: false,
          items: [
            { text: 'Overview', link: '/reference/checklists/' },
            ...(generated.checklists ?? []),
          ],
        },
        {
          text: 'Templates',
          collapsed: false,
          items: [
            { text: 'Overview', link: '/reference/templates/' },
            ...(generated.templates ?? []),
          ],
        },
        {
          text: 'CLI Commands',
          collapsed: true,
          items: [
            { text: 'Overview', link: '/reference/cli/' },
            ...(generated.cli ?? []),
          ],
        },
        {
          text: 'Schemas',
          collapsed: true,
          items: [
            { text: 'Overview', link: '/reference/schemas/' },
            ...(generated.schemas ?? []),
          ],
        },
        {
          text: 'Hooks',
          collapsed: true,
          items: [
            { text: 'Overview', link: '/reference/hooks/' },
            ...(generated.hooks ?? []),
          ],
        },
        {
          text: 'Configuration',
          collapsed: true,
          items: [
            ...(generated.config ?? []),
          ],
        },
      ],
    },

    editLink: {
      pattern: 'https://github.com/virkt25/sniper/edit/main/packages/docs/:path',
      text: 'Edit this page on GitHub',
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/virkt25/sniper' },
    ],
  },

  mermaid: {
    theme: 'base',
    themeVariables: {
      primaryColor: '#6366f1',
      primaryTextColor: '#fff',
      primaryBorderColor: '#4f46e5',
      lineColor: '#818cf8',
      secondaryColor: '#f97316',
      tertiaryColor: '#10b981',
      fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
    },
  },
  mermaidPlugin: {
    class: 'mermaid',
  },
}))
