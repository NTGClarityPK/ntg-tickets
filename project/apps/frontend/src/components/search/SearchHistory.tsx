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
      <Paper withBorder p='md' radius='md' bg='gray.0' data-testid="search-history-empty">
        <Stack align='center' gap='sm' data-testid="search-history-empty-stack">
          <IconHistory size={24} color='var(--mantine-color-dimmed)' data-testid="search-history-empty-icon" />
          <Text size='sm' c='dimmed' ta='center' data-testid="search-history-empty-message">
            No recent searches
          </Text>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper withBorder shadow='md' p='sm' radius='md' data-testid="search-history-container">
      <Stack gap='xs' data-testid="search-history-stack">
        <Group justify='space-between' mb='xs' data-testid="search-history-header">
          <Text size='sm' fw={500} c='dimmed' data-testid="search-history-title">
            Recent Searches
          </Text>
          <Button
            variant='subtle'
            size='xs'
            color={theme.colors[theme.primaryColor][9]}
            leftSection={<IconTrash size={12} />}
            onClick={onClearHistory}
            data-testid="search-history-clear-all-button"
          >
            Clear All
          </Button>
        </Group>

        <Divider data-testid="search-history-divider" />

        <div style={{ maxHeight: 200 }} data-testid="search-history-list-container">
          <ScrollArea.Autosize data-testid="search-history-scroll">
            <Stack gap='xs' data-testid="search-history-list">
              {recentSearches.slice(0, maxItems).map((search, index) => (
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
                  data-testid={`search-history-item-${index}`}
                >
                  <Group gap='xs' data-testid={`search-history-item-content-${index}`}>
                    <IconClock size={14} color='var(--mantine-color-dimmed)' data-testid={`search-history-item-icon-${index}`} />
                    <Text size='sm' style={{ flex: 1 }} data-testid={`search-history-item-text-${index}`}>
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
                    data-testid={`search-history-item-remove-${index}`}
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
