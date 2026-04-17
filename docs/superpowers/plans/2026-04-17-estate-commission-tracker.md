# Estate Commission Tracker — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a monorepo full-stack app (NestJS backend + Nuxt 3 frontend) that tracks real-estate transaction lifecycles and auto-distributes commission between agency and agents.

**Architecture:** Simple layered architecture — Controllers → Services → Mongoose models. Commission breakdown is computed as a pure function and embedded in the transaction document when it reaches `completed`. Frontend consumes the REST API via a Pinia store + `useApi` composable.

**Tech Stack:** NestJS 10, TypeScript, Mongoose, MongoDB Atlas, Jest (backend) · Nuxt 3, Pinia, Tailwind CSS (frontend) · Railway (backend deploy) · Vercel (frontend deploy)

---

## File Map

```
estate-commission-tracker/
├── backend/
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── commission/
│   │   │   ├── commission.module.ts
│   │   │   └── commission.service.ts
│   │   ├── agents/
│   │   │   ├── agents.module.ts
│   │   │   ├── agents.controller.ts
│   │   │   ├── agents.service.ts
│   │   │   ├── schemas/agent.schema.ts
│   │   │   └── dto/create-agent.dto.ts
│   │   └── transactions/
│   │       ├── transactions.module.ts
│   │       ├── transactions.controller.ts
│   │       ├── transactions.service.ts
│   │       ├── stage-transitions.ts
│   │       ├── schemas/transaction.schema.ts
│   │       └── dto/create-transaction.dto.ts
│   ├── test/
│   │   ├── commission.service.spec.ts
│   │   ├── stage-transitions.spec.ts
│   │   └── transactions.service.spec.ts
│   └── .env.example
├── frontend/
│   ├── nuxt.config.ts
│   ├── types/index.ts
│   ├── composables/useApi.ts
│   ├── stores/
│   │   ├── transactions.ts
│   │   └── agents.ts
│   ├── pages/
│   │   ├── index.vue
│   │   ├── transactions/[id].vue
│   │   └── agents/index.vue
│   └── components/
│       ├── TransactionCard.vue
│       ├── StageProgress.vue
│       └── CommissionBreakdown.vue
├── README.md
└── DESIGN.md
```

---

## Task 1: Monorepo Init

**Files:**
- Create: `README.md` (root)
- Create: `.gitignore` (root)

- [ ] **Step 1: Init git repo**

```bash
cd "C:\Users\PC\Desktop\Technical Case Iceberg Digital"
git init
```

Expected: `Initialized empty Git repository in ...`

- [ ] **Step 2: Create root .gitignore**

Create file `.gitignore` at repo root:

```
node_modules/
dist/
.env
.nuxt/
.output/
```

- [ ] **Step 3: Commit**

```bash
git add .gitignore
git commit -m "chore: init monorepo"
```

---

## Task 2: Backend Scaffold

**Files:**
- Create: `backend/` (NestJS scaffold)
- Create: `backend/.env.example`

- [ ] **Step 1: Scaffold NestJS project**

```bash
cd "C:\Users\PC\Desktop\Technical Case Iceberg Digital"
npx @nestjs/cli new backend --package-manager npm --skip-git
```

When prompted for package manager, confirm `npm`. This creates `backend/` with src/, test/, package.json, tsconfig.json.

- [ ] **Step 2: Install additional dependencies**

```bash
cd backend
npm install @nestjs/mongoose mongoose @nestjs/config class-validator class-transformer
```

- [ ] **Step 3: Create .env.example**

Create `backend/.env.example`:

```
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/estate-commission
PORT=3001
```

- [ ] **Step 4: Create .env from example**

```bash
cp backend/.env.example backend/.env
```

Then open `backend/.env` and fill in the real MongoDB Atlas URI.

- [ ] **Step 5: Commit**

```bash
cd "C:\Users\PC\Desktop\Technical Case Iceberg Digital"
git add backend/
git commit -m "chore: scaffold NestJS backend"
```

---

## Task 3: Commission Service (TDD)

**Files:**
- Create: `backend/src/commission/commission.service.ts`
- Create: `backend/src/commission/commission.module.ts`
- Create: `backend/test/commission.service.spec.ts`

- [ ] **Step 1: Write failing test**

Create `backend/test/commission.service.spec.ts`:

```typescript
import { CommissionService } from '../src/commission/commission.service';

describe('CommissionService', () => {
  let service: CommissionService;

  beforeEach(() => {
    service = new CommissionService();
  });

  it('agency always receives 50% of totalServiceFee', () => {
    const result = service.calculate(10000, 'agent-a', 'agent-b');
    expect(result.agencyAmount).toBe(5000);
  });

  it('Scenario 1: same agent receives 50% (full agent pool)', () => {
    const result = service.calculate(10000, 'agent-a', 'agent-a');
    expect(result.listingAgentAmount).toBe(5000);
    expect(result.sellingAgentAmount).toBe(0);
  });

  it('Scenario 2: different agents each receive 25%', () => {
    const result = service.calculate(10000, 'agent-a', 'agent-b');
    expect(result.listingAgentAmount).toBe(2500);
    expect(result.sellingAgentAmount).toBe(2500);
  });

  it('all amounts sum to totalServiceFee', () => {
    const result = service.calculate(10000, 'agent-a', 'agent-b');
    const sum = result.agencyAmount + result.listingAgentAmount + result.sellingAgentAmount;
    expect(sum).toBe(10000);
  });

  it('all amounts sum to totalServiceFee (same agent)', () => {
    const result = service.calculate(8000, 'agent-a', 'agent-a');
    const sum = result.agencyAmount + result.listingAgentAmount + result.sellingAgentAmount;
    expect(sum).toBe(8000);
  });
});
```

