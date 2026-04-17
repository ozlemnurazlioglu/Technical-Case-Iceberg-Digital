import { defineStore } from 'pinia';
import type { AgentEarning, ReportsSummary } from '~/types';

export const useReportsStore = defineStore('reports', {
  state: () => ({
    summary: null as ReportsSummary | null,
    agents: [] as AgentEarning[],
    loading: false,
    error: null as string | null,
  }),

  actions: {
    async fetchAll() {
      const { get } = useApi();
      this.loading = true;
      this.error = null;
      try {
        const [summary, agents] = await Promise.all([
          get<ReportsSummary>('/reports/summary'),
          get<AgentEarning[]>('/reports/agents'),
        ]);
        this.summary = summary;
        this.agents = agents;
      } catch (e: any) {
        this.error = e?.message ?? 'Failed to fetch reports';
      } finally {
        this.loading = false;
      }
    },
  },
});
