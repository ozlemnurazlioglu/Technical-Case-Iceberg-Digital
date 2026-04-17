export const STAGE_ORDER = [
  'agreement',
  'earnest_money',
  'title_deed',
  'completed',
] as const;

export type TransactionStage = (typeof STAGE_ORDER)[number];

export function getNextStage(
  current: TransactionStage,
): TransactionStage | null {
  const idx = STAGE_ORDER.indexOf(current);
  if (idx === -1 || idx === STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[idx + 1];
}
