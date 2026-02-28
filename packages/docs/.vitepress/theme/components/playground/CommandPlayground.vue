<script setup lang="ts">
import { ref } from 'vue'
import { usePlaygroundData } from './usePlaygroundData'
import type { PlaygroundCommand } from './usePlaygroundData'
import CommandSelector from './CommandSelector.vue'
import TerminalSimulator from './TerminalSimulator.vue'
import CommandMeta from './CommandMeta.vue'

const { commands } = usePlaygroundData()
const selected = ref<PlaygroundCommand>(commands[0] ?? null)

function selectCommand(cmd: PlaygroundCommand) {
  selected.value = cmd
}
</script>

<template>
  <div class="command-playground">
    <div class="playground-header">
      <h1 class="playground-title">Command Playground</h1>
      <p class="playground-subtitle">
        Explore SNIPER commands interactively. Select a command to see simulated terminal output and metadata.
      </p>
    </div>

    <div class="playground-content">
      <CommandSelector
        :commands="commands"
        :selected="selected"
        @select="selectCommand"
      />

      <div class="playground-main" v-if="selected">
        <TerminalSimulator
          :lines="selected.terminalLines"
          :title="selected.name"
        />
        <CommandMeta
          :name="selected.name"
          :description="selected.description"
          :phase="selected.phase"
          :meta="selected.meta"
          :slug="selected.slug"
        />
      </div>
      <div v-else class="playground-empty">
        <p>Select a command from the list to get started.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.command-playground {
  max-width: 100%;
}

.playground-header {
  margin-bottom: 24px;
}

.playground-title {
  margin: 0 0 8px;
  font-size: 28px;
  font-weight: 700;
  color: var(--vp-c-text-1);
}

.playground-subtitle {
  margin: 0;
  font-size: 15px;
  color: var(--vp-c-text-2);
  line-height: 1.5;
}

.playground-content {
  display: flex;
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--sniper-radius-lg);
  overflow: hidden;
  background: var(--vp-c-bg);
  min-height: 480px;
}

.playground-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.playground-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--vp-c-text-3);
  font-size: 15px;
}

@media (max-width: 768px) {
  .playground-content {
    flex-direction: column;
    min-height: auto;
  }

  .playground-title {
    font-size: 22px;
  }
}
</style>
