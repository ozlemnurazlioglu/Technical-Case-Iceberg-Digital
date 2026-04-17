<template>
  <NuxtLink
    :to="`/transactions/${transaction._id}`"
    class="block bg-surface border border-border rounded-xl p-5 card-lift group"
  >
    <!-- Stage badge + arrow -->
    <div class="flex items-center justify-between mb-3">
      <span :class="stageBadgeClass" class="text-[10px] font-mono px-2.5 py-1 rounded-full">
        {{ stageLabel }}
      </span>
      <svg class="w-3.5 h-3.5 text-ink-3 group-hover:text-gold/50 transition-colors" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 2.5L8.5 6L3 9.5"/>
      </svg>
    </div>

    <!-- Property address -->
    <p class="font-display text-[1.05rem] text-ink leading-snug mb-3 group-hover:text-gold/90 transition-colors line-clamp-2">
      {{ transaction.propertyAddress }}
    </p>

    <!-- Fee -->
    <p class="font-mono text-base text-gold mb-4">
      {{ formatCurrency(transaction.totalServiceFee) }}
    </p>

    <!-- Date + sale price -->
    <div class="flex items-center justify-between border-t border-border/60 pt-3">
      <span class="text-[10px] text-ink-3 font-mono">{{ formatDate(transaction.createdAt) }}</span>
      <span class="text-[10px] text-ink-3 font-mono">{{ formatCurrency(transaction.salePrice) }} sale</span>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { Transaction, TransactionStage } from '~/types';

const props = defineProps<{ transaction: Transaction }>();

const STAGE_LABELS: Record<TransactionStage, string> = {
  agreement: 'Agreement',
  earnest_money: 'Earnest Money',
  title_deed: 'Title Deed',
  completed: 'Completed',
};

const STAGE_COLORS: Record<TransactionStage, string> = {
  agreement: 'bg-blue-500/10 border border-blue-500/25 text-blue-400',
  earnest_money: 'bg-amber-500/10 border border-amber-500/25 text-amber-400',
  title_deed: 'bg-violet-500/10 border border-violet-500/25 text-violet-400',
  completed: 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400',
};

const stageLabel = computed(() => STAGE_LABELS[props.transaction.stage]);
const stageBadgeClass = computed(() => STAGE_COLORS[props.transaction.stage]);

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
</script>
