'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Group,
  Button,
  Text,
  Stack,
  Modal,
  Checkbox,
  Box,
  ThemeIcon,
  useMantineTheme,
} from '@mantine/core';
import {
  IconShield,
  IconCookie,
  IconLock,
  IconEye,
  IconDatabase,
} from '@tabler/icons-react';
import { STORAGE_KEYS } from '../../lib/constants';

interface DataProtectionBannerProps {
  onAccept?: (preferences: DataPreferences) => void;
  onReject?: () => void;
}

interface DataPreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

export function DataProtectionBanner({
  onAccept,
  onReject,
}: DataProtectionBannerProps) {
  const theme = useMantineTheme();
  const t = useTranslations('common');
  const tCompliance = useTranslations('compliance');
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [preferences, setPreferences] = useState<DataPreferences>({
    necessary: true, // Always required
    analytics: false,
    marketing: false,
    functional: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEYS.DATA_PROTECTION_CONSENT);
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAcceptAll = () => {
    const allPreferences: DataPreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
    };
    localStorage.setItem(
      STORAGE_KEYS.DATA_PROTECTION_CONSENT,
      JSON.stringify(allPreferences)
    );
    setShowBanner(false);
    onAccept?.(allPreferences);
  };

  const handleRejectAll = () => {
    const minimalPreferences: DataPreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
    };
    localStorage.setItem(
      STORAGE_KEYS.DATA_PROTECTION_CONSENT,
      JSON.stringify(minimalPreferences)
    );
    setShowBanner(false);
    onReject?.();
  };

  const handleCustomSave = () => {
    localStorage.setItem(
      STORAGE_KEYS.DATA_PROTECTION_CONSENT,
      JSON.stringify(preferences)
    );
    setShowBanner(false);
    setShowModal(false);
    onAccept?.(preferences);
  };

  if (!showBanner) return null;

  return (
    <>
      <Box
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          backgroundColor: 'var(--mantine-color-white)',
          borderTop: '1px solid var(--mantine-color-gray-3)',
          boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
        }}
        p='md'
      >
        <Group justify='space-between' align='flex-start'>
          <Group align='flex-start' gap='md' style={{ flex: 1 }}>
            <ThemeIcon size='lg' variant='light' color={theme.colors[theme.primaryColor][9]}>
              <IconShield size={20} />
            </ThemeIcon>
            <Stack gap='xs' style={{ flex: 1 }}>
              <Text size='sm' fw={500}>
                {tCompliance('dataProtection')}
              </Text>
              <Text size='xs' c='dimmed'>
                {tCompliance('cookieDescription')}
              </Text>
            </Stack>
          </Group>
          <Group gap='xs'>
            <Button
              variant='outline'
              size='xs'
              onClick={() => setShowModal(true)}
            >
              {tCompliance('customize')}
            </Button>
            <Button
              variant='outline'
              size='xs'
              color={theme.colors[theme.primaryColor][9]}
              onClick={handleRejectAll}
            >
              {tCompliance('rejectAll')}
            </Button>
            <Button size='xs' onClick={handleAcceptAll}>
              {tCompliance('acceptAll')}
            </Button>
          </Group>
        </Group>
      </Box>

      <Modal
        opened={showModal}
        onClose={() => setShowModal(false)}
        title={
          <Group gap='sm'>
            <IconShield size={20} />
            <Text>{tCompliance('cookiePreferences')}</Text>
          </Group>
        }
        size='lg'
      >
        <Stack gap='md'>
          <Text size='sm' c='dimmed'>
            {tCompliance('cookieDescription')}
          </Text>

          <Stack gap='sm'>
            <Group justify='space-between'>
              <Group gap='sm'>
                <IconLock size={16} color={theme.colors[theme.primaryColor][6]} />
                <div>
                  <Text size='sm' fw={500}>
                    {tCompliance('necessaryCookies')}
                  </Text>
                  <Text size='xs' c='dimmed'>
                    {tCompliance('necessaryCookiesDescription')}
                  </Text>
                </div>
              </Group>
              <Checkbox checked={preferences.necessary} disabled />
            </Group>

            <Group justify='space-between'>
              <Group gap='sm'>
                <IconDatabase size={16} color={theme.colors[theme.primaryColor][9]} />
                <div>
                  <Text size='sm' fw={500}>
                    {tCompliance('analyticsCookies')}
                  </Text>
                  <Text size='xs' c='dimmed'>
                    {tCompliance('analyticsCookiesDescription')}
                  </Text>
                </div>
              </Group>
              <Checkbox
                checked={preferences.analytics}
                onChange={event =>
                  setPreferences(prev => ({
                    ...prev,
                    analytics: event.target.checked,
                  }))
                }
              />
            </Group>

            <Group justify='space-between'>
              <Group gap='sm'>
                <IconEye size={16} color='orange' />
                <div>
                  <Text size='sm' fw={500}>
                    {tCompliance('functionalCookies')}
                  </Text>
                  <Text size='xs' c='dimmed'>
                    {tCompliance('functionalCookiesDescription')}
                  </Text>
                </div>
              </Group>
              <Checkbox
                checked={preferences.functional}
                onChange={event =>
                  setPreferences(prev => ({
                    ...prev,
                    functional: event.target.checked,
                  }))
                }
              />
            </Group>

            <Group justify='space-between'>
              <Group gap='sm'>
                <IconCookie size={16} color='purple' />
                <div>
                  <Text size='sm' fw={500}>
                    {tCompliance('marketingCookies')}
                  </Text>
                  <Text size='xs' c='dimmed'>
                    {tCompliance('marketingCookiesDescription')}
                  </Text>
                </div>
              </Group>
              <Checkbox
                checked={preferences.marketing}
                onChange={event =>
                  setPreferences(prev => ({
                    ...prev,
                    marketing: event.target.checked,
                  }))
                }
              />
            </Group>
          </Stack>

          <Group justify='space-between' mt='md'>
            <Button variant='outline' onClick={handleRejectAll}>
              {tCompliance('rejectAll')}
            </Button>
            <Group gap='xs'>
              <Button variant='outline' onClick={() => setShowModal(false)}>
                {t('cancel')}
              </Button>
              <Button onClick={handleCustomSave}>
                {tCompliance('savePreferences')}
              </Button>
            </Group>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
