<template>
  <div class="relative px-2">
    <!-- Track background -->
    <div class="absolute top-4 left-6 right-6 h-px bg-border z-0" />

    <!-- Track fill -->
    <div
      class="absolute top-4 left-6 h-px bg-gradient-to-r from-gold/70 via-gold/50 to-gold/20 z-0 transition-all duration-700 ease-out"
      :style="{ width: trackWidth }"
    />

    <!-- Steps -->
    <div class="relative z-10 flex items-start justify-between">
      <div
        v-for="(stage, i) in STAGES"
        :key="stage"
        class="flex flex-col items-center gap-2.5"
        style="width: 25%"
      >
        <!-- Indicator -->
        <div class="relative flex items-center justify-center w-8 h-8">
          <!-- Pulse ring (current only) -->
          <div
            v-if="isCurrent(stage)"
            class="absolute inset-0 rounded-full bg-gold/25 animate-pulse-ring"
          />
          <!-- Circle -->
          <div
            :class="[
              'relative w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono transition-all duration-300',
              isCompleted(stage)
                ? 'bg-gold/15 border border-gold/40 text-gold'
                : isCurrent(stage)
                  ? 'bg-gold/10 border-2 border-gold text-gold'
                  : 'bg-surface-raised border border-border text-ink-3',
            ]"
          >
            <svg v-if="isCompleted(stage)" width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2 5.5L4.5 8L9 3"/>
            </svg>
            <span v-else class="text-[10px]">{{ i + 1 }}</span>
          </div>
        </div>

        <!-- Label -->
        <span
          class="text-[10px] font-mono text-center leading-tight transition-colors max-w-[60px]"
          :class="isCompleted(stage) ? 'text-gold/60' : isCurrent(stage) ? 'text-gold' : 'text-ink-3'"
        >
          {{ STAGE_LABELS[stage] }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TransactionStage } from '~/types';

const props = defineProps<{ currentStage: TransactionStage }>();

const STAGES: TransactionStage[] = ['agreement', 'earnest_money', 'title_deed', 'completed'];

const STAGE_LABELS: Record<TransactionStage, string> = {
  agreement: 'Agreement',
  earnest_money: 'Earnest Money',
  title_deed: 'Title Deed',
  completed: 'Completed',
};

const currentIdx = computed(() => STAGES.indexOf(props.currentStage));
const isCompleted = (s: TransactionStage) => STAGES.indexOf(s) < currentIdx.value;
const isCurrent = (s: TransactionStage) => s === props.currentStage;

const trackWidth = computed(() => {
  if (currentIdx.value === 0) return '0%';
  return `${(currentIdx.value / (STAGES.length - 1)) * 88}%`;
});
</script>
