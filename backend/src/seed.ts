import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Logger } from '@nestjs/common';
import { Model } from 'mongoose';
import { AppModule } from './app.module';
import { Agent, AgentDocument } from './agents/schemas/agent.schema';
import {
  Transaction,
  TransactionDocument,
} from './transactions/schemas/transaction.schema';
import { CommissionService } from './commission/commission.service';
import {
  STAGE_ORDER,
  TransactionStage,
} from './transactions/stage-transitions';

const AGENTS = [
  {
    name: 'Jane Smith',
    email: 'jane.smith@estate-agency.com',
    phone: '+1 555 1001',
  },
  {
    name: 'Michael Chen',
    email: 'michael.chen@estate-agency.com',
    phone: '+1 555 1002',
  },
  {
    name: 'Sofia Rodriguez',
    email: 'sofia.rodriguez@estate-agency.com',
    phone: '+1 555 1003',
  },
];

interface SeedTxn {
  propertyAddress: string;
  salePrice: number;
  totalServiceFee: number;
  listingIdx: number;
  sellingIdx: number;
  finalStage: TransactionStage;
}

const TRANSACTIONS: SeedTxn[] = [
  {
    propertyAddress: '742 Evergreen Terrace, Springfield, IL',
    salePrice: 525000,
    totalServiceFee: 21000,
    listingIdx: 0,
    sellingIdx: 1,
    finalStage: 'completed',
  },
  {
    propertyAddress: '1600 Pennsylvania Avenue, Washington, DC',
    salePrice: 1850000,
    totalServiceFee: 74000,
    listingIdx: 1,
    sellingIdx: 1,
    finalStage: 'completed',
  },
  {
    propertyAddress: '221B Baker Street Loft, New York, NY',
    salePrice: 975000,
    totalServiceFee: 39000,
    listingIdx: 2,
    sellingIdx: 0,
    finalStage: 'completed',
  },
  {
    propertyAddress: '77 Sunset Boulevard Penthouse, Los Angeles, CA',
    salePrice: 2450000,
    totalServiceFee: 98000,
    listingIdx: 0,
    sellingIdx: 2,
    finalStage: 'title_deed',
  },
  {
    propertyAddress: '12 Oak Ridge Lane, Austin, TX',
    salePrice: 685000,
    totalServiceFee: 27400,
    listingIdx: 1,
    sellingIdx: 2,
    finalStage: 'earnest_money',
  },
  {
    propertyAddress: '88 Harbor View Condo, Seattle, WA',
    salePrice: 820000,
    totalServiceFee: 32800,
    listingIdx: 2,
    sellingIdx: 2,
    finalStage: 'agreement',
  },
];

async function seed() {
  const logger = new Logger('Seed');
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  const agentModel = app.get<Model<AgentDocument>>(getModelToken(Agent.name));
  const txnModel = app.get<Model<TransactionDocument>>(
    getModelToken(Transaction.name),
  );
  const commission = app.get(CommissionService);

  logger.log('Clearing existing collections...');
  await Promise.all([agentModel.deleteMany({}), txnModel.deleteMany({})]);

  logger.log(`Inserting ${AGENTS.length} agents...`);
  const agents = await agentModel.insertMany(AGENTS);

  logger.log(`Inserting ${TRANSACTIONS.length} transactions...`);
  for (const seed of TRANSACTIONS) {
    const listing = agents[seed.listingIdx];
    const selling = agents[seed.sellingIdx];
    const finalIdx = STAGE_ORDER.indexOf(seed.finalStage);
    const baseDate = new Date();
    baseDate.setDate(
      baseDate.getDate() -
        (TRANSACTIONS.length - TRANSACTIONS.indexOf(seed)) * 3,
    );

    const stageHistory = STAGE_ORDER.slice(0, finalIdx + 1).map((stage, i) => ({
      stage,
      timestamp: new Date(baseDate.getTime() + i * 86400000),
    }));

    const breakdown =
      seed.finalStage === 'completed'
        ? commission.calculate(
            seed.totalServiceFee,
            String(listing._id),
            String(selling._id),
          )
        : null;

    await txnModel.create({
      propertyAddress: seed.propertyAddress,
      salePrice: seed.salePrice,
      totalServiceFee: seed.totalServiceFee,
      listingAgentId: listing._id,
      sellingAgentId: selling._id,
      stage: seed.finalStage,
      stageHistory,
      commissionBreakdown: breakdown,
    });
  }

  logger.log('Seed complete.');
  logger.log(`  ${AGENTS.length} agents`);
  logger.log(`  ${TRANSACTIONS.length} transactions`);
  logger.log(
    `  ${TRANSACTIONS.filter((t) => t.finalStage === 'completed').length} completed with commission`,
  );

  await app.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
