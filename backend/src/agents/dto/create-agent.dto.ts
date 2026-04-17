import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAgentDto {
  @ApiProperty({ example: 'Jane Smith' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'jane@agency.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '+1 555 000 0000' })
  @IsString()
  @IsOptional()
  phone?: string;
}
