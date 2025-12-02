'use client';

import { ActionIcon, Menu, Group, Text, useMantineTheme } from '@mantine/core';
import { IconSun, IconMoon, IconDeviceDesktop } from '@tabler/icons-react';
import { useTheme } from '../../hooks/useTheme';
import { useState, useEffect } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mantineTheme = useMantineTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <ActionIcon
        variant='subtle'
        color={mantineTheme.colors[mantineTheme.primaryColor][9]}
        size='lg'
        aria-label='Toggle theme'
      >
        <IconSun size={16} />
      </ActionIcon>
    );
  }

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <IconSun size={16} />;
      case 'dark':
        return <IconMoon size={16} />;
      case 'auto':
        return <IconDeviceDesktop size={16} />;
      default:
        return <IconSun size={16} />;
    }
  };

  return (
    <Menu shadow='md' width={200} data-testid="theme-toggle-menu">
      <Menu.Target>
        <ActionIcon
          variant='subtle'
          color={mantineTheme.colors[mantineTheme.primaryColor][9]}
          size='lg'
          aria-label='Toggle theme'
          data-testid="theme-toggle-button"
        >
          {getIcon()}
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>Theme</Menu.Label>
        <Menu.Item
          leftSection={<IconSun size={14} />}
          onClick={() => setTheme('light')}
          style={{
            backgroundColor:
              theme === 'light' ? mantineTheme.colors.red[1] : 'transparent',
            color: theme === 'light' ? mantineTheme.colors.red[6] : 'inherit',
            fontWeight: theme === 'light' ? 600 : 400,
            transition: 'background-color 0.2s ease',
            marginBottom: '4px',
          }}
          data-testid="theme-light-option"
          onMouseEnter={e => {
            // Use theme-aware hover: light for light mode, dark for dark mode
            const isDarkMode =
              document.documentElement.getAttribute(
                'data-mantine-color-scheme'
              ) === 'dark';
            if (isDarkMode) {
              e.currentTarget.style.backgroundColor =
                mantineTheme.colors.red[2];
              e.currentTarget.style.color = mantineTheme.colors.red[8];
            } else {
              e.currentTarget.style.backgroundColor = '#f8f9ff';
            }
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor =
              theme === 'light' ? mantineTheme.colors.red[1] : 'transparent';
            e.currentTarget.style.color =
              theme === 'light' ? mantineTheme.colors.red[6] : 'inherit';
          }}
        >
          <Group justify='space-between'>
            <Text size='sm'>Light</Text>
            {theme === 'light' && (
              <Text size='xs' c={mantineTheme.colors[mantineTheme.primaryColor][6]}>
                ✓
              </Text>
            )}
          </Group>
        </Menu.Item>
        <Menu.Item
          leftSection={<IconMoon size={14} />}
          onClick={() => setTheme('dark')}
          style={{
            backgroundColor:
              theme === 'dark' ? mantineTheme.colors.red[1] : 'transparent',
            color: theme === 'dark' ? mantineTheme.colors.red[6] : 'inherit',
            fontWeight: theme === 'dark' ? 600 : 400,
            transition: 'background-color 0.2s ease',
            marginBottom: '4px',
          }}
          data-testid="theme-dark-option"
          onMouseEnter={e => {
            // Use theme-aware hover: light for light mode, dark for dark mode
            const isDarkMode =
              document.documentElement.getAttribute(
                'data-mantine-color-scheme'
              ) === 'dark';
            if (isDarkMode) {
              e.currentTarget.style.backgroundColor =
                mantineTheme.colors.red[2];
              e.currentTarget.style.color = mantineTheme.colors.red[8];
            } else {
              e.currentTarget.style.backgroundColor = '#f8f9ff';
            }
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor =
              theme === 'dark' ? mantineTheme.colors.red[1] : 'transparent';
            e.currentTarget.style.color =
              theme === 'dark' ? mantineTheme.colors.red[6] : 'inherit';
          }}
        >
          <Group justify='space-between'>
            <Text size='sm'>Dark</Text>
            {theme === 'dark' && (
              <Text size='xs' c={mantineTheme.colors[mantineTheme.primaryColor][6]}>
                ✓
              </Text>
            )}
          </Group>
        </Menu.Item>
        <Menu.Item
          leftSection={<IconDeviceDesktop size={14} />}
          onClick={() => setTheme('auto')}
          style={{
            backgroundColor:
              theme === 'auto' ? mantineTheme.colors.red[1] : 'transparent',
            color: theme === 'auto' ? mantineTheme.colors.red[6] : 'inherit',
            fontWeight: theme === 'auto' ? 600 : 400,
            transition: 'background-color 0.2s ease',
            marginBottom: '4px',
          }}
          data-testid="theme-auto-option"
          onMouseEnter={e => {
            // Use theme-aware hover: light for light mode, dark for dark mode
            const isDarkMode =
              document.documentElement.getAttribute(
                'data-mantine-color-scheme'
              ) === 'dark';
            if (isDarkMode) {
              e.currentTarget.style.backgroundColor =
                mantineTheme.colors.red[2];
              e.currentTarget.style.color = mantineTheme.colors.red[8];
            } else {
              e.currentTarget.style.backgroundColor = '#f8f9ff';
            }
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor =
              theme === 'auto' ? mantineTheme.colors.red[1] : 'transparent';
            e.currentTarget.style.color =
              theme === 'auto' ? mantineTheme.colors.red[6] : 'inherit';
          }}
        >
          <Group justify='space-between'>
            <Text size='sm'>Auto</Text>
            {theme === 'auto' && (
              <Text size='xs' c={mantineTheme.colors[mantineTheme.primaryColor][6]}>
                ✓
              </Text>
            )}
          </Group>
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
