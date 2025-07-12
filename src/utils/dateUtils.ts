// ./utils/dateUtils.ts
export const getCurrentDate = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getDaysRemaining = (targetDateString: string): number => {
  const targetDate = new Date(targetDateString);
  const today = new Date();
  // Set time to 00:00:00 for accurate day difference calculation
  targetDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const differenceMs = targetDate.getTime() - today.getTime();
  const differenceDays = Math.ceil(differenceMs / (1000 * 60 * 60 * 24));
  return differenceDays;
};

export const isExpiringSoon = (targetDateString: string, daysThreshold: number = 30): boolean => {
  const remaining = getDaysRemaining(targetDateString);
  return remaining <= daysThreshold && remaining >= 0; // Expires within threshold or on the day itself
};

export const formatDisplayDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Ngày không hợp lệ';
    }
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (e) {
    console.error("Error formatting date:", dateString, e);
    return 'Ngày không hợp lệ';
  }
};

export const parseDateForInput = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return ''; // Return empty string for invalid dates
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (e) {
    console.error("Error parsing date for input:", dateString, e);
    return '';
  }
};