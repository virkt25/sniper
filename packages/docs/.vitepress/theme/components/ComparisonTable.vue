<script setup lang="ts">
const props = defineProps<{
  columns: string[]
  rows: Array<{ feature: string; values: (boolean | string)[] }>
  highlightColumn?: number
}>()
</script>

<template>
  <div class="comparison-table-wrapper">
    <table class="comparison-table">
      <thead>
        <tr>
          <th class="feature-header">Feature</th>
          <th
            v-for="(col, i) in columns"
            :key="col"
            :class="{ highlighted: highlightColumn === i }"
          >
            {{ col }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.feature" class="table-row">
          <td class="feature-cell">{{ row.feature }}</td>
          <td
            v-for="(val, i) in row.values"
            :key="i"
            :class="{ highlighted: highlightColumn === i }"
            class="value-cell"
          >
            <template v-if="typeof val === 'boolean'">
              <svg
                v-if="val"
                class="icon-check"
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                aria-label="Yes"
              >
                <circle cx="9" cy="9" r="8" fill="#10b98120" stroke="#10b981" stroke-width="1.2"/>
                <path d="M5.5 9.5l2 2 5-5" stroke="#10b981" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <svg
                v-else
                class="icon-cross"
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                aria-label="No"
              >
                <circle cx="9" cy="9" r="8" fill="#ef444420" stroke="#ef4444" stroke-width="1.2"/>
                <path d="M6.5 6.5l5 5M11.5 6.5l-5 5" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </template>
            <span v-else class="text-value">{{ val }}</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.comparison-table-wrapper {
  overflow-x: auto;
  margin: 16px 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--sniper-radius-md);
}

.comparison-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.comparison-table thead th {
  padding: 12px 16px;
  text-align: center;
  font-weight: 600;
  font-size: 13px;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
  white-space: nowrap;
}

.comparison-table thead th.highlighted {
  background: color-mix(in srgb, var(--sniper-brand) 10%, var(--vp-c-bg-soft));
  color: var(--sniper-brand);
}

.feature-header {
  text-align: left !important;
  position: sticky;
  left: 0;
  z-index: 1;
  background: var(--vp-c-bg-soft) !important;
}

.table-row {
  transition: background var(--sniper-duration) var(--sniper-ease);
}

.table-row:hover {
  background: var(--vp-c-bg-soft);
}

.comparison-table td {
  padding: 10px 16px;
  border-bottom: 1px solid var(--vp-c-divider);
}

.feature-cell {
  font-weight: 500;
  color: var(--vp-c-text-1);
  white-space: nowrap;
  position: sticky;
  left: 0;
  background: var(--vp-c-bg);
  z-index: 1;
}

.table-row:hover .feature-cell {
  background: var(--vp-c-bg-soft);
}

.value-cell {
  text-align: center;
}

.value-cell.highlighted {
  background: color-mix(in srgb, var(--sniper-brand) 4%, transparent);
}

.table-row:hover .value-cell.highlighted {
  background: color-mix(in srgb, var(--sniper-brand) 8%, var(--vp-c-bg-soft));
}

.icon-check,
.icon-cross {
  display: inline-block;
  vertical-align: middle;
}

.text-value {
  color: var(--vp-c-text-2);
  font-size: 13px;
}

@media (prefers-reduced-motion: reduce) {
  .table-row {
    transition: none;
  }
}
</style>
