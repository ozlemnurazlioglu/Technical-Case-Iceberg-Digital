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
      const toast = useToast();
      try {
        const created = await post<Agent>('/agents', payload);
        this.agents.push(created);
        toast.success(`Agent "${created.name}" added`);
        return created;
      } catch (e: any) {
        const status = e?.statusCode ?? e?.response?.status;
        const message =
          status === 409
            ? 'An agent with that email already exists'
            : e?.data?.message ?? e?.message ?? 'Failed to create agent';
        toast.error(message);
        throw e;
      }
    },
  },
});
