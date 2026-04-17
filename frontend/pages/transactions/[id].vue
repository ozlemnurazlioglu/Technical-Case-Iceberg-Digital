<template>
  <div v-if="store.loading" class="text-gray-400 text-center py-12">Loading...</div>
  <div v-else-if="!store.current" class="text-gray-400 text-center py-12">Transaction not found.</div>
  <div v-else>
    <NuxtLink to="/" class="text-sm text-blue-600 hover:underline mb-4 inline-block">← Back</NuxtLink>

    <h1 class="text-2xl font-bold text-gray-900 mt-2 mb-1">{{ store.current.propertyAddress }}</h1>
    <p class="text-gray-500 text-sm mb-6">
      Sale Price: {{ fmt(store.current.salePrice) }} &nbsp;·&nbsp;
      Service Fee: {{ fmt(store.current.totalServiceFee) }}
    </p>

    <div class="bg-white border border-gray-200 rounded-xl p-6 mb-6">
      <h2 class="font-semibold text-gray-800 mb-5">Transaction Stage</h2>
      <StageProgress :currentStage="store.current.stage" />
      <div class="mt-6 flex gap-3">
        <button
          v-if="store.current.stage !== 'completed'"
          @click="advance"
          :disabled="advancing"
          class="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {{ advancing ? 'Advancing...' : `Advance to ${nextStageLabel}` }}
        </button>
        <span v-else class="text-green-600 font-semibold text-sm flex items-center gap-1">✓ Transaction Completed</span>
      </div>
    </div>

    <CommissionBreakdown :breakdown="store.current.commissionBreakdown" />

    <div class="bg-white border border-gray-200 rounded-xl p-6 mt-6">
      <h2 class="font-semibold text-gray-800 mb-4">Stage History</h2>
      <ol class="space-y-2">
        <li v-for="entry in store.current.stageHistory" :key="entry.timestamp" class="flex gap-3 text-sm">
          <span class="text-gray-400 shrink-0">{{ fmtDate(entry.timestamp) }}</span>
          <span class="text-gray-700 capitalize">{{ entry.stage.replace('_', ' ') }}</span>
        </li>
      </ol>
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

const advancing = ref(false);

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
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

const fmtDate = (d: string) =>
  new Date(d).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
</script>
