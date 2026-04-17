import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TransactionsService } from '../src/transactions/transactions.service';
import { CommissionService } from '../src/commission/commission.service';
import { AgentsService } from '../src/agents/agents.service';
import { Transaction } from '../src/transactions/schemas/transaction.schema';

const mockCommissionService = {
  calculate: jest.fn().mockReturnValue({
    agencyAmount: 5000,
    listingAgentAmount: 2500,
    sellingAgentAmount: 2500,
  }),
};

const mockAgentsService = {
  findOne: jest.fn().mockResolvedValue({ _id: 'agent', name: 'Mock' }),
};

function makeMockTransaction(overrides: Partial<any> = {}) {
  return {
    _id: 'txn-1',
    stage: 'agreement',
    stageHistory: [] as { stage: string; timestamp: Date }[],
    totalServiceFee: 10000,
    listingAgentId: 'agent-a',
    sellingAgentId: 'agent-b',
    commissionBreakdown: null,
    save: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('TransactionsService', () => {
  let service: TransactionsService;
  let mockModel: any;

  beforeEach(async () => {
    mockModel = {
      find: jest.fn(),
      findById: jest.fn(),
    };
    mockModel.find.mockReturnValue({ exec: jest.fn().mockResolvedValue([]) });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: getModelToken(Transaction.name), useValue: mockModel },
        { provide: CommissionService, useValue: mockCommissionService },
        { provide: AgentsService, useValue: mockAgentsService },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
  });

  describe('advanceStage', () => {
    it('advances from agreement to earnest_money', async () => {
      const txn = makeMockTransaction({ stage: 'agreement' });
      txn.save.mockResolvedValue({ ...txn, stage: 'earnest_money' });
      mockModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(txn),
      });

      await service.advanceStage('txn-1');

      expect(txn.stage).toBe('earnest_money');
      expect(txn.stageHistory).toHaveLength(1);
      expect(txn.stageHistory[0].stage).toBe('earnest_money');
    });

    it('embeds commission breakdown when advancing to completed', async () => {
      const txn = makeMockTransaction({ stage: 'title_deed' });
      txn.save.mockResolvedValue(txn);
      mockModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(txn),
      });

      await service.advanceStage('txn-1');

      expect(mockCommissionService.calculate).toHaveBeenCalledWith(
        10000,
        'agent-a',
        'agent-b',
      );
      expect(txn.commissionBreakdown).toEqual({
        agencyAmount: 5000,
        listingAgentAmount: 2500,
        sellingAgentAmount: 2500,
      });
    });

    it('throws BadRequestException when already at completed', async () => {
      const txn = makeMockTransaction({ stage: 'completed' });
      mockModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(txn),
      });

      await expect(service.advanceStage('txn-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws NotFoundException when transaction not found', async () => {
      mockModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.advanceStage('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