- [ ] **Step 2: Run test — expect failure**

```bash
cd backend
npx jest test/commission.service.spec.ts --no-coverage
```

Expected: FAIL — `Cannot find module '../src/commission/commission.service'`

- [ ] **Step 3: Implement CommissionService**

Create `backend/src/commission/commission.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';

export interface CommissionBreakdown {
  agencyAmount: number;
  listingAgentAmount: number;
  sellingAgentAmount: number;
}

@Injectable()
export class CommissionService {
  calculate(
    totalServiceFee: number,
    listingAgentId: string,
    sellingAgentId: string,
  ): CommissionBreakdown {
    const agencyAmount = totalServiceFee * 0.5;
    const agentPool = totalServiceFee * 0.5;

    if (listingAgentId === sellingAgentId) {
      return { agencyAmount, listingAgentAmount: agentPool, sellingAgentAmount: 0 };
    }

    return {
      agencyAmount,
      listingAgentAmount: agentPool * 0.5,
      sellingAgentAmount: agentPool * 0.5,
    };
  }
}
```

Create `backend/src/commission/commission.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { CommissionService } from './commission.service';

@Module({
  providers: [CommissionService],
  exports: [CommissionService],
})
export class CommissionModule {}
```

- [ ] **Step 4: Run test — expect pass**

```bash
npx jest test/commission.service.spec.ts --no-coverage
```

Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
cd "C:\Users\PC\Desktop\Technical Case Iceberg Digital"
git add backend/src/commission/ backend/test/commission.service.spec.ts
git commit -m "feat: add CommissionService with 50/50 policy"
```

---

## Task 4: Stage Transitions Utility (TDD)

**Files:**
- Create: `backend/src/transactions/stage-transitions.ts`
- Create: `backend/test/stage-transitions.spec.ts`

- [ ] **Step 1: Write failing test**

Create `backend/test/stage-transitions.spec.ts`:

```typescript
import { getNextStage, STAGE_ORDER } from '../src/transactions/stage-transitions';

describe('getNextStage', () => {
  it('advances agreement → earnest_money', () => {
    expect(getNextStage('agreement')).toBe('earnest_money');
  });

  it('advances earnest_money → title_deed', () => {
    expect(getNextStage('earnest_money')).toBe('title_deed');
  });

  it('advances title_deed → completed', () => {
    expect(getNextStage('title_deed')).toBe('completed');
  });

  it('returns null when already at completed', () => {
    expect(getNextStage('completed')).toBeNull();
  });

  it('STAGE_ORDER has exactly 4 stages', () => {
    expect(STAGE_ORDER).toHaveLength(4);
  });
});
```

- [ ] **Step 2: Run test — expect failure**

```bash
cd backend
npx jest test/stage-transitions.spec.ts --no-coverage
```

Expected: FAIL — `Cannot find module`

- [ ] **Step 3: Implement stage-transitions.ts**

Create `backend/src/transactions/stage-transitions.ts`:

```typescript
export const STAGE_ORDER = [
  'agreement',
  'earnest_money',
  'title_deed',
  'completed',
] as const;

export type TransactionStage = (typeof STAGE_ORDER)[number];

export function getNextStage(current: TransactionStage): TransactionStage | null {
  const idx = STAGE_ORDER.indexOf(current);
  if (idx === -1 || idx === STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[idx + 1];
}
```

- [ ] **Step 4: Run test — expect pass**

```bash
npx jest test/stage-transitions.spec.ts --no-coverage
```

Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
cd "C:\Users\PC\Desktop\Technical Case Iceberg Digital"
git add backend/src/transactions/stage-transitions.ts backend/test/stage-transitions.spec.ts
git commit -m "feat: add stage transition utility with tests"
```

---

## Task 5: Agent Schema + Module

**Files:**
- Create: `backend/src/agents/schemas/agent.schema.ts`
- Create: `backend/src/agents/dto/create-agent.dto.ts`
- Create: `backend/src/agents/agents.service.ts`
- Create: `backend/src/agents/agents.controller.ts`
- Create: `backend/src/agents/agents.module.ts`

- [ ] **Step 1: Create Agent schema**

Create `backend/src/agents/schemas/agent.schema.ts`:

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AgentDocument = Agent & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Agent {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  phone?: string;
}

export const AgentSchema = SchemaFactory.createForClass(Agent);
```

- [ ] **Step 2: Create CreateAgentDto**

Create `backend/src/agents/dto/create-agent.dto.ts`:

```typescript
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAgentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  phone?: string;
}
```

- [ ] **Step 3: Create AgentsService**

Create `backend/src/agents/agents.service.ts`:

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Agent, AgentDocument } from './schemas/agent.schema';
import { CreateAgentDto } from './dto/create-agent.dto';

@Injectable()
export class AgentsService {
  constructor(@InjectModel(Agent.name) private agentModel: Model<AgentDocument>) {}

  async create(dto: CreateAgentDto): Promise<AgentDocument> {
    return new this.agentModel(dto).save();
  }

  async findAll(): Promise<AgentDocument[]> {
    return this.agentModel.find().exec();
  }

  async findOne(id: string): Promise<AgentDocument> {
    const agent = await this.agentModel.findById(id).exec();
    if (!agent) throw new NotFoundException(`Agent ${id} not found`);
    return agent;
  }
}
```

