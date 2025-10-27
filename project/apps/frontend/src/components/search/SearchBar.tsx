'use client';

import { useState, useEffect, useCallback } from 'react';
import { TextInput, ActionIcon, Group, Button, Loader } from '@mantine/core';
import { IconSearch, IconFilter, IconX } from '@tabler/icons-react';
import { useDebounce } from '../../hooks/useDebounce';
import { SearchHistory } from './SearchHistory';
import { SearchSuggestions } from './SearchSuggestions';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onAdvancedSearch: () => void;
  onSimpleFilters?: () => void;
  placeholder?: string;
  showFilters?: boolean;
  recentSearches?: string[];
  onRecentSearchClick?: (search: string) => void;
  onClearRecentSearches?: () => void;
  onRemoveRecentSearch?: (search: string) => void;
  debounceMs?: number;
  isLoading?: boolean;
}

export function SearchBar({
  value,
  onChange,
  onAdvancedSearch,
  onSimpleFilters,
  placeholder = 'Search tickets...',
  showFilters = true,
  recentSearches = [],
  onRecentSearchClick,
  onClearRecentSearches,
  onRemoveRecentSearch,
  debounceMs = 300,
  isLoading = false,
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showRecent, setShowRecent] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const [isClearing, setIsClearing] = useState(false);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const [isSelectingSuggestion, setIsSelectingSuggestion] = useState(false);

  // Debounce the local value changes
  const debouncedValue = useDebounce(localValue, debounceMs);

  // Update parent when debounced value changes (but not when clearing)
  useEffect(() => {
    if (!isClearing && debouncedValue !== value) {
      onChange(debouncedValue);
      setIsDebouncing(false);
    }
  }, [debouncedValue, onChange, value, isClearing]);

  // Sync local value with prop value (but not when clearing, typing, or selecting suggestions)
  useEffect(() => {
    if (!isClearing && !isSelectingSuggestion && (!isFocused || value === '')) {
      setLocalValue(value);
    }
  }, [value, isClearing, isFocused, isSelectingSuggestion]);

  const handleInputChange = useCallback(
    (newValue: string) => {
      setLocalValue(newValue);
      setShowSuggestions(newValue.trim().length > 0);
      setIsDebouncing(true);
      // Reset clearing flag if user starts typing
      if (isClearing) {
        setIsClearing(false);
      }
    },
    [isClearing]
  );

  const handleClear = useCallback(() => {
    setIsClearing(true);
    setLocalValue('');
    onChange(''); // Immediate update, bypass debouncing
    setShowSuggestions(false);
    // Don't hide recent searches - let them show when focused on empty input
    // setShowRecent(false);
    // Reset clearing flag after debounce time to prevent interference
    setTimeout(() => setIsClearing(false), debounceMs + 100);
  }, [onChange, debounceMs]);

  const handleRecentSearch = useCallback(
    (search: string) => {
      setLocalValue(search);
      onChange(search);
      onRecentSearchClick?.(search);
      setShowRecent(false);
      setShowSuggestions(false);
    },
    [onChange, onRecentSearchClick]
  );

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      // Suggestion clicked
      // Completely bypass all debouncing and syncing logic
      setLocalValue(suggestion);
      onChange(suggestion);
      setShowSuggestions(false);
      setShowRecent(false);
      setIsDebouncing(false);
      setIsClearing(false);
      setIsSelectingSuggestion(false);
    },
    [onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        // Immediately trigger search, bypassing debounce
        onChange(localValue);
        setShowSuggestions(false);
        setShowRecent(false);
        setIsDebouncing(false); // Stop the debouncing indicator
      }
    },
    [localValue, onChange]
  );

  useEffect(() => {
    if (isFocused && recentSearches.length > 0 && !localValue.trim()) {
      setShowRecent(true);
    } else {
      setShowRecent(false);
    }
  }, [isFocused, recentSearches.length, localValue]);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <Group>
        <TextInput
          placeholder={placeholder}
          value={localValue}
          onChange={e => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={e => {
            // Don't hide dropdowns if clicking on suggestions
            if (e.relatedTarget?.closest('[data-suggestion]')) {
              return;
            }
            setTimeout(() => {
              setIsFocused(false);
              setShowRecent(false);
              setShowSuggestions(false);
            }, 200);
          }}
          leftSection={
            isLoading || isDebouncing ? (
              <Loader size='xs' />
            ) : (
              <IconSearch size={16} />
            )
          }
          rightSection={
            localValue ? (
              <ActionIcon
                variant='subtle'
                size='sm'
                onClick={handleClear}
                style={{ cursor: 'pointer' }}
              >
                <IconX size={14} />
              </ActionIcon>
            ) : null
          }
          style={{ flex: 1 }}
        />
        {showFilters && (
          <Button
            variant='light'
            leftSection={<IconFilter size={16} />}
            onClick={onSimpleFilters || onAdvancedSearch}
          >
            Filters
          </Button>
        )}
      </Group>

      {showRecent && recentSearches.length > 0 && !localValue.trim() && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            marginTop: 4,
          }}
        >
          <SearchHistory
            recentSearches={recentSearches}
            onSearchClick={handleRecentSearch}
            onClearHistory={onClearRecentSearches || (() => undefined)}
            onRemoveSearch={onRemoveRecentSearch || (() => undefined)}
            maxItems={5}
          />
        </div>
      )}

      {showSuggestions && localValue.trim() && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            marginTop: 4,
          }}
        >
          <SearchSuggestions
            query={localValue}
            onSuggestionClick={handleSuggestionClick}
            recentSearches={recentSearches}
            maxItems={8}
          />
        </div>
      )}
    </div>
  );
}
