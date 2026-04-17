import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import type { TransactionStage } from '../stage-transitions';

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