- [ ] **Step 4: Create AgentsController**

Create `backend/src/agents/agents.controller.ts`:

```typescript
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AgentsService } from './agents.service';
import { CreateAgentDto } from './dto/create-agent.dto';

@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Post()
  create(@Body() dto: CreateAgentDto) {
    return this.agentsService.create(dto);
  }

  @Get()
  findAll() {
    return this.agentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.agentsService.findOne(id);
  }
}
```

- [ ] **Step 5: Create AgentsModule**

Create `backend/src/agents/agents.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';
import { Agent, AgentSchema } from './schemas/agent.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Agent.name, schema: AgentSchema }])],
  controllers: [AgentsController],
  providers: [AgentsService],
  exports: [AgentsService],
})
export class AgentsModule {}
```

- [ ] **Step 6: Commit**

```bash
cd "C:\Users\PC\Desktop\Technical Case Iceberg Digital"
git add backend/src/agents/
git commit -m "feat: add agents module with CRUD"
```

---

## Task 6: Transaction Schema + DTO

**Files:**
- Create: `backend/src/transactions/schemas/transaction.schema.ts`
- Create: `backend/src/transactions/dto/create-transaction.dto.ts`

- [ ] **Step 1: Create Transaction schema**

Create `backend/src/transactions/schemas/transaction.schema.ts`:

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TransactionStage } from '../stage-transitions';

export type TransactionDocument = Transaction & Document;

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ required: true })
  propertyAddress: string;

  @Prop({ required: true })
  salePrice: number;

  @Prop({ required: true })
  totalServiceFee: number;

  @Prop({
    required: true,
    enum: ['agreement', 'earnest_money', 'title_deed', 'completed'],
    default: 'agreement',
  })
  stage: TransactionStage;

  @Prop({ type: Types.ObjectId, ref: 'Agent', required: true })
  listingAgentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Agent', required: true })
  sellingAgentId: Types.ObjectId;

  @Prop({
    type: {
      agencyAmount: Number,
      listingAgentAmount: Number,
      sellingAgentAmount: Number,
    },
    default: null,
  })
  commissionBreakdown: {
    agencyAmount: number;
    listingAgentAmount: number;
    sellingAgentAmount: number;
  } | null;

  @Prop({
    type: [{ stage: String, timestamp: Date }],
    default: [],
  })
  stageHistory: { stage: string; timestamp: Date }[];
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
```

- [ ] **Step 2: Create CreateTransactionDto**

Create `backend/src/transactions/dto/create-transaction.dto.ts`:

```typescript
import { IsMongoId, IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class CreateTransactionDto {
  @IsString()
  @IsNotEmpty()
  propertyAddress: string;

  @IsNumber()
  @IsPositive()
  salePrice: number;

  @IsNumber()
  @IsPositive()
  totalServiceFee: number;

  @IsMongoId()
  listingAgentId: string;

  @IsMongoId()
  sellingAgentId: string;
}
```

- [ ] **Step 3: Commit**

```bash
cd "C:\Users\PC\Desktop\Technical Case Iceberg Digital"
git add backend/src/transactions/schemas/ backend/src/transactions/dto/
git commit -m "feat: add transaction schema and DTO"
```

---

## Task 7: TransactionsService (TDD)

**Files:**
- Create: `backend/src/transactions/transactions.service.ts`
- Create: `backend/test/transactions.service.spec.ts`

- [ ] **Step 1: Write failing tests**

Create `backend/test/transactions.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TransactionsService } from '../src/transactions/transactions.service';
import { CommissionService } from '../src/commission/commission.service';
import { Transaction } from '../src/transactions/schemas/transaction.schema';

const mockCommissionService = {
  calculate: jest.fn().mockReturnValue({
    agencyAmount: 5000,
    listingAgentAmount: 2500,
    sellingAgentAmount: 2500,
  }),
};

