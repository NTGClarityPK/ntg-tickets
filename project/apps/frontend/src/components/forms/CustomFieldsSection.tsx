'use client';

import { useEffect, useState } from 'react';
import {
  TextInput,
  Select,
  Switch,
  Stack,
  Text,
  Grid,
  NumberInput,
} from '@mantine/core';
import { useCustomFields } from '../../hooks/useCustomFields';
import { CustomField, CustomFieldType } from '../../types/unified';

interface CustomFieldsSectionProps {
  values: Record<string, string | number | boolean>;
  onChange: (values: Record<string, string | number | boolean>) => void;
}

export function CustomFieldsSection({
  values,
  onChange,
}: CustomFieldsSectionProps) {
  const [availableFields, setAvailableFields] = useState<CustomField[]>([]);
  const { data: allCustomFields } = useCustomFields();

  useEffect(() => {
    if (allCustomFields) {
      // Show all active custom fields regardless of category
      const filteredFields = allCustomFields.filter(field => field.isActive);
      setAvailableFields(filteredFields);
    }
  }, [allCustomFields]);

  const handleFieldChange = (fieldName: string, value: string | number | boolean) => {
    onChange({
      ...values,
      [fieldName]: value,
    });
  };

  const renderField = (field: CustomField) => {
    const fieldValue = values[field.name] || '';

    switch (field.fieldType) {
      case CustomFieldType.TEXT:
        return (
          <TextInput
            key={field.id}
            label={field.name}
            description={field.description}
            placeholder={`Enter ${field.name.toLowerCase()}`}
            required={field.isRequired}
            value={String(fieldValue)}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            data-testid={`custom-field-${field.name}-text`}
          />
        );

      case CustomFieldType.NUMBER:
        return (
          <NumberInput
            key={field.id}
            label={field.name}
            description={field.description}
            placeholder={`Enter ${field.name.toLowerCase()}`}
            required={field.isRequired}
            value={typeof fieldValue === 'number' ? fieldValue : undefined}
            onChange={(value) => handleFieldChange(field.name, value || 0)}
            data-testid={`custom-field-${field.name}-number`}
          />
        );

      case CustomFieldType.DATE:
        return (
          <TextInput
            key={field.id}
            label={field.name}
            description={field.description}
            type="date"
            required={field.isRequired}
            value={String(fieldValue)}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            data-testid={`custom-field-${field.name}-date`}
          />
        );

      case CustomFieldType.SELECT:
        return (
          <Select
            key={field.id}
            label={field.name}
            description={field.description}
            placeholder={`Select ${field.name.toLowerCase()}`}
            required={field.isRequired}
            data={field.options || []}
            value={String(fieldValue)}
            onChange={(value) => handleFieldChange(field.name, value || '')}
            data-testid={`custom-field-${field.name}-select`}
          />
        );

      case CustomFieldType.BOOLEAN:
        return (
          <Switch
            key={field.id}
            label={field.name}
            description={field.description}
            checked={fieldValue === true || fieldValue === 'true'}
            onChange={(e) => handleFieldChange(field.name, e.currentTarget.checked)}
            data-testid={`custom-field-${field.name}-switch`}
          />
        );

      default:
        return null;
    }
  };

  if (availableFields.length === 0) {
    return null;
  }

  return (
    <Stack gap="md">
      <Text size="lg" fw={500}>
        Additional Information
      </Text>
      <Text size="sm" c="dimmed">
        These fields are configured by your administrator and help provide more context for your ticket.
      </Text>
      <Grid>
        {availableFields.map((field) => (
          <Grid.Col key={field.id} span={{ base: 12, sm: 6 }}>
            {renderField(field)}
          </Grid.Col>
        ))}
      </Grid>
    </Stack>
  );
}
