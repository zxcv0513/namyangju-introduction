/** [9, 10] → "9~10월", [7, 8] → "7~8월", [5, 9] → "5·9월" */
export function formatMonths(months: number[]): string {
  const m = [...new Set(months)].sort((a, b) => a - b);
  if (m.length === 0) return "시기 미정";
  const contiguous = m.every((v, i) => i === 0 || v === m[i - 1]! + 1);
  if (m.length > 1 && contiguous) return `${m[0]}~${m[m.length - 1]}월`;
  return `${m.join("·")}월`;
}
