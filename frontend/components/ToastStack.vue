<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <TransitionGroup name="toast">
        <div
          v-for="t in toasts"
          :key="t.id"
          class="pointer-events-auto min-w-[260px] max-w-sm px-4 py-3 rounded-lg border backdrop-blur-md flex items-start gap-3 shadow-xl"
          :class="toastClass(t.kind)"
        >
          <span class="mt-0.5 flex-shrink-0 w-1.5 h-1.5 rounded-full" :class="dotClass(t.kind)" />
          <p class="text-sm leading-snug">{{ t.message }}</p>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { ToastKind } from '~/composables/useToast';

const { toasts } = useToast();

const toastClass = (k: ToastKind) => {
  if (k === 'success') return 'bg-emerald-950/85 border-emerald-500/40 text-emerald-100';
  if (k === 'error') return 'bg-rose-950/85 border-rose-500/40 text-rose-100';
  return 'bg-surface/95 border-border text-ink';
};

const dotClass = (k: ToastKind) => {
  if (k === 'success') return 'bg-emerald-400';
  if (k === 'error') return 'bg-rose-400';
  return 'bg-gold';
};
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.28s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(24px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(24px);
}
</style>
