<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vitepress'

interface SearchResult {
  id: string
  url: string
  title: string
  excerpt: string
  category: string
  sub_results?: Array<{
    url: string
    title: string
    excerpt: string
  }>
}

interface PagefindResult {
  id: string
  data: () => Promise<{
    url: string
    meta: { title?: string }
    excerpt: string
    filters: Record<string, string[]>
    sub_results?: Array<{
      url: string
      title: string
      excerpt: string
    }>
  }>
}

const isOpen = ref(false)
const query = ref('')
const activeIndex = ref(0)
const activeCategory = ref('All')
const results = ref<SearchResult[]>([])
const categories = ref<string[]>([])
const recentSearches = ref<string[]>([])
const inputRef = ref<HTMLInputElement | null>(null)
const resultsRef = ref<HTMLElement | null>(null)
const isProduction = import.meta.env.PROD
const isLoading = ref(false)

let pagefind: any = null
let debounceTimer: ReturnType<typeof setTimeout> | null = null

const router = useRouter()

const RECENT_KEY = 'sniper-recent-searches'
const MAX_RECENT = 5

function loadRecent() {
  try {
    const stored = localStorage.getItem(RECENT_KEY)
    if (stored) recentSearches.value = JSON.parse(stored)
  } catch {}
}

function saveRecent(q: string) {
  const trimmed = q.trim()
  if (!trimmed) return
  recentSearches.value = [
    trimmed,
    ...recentSearches.value.filter((s) => s !== trimmed),
  ].slice(0, MAX_RECENT)
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(recentSearches.value))
  } catch {}
}

const categoryColors: Record<string, string> = {
  Guide: '#6366f1',
  Commands: '#8b5cf6',
  Personas: '#10b981',
  Teams: '#f59e0b',
  Templates: '#f97316',
  Checklists: '#ef4444',
  Workflows: '#3b82f6',
}

const displayResults = computed(() => {
  if (activeCategory.value === 'All') return results.value
  return results.value.filter((r) => r.category === activeCategory.value)
})

const selectedResult = computed(() => {
  return displayResults.value[activeIndex.value] ?? null
})

watch(query, (val) => {
  activeIndex.value = 0
  if (debounceTimer) clearTimeout(debounceTimer)
  if (!val.trim()) {
    results.value = []
    return
  }
  debounceTimer = setTimeout(() => doSearch(val), 300)
})

watch(activeCategory, () => {
  activeIndex.value = 0
})

async function initPagefind() {
  if (pagefind || !isProduction) return
  try {
    pagefind = await import(/* @vite-ignore */ '/pagefind/pagefind.js')
    await pagefind.init()
    const filters = await pagefind.filters()
    if (filters.category) {
      categories.value = Object.keys(filters.category)
    }
  } catch (e) {
    console.warn('Pagefind not available:', e)
  }
}

async function doSearch(q: string) {
  if (!pagefind) return
  isLoading.value = true
  try {
    const search = await pagefind.debouncedSearch(q)
    if (!search) return
    const loaded = await Promise.all(
      search.results.slice(0, 20).map(async (r: PagefindResult) => {
        const data = await r.data()
        return {
          id: r.id,
          url: data.url,
          title: data.meta?.title || 'Untitled',
          excerpt: data.excerpt,
          category: data.filters?.category?.[0] || 'Other',
          sub_results: data.sub_results?.slice(0, 3),
        } satisfies SearchResult
      })
    )
    results.value = loaded
  } finally {
    isLoading.value = false
  }
}

function open() {
  isOpen.value = true
  query.value = ''
  activeIndex.value = 0
  activeCategory.value = 'All'
  results.value = []
  loadRecent()
  initPagefind()
  nextTick(() => inputRef.value?.focus())
}

function close() {
  isOpen.value = false
}

function navigateTo(url: string) {
  if (query.value.trim()) saveRecent(query.value)
  close()
  router.go(url)
}

function selectActive() {
  const r = displayResults.value[activeIndex.value]
  if (r) navigateTo(r.url)
}

function useRecentSearch(q: string) {
  query.value = q
}

function handleKeydown(e: KeyboardEvent) {
  if (!isOpen.value) return

  if (e.key === 'Escape') {
    e.preventDefault()
    close()
    return
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIndex.value = Math.min(
      activeIndex.value + 1,
      displayResults.value.length - 1
    )
    scrollToActive()
    return
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value = Math.max(activeIndex.value - 1, 0)
    scrollToActive()
    return
  }
  if (e.key === 'Enter') {
    e.preventDefault()
    selectActive()
  }
}

