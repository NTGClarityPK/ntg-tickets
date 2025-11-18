'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Button, Menu, Group, Text, useMantineTheme } from '@mantine/core';
import { IconWorld } from '@tabler/icons-react';
import { RTLChevronDown } from '../ui/RTLIcon';
import { useState, useEffect } from 'react';
import { useRTL } from '../../hooks/useRTL';
import { useRouter } from 'next/navigation';

export interface Language {
  code: string;
  name: string;
  flag: string;
}

export interface LanguageSwitcherProps {
  /** Array of supported languages */
  languages?: Language[];
  /** Cookie name for storing locale (default: 'locale') */
  cookieName?: string;
  /** Cookie max age in seconds (default: 31536000 = 1 year) */
  cookieMaxAge?: number;
}

const defaultLanguages: Language[] = [
  { code: 'en', name: 'US English', flag: '🇺🇸' },
];

/**
 * Generic language switcher component
 * Allows users to switch between supported languages
 */
export function LanguageSwitcher({
  languages = defaultLanguages,
  cookieName = 'locale',
  cookieMaxAge = 31536000,
}: LanguageSwitcherProps) {
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
    document.cookie = `${cookieName}=${newLocale}; path=/; max-age=${cookieMaxAge}`;
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
        <Text size='sm'>{currentLanguage?.name || 'Language'}</Text>
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
          <Menu.Label>{t('language') || 'Language'}</Menu.Label>
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

