import { Injectable } from '@nestjs/common';

export interface ApiInfo {
  name: string;
  version: string;
  status: 'ok';
  docs: string;
  endpoints: {
    agents: string;
    transactions: string;
    reports: string;
  };
}

@Injectable()
export class AppService {
  getInfo(): ApiInfo {
    return {
      name: 'Estate Commission Tracker API',
      version: '1.0',
      status: 'ok',
      docs: '/api/docs',
      endpoints: {
        agents: '/agents',
        transactions: '/transactions',
        reports: '/reports/summary',
      },
    };
  }
}