function scrollToActive() {
  nextTick(() => {
    const el = resultsRef.value?.querySelector('.search-item.active')
    el?.scrollIntoView({ block: 'nearest' })
  })
}

function handleGlobalKeydown(e: KeyboardEvent) {
  // Cmd+K / Ctrl+K (but not Cmd+Shift+K which is CommandPalette)
  if ((e.metaKey || e.ctrlKey) && e.key === 'k' && !e.shiftKey) {
    e.preventDefault()
    if (isOpen.value) close()
    else open()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleGlobalKeydown)
  loadRecent()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleGlobalKeydown)
})
</script>

<template>
  <!-- Nav trigger button -->
  <button class="search-trigger" @click="open" aria-label="Search (Cmd+K)">
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" stroke-width="1.5"/>
      <path d="M12 12l3.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
    <span class="search-trigger-text">Search</span>
    <kbd class="search-trigger-kbd">
      <span class="kbd-meta">&#8984;</span>K
    </kbd>
  </button>

  <!-- Modal -->
  <Teleport to="body">
    <Transition name="search-modal">
      <div v-if="isOpen" class="search-overlay" @click.self="close">
        <div
          class="search-modal"
          @keydown="handleKeydown"
          role="dialog"
          aria-label="Search documentation"
          aria-modal="true"
        >
          <!-- Input -->
          <div class="search-input-wrapper">
            <svg class="search-input-icon" width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="5.5" stroke="currentColor" stroke-width="1.5"/>
              <path d="M12 12l3.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <input
              ref="inputRef"
              v-model="query"
              type="text"
              class="search-input"
              placeholder="Search documentation..."
              aria-label="Search documentation"
              autocomplete="off"
            />
            <kbd class="esc-hint">Esc</kbd>
          </div>

          <!-- Category filter chips -->
          <div v-if="categories.length > 0" class="search-categories">
            <button
              class="category-chip"
              :class="{ active: activeCategory === 'All' }"
              @click="activeCategory = 'All'"
            >
              All
            </button>
            <button
              v-for="cat in categories"
              :key="cat"
              class="category-chip"
              :class="{ active: activeCategory === cat }"
              :style="activeCategory === cat ? { backgroundColor: categoryColors[cat] || 'var(--sniper-brand)', color: '#fff' } : {}"
              @click="activeCategory = cat"
            >
              {{ cat }}
            </button>
          </div>

          <!-- Body: results + preview -->
          <div class="search-body">
            <!-- Results list -->
            <div class="search-results-panel">
              <!-- Dev mode message -->
              <div v-if="!isProduction" class="search-dev-message">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M10 6v5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  <circle cx="10" cy="14" r="1" fill="currentColor"/>
                </svg>
                <span>Search is available in production builds. Run <code>pnpm build && pnpm preview</code> to test.</span>
              </div>

              <!-- Recent searches (when no query) -->
              <div v-else-if="!query.trim() && recentSearches.length > 0" class="search-recent">
                <div class="recent-header">Recent searches</div>
                <button
                  v-for="(recent, i) in recentSearches"
                  :key="i"
                  class="recent-item"
                  @click="useRecentSearch(recent)"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M1 7a6 6 0 1 1 1.76 4.24" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                    <path d="M7 4v3l2 1.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                  </svg>
                  {{ recent }}
                </button>
              </div>

              <!-- Empty query placeholder -->
              <div v-else-if="!query.trim()" class="search-placeholder">
                Type to search documentation
              </div>

              <!-- Loading -->
              <div v-else-if="isLoading" class="search-loading">
                Searching...
              </div>

              <!-- No results -->
              <div v-else-if="displayResults.length === 0 && query.trim()" class="search-empty">
                No results for "{{ query }}"
              </div>

              <!-- Results -->
              <ul v-else ref="resultsRef" class="search-results" role="listbox">
                <li
                  v-for="(result, i) in displayResults"
                  :key="result.id"
                  class="search-item"
                  :class="{ active: i === activeIndex }"
                  role="option"
                  :aria-selected="i === activeIndex"
                  @click="navigateTo(result.url)"
                  @mouseenter="activeIndex = i"
                >
                  <div class="result-header">
                    <span class="result-title">{{ result.title }}</span>
                    <span
                      class="result-badge"
                      :style="{ backgroundColor: categoryColors[result.category] || 'var(--vp-c-bg-mute)', color: categoryColors[result.category] ? '#fff' : 'var(--vp-c-text-2)' }"
                    >
                      {{ result.category }}
                    </span>
                  </div>
                  <div class="result-excerpt" v-html="result.excerpt" />
                  <!-- Sub-results -->
                  <div v-if="result.sub_results?.length" class="result-subs">
                    <a
                      v-for="sub in result.sub_results"
                      :key="sub.url"
                      class="result-sub"
                      @click.stop="navigateTo(sub.url)"
                    >
                      <span class="sub-hash">#</span>
                      <span class="sub-title">{{ sub.title }}</span>
                    </a>
                  </div>
                </li>
              </ul>
            </div>

            <!-- Preview panel (desktop only) -->
            <div v-if="selectedResult && displayResults.length > 0" class="search-preview-panel">
              <div class="preview-title">{{ selectedResult.title }}</div>
              <span
                class="preview-badge"
                :style="{ backgroundColor: categoryColors[selectedResult.category] || 'var(--vp-c-bg-mute)', color: categoryColors[selectedResult.category] ? '#fff' : 'var(--vp-c-text-2)' }"
              >
                {{ selectedResult.category }}
              </span>
              <div class="preview-excerpt" v-html="selectedResult.excerpt" />
              <div v-if="selectedResult.sub_results?.length" class="preview-sections">
                <div class="preview-sections-label">Sections</div>
                <a
                  v-for="sub in selectedResult.sub_results"
                  :key="sub.url"
                  class="preview-section"
                  @click="navigateTo(sub.url)"
                >
                  {{ sub.title }}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ── Trigger button ── */
