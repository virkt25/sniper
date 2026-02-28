<script setup lang="ts">
import { reactive } from 'vue'
import { usePlaygroundData } from './usePlaygroundData'
import type { PersonaItem } from './usePlaygroundData'
import LayerPicker from './LayerPicker.vue'
import LayerStack from './LayerStack.vue'
import SpawnPreview from './SpawnPreview.vue'

const { personas, spawnTemplate } = usePlaygroundData()

const LAYERS = ['process', 'technical', 'cognitive', 'domain'] as const

const selections = reactive<Record<string, PersonaItem | null>>({
  process: null,
  technical: null,
  cognitive: null,
  domain: null,
})

function selectLayer(layer: string, item: PersonaItem | null) {
  selections[layer] = item
}
</script>

<template>
  <div class="persona-composer">
    <div class="composer-header">
      <h1 class="composer-title">Persona Composer</h1>
      <p class="composer-subtitle">
        Build agent personas by selecting one layer from each category. See the composed spawn prompt update in real time.
      </p>
    </div>

    <div class="composer-pickers">
      <LayerPicker
        v-for="layer in LAYERS"
        :key="layer"
        :layer="layer"
        :items="personas[layer] ?? []"
        :selected="selections[layer]"
        @select="(item) => selectLayer(layer, item)"
      />
    </div>

    <div class="composer-output">
      <LayerStack :selections="selections" />
      <SpawnPreview :template="spawnTemplate" :selections="selections" />
    </div>
  </div>
</template>

<style scoped>
.persona-composer {
  max-width: 100%;
}

.composer-header {
  margin-bottom: 24px;
}

.composer-title {
  margin: 0 0 8px;
  font-size: 28px;
  font-weight: 700;
  color: var(--vp-c-text-1);
}

.composer-subtitle {
  margin: 0;
  font-size: 15px;
  color: var(--vp-c-text-2);
  line-height: 1.5;
}

.composer-pickers {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--sniper-radius-lg);
  overflow: hidden;
  background: var(--vp-c-bg);
}

.composer-output {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 16px;
}

@media (max-width: 900px) {
  .composer-pickers {
    grid-template-columns: repeat(2, 1fr);
  }

  .composer-output {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .composer-pickers {
    grid-template-columns: 1fr;
  }

  .composer-title {
    font-size: 22px;
  }
}
</style>
