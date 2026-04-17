import { ApiProperty } from '@nestjs/swagger';
import {
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateTransactionDto {
  @ApiProperty({ example: '123 Main Street, Springfield, IL' })
  @IsString()
  @IsNotEmpty()
  propertyAddress: string;

  @ApiProperty({ example: 450000 })
  @IsNumber()
  @IsPositive()
  salePrice: number;

  @ApiProperty({
    example: 18000,
    description: 'Total fee to be split between agency and agents',
  })
  @IsNumber()
  @IsPositive()
  totalServiceFee: number;

  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'Agent who listed the property',
  })
  @IsMongoId()
  listingAgentId: string;

  @ApiProperty({
    example: '507f1f77bcf86cd799439012',
    description: 'Agent who brought the buyer',
  })
  @IsMongoId()
  sellingAgentId: string;
}