.search-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--sniper-radius-sm);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  cursor: pointer;
  font-size: 13px;
  font-family: inherit;
  transition: border-color var(--sniper-duration) var(--sniper-ease),
              color var(--sniper-duration) var(--sniper-ease);
}
.search-trigger:hover {
  border-color: var(--sniper-brand);
  color: var(--vp-c-text-1);
}
.search-trigger-text {
  display: none;
}
@media (min-width: 640px) {
  .search-trigger-text {
    display: inline;
  }
}
.search-trigger-kbd {
  display: none;
  font-size: 11px;
  font-family: var(--sniper-font-mono);
  padding: 1px 5px;
  border-radius: 4px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-3);
}
@media (min-width: 640px) {
  .search-trigger-kbd {
    display: inline;
  }
}
.kbd-meta {
  font-size: 13px;
}

/* ── Overlay ── */
.search-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 10vh;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

/* ── Modal ── */
.search-modal {
  width: 100%;
  max-width: 800px;
  margin: 0 16px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--sniper-radius-lg);
  box-shadow: var(--sniper-shadow-lg);
  overflow: hidden;
}

/* ── Input ── */
.search-input-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--vp-c-divider);
  flex-shrink: 0;
}
.search-input-icon {
  color: var(--vp-c-text-2);
  flex-shrink: 0;
}
.search-input {
  flex: 1;
  border: none;
  background: none;
  outline: none;
  font-size: 16px;
  color: var(--vp-c-text-1);
  font-family: var(--sniper-font-mono);
}
.search-input::placeholder {
  color: var(--vp-c-text-3);
}
.esc-hint {
  font-size: 11px;
  font-family: var(--sniper-font-mono);
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-3);
  background: var(--vp-c-bg-soft);
  flex-shrink: 0;
}

/* ── Category chips ── */
.search-categories {
  display: flex;
  gap: 6px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--vp-c-divider);
  overflow-x: auto;
  flex-shrink: 0;
}
.category-chip {
  padding: 4px 12px;
  border-radius: 9999px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--sniper-duration) var(--sniper-ease);
}
.category-chip:hover {
  border-color: var(--sniper-brand);
  color: var(--vp-c-text-1);
}
.category-chip.active {
  border-color: transparent;
  background: var(--sniper-brand);
  color: #fff;
}

