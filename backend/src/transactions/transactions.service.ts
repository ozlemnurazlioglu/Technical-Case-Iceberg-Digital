import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CommissionService } from '../commission/commission.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { Transaction, TransactionDocument } from './schemas/transaction.schema';
import { getNextStage } from './stage-transitions';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    private commissionService: CommissionService,
  ) {}

  async create(dto: CreateTransactionDto): Promise<TransactionDocument> {
    return new (this.transactionModel as any)({
      ...dto,
      stage: 'agreement',
      stageHistory: [{ stage: 'agreement', timestamp: new Date() }],
      commissionBreakdown: null,
    }).save();
  }

  async findAll(stage?: string): Promise<TransactionDocument[]> {
    const filter = stage ? { stage } : {};
    return this.transactionModel.find(filter).exec();
  }

  async findOne(id: string): Promise<TransactionDocument> {
    const txn = await this.transactionModel.findById(id).exec();
    if (!txn) throw new NotFoundException(`Transaction ${id} not found`);
    return txn;
  }

  async advanceStage(id: string): Promise<TransactionDocument> {
    const txn = await this.findOne(id);
    const nextStage = getNextStage(txn.stage);
    if (!nextStage) {
      throw new BadRequestException(
        `Transaction is already at final stage: ${txn.stage}`,
      );
    }

    txn.stage = nextStage;
    txn.stageHistory.push({ stage: nextStage, timestamp: new Date() });

    if (nextStage === 'completed') {
      txn.commissionBreakdown = this.commissionService.calculate(
        txn.totalServiceFee,
        txn.listingAgentId.toString(),
        txn.sellingAgentId.toString(),
      );
    }

    return txn.save();
  }
}
