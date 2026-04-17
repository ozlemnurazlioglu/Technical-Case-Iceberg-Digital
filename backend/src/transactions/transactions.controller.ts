import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionsService } from './transactions.service';

@ApiTags('transactions')
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
    return this.transactionsService
      .findOne(id)
      .then((t) => t.commissionBreakdown);
  }
}