function makeMockTransaction(overrides: Partial<any> = {}) {
  return {
    _id: 'txn-1',
    stage: 'agreement',
    stageHistory: [],
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
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
  });

  describe('advanceStage', () => {
    it('advances from agreement to earnest_money', async () => {
      const txn = makeMockTransaction({ stage: 'agreement' });
      txn.save.mockResolvedValue({ ...txn, stage: 'earnest_money' });
      mockModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(txn) });

      await service.advanceStage('txn-1');

      expect(txn.stage).toBe('earnest_money');
      expect(txn.stageHistory).toHaveLength(1);
      expect(txn.stageHistory[0].stage).toBe('earnest_money');
    });

    it('embeds commission breakdown when advancing to completed', async () => {
      const txn = makeMockTransaction({ stage: 'title_deed' });
      txn.save.mockResolvedValue(txn);
      mockModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(txn) });

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
      mockModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(txn) });

      await expect(service.advanceStage('txn-1')).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when transaction not found', async () => {
      mockModel.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      await expect(service.advanceStage('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
```

- [ ] **Step 2: Run test — expect failure**

```bash
cd backend
npx jest test/transactions.service.spec.ts --no-coverage
```

Expected: FAIL — `Cannot find module '../src/transactions/transactions.service'`

- [ ] **Step 3: Implement TransactionsService**

Create `backend/src/transactions/transactions.service.ts`:

```typescript
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
```

- [ ] **Step 4: Run test — expect pass**

```bash
npx jest test/transactions.service.spec.ts --no-coverage
```

Expected: PASS (4 tests)

- [ ] **Step 5: Run all backend tests**

```bash
npx jest --no-coverage
```

Expected: All tests pass (commission + stage-transitions + transactions)

- [ ] **Step 6: Commit**

```bash
cd "C:\Users\PC\Desktop\Technical Case Iceberg Digital"
git add backend/src/transactions/transactions.service.ts backend/test/transactions.service.spec.ts
git commit -m "feat: add TransactionsService with stage transitions and commission embedding"
```

---

## Task 8: TransactionsController + TransactionsModule

**Files:**
- Create: `backend/src/transactions/transactions.controller.ts`
- Create: `backend/src/transactions/transactions.module.ts`

- [ ] **Step 1: Create TransactionsController**

Create `backend/src/transactions/transactions.controller.ts`:

```typescript
import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionsService } from './transactions.service';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  create(@Body() dto: CreateTransactionDto) {
    return this.transactionsService.create(dto);
  }

  @Get()
  findAll(@Query('stage') stage?: string) {
    return this.transactionsService.findAll(stage);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(id);
  }

  @Patch(':id/stage')
  advanceStage(@Param('id') id: string) {
    return this.transactionsService.advanceStage(id);
  }

  @Get(':id/commission')
  getCommission(@Param('id') id: string) {
    return this.transactionsService.findOne(id).then((t) => t.commissionBreakdown);
  }
}
```

- [ ] **Step 2: Create TransactionsModule**

Create `backend/src/transactions/transactions.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommissionModule } from '../commission/commission.module';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { Transaction, TransactionSchema } from './schemas/transaction.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Transaction.name, schema: TransactionSchema }]),
    CommissionModule,
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService],
})
export class TransactionsModule {}
```

- [ ] **Step 3: Commit**

```bash
cd "C:\Users\PC\Desktop\Technical Case Iceberg Digital"
git add backend/src/transactions/transactions.controller.ts backend/src/transactions/transactions.module.ts
git commit -m "feat: add transactions controller and module"
```

---

## Task 9: App Module + main.ts Wiring

**Files:**
- Modify: `backend/src/app.module.ts`
- Modify: `backend/src/main.ts`

- [ ] **Step 1: Update app.module.ts**

Replace the contents of `backend/src/app.module.ts` with:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AgentsModule } from './agents/agents.module';
import { TransactionsModule } from './transactions/transactions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    AgentsModule,
    TransactionsModule,
  ],
})
export class AppModule {}
```

- [ ] **Step 2: Update main.ts**

Replace the contents of `backend/src/main.ts` with:

```typescript
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors();
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
```

- [ ] **Step 3: Run all tests to confirm nothing broken**

```bash
cd backend
npx jest --no-coverage
```

Expected: All tests pass.

- [ ] **Step 4: Start backend locally to verify it connects**

```bash
npm run start:dev
```

Expected: `Application is running on: http://localhost:3001` with no errors.  
Stop with `Ctrl+C`.

- [ ] **Step 5: Commit**

```bash
cd "C:\Users\PC\Desktop\Technical Case Iceberg Digital"
git add backend/src/app.module.ts backend/src/main.ts
git commit -m "feat: wire AppModule with MongoDB Atlas and validation pipe"
```

---

## Task 10: Frontend Scaffold

**Files:**
- Create: `frontend/` (Nuxt 3 scaffold)
- Modify: `frontend/nuxt.config.ts`

- [ ] **Step 1: Scaffold Nuxt 3 project**

```bash
cd "C:\Users\PC\Desktop\Technical Case Iceberg Digital"
npx nuxi@latest init frontend
```

Select defaults when prompted (or press Enter for all options). Choose `npm` as package manager.

- [ ] **Step 2: Install frontend dependencies**

```bash
cd frontend
npm install @pinia/nuxt @nuxtjs/tailwindcss
```

- [ ] **Step 3: Update nuxt.config.ts**

Replace contents of `frontend/nuxt.config.ts` with:

```typescript
export default defineNuxtConfig({
  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss'],
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3001',
    },
  },
  devtools: { enabled: true },
  compatibilityDate: '2024-11-01',
});
```

- [ ] **Step 4: Initialize Tailwind**

```bash
npx tailwindcss init
```

- [ ] **Step 5: Verify dev server starts**

```bash
npm run dev
```

Expected: `Nuxt 3 running at http://localhost:3000`. Stop with `Ctrl+C`.

- [ ] **Step 6: Commit**

```bash
cd "C:\Users\PC\Desktop\Technical Case Iceberg Digital"
git add frontend/
git commit -m "chore: scaffold Nuxt 3 frontend with Pinia and Tailwind"
```

---

## Task 11: Types + useApi + Pinia Stores

**Files:**
- Create: `frontend/types/index.ts`
- Create: `frontend/composables/useApi.ts`
- Create: `frontend/stores/transactions.ts`
- Create: `frontend/stores/agents.ts`

- [ ] **Step 1: Create shared types**

Create `frontend/types/index.ts`:

