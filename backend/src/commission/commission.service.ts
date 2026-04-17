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
      return {
        agencyAmount,
        listingAgentAmount: agentPool,
        sellingAgentAmount: 0,
      };
    }

    return {
      agencyAmount,
      listingAgentAmount: agentPool * 0.5,
      sellingAgentAmount: agentPool * 0.5,
    };
  }
}
