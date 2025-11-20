'use client';

import { useState } from 'react';
import {
  Paper,
  Stack,
  Text,
  Button,
  Group,
  ActionIcon,
  Divider,
  ScrollArea,
  useMantineTheme,
} from '@mantine/core';
import { IconHistory, IconX, IconClock, IconTrash } from '@tabler/icons-react';

interface SearchHistoryProps {
  recentSearches: string[];
  onSearchClick: (search: string) => void;
  onClearHistory: () => void;
  onRemoveSearch: (search: string) => void;
  maxItems?: number;
}

export function SearchHistory({
  recentSearches,
  onSearchClick,
  onClearHistory,
  onRemoveSearch,
  maxItems = 5,
}: SearchHistoryProps) {
  const theme = useMantineTheme();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  if (recentSearches.length === 0) {
    return (
      <Paper withBorder p='md' radius='md' bg='gray.0'>
        <Stack align='center' gap='sm'>
          <IconHistory size={24} color='var(--mantine-color-dimmed)' />
          <Text size='sm' c='dimmed' ta='center'>
            No recent searches
          </Text>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper withBorder shadow='md' p='sm' radius='md'>
      <Stack gap='xs'>
        <Group justify='space-between' mb='xs'>
          <Text size='sm' fw={500} c='dimmed'>
            Recent Searches
          </Text>
          <Button
            variant='subtle'
            size='xs'
            color={theme.colors[theme.primaryColor][9]}
            leftSection={<IconTrash size={12} />}
            onClick={onClearHistory}
          >
            Clear All
          </Button>
        </Group>

        <Divider />

        <div style={{ maxHeight: 200 }}>
          <ScrollArea.Autosize>
            <Stack gap='xs'>
              {recentSearches.slice(0, maxItems).map(search => (
                <Group
                  key={search}
                  justify='space-between'
                  p='xs'
                  style={{
                    borderRadius: 'var(--mantine-radius-sm)',
                    backgroundColor:
                      hoveredItem === search
                        ? 'var(--mantine-color-gray-1)'
                        : 'transparent',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={() => setHoveredItem(search)}
                  onMouseLeave={() => setHoveredItem(null)}
                  onClick={() => onSearchClick(search)}
                >
                  <Group gap='xs'>
                    <IconClock size={14} color='var(--mantine-color-dimmed)' />
                    <Text size='sm' style={{ flex: 1 }}>
                      {search}
                    </Text>
                  </Group>

                  <ActionIcon
                    variant='subtle'
                    size='xs'
                    color={theme.colors[theme.primaryColor][9]}
                    onClick={e => {
                      e.stopPropagation();
                      onRemoveSearch(search);
                    }}
                    style={{ opacity: hoveredItem === search ? 1 : 0 }}
                  >
                    <IconX size={10} />
                  </ActionIcon>
                </Group>
              ))}
            </Stack>
          </ScrollArea.Autosize>
        </div>
      </Stack>
    </Paper>
  );
}
