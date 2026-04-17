<template>
  <div>
    <!-- Header -->
    <div class="flex items-start justify-between mb-8">
      <div class="animate-fade-up" style="animation-delay: 0ms; animation-fill-mode: both">
        <h1 class="font-display text-5xl text-ink leading-none">Transactions</h1>
        <p class="text-ink-3 text-sm mt-2 font-mono">
          {{ filteredTransactions.length > 0 ? `${filteredTransactions.length} records` : 'No records yet' }}
        </p>
      </div>
      <button
        @click="showForm = !showForm"
        class="flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-150 animate-fade-up"
        style="animation-delay: 80ms; animation-fill-mode: both"
        :class="showForm
          ? 'bg-surface border border-border text-ink-2'
          : 'bg-gold/10 border border-gold/30 text-gold hover:bg-gold/18 hover:border-gold/50'"
      >
        <span class="text-[1.1rem] leading-none font-light">{{ showForm ? '×' : '+' }}</span>
        {{ showForm ? 'Cancel' : 'New Transaction' }}
      </button>
    </div>

    <!-- Create form -->
    <Transition name="form-slide">
      <div v-if="showForm" class="bg-surface border border-border rounded-xl p-6 mb-8">
        <h2 class="font-display text-2xl text-ink mb-6">New Transaction</h2>
        <form @submit.prevent="submitTransaction" class="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div class="sm:col-span-2">
            <label class="label">Property Address</label>
            <input v-model="form.propertyAddress" placeholder="123 Main Street, City, State" required class="input-dark" />
          </div>
          <div>
            <label class="label">Sale Price</label>
            <input v-model.number="form.salePrice" type="number" min="0" placeholder="0" required class="input-dark font-mono" />
          </div>
          <div>
            <label class="label">Service Fee</label>
            <input v-model.number="form.totalServiceFee" type="number" min="0" placeholder="0" required class="input-dark font-mono" />
          </div>
          <div>
            <label class="label">Listing Agent</label>
            <select v-model="form.listingAgentId" required class="input-dark">
              <option value="">Select agent…</option>
              <option v-for="a in agentsStore.agents" :key="a._id" :value="a._id">{{ a.name }}</option>
            </select>
          </div>
          <div>
            <label class="label">Selling Agent</label>
            <select v-model="form.sellingAgentId" required class="input-dark">
              <option value="">Select agent…</option>
              <option v-for="a in agentsStore.agents" :key="a._id" :value="a._id">{{ a.name }}</option>
            </select>
          </div>
          <div class="sm:col-span-2 flex items-center justify-between pt-1 border-t border-border">
            <p v-if="agentsStore.agents.length === 0" class="text-xs text-amber-500/70 font-mono">
              No agents yet — <NuxtLink to="/agents" class="underline hover:text-amber-400">add agents first</NuxtLink>
            </p>
            <div v-else />
            <button
              type="submit"
              :disabled="submitting"
              class="px-5 py-2.5 rounded-md text-sm font-medium bg-gold/12 border border-gold/35 text-gold hover:bg-gold/22 hover:border-gold/55 transition-all disabled:opacity-40"
            >
              {{ submitting ? 'Creating…' : 'Create Transaction' }}
            </button>
          </div>
        </form>
      </div>
    </Transition>

    <!-- Stage filter tabs -->
    <div v-if="!store.loading && store.transactions.length > 0" class="flex items-center gap-1 mb-6 animate-fade-up" style="animation-delay: 120ms; animation-fill-mode: both">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        @click="activeStage = tab.value"
        class="px-3 py-1.5 rounded-md text-xs font-mono transition-all"
        :class="activeStage === tab.value
          ? 'bg-surface border border-border text-ink'
          : 'text-ink-3 hover:text-ink-2 hover:bg-surface/50'"
      >
        {{ tab.label }}
        <span
          v-if="tab.count > 0"
          class="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full"
          :class="activeStage === tab.value ? 'bg-gold/15 text-gold/80' : 'bg-border text-ink-3'"
        >{{ tab.count }}</span>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="flex flex-col items-center py-24 gap-3">
      <div class="w-7 h-7 rounded-full border-2 border-border border-t-gold/60 spin" />
      <p class="text-ink-3 text-xs font-mono">Loading…</p>
    </div>

    <!-- Empty state (no transactions at all) -->
    <div
      v-else-if="store.transactions.length === 0"
      class="flex flex-col items-center py-24 text-center animate-fade-up"
      style="animation-fill-mode: both"
    >
      <div class="w-16 h-16 rounded-xl bg-surface border border-border flex items-center justify-center mb-5">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#535870" stroke-width="1.5" stroke-linecap="round">
          <rect x="2" y="2" width="18" height="18" rx="3"/>
          <path d="M8 11h6M11 8v6"/>
        </svg>
      </div>
      <p class="font-display text-xl text-ink-2 mb-1">No transactions yet</p>
      <p class="text-ink-3 text-sm">Create your first transaction to begin tracking</p>
    </div>

    <!-- Empty state (filter has no results) -->
    <div
      v-else-if="filteredTransactions.length === 0"
      class="flex flex-col items-center py-16 text-center"
    >
      <p class="font-display text-lg text-ink-2 mb-1">No {{ activeStageLabel.toLowerCase() }} transactions</p>
      <button @click="activeStage = 'all'" class="text-xs text-gold/60 hover:text-gold font-mono mt-2 transition-colors">
        Clear filter
      </button>
    </div>

    <!-- Grid -->
    <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <TransactionCard
        v-for="(t, i) in filteredTransactions"
        :key="t._id"
        :transaction="t"
        class="animate-fade-up opacity-0"
        :style="{ animationDelay: `${i * 55}ms`, animationFillMode: 'forwards' }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTransactionsStore } from '~/stores/transactions';
