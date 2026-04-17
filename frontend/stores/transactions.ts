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
      const toast = useToast();
      try {
        const created = await post<Transaction>('/transactions', payload);
        this.transactions.unshift(created);
        toast.success('Transaction created');
        return created;
      } catch (e: any) {
        toast.error(e?.data?.message ?? e?.message ?? 'Failed to create transaction');
        throw e;
      }
    },

    async advanceStage(id: string) {
      const { patch } = useApi();
      const toast = useToast();
      try {
        const updated = await patch<Transaction>(`/transactions/${id}/stage`);
        this.current = updated;
        const idx = this.transactions.findIndex((t) => t._id === id);
        if (idx !== -1) this.transactions[idx] = updated;
        if (updated.stage === 'completed') {
          toast.success('Transaction completed — commission distributed');
        } else {
          toast.info(`Advanced to ${updated.stage.replace(/_/g, ' ')}`);
        }
        return updated;
      } catch (e: any) {
        toast.error(e?.data?.message ?? e?.message ?? 'Failed to advance stage');
        throw e;
      }
    },
  },

  getters: {
    byStage: (state) => (stage: string) =>
      state.transactions.filter((t) => t.stage === stage),
  },
});