```typescript
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
```

- [ ] **Step 2: Create useApi composable**

Create `frontend/composables/useApi.ts`:

```typescript
export const useApi = () => {
  const config = useRuntimeConfig();
  const baseURL = config.public.apiBase as string;

  const get = <T>(path: string): Promise<T> =>
    $fetch<T>(`${baseURL}${path}`);

  const post = <T>(path: string, body: unknown): Promise<T> =>
    $fetch<T>(`${baseURL}${path}`, { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } });

  const patch = <T>(path: string): Promise<T> =>
    $fetch<T>(`${baseURL}${path}`, { method: 'PATCH' });

  return { get, post, patch };
};
```

- [ ] **Step 3: Create transactions Pinia store**

Create `frontend/stores/transactions.ts`:

```typescript
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
```

- [ ] **Step 4: Create agents Pinia store**

Create `frontend/stores/agents.ts`:

```typescript
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
```

- [ ] **Step 5: Commit**

```bash
cd "C:\Users\PC\Desktop\Technical Case Iceberg Digital"
git add frontend/types/ frontend/composables/ frontend/stores/
git commit -m "feat: add types, useApi composable, and Pinia stores"
```

---

## Task 12: Reusable Components

**Files:**
- Create: `frontend/components/TransactionCard.vue`
- Create: `frontend/components/StageProgress.vue`
- Create: `frontend/components/CommissionBreakdown.vue`

- [ ] **Step 1: Create TransactionCard component**

Create `frontend/components/TransactionCard.vue`:

```vue
<template>
  <NuxtLink
    :to="`/transactions/${transaction._id}`"
    class="block bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="font-semibold text-gray-900 truncate">{{ transaction.propertyAddress }}</p>
        <p class="text-sm text-gray-500 mt-1">Fee: {{ formatCurrency(transaction.totalServiceFee) }}</p>
      </div>
      <span :class="stageBadgeClass">{{ stageLabel }}</span>
    </div>
    <p class="text-xs text-gray-400 mt-3">{{ formatDate(transaction.createdAt) }}</p>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { Transaction, TransactionStage } from '~/types';

const props = defineProps<{ transaction: Transaction }>();

const STAGE_LABELS: Record<TransactionStage, string> = {
  agreement: 'Agreement',
  earnest_money: 'Earnest Money',
  title_deed: 'Title Deed',
  completed: 'Completed',
};

const STAGE_COLORS: Record<TransactionStage, string> = {
  agreement: 'bg-blue-100 text-blue-700',
  earnest_money: 'bg-yellow-100 text-yellow-700',
  title_deed: 'bg-orange-100 text-orange-700',
  completed: 'bg-green-100 text-green-700',
};

const stageLabel = computed(() => STAGE_LABELS[props.transaction.stage]);
const stageBadgeClass = computed(
  () => `text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${STAGE_COLORS[props.transaction.stage]}`,
);

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
</script>
```

- [ ] **Step 2: Create StageProgress component**

Create `frontend/components/StageProgress.vue`:

```vue
<template>
  <div class="flex items-center gap-0">
    <template v-for="(stage, i) in STAGES" :key="stage">
      <div class="flex flex-col items-center">
        <div
          :class="[
            'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors',
            isCompleted(stage) ? 'bg-green-500 text-white' : isCurrent(stage) ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-400',
          ]"
        >
          <span v-if="isCompleted(stage)">✓</span>
          <span v-else>{{ i + 1 }}</span>
        </div>
        <span class="text-xs mt-1 text-center w-20" :class="isCurrent(stage) ? 'text-blue-600 font-semibold' : 'text-gray-400'">
          {{ STAGE_LABELS[stage] }}
        </span>
      </div>
      <div v-if="i < STAGES.length - 1" :class="['flex-1 h-0.5 mb-5', isCompleted(STAGES[i + 1]) || isCurrent(STAGES[i + 1]) ? 'bg-blue-400' : 'bg-gray-200']" />
    </template>
  </div>
</template>

<script setup lang="ts">
import type { TransactionStage } from '~/types';

const props = defineProps<{ currentStage: TransactionStage }>();

const STAGES: TransactionStage[] = ['agreement', 'earnest_money', 'title_deed', 'completed'];

const STAGE_LABELS: Record<TransactionStage, string> = {
  agreement: 'Agreement',
  earnest_money: 'Earnest Money',
  title_deed: 'Title Deed',
  completed: 'Completed',
};

const currentIdx = computed(() => STAGES.indexOf(props.currentStage));
const isCompleted = (s: TransactionStage) => STAGES.indexOf(s) < currentIdx.value;
const isCurrent = (s: TransactionStage) => s === props.currentStage;
</script>
```

- [ ] **Step 3: Create CommissionBreakdown component**

Create `frontend/components/CommissionBreakdown.vue`:

