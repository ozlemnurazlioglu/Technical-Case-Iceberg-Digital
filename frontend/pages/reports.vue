<template>
  <div>
    <!-- Header -->
    <div class="mb-10 animate-fade-up" style="animation-fill-mode: both">
      <h1 class="font-display text-5xl text-ink leading-none">Financial Reports</h1>
      <p class="text-ink-3 text-sm mt-2 font-mono">
        Aggregate view of agency earnings, agent performance and pipeline value
      </p>
    </div>

    <!-- Loading -->
    <div v-if="store.loading && !store.summary" class="flex justify-center py-24">
      <div class="w-7 h-7 rounded-full border-2 border-border border-t-gold/60 spin" />
    </div>

    <!-- Empty -->
    <div v-else-if="!store.summary || store.summary.totalTransactions === 0" class="flex flex-col items-center py-24 text-center">
      <div class="w-16 h-16 rounded-xl bg-surface border border-border flex items-center justify-center mb-5">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#535870" stroke-width="1.5" stroke-linecap="round">
          <rect x="3" y="3" width="16" height="16" rx="2"/>
          <path d="M7 14l3-3 2 2 4-4"/>
        </svg>
      </div>
      <p class="font-display text-xl text-ink-2 mb-1">No data to report</p>
      <p class="text-ink-3 text-sm">Create transactions to see financial reports</p>
    </div>

    <div v-else class="space-y-8">
      <!-- Summary cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Agency Earnings"
          :value="fmt(store.summary.totalAgencyEarnings)"
          hint="From completed transactions"
          primary
          delay="0ms"
        />
        <SummaryCard
          label="Agent Earnings"
          :value="fmt(store.summary.totalAgentEarnings)"
          hint="Distributed to agents"
          delay="60ms"
        />
        <SummaryCard
          label="Pipeline Value"
          :value="fmt(store.summary.pipelineValue)"
          :hint="`${store.summary.activeTransactions} active transactions`"
          delay="120ms"
        />
        <SummaryCard
          label="Closed Value"
          :value="fmt(store.summary.completedValue)"
          :hint="`${store.summary.completedTransactions} completed transactions`"
          delay="180ms"
        />
      </div>

      <!-- Stage distribution -->
      <div class="bg-surface border border-border rounded-xl p-6 animate-fade-up opacity-0" style="animation-delay: 240ms; animation-fill-mode: forwards">
        <h2 class="text-[10px] text-ink-3 font-mono uppercase tracking-widest mb-5">Pipeline by Stage</h2>
        <div class="space-y-4">
          <div v-for="stage in STAGES" :key="stage">
            <div class="flex items-baseline justify-between mb-1.5">
              <span class="text-sm text-ink-2">{{ STAGE_LABELS[stage] }}</span>
              <span class="font-mono text-sm text-ink">
                {{ store.summary.stageDistribution[stage] }}
                <span class="text-ink-3 text-xs">({{ pctOf(store.summary.stageDistribution[stage]) }}%)</span>
              </span>
            </div>
            <div class="h-1.5 bg-border rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-700 ease-out"
                :class="STAGE_COLOR[stage]"
                :style="{ width: `${pctOf(store.summary.stageDistribution[stage])}%` }"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Agent leaderboard -->
      <div class="bg-surface border border-border rounded-xl p-6 animate-fade-up opacity-0" style="animation-delay: 320ms; animation-fill-mode: forwards">
        <div class="flex items-baseline justify-between mb-5">
          <h2 class="text-[10px] text-ink-3 font-mono uppercase tracking-widest">Agent Leaderboard</h2>
          <span class="text-[10px] text-ink-3 font-mono">{{ store.agents.length }} agents</span>
        </div>

        <div v-if="store.agents.length === 0" class="text-ink-3 text-sm py-6 text-center">
          No agents registered yet.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-[10px] text-ink-3 font-mono uppercase tracking-widest border-b border-border">
                <th class="text-left pb-3 font-normal">Rank</th>
                <th class="text-left pb-3 font-normal">Agent</th>
                <th class="text-right pb-3 font-normal">Closed</th>
                <th class="text-right pb-3 font-normal">As Listing</th>
                <th class="text-right pb-3 font-normal">As Selling</th>
                <th class="text-right pb-3 font-normal">Total Earnings</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(agent, i) in store.agents"
                :key="agent.agentId"
                class="border-b border-border/50 last:border-0 hover:bg-surface-raised/40 transition-colors"
              >
                <td class="py-3 font-mono text-ink-3">#{{ i + 1 }}</td>
                <td class="py-3">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
                      <span class="font-display text-gold text-sm leading-none">{{ agent.name.charAt(0).toUpperCase() }}</span>
                    </div>
                    <div>
                      <p class="text-ink">{{ agent.name }}</p>
                      <p class="text-[10px] text-ink-3 font-mono">{{ agent.email }}</p>
                    </div>
                  </div>
                </td>
                <td class="py-3 text-right font-mono text-ink-2">{{ agent.completedTransactions }}</td>
                <td class="py-3 text-right font-mono text-ink-2">{{ fmt(agent.asListing) }}</td>
                <td class="py-3 text-right font-mono text-ink-2">{{ fmt(agent.asSelling) }}</td>
                <td class="py-3 text-right font-mono" :class="i === 0 ? 'text-gold font-semibold' : 'text-ink'">
                  {{ fmt(agent.totalEarnings) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useReportsStore } from '~/stores/reports';
import type { TransactionStage } from '~/types';

const store = useReportsStore();

const STAGES: TransactionStage[] = ['agreement', 'earnest_money', 'title_deed', 'completed'];
const STAGE_LABELS: Record<TransactionStage, string> = {
  agreement: 'Agreement',
  earnest_money: 'Earnest Money',
  title_deed: 'Title Deed',
  completed: 'Completed',
};
const STAGE_COLOR: Record<TransactionStage, string> = {
  agreement: 'bg-blue-400/60',
  earnest_money: 'bg-amber-400/60',
  title_deed: 'bg-violet-400/60',
  completed: 'bg-emerald-400/70',
};

onMounted(() => store.fetchAll());

const pctOf = (n: number) => {
  const total = store.summary?.totalTransactions ?? 0;
  if (!total) return 0;
  return Math.round((n / total) * 100);
};

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
</script>
