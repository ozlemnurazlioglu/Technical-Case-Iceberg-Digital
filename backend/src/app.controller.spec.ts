import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('returns API info with name, status, and endpoint links', () => {
      const info = appController.getInfo();
      expect(info.name).toBe('Estate Commission Tracker API');
      expect(info.status).toBe('ok');
      expect(info.docs).toBe('/api/docs');
      expect(info.endpoints).toEqual({
        agents: '/agents',
        transactions: '/transactions',
        reports: '/reports/summary',
      });
    });
  });
});
