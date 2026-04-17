<template>
  <div
    class="bg-surface border rounded-xl p-5 card-lift animate-fade-up opacity-0"
    :class="primary ? 'border-gold/30 bg-gradient-to-br from-surface to-gold/[0.04]' : 'border-border'"
    :style="{ animationDelay: delay, animationFillMode: 'forwards' }"
  >
    <p class="text-[10px] text-ink-3 font-mono uppercase tracking-widest mb-3">{{ label }}</p>
    <p class="font-mono text-2xl leading-none mb-2" :class="primary ? 'text-gold' : 'text-ink'">
      {{ value }}
    </p>
    <p v-if="hint" class="text-[11px] text-ink-3 font-mono mt-2">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  value: string;
  hint?: string;
  primary?: boolean;
  delay?: string;
}>();
</script>
