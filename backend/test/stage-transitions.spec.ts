import { getNextStage, STAGE_ORDER } from '../src/transactions/stage-transitions';

describe('getNextStage', () => {
  it('advances agreement → earnest_money', () => {
    expect(getNextStage('agreement')).toBe('earnest_money');
  });

  it('advances earnest_money → title_deed', () => {
    expect(getNextStage('earnest_money')).toBe('title_deed');
  });

  it('advances title_deed → completed', () => {
    expect(getNextStage('title_deed')).toBe('completed');
  });

  it('returns null when already at completed', () => {
    expect(getNextStage('completed')).toBeNull();
  });

  it('STAGE_ORDER has exactly 4 stages', () => {
    expect(STAGE_ORDER).toHaveLength(4);
  });
});
