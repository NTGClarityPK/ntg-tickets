import { createTheme, MantineColorsTuple } from '@mantine/core';
import { generateColorPalette, PRIMARY_COLOR } from './colorConfig';

// Generate dynamic color palette from the primary color
const dynamicColors: MantineColorsTuple = generateColorPalette(PRIMARY_COLOR) as unknown as MantineColorsTuple;

export const theme = createTheme({
  primaryColor: 'dynamic',
  colors: {
    dynamic: dynamicColors,
    // Keep the old 'red' for backward compatibility if needed
    red: dynamicColors,
  },
  fontFamily:
    'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
  fontFamilyMonospace: 'Monaco, Courier, monospace',
  headings: {
    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
    fontWeight: '600',
  },
  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
  },
  radius: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
  },
  spacing: {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  breakpoints: {
    xs: '36em',
    sm: '48em',
    md: '62em',
    lg: '75em',
    xl: '88em',
  },
  components: {
    Button: {
      defaultProps: {
        size: 'md',
      },
    },
    TextInput: {
      defaultProps: {
        size: 'md',
      },
    },
    Select: {
      defaultProps: {
        size: 'md',
      },
    },
    Textarea: {
      defaultProps: {
        size: 'md',
      },
    },
  },
});

// Create a dynamic theme function that can be called with a custom primary color
export function createDynamicTheme(primaryColor?: string) {
  const colorToUse = primaryColor || PRIMARY_COLOR;
  const dynamicColors: MantineColorsTuple = generateColorPalette(colorToUse) as unknown as MantineColorsTuple;
  
  return createTheme({
    primaryColor: 'dynamic',
    colors: {
      dynamic: dynamicColors,
      // Keep the old 'red' for backward compatibility if needed
      red: dynamicColors,
    },
    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
    fontFamilyMonospace: 'Monaco, Courier, monospace',
    headings: {
      fontFamily:
        'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
      fontWeight: '600',
    },
    fontSizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      md: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
    },
    radius: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '0.75rem',
      lg: '1rem',
      xl: '1.5rem',
    },
    spacing: {
      xs: '0.5rem',
      sm: '0.75rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
    },
    breakpoints: {
      xs: '36em',
      sm: '48em',
      md: '62em',
      lg: '75em',
      xl: '88em',
    },
    components: {
      Button: {
        defaultProps: {
          size: 'md',
        },
      },
      TextInput: {
        defaultProps: {
          size: 'md',
        },
      },
      Select: {
        defaultProps: {
          size: 'md',
        },
      },
      Textarea: {
        defaultProps: {
          size: 'md',
        },
      },
    },
  });
}
