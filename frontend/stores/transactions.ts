import { defineStore } from 'pinia';
import type { Transaction, CreateTransactionPayload } from '~/types';

export const useTransactionsStore = defineStore('transactions', {
  state: () => ({
    transactions: [] as Transaction[],
    current: null as Transaction | null,
    loading: false,
    error: null as string | null,
  }),

  actions: {
    async fetchAll(stage?: string) {
      const { get } = useApi();
      this.loading = true;
      this.error = null;
      try {
        const query = stage ? `?stage=${stage}` : '';
        this.transactions = await get<Transaction[]>(`/transactions${query}`);
      } catch (e: any) {
        this.error = e?.message ?? 'Failed to fetch transactions';
      } finally {
        this.loading = false;
      }
    },

    async fetchOne(id: string) {
      const { get } = useApi();
      this.loading = true;
      this.error = null;
      try {
        this.current = await get<Transaction>(`/transactions/${id}`);
      } catch (e: any) {
        this.error = e?.message ?? 'Failed to fetch transaction';
      } finally {
        this.loading = false;
      }
    },

    async create(payload: CreateTransactionPayload) {
      const { post } = useApi();
      const created = await post<Transaction>('/transactions', payload);
      this.transactions.unshift(created);
      return created;
    },

    async advanceStage(id: string) {
      const { patch } = useApi();
      const updated = await patch<Transaction>(`/transactions/${id}/stage`);
      this.current = updated;
      const idx = this.transactions.findIndex((t) => t._id === id);
      if (idx !== -1) this.transactions[idx] = updated;
      return updated;
    },
  },

  getters: {
    byStage: (state) => (stage: string) =>
      state.transactions.filter((t) => t.stage === stage),
  },
});
