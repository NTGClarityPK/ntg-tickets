import { cookies } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async () => {
  const store = await cookies();
  let locale = store.get('locale')?.value;

  // If no cookie exists, try to detect from Accept-Language header
  if (!locale) {
    // This will be handled by the client-side language detection
    locale = 'en'; // Default fallback
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
