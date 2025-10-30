# Dynamic Color System

This document explains how to use the new dynamic color system in the NTG Ticket frontend.

## Overview

The system allows you to set a single primary color, and automatically generates all necessary color variations for the theme. Additionally, it provides earthy tones for summary cards and progress bars that are independent of the main theme.

## How to Change the Primary Color

### Step 1: Edit the Color Configuration

Open the file: `src/lib/colorConfig.ts`

Find this line:
```typescript
export const PRIMARY_COLOR = '#C52720'; // Default red color
```

Change the color to your desired primary color:
```typescript
export const PRIMARY_COLOR = '#3B82F6'; // Example: Blue color
```

### Step 2: Available Color Formats

You can use any of these color formats:
- Hex: `#3B82F6`
- RGB: `rgb(59, 130, 246)`
- HSL: `hsl(217, 91%, 60%)`

### Step 3: Color Generation

The system automatically generates:
- **Light variations**: Lighter shades for backgrounds and highlights
- **Dark variations**: Darker shades for text and borders
- **Theme adaptation**: Colors automatically adjust for light/dark mode

## Earthy Colors for Icons and Progress Bars

The system includes a separate palette of earthy, muted colors for:
- Summary card icons
- Progress bars
- Other UI elements that should remain neutral

These colors are defined in `EARTHY_COLORS` and include:
- Terracotta, Sienna, Ochre, Rust (warm tones)
- Sage, Slate, Charcoal, Stone (cool tones)
- Taupe, Khaki, Beige, Sand (neutral tones)

## Usage in Components

### Using Dynamic Theme Colors

```typescript
import { useDynamicTheme } from '../hooks/useDynamicTheme';

function MyComponent() {
  const { primary, primaryLight, primaryDark } = useDynamicTheme();
  
  return (
    <div style={{ 
      backgroundColor: primary,
      color: primaryLight 
    }}>
      Content
    </div>
  );
}
```

### Using Earthy Colors for Icons

```typescript
import { useDynamicTheme } from '../hooks/useDynamicTheme';

function MetricCard({ icon: Icon, index }) {
  const { getEarthyColorByIndex } = useDynamicTheme();
  
  return (
    <Avatar color={getEarthyColorByIndex(index)}>
      <Icon />
    </Avatar>
  );
}
```

### Using CSS Custom Properties

You can also use the CSS custom properties directly:

```css
.my-component {
  background-color: var(--dynamic-primary);
  color: var(--dynamic-text);
  border: 1px solid var(--dynamic-border);
}
```

## Available CSS Custom Properties

### Primary Colors
- `--dynamic-primary`
- `--dynamic-primary-light`
- `--dynamic-primary-lighter`
- `--dynamic-primary-lightest`
- `--dynamic-primary-dark`
- `--dynamic-primary-darker`
- `--dynamic-primary-darkest`

### Background Colors
- `--dynamic-background`
- `--dynamic-surface`
- `--dynamic-surface-variant`

### Text Colors
- `--dynamic-text`
- `--dynamic-text-secondary`
- `--dynamic-text-muted`

### Border Colors
- `--dynamic-border`
- `--dynamic-border-light`

## Theme Adaptation

The system automatically adapts colors based on the current theme:

- **Light Mode**: Uses lighter backgrounds and darker text
- **Dark Mode**: Uses darker backgrounds and lighter text
- **Auto Mode**: Follows the system preference

## Examples

### Changing to a Blue Theme
```typescript
export const PRIMARY_COLOR = '#3B82F6'; // Blue
```

### Changing to a Green Theme
```typescript
export const PRIMARY_COLOR = '#10B981'; // Green
```

### Changing to a Purple Theme
```typescript
export const PRIMARY_COLOR = '#8B5CF6'; // Purple
```

## Notes

- The system automatically handles color contrast and accessibility
- Earthy colors remain consistent regardless of the primary color
- All existing components will automatically use the new color system
- The system is fully compatible with Mantine's theming system
