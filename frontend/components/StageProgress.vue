<template>
  <div class="flex items-center gap-0">
    <template v-for="(stage, i) in STAGES" :key="stage">
      <div class="flex flex-col items-center">
        <div
          :class="[
            'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors',
            isCompleted(stage) ? 'bg-green-500 text-white' : isCurrent(stage) ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-400',
          ]"
        >
          <span v-if="isCompleted(stage)">✓</span>
          <span v-else>{{ i + 1 }}</span>
        </div>
        <span class="text-xs mt-1 text-center w-20" :class="isCurrent(stage) ? 'text-blue-600 font-semibold' : 'text-gray-400'">
          {{ STAGE_LABELS[stage] }}
        </span>
      </div>
      <div v-if="i < STAGES.length - 1" :class="['flex-1 h-0.5 mb-5', isCompleted(STAGES[i + 1]) || isCurrent(STAGES[i + 1]) ? 'bg-blue-400' : 'bg-gray-200']" />
    </template>
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
</script>
