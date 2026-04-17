import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { AgentsService } from '../src/agents/agents.service';
import { Agent } from '../src/agents/schemas/agent.schema';

describe('AgentsService', () => {
  let service: AgentsService;

  const createdDoc = {
    _id: 'agent-1',
    name: 'Jane',
    email: 'jane@agency.com',
  };

  const saveMock = jest.fn();
  const AgentModelCtor: any = jest.fn().mockImplementation(() => ({
    save: saveMock,
  }));
  AgentModelCtor.find = jest.fn();
  AgentModelCtor.findById = jest.fn();

  beforeEach(async () => {
    saveMock.mockReset();
    AgentModelCtor.find.mockReset();
    AgentModelCtor.findById.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentsService,
        { provide: getModelToken(Agent.name), useValue: AgentModelCtor },
      ],
    }).compile();

    service = module.get(AgentsService);
  });

  it('create() returns saved agent on success', async () => {
    saveMock.mockResolvedValue(createdDoc);
    const result = await service.create({
      name: 'Jane',
      email: 'jane@agency.com',
    });
    expect(result).toEqual(createdDoc);
  });

  it('create() throws ConflictException (409) on duplicate email', async () => {
    saveMock.mockRejectedValue({ code: 11000, message: 'duplicate key' });
    await expect(
      service.create({ name: 'Jane', email: 'jane@agency.com' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('create() rethrows non-duplicate errors unchanged', async () => {
    const other = new Error('network down');
    saveMock.mockRejectedValue(other);
    await expect(
      service.create({ name: 'Jane', email: 'jane@agency.com' }),
    ).rejects.toBe(other);
  });

  it('findOne() throws NotFoundException when agent missing', async () => {
    AgentModelCtor.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });
    await expect(service.findOne('missing-id')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
