<template>
  <div class="bg-gray-50 rounded-xl p-5 border border-gray-200">
    <h3 class="font-semibold text-gray-800 mb-4">Commission Breakdown</h3>
    <div v-if="breakdown" class="space-y-3">
      <div class="flex justify-between items-center py-2 border-b border-gray-200">
        <span class="text-gray-600">Agency (50%)</span>
        <span class="font-semibold text-gray-900">{{ fmt(breakdown.agencyAmount) }}</span>
      </div>
      <div class="flex justify-between items-center py-2 border-b border-gray-200">
        <span class="text-gray-600">Listing Agent</span>
        <span class="font-semibold text-gray-900">{{ fmt(breakdown.listingAgentAmount) }}</span>
      </div>
      <div class="flex justify-between items-center py-2">
        <span class="text-gray-600">Selling Agent</span>
        <span class="font-semibold text-gray-900">{{ fmt(breakdown.sellingAgentAmount) }}</span>
      </div>
      <div class="flex justify-between items-center pt-3 border-t border-gray-300">
        <span class="font-semibold text-gray-800">Total Service Fee</span>
        <span class="font-bold text-gray-900">{{ fmt(total) }}</span>
      </div>
    </div>
    <p v-else class="text-gray-400 text-sm">Available after transaction is completed.</p>
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

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
</script>
