export const formatDate = (date: Date): string =>
  date.toISOString().split('T')[0];

export const getGoalDateStr = (goal?: number): string => {
  if (!goal) return '';
  const now = new Date();
  const goalDate = new Date(now);
  goalDate.setDate(now.getDate() + goal);
  return formatDate(goalDate);
}; 