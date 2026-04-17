import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ReportsService } from '../src/reports/reports.service';
import { Agent } from '../src/agents/schemas/agent.schema';
import { Transaction } from '../src/transactions/schemas/transaction.schema';

function mockQuery<T>(result: T) {
  return { lean: () => ({ exec: jest.fn().mockResolvedValue(result) }) };
}

describe('ReportsService', () => {
  let service: ReportsService;
  let txnModel: any;
  let agentModel: any;

  const agents = [
    { _id: 'a1', name: 'Alice', email: 'a@x.com' },
    { _id: 'a2', name: 'Bob', email: 'b@x.com' },
    { _id: 'a3', name: 'Carol', email: 'c@x.com' },
  ];

  const completedDiff = {
    _id: 't1',
    stage: 'completed',
    totalServiceFee: 10000,
    listingAgentId: 'a1',
    sellingAgentId: 'a2',
    commissionBreakdown: {
      agencyAmount: 5000,
      listingAgentAmount: 2500,
      sellingAgentAmount: 2500,
    },
  };

  const completedSame = {
    _id: 't2',
    stage: 'completed',
    totalServiceFee: 8000,
    listingAgentId: 'a1',
    sellingAgentId: 'a1',
    commissionBreakdown: {
      agencyAmount: 4000,
      listingAgentAmount: 4000,
      sellingAgentAmount: 0,
    },
  };

  const active = {
    _id: 't3',
    stage: 'earnest_money',
    totalServiceFee: 5000,
    listingAgentId: 'a2',
    sellingAgentId: 'a3',
    commissionBreakdown: null,
  };

  beforeEach(async () => {
    txnModel = { find: jest.fn() };
    agentModel = { find: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: getModelToken(Transaction.name), useValue: txnModel },
        { provide: getModelToken(Agent.name), useValue: agentModel },
      ],
    }).compile();

    service = module.get(ReportsService);
  });

  describe('summary', () => {
    it('aggregates completed and active correctly', async () => {
      txnModel.find.mockReturnValue(
        mockQuery([completedDiff, completedSame, active]),
      );

      const result = await service.summary();

      expect(result.totalTransactions).toBe(3);
      expect(result.completedTransactions).toBe(2);
      expect(result.activeTransactions).toBe(1);
      expect(result.totalAgencyEarnings).toBe(9000);
      expect(result.totalAgentEarnings).toBe(9000);
      expect(result.completedValue).toBe(18000);
      expect(result.pipelineValue).toBe(5000);
    });

    it('stageDistribution counts every stage', async () => {
      txnModel.find.mockReturnValue(
        mockQuery([completedDiff, completedSame, active]),
      );

      const result = await service.summary();

      expect(result.stageDistribution.completed).toBe(2);
      expect(result.stageDistribution.earnest_money).toBe(1);
      expect(result.stageDistribution.agreement).toBe(0);
      expect(result.stageDistribution.title_deed).toBe(0);
    });

    it('returns zeros for empty database', async () => {
      txnModel.find.mockReturnValue(mockQuery([]));

      const result = await service.summary();

      expect(result.totalTransactions).toBe(0);
      expect(result.totalAgencyEarnings).toBe(0);
      expect(result.totalAgentEarnings).toBe(0);
    });
  });

  describe('agentEarnings', () => {
    it('ranks agents by total earnings and includes all agents', async () => {
      agentModel.find.mockReturnValue(mockQuery(agents));
      txnModel.find.mockReturnValue(mockQuery([completedDiff, completedSame]));

      const result = await service.agentEarnings();

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('Alice');
      expect(result[0].totalEarnings).toBe(6500);
      expect(result[0].asListing).toBe(6500);
      expect(result[0].asSelling).toBe(0);
      expect(result[0].completedTransactions).toBe(2);

      const bob = result.find((a) => a.name === 'Bob')!;
      expect(bob.totalEarnings).toBe(2500);
      expect(bob.asSelling).toBe(2500);
      expect(bob.asListing).toBe(0);
      expect(bob.completedTransactions).toBe(1);

      const carol = result.find((a) => a.name === 'Carol')!;
      expect(carol.totalEarnings).toBe(0);
      expect(carol.completedTransactions).toBe(0);
    });

    it('same-agent transaction only counts once for that agent', async () => {
      agentModel.find.mockReturnValue(mockQuery([agents[0]]));
      txnModel.find.mockReturnValue(mockQuery([completedSame]));

      const result = await service.agentEarnings();

      expect(result[0].completedTransactions).toBe(1);
      expect(result[0].totalEarnings).toBe(4000);
      expect(result[0].asListing).toBe(4000);
      expect(result[0].asSelling).toBe(0);
    });
  });
});
