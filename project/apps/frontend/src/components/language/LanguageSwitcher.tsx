'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Button, Menu, Group, Text, useMantineTheme } from '@mantine/core';
import { IconWorld } from '@tabler/icons-react';
import { RTLChevronDown, useRTL } from '@ntg/shared-library';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const languages: Array<{ code: string; name: string; flag: string }> = [
  { code: 'en', name: 'US English', flag: '🇺🇸' },
  // { code: 'ar', name: 'العربية', flag: '🇸🇦' }, // Temporarily hidden until Arabic support is complete
];

export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations('common');
  const { direction } = useRTL();
  const [opened, setOpened] = useState(false);
  const [mounted, setMounted] = useState(false);
  const theme = useMantineTheme();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentLanguage =
    languages.find(lang => lang.code === locale) || languages[0];

  const handleLanguageChange = (newLocale: string) => {
    // Set cookie and refresh page
    document.cookie = `locale=${newLocale}; path=/; max-age=31536000`; // 1 year
    router.refresh();
    setOpened(false);
  };

  if (!mounted) {
    return (
      <Button
        variant='outline'
        color='red'
        leftSection={<IconWorld size={16} />}
        rightSection={<RTLChevronDown size={16} />}
        style={{ minWidth: 120 }}
      >
        <Text size='sm'>US English</Text>
      </Button>
    );
  }

  return (
    <div dir={direction}>
      <Menu
        opened={opened}
        onOpen={() => setOpened(true)}
        onClose={() => setOpened(false)}
        radius='md'
        width='target'
        withinPortal
        shadow='md'
      >
        <Menu.Target>
          <Button
            variant='outline'
            color='red'
            leftSection={<IconWorld size={16} />}
            rightSection={<RTLChevronDown size={16} />}
            style={{
              minWidth: 120,
            }}
          >
            <Text size='sm'>{currentLanguage.name}</Text>
          </Button>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Label>{t('language')}</Menu.Label>
          {languages.map(language => (
            <Menu.Item
              key={language.code}
              leftSection={<Text size='lg'>{language.flag}</Text>}
              onClick={() => handleLanguageChange(language.code)}
              style={{
                backgroundColor:
                  locale === language.code
                    ? theme.colors.red[1]
                    : 'transparent',
                color:
                  locale === language.code ? theme.colors.red[6] : 'inherit',
                fontWeight: locale === language.code ? 600 : 400,
                transition: 'background-color 0.2s ease',
                marginBottom: '4px',
              }}
              onMouseEnter={e => {
                // Use theme-aware hover: light for light mode, dark for dark mode
                const isDarkMode =
                  document.documentElement.getAttribute(
                    'data-mantine-color-scheme'
                  ) === 'dark';
                if (isDarkMode) {
                  e.currentTarget.style.backgroundColor = theme.colors.red[2];
                  e.currentTarget.style.color = theme.colors.red[8];
                } else {
                  e.currentTarget.style.backgroundColor = '#f8f9ff';
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor =
                  locale === language.code
                    ? theme.colors.red[1]
                    : 'transparent';
                e.currentTarget.style.color =
                  locale === language.code ? theme.colors.red[6] : 'inherit';
              }}
            >
              <Group justify='space-between'>
                <Text size='sm'>{language.name}</Text>
                {locale === language.code && (
                  <Text size='xs' c='blue'>
                    ✓
                  </Text>
                )}
              </Group>
            </Menu.Item>
          ))}
        </Menu.Dropdown>
      </Menu>
    </div>
  );
}
