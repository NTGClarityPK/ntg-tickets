'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Button, Menu, Text, useMantineTheme } from '@mantine/core';
import { IconWorld } from '@tabler/icons-react';
import { RTLChevronDown } from '../ui/RTLIcon';
import { useState, useEffect } from 'react';
import { useRTL } from '../../hooks/useRTL';
import { useRouter } from 'next/navigation';
import { US } from 'country-flag-icons/react/3x2';

const languages = [
  { code: 'en', name: 'US English', Flag: US },
];

export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations('common');
  const { direction } = useRTL();
  const [opened, setOpened] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const theme = useMantineTheme();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const checkDarkMode = () => {
      setIsDarkMode(
        document.documentElement.getAttribute('data-mantine-color-scheme') === 'dark'
      );
    };
    checkDarkMode();
    // Watch for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-mantine-color-scheme'],
    });
    return () => observer.disconnect();
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
          {languages.map(language => {
            const isSelected = locale === language.code;
            const selectedBg = isDarkMode ? theme.colors.red[8] : theme.colors.red[1];
            const selectedColor = isDarkMode ? theme.white : theme.colors.red[6];
            const hoverBg = isDarkMode ? theme.colors.red[7] : theme.colors.red[0];

            return (
              <Menu.Item
                key={language.code}
                leftSection={<language.Flag style={{ width: 16 }} />}
                rightSection={
                  isSelected ? (
                    <Text size='sm' c={selectedColor}>
                      ✓
                    </Text>
                  ) : null
                }
                onClick={() => handleLanguageChange(language.code)}
                style={{
                  backgroundColor: isSelected ? selectedBg : 'transparent',
                  color: isSelected ? selectedColor : 'inherit',
                  fontWeight: isSelected ? 600 : 400,
                  transition: 'background-color 0.2s ease, color 0.2s ease',
                  marginBottom: '4px',
                }}
                onMouseEnter={e => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = hoverBg;
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = isSelected ? selectedBg : 'transparent';
                  e.currentTarget.style.color = isSelected ? selectedColor : 'inherit';
                }}
              >
                <Text size='sm'>{language.name}</Text>
              </Menu.Item>
            );
          })}
        </Menu.Dropdown>
      </Menu>
    </div>
  );
}
