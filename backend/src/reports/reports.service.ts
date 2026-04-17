import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Agent, AgentDocument } from '../agents/schemas/agent.schema';
import {
  Transaction,
  TransactionDocument,
} from '../transactions/schemas/transaction.schema';
import {
  STAGE_ORDER,
  TransactionStage,
} from '../transactions/stage-transitions';

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

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Transaction.name) private txnModel: Model<TransactionDocument>,
    @InjectModel(Agent.name) private agentModel: Model<AgentDocument>,
  ) {}

  async summary(): Promise<ReportsSummary> {
    const txns = await this.txnModel.find().lean().exec();

    const stageDistribution = STAGE_ORDER.reduce(
      (acc, s) => ({ ...acc, [s]: 0 }),
      {} as Record<TransactionStage, number>,
    );

    let totalAgencyEarnings = 0;
    let totalAgentEarnings = 0;
    let pipelineValue = 0;
    let completedValue = 0;
    let completedTransactions = 0;

    for (const t of txns) {
      stageDistribution[t.stage] = (stageDistribution[t.stage] ?? 0) + 1;

      if (t.stage === 'completed' && t.commissionBreakdown) {
        completedTransactions += 1;
        completedValue += t.totalServiceFee ?? 0;
        totalAgencyEarnings += t.commissionBreakdown.agencyAmount ?? 0;
        totalAgentEarnings +=
          (t.commissionBreakdown.listingAgentAmount ?? 0) +
          (t.commissionBreakdown.sellingAgentAmount ?? 0);
      } else {
        pipelineValue += t.totalServiceFee ?? 0;
      }
    }

    return {
      totalTransactions: txns.length,
      activeTransactions: txns.length - completedTransactions,
      completedTransactions,
      totalAgencyEarnings,
      totalAgentEarnings,
      pipelineValue,
      completedValue,
      stageDistribution,
    };
  }

  async agentEarnings(): Promise<AgentEarning[]> {
    const [agents, completedTxns] = await Promise.all([
      this.agentModel.find().lean().exec(),
      this.txnModel.find({ stage: 'completed' }).lean().exec(),
    ]);

    const byAgent = new Map<
      string,
      { completed: number; total: number; listing: number; selling: number }
    >();

    for (const a of agents) {
      byAgent.set(String(a._id), {
        completed: 0,
        total: 0,
        listing: 0,
        selling: 0,
      });
    }

    for (const t of completedTxns) {
      if (!t.commissionBreakdown) continue;
      const listingId = String(t.listingAgentId);
      const sellingId = String(t.sellingAgentId);
      const { listingAgentAmount, sellingAgentAmount } = t.commissionBreakdown;

      const listingEntry = byAgent.get(listingId);
      if (listingEntry) {
        listingEntry.listing += listingAgentAmount ?? 0;
        listingEntry.total += listingAgentAmount ?? 0;
        listingEntry.completed += 1;
      }

      if (sellingId !== listingId) {
        const sellingEntry = byAgent.get(sellingId);
        if (sellingEntry) {
          sellingEntry.selling += sellingAgentAmount ?? 0;
          sellingEntry.total += sellingAgentAmount ?? 0;
          sellingEntry.completed += 1;
        }
      }
    }

    return agents
      .map((a) => {
        const e = byAgent.get(String(a._id))!;
        return {
          agentId: String(a._id),
          name: a.name,
          email: a.email,
          completedTransactions: e.completed,
          totalEarnings: e.total,
          asListing: e.listing,
          asSelling: e.selling,
        };
      })
      .sort((a, b) => b.totalEarnings - a.totalEarnings);
  }
}
