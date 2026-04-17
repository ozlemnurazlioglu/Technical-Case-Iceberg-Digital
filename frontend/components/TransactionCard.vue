<template>
  <NuxtLink
    :to="`/transactions/${transaction._id}`"
    class="block bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="font-semibold text-gray-900 truncate">{{ transaction.propertyAddress }}</p>
        <p class="text-sm text-gray-500 mt-1">Fee: {{ formatCurrency(transaction.totalServiceFee) }}</p>
      </div>
      <span :class="stageBadgeClass">{{ stageLabel }}</span>
    </div>
    <p class="text-xs text-gray-400 mt-3">{{ formatDate(transaction.createdAt) }}</p>
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
  agreement: 'bg-blue-100 text-blue-700',
  earnest_money: 'bg-yellow-100 text-yellow-700',
  title_deed: 'bg-orange-100 text-orange-700',
  completed: 'bg-green-100 text-green-700',
};

const stageLabel = computed(() => STAGE_LABELS[props.transaction.stage]);
const stageBadgeClass = computed(
  () => `text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${STAGE_COLORS[props.transaction.stage]}`,
);

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
</script>
