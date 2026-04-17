<template>
  <div>
    <!-- Header -->
    <div class="flex items-start justify-between mb-8">
      <div class="animate-fade-up" style="animation-fill-mode: both">
        <h1 class="font-display text-5xl text-ink leading-none">Agents</h1>
        <p class="text-ink-3 text-sm mt-2 font-mono">
          {{ store.agents.length > 0 ? `${store.agents.length} registered` : 'None registered' }}
        </p>
      </div>
      <button
        @click="showForm = !showForm"
        class="flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all animate-fade-up"
        style="animation-delay: 80ms; animation-fill-mode: both"
        :class="showForm
          ? 'bg-surface border border-border text-ink-2'
          : 'bg-gold/10 border border-gold/30 text-gold hover:bg-gold/18 hover:border-gold/50'"
      >
        <span class="text-[1.1rem] leading-none font-light">{{ showForm ? '×' : '+' }}</span>
        {{ showForm ? 'Cancel' : 'New Agent' }}
      </button>
    </div>

    <!-- Create form -->
    <Transition name="form-slide">
      <div v-if="showForm" class="bg-surface border border-border rounded-xl p-6 mb-8">
        <h2 class="font-display text-2xl text-ink mb-6">New Agent</h2>
        <form @submit.prevent="submitAgent" class="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label class="label">Full Name</label>
            <input v-model="form.name" placeholder="Jane Smith" required class="input-dark" />
          </div>
          <div>
            <label class="label">Email</label>
            <input v-model="form.email" type="email" placeholder="jane@agency.com" required class="input-dark" />
          </div>
          <div class="sm:col-span-2">
            <label class="label">Phone <span class="text-ink-3/40 normal-case tracking-normal">(optional)</span></label>
            <input v-model="form.phone" placeholder="+1 (555) 000-0000" class="input-dark" />
          </div>
          <div class="sm:col-span-2 flex justify-end pt-1 border-t border-border">
            <button
              type="submit"
              :disabled="submitting"
              class="px-5 py-2.5 rounded-md text-sm font-medium bg-gold/12 border border-gold/35 text-gold hover:bg-gold/22 transition-all disabled:opacity-40"
            >
              {{ submitting ? 'Adding…' : 'Add Agent' }}
            </button>
          </div>
        </form>
      </div>
    </Transition>

    <!-- Loading -->
    <div v-if="store.loading" class="flex justify-center py-24">
      <div class="w-7 h-7 rounded-full border-2 border-border border-t-gold/60 spin" />
    </div>

    <!-- Empty state -->
    <div v-else-if="store.agents.length === 0" class="flex flex-col items-center py-24 text-center animate-fade-up" style="animation-fill-mode: both">
      <div class="w-16 h-16 rounded-xl bg-surface border border-border flex items-center justify-center mb-5">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#535870" stroke-width="1.5" stroke-linecap="round">
          <circle cx="11" cy="8" r="4"/>
          <path d="M3.5 20c0-4.5 3.4-7.5 7.5-7.5s7.5 3 7.5 7.5"/>
        </svg>
      </div>
      <p class="font-display text-xl text-ink-2 mb-1">No agents yet</p>
      <p class="text-ink-3 text-sm">Add agents before creating transactions</p>
    </div>

    <!-- Agent grid -->
    <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="(agent, i) in store.agents"
        :key="agent._id"
        class="bg-surface border border-border rounded-xl p-5 card-lift animate-fade-up opacity-0"
        :style="{ animationDelay: `${i * 55}ms`, animationFillMode: 'forwards' }"
      >
        <!-- Avatar -->
        <div class="w-10 h-10 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center mb-4">
          <span class="font-display text-gold text-lg leading-none">{{ agent.name.charAt(0).toUpperCase() }}</span>
        </div>
        <p class="font-medium text-ink">{{ agent.name }}</p>
        <p class="text-xs text-ink-3 font-mono mt-1 truncate">{{ agent.email }}</p>
        <p v-if="agent.phone" class="text-xs text-ink-3 font-mono mt-0.5">{{ agent.phone }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAgentsStore } from '~/stores/agents';

const store = useAgentsStore();
const showForm = ref(false);
const submitting = ref(false);
const form = reactive({ name: '', email: '', phone: '' });

onMounted(() => store.fetchAll());

async function submitAgent() {
  submitting.value = true;
  try {
    await store.create({ ...form });
    showForm.value = false;
    Object.assign(form, { name: '', email: '', phone: '' });
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