/* ── Body (results + preview) ── */
.search-body {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* ── Results panel ── */
.search-results-panel {
  flex: 1;
  overflow-y: auto;
  min-width: 0;
}

.search-results {
  list-style: none;
  padding: 8px;
  margin: 0;
}

.search-item {
  padding: 10px 12px;
  border-radius: var(--sniper-radius-sm);
  cursor: pointer;
  transition: background var(--sniper-duration) var(--sniper-ease);
}
.search-item:hover,
.search-item.active {
  background: var(--vp-c-bg-soft);
}

.result-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.result-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}
.result-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 1px 7px;
  border-radius: 9999px;
  flex-shrink: 0;
}

.result-excerpt {
  font-size: 13px;
  color: var(--vp-c-text-2);
  line-height: 1.5;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.result-excerpt :deep(mark) {
  background: color-mix(in srgb, var(--sniper-brand) 25%, transparent);
  color: inherit;
  border-radius: 2px;
}

.result-subs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}
.result-sub {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--vp-c-bg-mute);
  font-size: 11px;
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: color var(--sniper-duration) var(--sniper-ease);
}
.result-sub:hover {
  color: var(--sniper-brand);
}
.sub-hash {
  color: var(--sniper-brand);
  font-family: var(--sniper-font-mono);
  font-weight: 600;
}

/* ── Preview panel ── */
.search-preview-panel {
  display: none;
  width: 300px;
  flex-shrink: 0;
  border-left: 1px solid var(--vp-c-divider);
  padding: 16px;
  overflow-y: auto;
}
@media (min-width: 768px) {
  .search-preview-panel {
    display: block;
  }
}
.preview-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--vp-c-text-1);
  margin-bottom: 8px;
}
.preview-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 9999px;
  margin-bottom: 12px;
}
.preview-excerpt {
  font-size: 13px;
  color: var(--vp-c-text-2);
  line-height: 1.6;
}
.preview-excerpt :deep(mark) {
  background: color-mix(in srgb, var(--sniper-brand) 25%, transparent);
  color: inherit;
  border-radius: 2px;
}
.preview-sections {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--vp-c-divider);
}
.preview-sections-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--vp-c-text-3);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}
.preview-section {
  display: block;
  padding: 4px 0;
  font-size: 13px;
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: color var(--sniper-duration) var(--sniper-ease);
}
.preview-section:hover {
  color: var(--sniper-brand);
}

/* ── States ── */
.search-dev-message,
.search-placeholder,
.search-loading,
.search-empty {
  padding: 32px 16px;
  text-align: center;
  font-size: 14px;
  color: var(--vp-c-text-2);
}
.search-dev-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.search-dev-message code {
  font-family: var(--sniper-font-mono);
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--vp-c-bg-soft);
}

.search-recent {
  padding: 8px;
}
.recent-header {
  padding: 8px 12px 4px;
  font-size: 11px;
  font-weight: 600;
  color: var(--vp-c-text-3);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.recent-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: none;
  border-radius: var(--sniper-radius-sm);
  font-size: 14px;
  color: var(--vp-c-text-2);
  cursor: pointer;
  text-align: left;
  transition: background var(--sniper-duration) var(--sniper-ease);
}
.recent-item:hover {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
}

/* ── Transitions ── */
.search-modal-enter-active {
  transition: opacity 0.15s ease;
}
.search-modal-enter-active .search-modal {
  transition: transform 0.15s var(--sniper-ease-bounce), opacity 0.15s ease;
}
.search-modal-leave-active {
  transition: opacity 0.1s ease;
}
.search-modal-leave-active .search-modal {
  transition: transform 0.1s ease, opacity 0.1s ease;
}
.search-modal-enter-from {
  opacity: 0;
}
.search-modal-enter-from .search-modal {
  opacity: 0;
  transform: scale(0.95) translateY(-8px);
}
.search-modal-leave-to {
  opacity: 0;
}
.search-modal-leave-to .search-modal {
  opacity: 0;
  transform: scale(0.97);
}

/* ── Mobile ── */
@media (max-width: 767px) {
  .search-modal {
    max-width: none;
    margin: 0;
    border-radius: 0;
    max-height: 100vh;
    height: 100vh;
  }
  .search-overlay {
    padding-top: 0;
  }
}

/* ── Reduced motion ── */
@media (prefers-reduced-motion: reduce) {
  .search-modal-enter-active,
  .search-modal-enter-active .search-modal,
  .search-modal-leave-active,
  .search-modal-leave-active .search-modal,
  .search-item,
  .category-chip,
  .search-trigger {
    transition: none;
  }
}
</style>
