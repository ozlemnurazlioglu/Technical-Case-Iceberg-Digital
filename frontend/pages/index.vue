<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Transactions</h1>
      <button
        @click="showForm = !showForm"
        class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
      >
        + New Transaction
      </button>
    </div>

    <div v-if="showForm" class="bg-white border border-gray-200 rounded-xl p-6 mb-6">
      <h2 class="font-semibold text-gray-800 mb-4">New Transaction</h2>
      <form @submit.prevent="submitTransaction" class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <input v-model="form.propertyAddress" placeholder="Property Address" required class="input col-span-2" />
        <input v-model.number="form.salePrice" type="number" placeholder="Sale Price" required class="input" />
        <input v-model.number="form.totalServiceFee" type="number" placeholder="Total Service Fee" required class="input" />
        <select v-model="form.listingAgentId" required class="input">
          <option value="">Select Listing Agent</option>
          <option v-for="a in agentsStore.agents" :key="a._id" :value="a._id">{{ a.name }}</option>
        </select>
        <select v-model="form.sellingAgentId" required class="input">
          <option value="">Select Selling Agent</option>
          <option v-for="a in agentsStore.agents" :key="a._id" :value="a._id">{{ a.name }}</option>
        </select>
        <div class="col-span-2 flex gap-3">
          <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">Create</button>
          <button type="button" @click="showForm = false" class="text-gray-500 px-4 py-2 text-sm">Cancel</button>
        </div>
      </form>
    </div>

    <div v-if="store.loading" class="text-gray-400 text-center py-12">Loading...</div>
    <div v-else-if="store.transactions.length === 0" class="text-gray-400 text-center py-12">No transactions yet.</div>
    <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <TransactionCard v-for="t in store.transactions" :key="t._id" :transaction="t" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTransactionsStore } from '~/stores/transactions';
import { useAgentsStore } from '~/stores/agents';

const store = useTransactionsStore();
const agentsStore = useAgentsStore();

const showForm = ref(false);
const form = reactive({
  propertyAddress: '',
  salePrice: 0,
  totalServiceFee: 0,
  listingAgentId: '',
  sellingAgentId: '',
});

onMounted(async () => {
  await Promise.all([store.fetchAll(), agentsStore.fetchAll()]);
});

async function submitTransaction() {
  await store.create({ ...form });
  showForm.value = false;
  Object.assign(form, { propertyAddress: '', salePrice: 0, totalServiceFee: 0, listingAgentId: '', sellingAgentId: '' });
}
</script>

<style scoped>
.input {
  @apply border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-300;
}
</style>
