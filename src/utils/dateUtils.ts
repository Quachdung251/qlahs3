// Utility functions for date formatting and calculations
export const formatDate = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export const parseDate = (dateString: string): Date => {
  const [day, month, year] = dateString.split('/').map(Number);
  return new Date(year, month - 1, day);
};

export const toInputDate = (ddmmyyyy: string): string => {
  const [day, month, year] = ddmmyyyy.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

export const fromInputDate = (inputDate: string): string => {
  const [year, month, day] = inputDate.split('-');
  return `${day}/${month}/${year}`;
};

export const getDaysRemaining = (deadline: string): number => {
  const today = new Date();
  const deadlineDate = parseDate(deadline);
  const diffTime = deadlineDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const isExpiringSoon = (deadline: string): boolean => {
  return getDaysRemaining(deadline) <= 15;
};

export const getCurrentDate = (): string => {
  return formatDate(new Date());
};

export const addDaysToDate = (dateString: string, days: number): string => {
  const date = parseDate(dateString);
  date.setDate(date.getDate() + days);
  return formatDate(date);
};