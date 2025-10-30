'use client';

import { Checkbox } from '@mantine/core';
import { forwardRef } from 'react';

interface BulkSelectCheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
  'aria-label'?: string;
}

export const BulkSelectCheckbox = forwardRef<
  HTMLInputElement,
  BulkSelectCheckboxProps
>(({ checked, indeterminate, onChange, ...props }, ref) => {
  return (
    <Checkbox
      ref={ref}
      checked={checked}
      indeterminate={indeterminate}
      onChange={event => onChange(event.currentTarget.checked)}
      {...props}
    />
  );
});

BulkSelectCheckbox.displayName = 'BulkSelectCheckbox';
