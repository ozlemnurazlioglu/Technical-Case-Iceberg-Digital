<template>
  <!-- Loading -->
  <div v-if="store.loading" class="flex flex-col items-center py-24 gap-3">
    <div class="w-7 h-7 rounded-full border-2 border-border border-t-gold/60 spin" />
    <p class="text-ink-3 text-xs font-mono">Loading transaction…</p>
  </div>

  <!-- Not found -->
  <div v-else-if="!store.current" class="flex flex-col items-center py-24 text-center">
    <p class="font-display text-2xl text-ink-2 mb-4">Transaction not found</p>
    <NuxtLink to="/" class="text-sm text-gold/70 hover:text-gold transition-colors font-mono">← Back to transactions</NuxtLink>
  </div>

  <!-- Content -->
  <div v-else class="animate-fade-up" style="animation-fill-mode: both">
    <!-- Back -->
    <NuxtLink to="/" class="inline-flex items-center gap-1.5 text-ink-3 hover:text-gold text-xs font-mono transition-colors mb-8">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M8 2L3 6L8 10"/>
      </svg>
      All transactions
    </NuxtLink>

    <!-- Hero -->
    <div class="mb-8">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <h1 class="font-display text-4xl md:text-5xl text-ink leading-tight max-w-2xl">
          {{ store.current.propertyAddress }}
        </h1>
        <span :class="stageBadgeClass" class="text-[10px] font-mono px-3 py-1.5 rounded-full shrink-0">
          {{ stageLabel }}
        </span>
      </div>

      <!-- Financial stats strip -->
      <div class="flex flex-wrap items-center gap-6 mt-5">
        <div>
          <span class="text-[10px] text-ink-3 font-mono uppercase tracking-widest block mb-1">Sale Price</span>
          <span class="font-mono text-xl text-ink-2">{{ fmt(store.current.salePrice) }}</span>
        </div>
        <div class="w-px h-10 bg-border" />
        <div>
          <span class="text-[10px] text-ink-3 font-mono uppercase tracking-widest block mb-1">Service Fee</span>
          <span class="font-mono text-xl text-gold">{{ fmt(store.current.totalServiceFee) }}</span>
        </div>
        <div class="w-px h-10 bg-border" />
        <div>
          <span class="text-[10px] text-ink-3 font-mono uppercase tracking-widest block mb-1">Created</span>
          <span class="font-mono text-sm text-ink-2">{{ fmtDate(store.current.createdAt) }}</span>
        </div>
      </div>
    </div>

    <!-- Stage card -->
    <div class="bg-surface border border-border rounded-xl p-6 mb-4">
      <h2 class="text-[10px] text-ink-3 font-mono uppercase tracking-widest mb-7">Transaction Progress</h2>
      <StageProgress :currentStage="store.current.stage" />

      <div class="mt-7 pt-5 border-t border-border flex items-center gap-4">
        <button
          v-if="store.current.stage !== 'completed'"
          @click="advance"
          :disabled="advancing"
          class="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium bg-gold/10 border border-gold/30 text-gold hover:bg-gold/18 hover:border-gold/50 transition-all disabled:opacity-40"
        >
          <svg v-if="advancing" class="w-3.5 h-3.5 spin" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M7 1v2M7 11v2M1 7h2M11 7h2M2.93 2.93l1.41 1.41M9.66 9.66l1.41 1.41"/>
          </svg>
          <svg v-else width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 6.5h7M7 3.5l3 3-3 3"/>
          </svg>
          {{ advancing ? 'Advancing…' : `Advance to ${nextStageLabel}` }}
        </button>

        <div v-else class="inline-flex items-center gap-2 text-emerald-400 text-sm font-medium">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.5"/>
            <path d="M5 8L7 10L11 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Transaction completed
        </div>
      </div>
    </div>

    <!-- Bottom grid -->
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <CommissionBreakdown :breakdown="store.current.commissionBreakdown" />

      <!-- History -->
      <div class="bg-surface border border-border rounded-xl p-6">
        <h2 class="text-[10px] text-ink-3 font-mono uppercase tracking-widest mb-5">Stage History</h2>
        <div v-if="store.current.stageHistory.length === 0" class="text-ink-3 text-sm">No history recorded.</div>
        <ol class="space-y-4">
          <li
            v-for="(entry, i) in store.current.stageHistory"
            :key="entry.timestamp"
            class="flex items-start gap-3"
          >
            <div class="flex flex-col items-center shrink-0 mt-1">
              <div class="w-1.5 h-1.5 rounded-full" :class="i === 0 ? 'bg-gold' : 'bg-ink-3/50'" />
              <div v-if="i < store.current.stageHistory.length - 1" class="w-px h-full min-h-[1.5rem] bg-border mt-1" />
            </div>
            <div>
              <p class="text-sm text-ink capitalize">{{ entry.stage.replace(/_/g, ' ') }}</p>
              <p class="text-[10px] text-ink-3 font-mono mt-0.5">{{ fmtDate(entry.timestamp) }}</p>
            </div>
          </li>
        </ol>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTransactionsStore } from '~/stores/transactions';
import type { TransactionStage } from '~/types';

const route = useRoute();
const store = useTransactionsStore();

const STAGE_ORDER: TransactionStage[] = ['agreement', 'earnest_money', 'title_deed', 'completed'];
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

const advancing = ref(false);

const stageLabel = computed(() => STAGE_LABELS[store.current?.stage ?? 'agreement']);
const stageBadgeClass = computed(() => STAGE_COLORS[store.current?.stage ?? 'agreement']);

const nextStageLabel = computed(() => {
  if (!store.current) return '';
  const idx = STAGE_ORDER.indexOf(store.current.stage);
  return idx < STAGE_ORDER.length - 1 ? STAGE_LABELS[STAGE_ORDER[idx + 1]] : '';
});

onMounted(() => store.fetchOne(route.params.id as string));

async function advance() {
  if (!store.current) return;
  advancing.value = true;
  try {
    await store.advanceStage(store.current._id);
  } finally {
    advancing.value = false;
  }
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: string) =>
  new Date(d).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
</script>
