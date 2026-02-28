<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePlaygroundData } from './usePlaygroundData'
import type { PlaygroundTeam } from './usePlaygroundData'
import PhaseSelector from './PhaseSelector.vue'
import TeamCanvas from './TeamCanvas.vue'
import TeamExport from './TeamExport.vue'

const { teams } = usePlaygroundData()

const selectedPhase = ref<string | null>(null)
const selectedTeam = ref<PlaygroundTeam | null>(teams[0] ?? null)
const disabledMembers = ref<Set<string>>(new Set())

const availablePhases = computed(() => {
  const phases = new Set<string>()
  for (const t of teams) {
    if (t.phase) phases.add(t.phase)
  }
  return phases
})

const filteredTeams = computed(() => {
  if (!selectedPhase.value) return teams
  return teams.filter((t) => t.phase === selectedPhase.value)
})

function selectPhase(phase: string | null) {
  selectedPhase.value = phase
  // Auto-select first team of the phase
  const available = phase ? teams.filter((t) => t.phase === phase) : teams
  if (available.length > 0 && (!selectedTeam.value || !available.includes(selectedTeam.value))) {
    selectedTeam.value = available[0]
    disabledMembers.value = new Set()
  }
}

function selectTeam(team: PlaygroundTeam) {
  selectedTeam.value = team
  disabledMembers.value = new Set()
}

function toggleMember(name: string) {
  const next = new Set(disabledMembers.value)
  if (next.has(name)) {
    next.delete(name)
  } else {
    next.add(name)
  }
  disabledMembers.value = next
}
</script>

<template>
  <div class="team-builder">
    <div class="builder-header">
      <h1 class="builder-title">Team Builder</h1>
      <p class="builder-subtitle">
        Explore SNIPER team compositions. Select a phase, pick a team, toggle members on/off, and export the configuration.
      </p>
    </div>

    <PhaseSelector
      :selected="selectedPhase"
      :available-phases="availablePhases"
      @select="selectPhase"
    />

    <div class="builder-team-select">
      <label class="team-label" for="team-dropdown">Team:</label>
      <select
        id="team-dropdown"
        class="team-dropdown"
        :value="selectedTeam?.slug ?? ''"
        @change="selectTeam(teams.find((t) => t.slug === ($event.target as HTMLSelectElement).value)!)"
      >
        <option v-for="team in filteredTeams" :key="team.slug" :value="team.slug">
          {{ team.name }} ({{ team.members.length }} members)
        </option>
      </select>
    </div>

    <div v-if="selectedTeam" class="builder-content">
      <TeamCanvas :team="selectedTeam" :disabled-members="disabledMembers" @toggle-member="toggleMember" />
      <TeamExport :team="selectedTeam" :disabled-members="disabledMembers" />
    </div>
  </div>
</template>

<style scoped>
.team-builder {
  max-width: 100%;
}

.builder-header {
  margin-bottom: 24px;
}

.builder-title {
  margin: 0 0 8px;
  font-size: 28px;
  font-weight: 700;
  color: var(--vp-c-text-1);
}

.builder-subtitle {
  margin: 0;
  font-size: 15px;
  color: var(--vp-c-text-2);
  line-height: 1.5;
}

.builder-team-select {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  padding: 0 16px;
}

.team-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.team-dropdown {
  flex: 1;
  max-width: 360px;
  padding: 8px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--sniper-radius-sm);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 14px;
  font-family: inherit;
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.team-dropdown:hover {
  border-color: var(--vp-c-text-3);
}

.team-dropdown:focus {
  outline: 2px solid var(--sniper-brand);
  outline-offset: 2px;
}

.builder-content {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 16px;
}

@media (max-width: 900px) {
  .builder-content {
    grid-template-columns: 1fr;
  }

  .builder-title {
    font-size: 22px;
  }
}
</style>
