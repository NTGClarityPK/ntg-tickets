import { usePublicSettings } from './usePublicSettings';

export function useSiteBranding() {
  const { data: settings } = usePublicSettings();

  const siteName = settings?.siteName || 'NTG Ticket';
  const siteDescription =
    settings?.siteDescription || 'IT Support - Ticket Management System';
  const timezone = settings?.timezone || 'UTC';
  const language = settings?.language || 'en';
  const dateFormat = settings?.dateFormat || 'MM/DD/YYYY';

  const formatDate = (date: Date | string): string => {
    const d = new Date(date);

    switch (dateFormat) {
      case 'DD/MM/YYYY':
        return d.toLocaleDateString('en-GB');
      case 'YYYY-MM-DD':
        return d.toISOString().split('T')[0];
      case 'MM/DD/YYYY':
      default:
        return d.toLocaleDateString('en-US');
    }
  };

  const formatDateTime = (date: Date | string): string => {
    const d = new Date(date);
    return `${formatDate(d)} ${d.toLocaleTimeString()}`;
  };

  return {
    siteName,
    siteDescription,
    timezone,
    language,
    dateFormat,
    formatDate,
    formatDateTime,
  };
}