```vue
<template>
  <div class="bg-gray-50 rounded-xl p-5 border border-gray-200">
    <h3 class="font-semibold text-gray-800 mb-4">Commission Breakdown</h3>
    <div v-if="breakdown" class="space-y-3">
      <div class="flex justify-between items-center py-2 border-b border-gray-200">
        <span class="text-gray-600">Agency (50%)</span>
        <span class="font-semibold text-gray-900">{{ fmt(breakdown.agencyAmount) }}</span>
      </div>
      <div class="flex justify-between items-center py-2 border-b border-gray-200">
        <span class="text-gray-600">Listing Agent</span>
        <span class="font-semibold text-gray-900">{{ fmt(breakdown.listingAgentAmount) }}</span>
      </div>
      <div class="flex justify-between items-center py-2">
        <span class="text-gray-600">Selling Agent</span>
        <span class="font-semibold text-gray-900">{{ fmt(breakdown.sellingAgentAmount) }}</span>
      </div>
      <div class="flex justify-between items-center pt-3 border-t border-gray-300">
        <span class="font-semibold text-gray-800">Total Service Fee</span>
        <span class="font-bold text-gray-900">{{ fmt(total) }}</span>
      </div>
    </div>
    <p v-else class="text-gray-400 text-sm">Available after transaction is completed.</p>
  </div>
</template>

<script setup lang="ts">
import type { CommissionBreakdown } from '~/types';

const props = defineProps<{ breakdown: CommissionBreakdown | null }>();

const total = computed(() =>
  props.breakdown
    ? props.breakdown.agencyAmount + props.breakdown.listingAgentAmount + props.breakdown.sellingAgentAmount
    : 0,
);

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
</script>
```

- [ ] **Step 4: Commit**

```bash
cd "C:\Users\PC\Desktop\Technical Case Iceberg Digital"
git add frontend/components/
git commit -m "feat: add TransactionCard, StageProgress, CommissionBreakdown components"
```

---

## Task 13: Frontend Pages

**Files:**
- Modify: `frontend/app.vue`
- Create: `frontend/pages/index.vue`
- Create: `frontend/pages/transactions/[id].vue`
- Create: `frontend/pages/agents/index.vue`

- [ ] **Step 1: Update app.vue**

Replace `frontend/app.vue` with:

```vue
<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white border-b border-gray-200 px-6 py-4">
      <div class="max-w-5xl mx-auto flex items-center justify-between">
        <NuxtLink to="/" class="text-xl font-bold text-gray-900">Estate Commission Tracker</NuxtLink>
        <div class="flex gap-6 text-sm">
          <NuxtLink to="/" class="text-gray-600 hover:text-gray-900">Transactions</NuxtLink>
          <NuxtLink to="/agents" class="text-gray-600 hover:text-gray-900">Agents</NuxtLink>
        </div>
      </div>
    </nav>
    <main class="max-w-5xl mx-auto px-6 py-8">
      <NuxtPage />
    </main>
  </div>
</template>
```

- [ ] **Step 2: Create Dashboard page**

Create `frontend/pages/index.vue`:

```vue
<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Transactions</h1>
      <button
        @click="showForm = !showForm"
        class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
      >
        + New Transaction
      </button>
    </div>

    <div v-if="showForm" class="bg-white border border-gray-200 rounded-xl p-6 mb-6">
      <h2 class="font-semibold text-gray-800 mb-4">New Transaction</h2>
      <form @submit.prevent="submitTransaction" class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <input v-model="form.propertyAddress" placeholder="Property Address" required class="input col-span-2" />
        <input v-model.number="form.salePrice" type="number" placeholder="Sale Price" required class="input" />
        <input v-model.number="form.totalServiceFee" type="number" placeholder="Total Service Fee" required class="input" />
        <select v-model="form.listingAgentId" required class="input">
          <option value="">Select Listing Agent</option>
          <option v-for="a in agentsStore.agents" :key="a._id" :value="a._id">{{ a.name }}</option>
        </select>
        <select v-model="form.sellingAgentId" required class="input">
          <option value="">Select Selling Agent</option>
          <option v-for="a in agentsStore.agents" :key="a._id" :value="a._id">{{ a.name }}</option>
        </select>
        <div class="col-span-2 flex gap-3">
          <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">Create</button>
          <button type="button" @click="showForm = false" class="text-gray-500 px-4 py-2 text-sm">Cancel</button>
        </div>
      </form>
    </div>

    <div v-if="store.loading" class="text-gray-400 text-center py-12">Loading...</div>
    <div v-else-if="store.transactions.length === 0" class="text-gray-400 text-center py-12">No transactions yet.</div>
    <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <TransactionCard v-for="t in store.transactions" :key="t._id" :transaction="t" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTransactionsStore } from '~/stores/transactions';
import { useAgentsStore } from '~/stores/agents';

const store = useTransactionsStore();
const agentsStore = useAgentsStore();

const showForm = ref(false);
const form = reactive({
  propertyAddress: '',
  salePrice: 0,
  totalServiceFee: 0,
  listingAgentId: '',
  sellingAgentId: '',
});

onMounted(async () => {
  await Promise.all([store.fetchAll(), agentsStore.fetchAll()]);
});

async function submitTransaction() {
  await store.create({ ...form });
  showForm.value = false;
  Object.assign(form, { propertyAddress: '', salePrice: 0, totalServiceFee: 0, listingAgentId: '', sellingAgentId: '' });
}
</script>

<style scoped>
.input {
  @apply border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-300;
}
</style>
```

- [ ] **Step 3: Create Transaction detail page**

Create `frontend/pages/transactions/[id].vue`:

