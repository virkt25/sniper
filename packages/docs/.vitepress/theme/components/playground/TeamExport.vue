<script setup lang="ts">
import { computed } from 'vue'
import CopyButton from './CopyButton.vue'
import type { PlaygroundTeam } from './usePlaygroundData'

const props = defineProps<{
  team: PlaygroundTeam
  disabledMembers: Set<string>
}>()

const yamlOutput = computed(() => {
  const t = props.team
  const activeMembers = t.members.filter((m) => !props.disabledMembers.has(m.name))

  const lines: string[] = [
    `team_name: ${t.name}`,
    `phase: ${t.phase}`,
    '',
    'teammates:',
  ]

  for (const member of activeMembers) {
    lines.push(`  - name: ${member.name}`)
    lines.push('    compose:')
    for (const layer of ['process', 'technical', 'cognitive', 'domain']) {
      const val = member.compose[layer]
      lines.push(`      ${layer}: ${val ?? 'null'}`)
    }

    // Add tasks for this member
    const memberTasks = t.tasks.filter((task) => task.member === member.name)
    if (memberTasks.length > 0) {
      lines.push('    tasks:')
      for (const task of memberTasks) {
        lines.push(`      - id: ${task.id}`)
        lines.push(`        name: "${task.name}"`)
        if (task.output) lines.push(`        output: "${task.output}"`)
        if (task.dependsOn) {
          const deps = Array.isArray(task.dependsOn) ? task.dependsOn : [task.dependsOn]
          lines.push(`        depends_on: [${deps.join(', ')}]`)
        }
        if (task.planApproval) lines.push('        plan_approval: true')
      }
    }
    lines.push('')
  }

  // Coordination
  const activeCoord = t.coordination.filter((c) =>
    c.between.every((name) => !props.disabledMembers.has(name))
  )
  if (activeCoord.length > 0) {
    lines.push('coordination:')
    for (const c of activeCoord) {
      lines.push(`  - between: [${c.between.join(', ')}]`)
      lines.push(`    topic: "${c.topic}"`)
    }
    lines.push('')
  }

  // Review gate
  if (t.reviewGate) {
    lines.push('review_gate:')
    lines.push(`  checklist: "${t.reviewGate.checklist}"`)
    lines.push(`  mode: ${t.reviewGate.mode}`)
  }

  return lines.join('\n')
})
</script>

<template>
  <div class="team-export">
    <div class="export-header">
      <h4 class="export-title">Team YAML</h4>
      <CopyButton :text="yamlOutput" label="Copy" />
    </div>
    <div class="export-body">
      <pre class="export-code">{{ yamlOutput }}</pre>
    </div>
  </div>
</template>

<style scoped>
.team-export {
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--sniper-radius-md);
  overflow: hidden;
  background: var(--vp-c-bg);
}

.export-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
}

.export-title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.export-body {
  max-height: 320px;
  overflow-y: auto;
}

.export-code {
  margin: 0;
  padding: 14px 18px;
  font-family: var(--sniper-font-mono);
  font-size: 12px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
