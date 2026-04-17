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
