/**
 * 数値をフォーマット
 */
export const formatNumber = (num: number, decimals: number = 0): string => {
  return num.toFixed(decimals);
};

/**
 * 工数をフォーマット (例: 2.5h)
 */
export const formatHours = (hours: number): string => {
  return `${formatNumber(hours, 1)}h`;
};

/**
 * パーセンテージをフォーマット
 */
export const formatPercentage = (value: number): string => {
  return `${formatNumber(value, 0)}%`;
};
