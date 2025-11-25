export const isSameDay = (date1: string, date2: string): boolean => {
  return date1.split('T')[0] === date2.split('T')[0];
};

export const canBombToday = (lastBombDate: string | null): boolean => {
  if (!lastBombDate) return true;
  return !isSameDay(lastBombDate, new Date().toISOString());
};