import { useAgentsStore } from '~/stores/agents';
import type { TransactionStage } from '~/types';

const store = useTransactionsStore();
const agentsStore = useAgentsStore();

const showForm = ref(false);
const submitting = ref(false);
const activeStage = ref<TransactionStage | 'all'>('all');

const form = reactive({
  propertyAddress: '',
  salePrice: 0,
  totalServiceFee: 0,
  listingAgentId: '',
  sellingAgentId: '',
});

const STAGE_LABELS: Record<TransactionStage, string> = {
  agreement: 'Agreement',
  earnest_money: 'Earnest Money',
  title_deed: 'Title Deed',
  completed: 'Completed',
};

const tabs = computed(() => [
  { value: 'all' as const, label: 'All', count: store.transactions.length },
  { value: 'agreement' as const, label: 'Agreement', count: store.byStage('agreement').length },
  { value: 'earnest_money' as const, label: 'Earnest Money', count: store.byStage('earnest_money').length },
  { value: 'title_deed' as const, label: 'Title Deed', count: store.byStage('title_deed').length },
  { value: 'completed' as const, label: 'Completed', count: store.byStage('completed').length },
]);

const filteredTransactions = computed(() =>
  activeStage.value === 'all'
    ? store.transactions
    : store.byStage(activeStage.value),
);

const activeStageLabel = computed(() =>
  activeStage.value === 'all' ? 'All' : STAGE_LABELS[activeStage.value],
);

onMounted(async () => {
  await Promise.all([store.fetchAll(), agentsStore.fetchAll()]);
});

async function submitTransaction() {
  submitting.value = true;
  try {
    await store.create({ ...form });
    showForm.value = false;
    Object.assign(form, { propertyAddress: '', salePrice: 0, totalServiceFee: 0, listingAgentId: '', sellingAgentId: '' });
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.label {
  @apply block text-[10px] text-ink-3 font-mono uppercase tracking-widest mb-1.5;
}
</style>
