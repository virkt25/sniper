import { defineConfig } from 'vitepress'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function loadSidebarData() {
  const sidebarPath = resolve(__dirname, '../generated/sidebar-data.json')
  if (existsSync(sidebarPath)) {
    return JSON.parse(readFileSync(sidebarPath, 'utf-8'))
  }
  console.warn('⚠ sidebar-data.json not found. Run "pnpm generate" first.')
  return {}
}

const generated = loadSidebarData()

export default defineConfig({
  title: 'SNIPER',
  description: 'AI-Powered Project Lifecycle Framework for Claude Code',
  base: '/',
  cleanUrls: true,

  head: [
    ['link', { rel: 'icon', type: 'image/png', href: '/logo.png' }],
  ],

  rewrites: {
    'generated/commands/:slug.md': 'reference/commands/:slug.md',
    'generated/personas/:layer/:slug.md': 'reference/personas/:layer/:slug.md',
    'generated/teams/:slug.md': 'reference/teams/:slug.md',
    'generated/checklists/:slug.md': 'reference/checklists/:slug.md',
    'generated/templates/:slug.md': 'reference/templates/:slug.md',
    'generated/workflows/:slug.md': 'reference/workflows/:slug.md',
  },

  themeConfig: {
    logo: '/logo.png',
    siteTitle: 'SNIPER',

    nav: [
      { text: 'Guide', link: '/guide/what-is-sniper' },
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
            { text: 'What is SNIPER?', link: '/guide/what-is-sniper' },
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Core Concepts', link: '/guide/core-concepts' },
          ],
        },
        {
          text: 'Using SNIPER',
          items: [
            { text: 'Configuration', link: '/guide/configuration' },
            { text: 'Full Lifecycle', link: '/guide/full-lifecycle' },
            { text: 'Review Gates', link: '/guide/review-gates' },
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
          text: 'Teams',
          collapsed: false,
          items: [
            { text: 'Overview', link: '/reference/teams/' },
            ...(generated.teams ?? []),
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
          text: 'Workflows',
          collapsed: false,
          items: [
            { text: 'Overview', link: '/reference/workflows/' },
            ...(generated.workflows ?? []),
          ],
        },
      ],
    },

    search: {
      provider: 'local',
    },

    editLink: {
      pattern: 'https://github.com/virkt25/sniper/edit/main/packages/docs/:path',
      text: 'Edit this page on GitHub',
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/virkt25/sniper' },
    ],
  },
})