```vue
<template>
  <div v-if="store.loading" class="text-gray-400 text-center py-12">Loading...</div>
  <div v-else-if="!store.current" class="text-gray-400 text-center py-12">Transaction not found.</div>
  <div v-else>
    <NuxtLink to="/" class="text-sm text-blue-600 hover:underline mb-4 inline-block">← Back</NuxtLink>

    <h1 class="text-2xl font-bold text-gray-900 mt-2 mb-1">{{ store.current.propertyAddress }}</h1>
    <p class="text-gray-500 text-sm mb-6">
      Sale Price: {{ fmt(store.current.salePrice) }} &nbsp;·&nbsp;
      Service Fee: {{ fmt(store.current.totalServiceFee) }}
    </p>

    <div class="bg-white border border-gray-200 rounded-xl p-6 mb-6">
      <h2 class="font-semibold text-gray-800 mb-5">Transaction Stage</h2>
      <StageProgress :currentStage="store.current.stage" />
      <div class="mt-6 flex gap-3">
        <button
          v-if="store.current.stage !== 'completed'"
          @click="advance"
          :disabled="advancing"
          class="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {{ advancing ? 'Advancing...' : `Advance to ${nextStageLabel}` }}
        </button>
        <span v-else class="text-green-600 font-semibold text-sm flex items-center gap-1">✓ Transaction Completed</span>
      </div>
    </div>

    <CommissionBreakdown :breakdown="store.current.commissionBreakdown" />

    <div class="bg-white border border-gray-200 rounded-xl p-6 mt-6">
      <h2 class="font-semibold text-gray-800 mb-4">Stage History</h2>
      <ol class="space-y-2">
        <li v-for="entry in store.current.stageHistory" :key="entry.timestamp" class="flex gap-3 text-sm">
          <span class="text-gray-400 shrink-0">{{ fmtDate(entry.timestamp) }}</span>
          <span class="text-gray-700 capitalize">{{ entry.stage.replace('_', ' ') }}</span>
        </li>
      </ol>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTransactionsStore } from '~/stores/transactions';
import type { TransactionStage } from '~/types';

const route = useRoute();
const store = useTransactionsStore();

const STAGE_ORDER: TransactionStage[] = ['agreement', 'earnest_money', 'title_deed', 'completed'];
const STAGE_LABELS: Record<TransactionStage, string> = {
  agreement: 'Agreement',
  earnest_money: 'Earnest Money',
  title_deed: 'Title Deed',
  completed: 'Completed',
};

const advancing = ref(false);

const nextStageLabel = computed(() => {
  if (!store.current) return '';
  const idx = STAGE_ORDER.indexOf(store.current.stage);
  return idx < STAGE_ORDER.length - 1 ? STAGE_LABELS[STAGE_ORDER[idx + 1]] : '';
});

onMounted(() => store.fetchOne(route.params.id as string));

async function advance() {
  if (!store.current) return;
  advancing.value = true;
  try {
    await store.advanceStage(store.current._id);
  } finally {
    advancing.value = false;
  }
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

const fmtDate = (d: string) =>
  new Date(d).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
</script>
```

- [ ] **Step 4: Create Agents page**

Create `frontend/pages/agents/index.vue`:

```vue
<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Agents</h1>
      <button @click="showForm = !showForm" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
        + New Agent
      </button>
    </div>

    <div v-if="showForm" class="bg-white border border-gray-200 rounded-xl p-6 mb-6">
      <h2 class="font-semibold text-gray-800 mb-4">New Agent</h2>
      <form @submit.prevent="submitAgent" class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <input v-model="form.name" placeholder="Full Name" required class="input" />
        <input v-model="form.email" type="email" placeholder="Email" required class="input" />
        <input v-model="form.phone" placeholder="Phone (optional)" class="input" />
        <div class="flex gap-3">
          <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">Create</button>
          <button type="button" @click="showForm = false" class="text-gray-500 px-4 py-2 text-sm">Cancel</button>
        </div>
      </form>
    </div>

    <div v-if="store.loading" class="text-gray-400 text-center py-12">Loading...</div>
    <div v-else-if="store.agents.length === 0" class="text-gray-400 text-center py-12">No agents yet.</div>
    <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="agent in store.agents" :key="agent._id"
        class="bg-white border border-gray-200 rounded-xl p-5">
        <p class="font-semibold text-gray-900">{{ agent.name }}</p>
        <p class="text-sm text-gray-500 mt-1">{{ agent.email }}</p>
        <p v-if="agent.phone" class="text-sm text-gray-400">{{ agent.phone }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAgentsStore } from '~/stores/agents';

const store = useAgentsStore();
const showForm = ref(false);
const form = reactive({ name: '', email: '', phone: '' });

onMounted(() => store.fetchAll());

async function submitAgent() {
  await store.create({ ...form });
  showForm.value = false;
  Object.assign(form, { name: '', email: '', phone: '' });
}
</script>

<style scoped>
.input {
  @apply border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-300;
}
</style>
```

- [ ] **Step 5: Start frontend dev server and verify pages load**

Make sure the backend is running on port 3001, then:

```bash
cd frontend
npm run dev
```

Open `http://localhost:3000` and verify: Dashboard loads, Agents page loads, navigation works.

- [ ] **Step 6: Commit**

```bash
cd "C:\Users\PC\Desktop\Technical Case Iceberg Digital"
git add frontend/app.vue frontend/pages/
git commit -m "feat: add dashboard, transaction detail, and agents pages"
```

---

## Task 14: README + DESIGN.md

**Files:**
- Create: `README.md` (root)
- Create: `DESIGN.md` (root)

- [ ] **Step 1: Create README.md**

