<template>
  <div class="scroll-progress" />
</template>

<style scoped>
.scroll-progress {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  z-index: 999;
  background: linear-gradient(90deg, var(--sniper-brand), var(--sniper-accent));
  transform-origin: left;
  scale: 0 1;
  animation: grow-progress linear both;
  animation-timeline: scroll(root);
}

@keyframes grow-progress {
  to {
    scale: 1 1;
  }
}

@supports not (animation-timeline: scroll()) {
  .scroll-progress {
    display: none;
  }
}
</style>
