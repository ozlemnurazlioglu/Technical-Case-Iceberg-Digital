export type TransactionStage = 'agreement' | 'earnest_money' | 'title_deed' | 'completed';

export interface Agent {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
}

export interface CommissionBreakdown {
  agencyAmount: number;
  listingAgentAmount: number;
  sellingAgentAmount: number;
}

export interface Transaction {
  _id: string;
  propertyAddress: string;
  salePrice: number;
  totalServiceFee: number;
  stage: TransactionStage;
  listingAgentId: string;
  sellingAgentId: string;
  commissionBreakdown: CommissionBreakdown | null;
  stageHistory: { stage: string; timestamp: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionPayload {
  propertyAddress: string;
  salePrice: number;
  totalServiceFee: number;
  listingAgentId: string;
  sellingAgentId: string;
}

export interface CreateAgentPayload {
  name: string;
  email: string;
  phone?: string;
}

export interface ReportsSummary {
  totalTransactions: number;
  activeTransactions: number;
  completedTransactions: number;
  totalAgencyEarnings: number;
  totalAgentEarnings: number;
  pipelineValue: number;
  completedValue: number;
  stageDistribution: Record<TransactionStage, number>;
}

export interface AgentEarning {
  agentId: string;
  name: string;
  email: string;
  completedTransactions: number;
  totalEarnings: number;
  asListing: number;
  asSelling: number;
}
