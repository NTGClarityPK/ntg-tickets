'use client';

import { useRTL } from '../../hooks/useRTL';
import { SVGProps } from 'react';

interface RTLIconProps extends SVGProps<SVGSVGElement> {
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
  return (
    <RTLIcon icon={require('@tabler/icons-react').IconArrowRight} {...props} />
  );
}

/**
 * RTL-aware arrow left icon
 */
export function RTLArrowLeft(
  props: SVGProps<SVGSVGElement> & { size?: number }
) {
  return (
    <RTLIcon icon={require('@tabler/icons-react').IconArrowLeft} {...props} />
  );
}

/**
 * RTL-aware chevron right icon
 */
export function RTLChevronRight(
  props: SVGProps<SVGSVGElement> & { size?: number }
) {
  return (
    <RTLIcon
      icon={require('@tabler/icons-react').IconChevronRight}
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
  return (
    <RTLIcon icon={require('@tabler/icons-react').IconChevronLeft} {...props} />
  );
}

/**
 * RTL-aware chevron down icon (usually doesn't need flipping)
 */
export function RTLChevronDown(
  props: SVGProps<SVGSVGElement> & { size?: number }
) {
  return (
    <RTLIcon
      icon={require('@tabler/icons-react').IconChevronDown}
      flipInRTL={false}
      {...props}
    />
  );
}
