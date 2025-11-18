'use client';

import { useRTL } from '../../hooks/useRTL';
import { SVGProps } from 'react';

export interface RTLIconProps extends SVGProps<SVGSVGElement> {
  icon: React.ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;
  flipInRTL?: boolean;
  size?: number;
}

/**
 * RTL-aware icon component that automatically flips directional icons
 * when the language is RTL (Arabic)
 */
export function RTLIcon({
  icon: IconComponent,
  flipInRTL = true,
  style,
  ...props
}: RTLIconProps) {
  const { isRTL } = useRTL();

  const iconStyle = {
    ...style,
    ...(isRTL &&
      flipInRTL && {
        transform: 'scaleX(-1)',
      }),
  };

  return <IconComponent style={iconStyle} {...props} />;
}

/**
 * RTL-aware arrow right icon
 */
export function RTLArrowRight(
  props: SVGProps<SVGSVGElement> & { size?: number }
) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const IconArrowRight = require('@tabler/icons-react').IconArrowRight;
  return (
    <RTLIcon icon={IconArrowRight} {...props} />
  );
}

/**
 * RTL-aware arrow left icon
 */
export function RTLArrowLeft(
  props: SVGProps<SVGSVGElement> & { size?: number }
) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const IconArrowLeft = require('@tabler/icons-react').IconArrowLeft;
  return (
    <RTLIcon icon={IconArrowLeft} {...props} />
  );
}

/**
 * RTL-aware chevron right icon
 */
export function RTLChevronRight(
  props: SVGProps<SVGSVGElement> & { size?: number }
) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const IconChevronRight = require('@tabler/icons-react').IconChevronRight;
  return (
    <RTLIcon
      icon={IconChevronRight}
      {...props}
    />
  );
}

/**
 * RTL-aware chevron left icon
 */
export function RTLChevronLeft(
  props: SVGProps<SVGSVGElement> & { size?: number }
) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const IconChevronLeft = require('@tabler/icons-react').IconChevronLeft;
  return (
    <RTLIcon icon={IconChevronLeft} {...props} />
  );
}

/**
 * RTL-aware chevron down icon (usually doesn't need flipping)
 */
export function RTLChevronDown(
  props: SVGProps<SVGSVGElement> & { size?: number }
) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const IconChevronDown = require('@tabler/icons-react').IconChevronDown;
  return (
    <RTLIcon
      icon={IconChevronDown}
      flipInRTL={false}
      {...props}
    />
  );
}

