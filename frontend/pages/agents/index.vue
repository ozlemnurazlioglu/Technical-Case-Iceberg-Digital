<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Agents</h1>
      <button @click="showForm = !showForm" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
        + New Agent
      </button>
    </div>

    <div v-if="showForm" class="bg-white border border-gray-200 rounded-xl p-6 mb-6">
      <h2 class="font-semibold text-gray-800 mb-4">New Agent</h2>
      <form @submit.prevent="submitAgent" class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <input v-model="form.name" placeholder="Full Name" required class="input" />
        <input v-model="form.email" type="email" placeholder="Email" required class="input" />
        <input v-model="form.phone" placeholder="Phone (optional)" class="input" />
        <div class="flex gap-3">
          <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">Create</button>
          <button type="button" @click="showForm = false" class="text-gray-500 px-4 py-2 text-sm">Cancel</button>
        </div>
      </form>
    </div>

    <div v-if="store.loading" class="text-gray-400 text-center py-12">Loading...</div>
    <div v-else-if="store.agents.length === 0" class="text-gray-400 text-center py-12">No agents yet.</div>
    <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="agent in store.agents" :key="agent._id"
        class="bg-white border border-gray-200 rounded-xl p-5">
        <p class="font-semibold text-gray-900">{{ agent.name }}</p>
        <p class="text-sm text-gray-500 mt-1">{{ agent.email }}</p>
        <p v-if="agent.phone" class="text-sm text-gray-400">{{ agent.phone }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAgentsStore } from '~/stores/agents';

const store = useAgentsStore();
const showForm = ref(false);
const form = reactive({ name: '', email: '', phone: '' });

onMounted(() => store.fetchAll());

async function submitAgent() {
  await store.create({ ...form });
  showForm.value = false;
  Object.assign(form, { name: '', email: '', phone: '' });
}
</script>

<style scoped>
.input {
  @apply border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-300;
}
</style>
