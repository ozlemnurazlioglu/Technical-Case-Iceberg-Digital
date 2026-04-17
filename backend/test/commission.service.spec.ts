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
