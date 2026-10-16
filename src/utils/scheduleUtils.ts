/**
 * Utility functions for homework and material scheduling
 */

export const isItemPublished = (item: any): boolean => {
  if (!item) return false;
  
  // If explicitly marked as scheduled
  if (item.status === 'scheduled') {
    if (!item.scheduledAt) return false;
    const schedMs = new Date(item.scheduledAt).getTime();
    return !isNaN(schedMs) && schedMs <= Date.now();
  }
  
  // If scheduledAt exists and is in the future
  if (item.scheduledAt) {
    const schedMs = new Date(item.scheduledAt).getTime();
    if (!isNaN(schedMs) && schedMs > Date.now()) {
      return false; // Not yet published
    }
  }
  
  return true; // Default published
};

export const formatScheduledDateLabel = (dateInput: string | Date | null | undefined): string => {
  if (!dateInput) return '';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return d.toLocaleDateString('ar-IQ', options);
  } catch {
    return String(dateInput);
  }
};