Create `README.md` at repo root:

```markdown
# Estate Commission Tracker

A full-stack system to track real-estate transaction lifecycles and auto-distribute commission between agency and agents.

## Stack
- **Backend:** NestJS · TypeScript · Mongoose · MongoDB Atlas · Jest
- **Frontend:** Nuxt 3 · Pinia · Tailwind CSS
- **Deploy:** Railway (API) · Vercel (Frontend)

## Local Setup

### Prerequisites
- Node.js 20 LTS
- MongoDB Atlas account (free M0 cluster)

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env and fill in MONGODB_URI
npm install
npm run start:dev
```

API runs at `http://localhost:3001`

### Frontend

```bash
cd frontend
npm install
NUXT_PUBLIC_API_BASE=http://localhost:3001 npm run dev
```

App runs at `http://localhost:3000`

### Run Tests

```bash
cd backend
npm test
```

## Live URLs
- **API:** https://<railway-url>.railway.app
- **Frontend:** https://<project>.vercel.app
```

- [ ] **Step 2: Create DESIGN.md**

Create `DESIGN.md` at repo root:

```markdown
# Design Decisions

## Architecture

Simple layered architecture: Controllers → Services → Mongoose models. No CQRS or event-sourcing — the domain is small enough that a direct service call is clearer and easier to test.

## Financial Breakdown Storage

The commission breakdown is **embedded in the transaction document** and computed once when the stage transitions to `completed`. 

Rationale: The breakdown is immutable after completion and always read together with the transaction. A separate collection would add a join with no benefit. Dynamic computation would lose the historical snapshot if business rules change.

## Stage Transitions

Stages follow a strict forward-only order: `agreement → earnest_money → title_deed → completed`. Reverse transitions are rejected with `400 Bad Request` because each stage represents an irreversible real-world event (signed contract, earnest money paid, title deed signed).

## Commission Policy

- Agency always receives 50% of `totalServiceFee`.
- If `listingAgentId === sellingAgentId`: that agent receives the full 50% agent pool.
- Otherwise: each agent receives 25%.

Logic lives in `CommissionService.calculate()` — a pure function with no database access — making it trivial to unit-test.

## Frontend State Management

Pinia stores (`transactions`, `agents`) own all server state. Pages call store actions; components receive props. The `useApi` composable centralises the `baseURL` so changing the API endpoint requires editing one file.
```

- [ ] **Step 3: Commit**

```bash
cd "C:\Users\PC\Desktop\Technical Case Iceberg Digital"
git add README.md DESIGN.md
git commit -m "docs: add README and DESIGN.md"
```

---

## Task 15: Deployment Config

**Files:**
- Create: `backend/Procfile`
- Create: `frontend/vercel.json`

- [ ] **Step 1: Add Railway Procfile for backend**

Create `backend/Procfile`:

```
web: npm run start:prod
```

- [ ] **Step 2: Verify backend build works**

```bash
cd backend
npm run build
```

Expected: `dist/` directory created with no TypeScript errors.

- [ ] **Step 3: Add Vercel config for frontend**

Create `frontend/vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".output/public",
  "framework": "nuxtjs"
}
```

- [ ] **Step 4: Deploy backend to Railway**

1. Go to railway.app and create a new project
2. Connect your Git repository
3. Set root directory to `backend/`
4. Add environment variable: `MONGODB_URI=<your atlas uri>`
5. Railway auto-detects Node.js and runs `npm run start:prod` via Procfile
6. Copy the generated Railway URL (e.g. `https://estate-commission-tracker.up.railway.app`)

- [ ] **Step 5: Deploy frontend to Vercel**

1. Go to vercel.com and import your Git repository
2. Set root directory to `frontend/`
3. Add environment variable: `NUXT_PUBLIC_API_BASE=<your railway url>`
4. Deploy

- [ ] **Step 6: Commit deployment config**

```bash
cd "C:\Users\PC\Desktop\Technical Case Iceberg Digital"
git add backend/Procfile frontend/vercel.json
git commit -m "chore: add Railway and Vercel deployment config"
```

- [ ] **Step 7: Update README.md with live URLs**

Open `README.md` and replace the placeholder URLs in the "Live URLs" section with the actual Railway and Vercel URLs, then commit:

```bash
git add README.md
git commit -m "docs: add live deployment URLs"
```

---

## Self-Review Checklist

| Spec requirement | Covered by |
|---|---|
| Track transaction lifecycle (4 stages) | Task 4, Task 7, Task 8 |
| Auto-distribute commission on completion | Task 3, Task 7 |
| Financial breakdown (agency + agents + reason) | Task 3, CommissionBreakdown component |
| Stage transition API | Task 8 |
| Scenario 1: same agent gets 50% | Task 3 (test + impl) |
| Scenario 2: different agents get 25% each | Task 3 (test + impl) |
| Invalid stage transition rejected | Task 4, Task 7 (test + impl) |
| Jest unit tests (commission + transitions + service) | Task 3, Task 4, Task 7 |
| NestJS + MongoDB Atlas + Mongoose | Task 2, Task 9 |
| Nuxt 3 + Pinia + Tailwind CSS | Task 10, Task 11 |
| Dashboard to visualize + trigger transitions | Task 13 |
| DESIGN.md | Task 14 |
| README.md with install instructions | Task 14 |
| Live API + Frontend URLs | Task 15 |
