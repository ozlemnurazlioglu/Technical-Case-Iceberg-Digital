import { defineStore } from 'pinia';
import type { Agent, CreateAgentPayload } from '~/types';

export const useAgentsStore = defineStore('agents', {
  state: () => ({
    agents: [] as Agent[],
    loading: false,
    error: null as string | null,
  }),

  actions: {
    async fetchAll() {
      const { get } = useApi();
      this.loading = true;
      this.error = null;
      try {
        this.agents = await get<Agent[]>('/agents');
      } catch (e: any) {
        this.error = e?.message ?? 'Failed to fetch agents';
      } finally {
        this.loading = false;
      }
    },

    async create(payload: CreateAgentPayload) {
      const { post } = useApi();
      const created = await post<Agent>('/agents', payload);
      this.agents.push(created);
      return created;
    },
  },
});
