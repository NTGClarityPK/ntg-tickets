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
        data-testid="data-protection-banner"
      >
        <Group justify='space-between' align='flex-start'>
          <Group align='flex-start' gap='md' style={{ flex: 1 }}>
            <ThemeIcon size='lg' variant='light' color={theme.colors[theme.primaryColor][9]} data-testid="data-protection-icon">
              <IconShield size={20} />
            </ThemeIcon>
            <Stack gap='xs' style={{ flex: 1 }}>
              <Text size='sm' fw={500} data-testid="data-protection-title">
                {tCompliance('dataProtection')}
              </Text>
              <Text size='xs' c='dimmed' data-testid="data-protection-description">
                {tCompliance('cookieDescription')}
              </Text>
            </Stack>
          </Group>
          <Group gap='xs' data-testid="data-protection-actions">
            <Button
              variant='outline'
              size='xs'
              onClick={() => setShowModal(true)}
              data-testid="data-protection-customize-button"
            >
              {tCompliance('customize')}
            </Button>
            <Button
              variant='outline'
              size='xs'
              color={theme.colors[theme.primaryColor][9]}
              onClick={handleRejectAll}
              data-testid="data-protection-reject-all-button"
            >
              {tCompliance('rejectAll')}
            </Button>
            <Button size='xs' onClick={handleAcceptAll} data-testid="data-protection-accept-all-button">
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
        data-testid="data-protection-preferences-modal"
      >
        <Stack gap='md'>
          <Text size='sm' c='dimmed' data-testid="data-protection-modal-description">
            {tCompliance('cookieDescription')}
          </Text>

          <Stack gap='sm' data-testid="data-protection-preferences-list">
            <Group justify='space-between' data-testid="data-protection-preference-necessary">
              <Group gap='sm'>
                <IconLock size={16} color={theme.colors[theme.primaryColor][6]} />
                <div>
                  <Text size='sm' fw={500} data-testid="data-protection-preference-necessary-title">
                    {tCompliance('necessaryCookies')}
                  </Text>
                  <Text size='xs' c='dimmed' data-testid="data-protection-preference-necessary-description">
                    {tCompliance('necessaryCookiesDescription')}
                  </Text>
                </div>
              </Group>
              <Checkbox checked={preferences.necessary} disabled data-testid="data-protection-preference-necessary-checkbox" />
            </Group>

            <Group justify='space-between' data-testid="data-protection-preference-analytics">
              <Group gap='sm'>
                <IconDatabase size={16} color={theme.colors[theme.primaryColor][9]} />
                <div>
                  <Text size='sm' fw={500} data-testid="data-protection-preference-analytics-title">
                    {tCompliance('analyticsCookies')}
                  </Text>
                  <Text size='xs' c='dimmed' data-testid="data-protection-preference-analytics-description">
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
                data-testid="data-protection-preference-analytics-checkbox"
              />
            </Group>

            <Group justify='space-between' data-testid="data-protection-preference-functional">
              <Group gap='sm'>
                <IconEye size={16} color='orange' />
                <div>
                  <Text size='sm' fw={500} data-testid="data-protection-preference-functional-title">
                    {tCompliance('functionalCookies')}
                  </Text>
                  <Text size='xs' c='dimmed' data-testid="data-protection-preference-functional-description">
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
                data-testid="data-protection-preference-functional-checkbox"
              />
            </Group>

            <Group justify='space-between' data-testid="data-protection-preference-marketing">
              <Group gap='sm'>
                <IconCookie size={16} color='purple' />
                <div>
                  <Text size='sm' fw={500} data-testid="data-protection-preference-marketing-title">
                    {tCompliance('marketingCookies')}
                  </Text>
                  <Text size='xs' c='dimmed' data-testid="data-protection-preference-marketing-description">
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
                data-testid="data-protection-preference-marketing-checkbox"
              />
            </Group>
          </Stack>

          <Group justify='space-between' mt='md' data-testid="data-protection-modal-actions">
            <Button variant='outline' onClick={handleRejectAll} data-testid="data-protection-modal-reject-all-button">
              {tCompliance('rejectAll')}
            </Button>
            <Group gap='xs'>
              <Button variant='outline' onClick={() => setShowModal(false)} data-testid="data-protection-modal-cancel-button">
                {t('cancel')}
              </Button>
              <Button onClick={handleCustomSave} data-testid="data-protection-modal-save-button">
                {tCompliance('savePreferences')}
              </Button>
            </Group>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
