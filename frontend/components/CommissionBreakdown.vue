<template>
  <div class="bg-surface border border-border rounded-xl p-6">
    <h2 class="text-[10px] text-ink-3 font-mono uppercase tracking-widest mb-5">Commission Breakdown</h2>

    <div v-if="breakdown" class="space-y-5">
      <div v-for="row in rows" :key="row.label">
        <div class="flex items-baseline justify-between mb-1.5">
          <span class="text-sm text-ink-2">{{ row.label }}</span>
          <span class="font-mono text-sm" :class="row.primary ? 'text-gold' : 'text-ink'">
            {{ fmt(row.amount) }}
          </span>
        </div>
        <div class="h-1 bg-border rounded-full overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-700 ease-out"
            :class="row.primary ? 'bg-gradient-to-r from-gold/70 to-gold/40' : 'bg-ink-3/35'"
            :style="{ width: `${row.pct}%` }"
          />
        </div>
        <span class="text-[10px] font-mono text-ink-3 mt-1 block">{{ row.pct }}% of total</span>
      </div>

      <div class="pt-4 border-t border-border flex justify-between items-center">
        <span class="text-[10px] font-mono text-ink-3 uppercase tracking-widest">Total Fee</span>
        <span class="font-mono text-base text-ink">{{ fmt(total) }}</span>
      </div>
    </div>

    <div v-else class="py-6 flex flex-col items-center text-center">
      <div class="w-11 h-11 rounded-full bg-gold/5 border border-gold/10 flex items-center justify-center mb-3">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#535870" stroke-width="1.5" stroke-linecap="round">
          <circle cx="8" cy="8" r="6.5"/>
          <path d="M8 5v3.5l2 2"/>
        </svg>
      </div>
      <p class="text-sm text-ink-3">Available when transaction completes</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CommissionBreakdown } from '~/types';

const props = defineProps<{ breakdown: CommissionBreakdown | null }>();

const total = computed(() =>
  props.breakdown
    ? props.breakdown.agencyAmount + props.breakdown.listingAgentAmount + props.breakdown.sellingAgentAmount
    : 0,
);

const rows = computed(() => {
  if (!props.breakdown || total.value === 0) return [];
  const t = total.value;
  return [
    { label: 'Agency', amount: props.breakdown.agencyAmount, pct: Math.round((props.breakdown.agencyAmount / t) * 100), primary: true },
    { label: 'Listing Agent', amount: props.breakdown.listingAgentAmount, pct: Math.round((props.breakdown.listingAgentAmount / t) * 100), primary: false },
    { label: 'Selling Agent', amount: props.breakdown.sellingAgentAmount, pct: Math.round((props.breakdown.sellingAgentAmount / t) * 100), primary: false },
  ];
});

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
</script>
