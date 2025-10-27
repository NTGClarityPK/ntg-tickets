'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@mantine/core';

interface SkipLinkProps {
  targetId: string;
  children: React.ReactNode;
}

export function SkipLink({ targetId, children }: SkipLinkProps) {
  const linkRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Show skip link when Tab is pressed and no element is focused
      if (event.key === 'Tab' && !document.activeElement) {
        linkRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleClick = () => {
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <Button
      ref={linkRef}
      variant='filled'
      size='sm'
      onClick={handleClick}
      style={{
        position: 'absolute',
        top: '-100px',
        left: '10px',
        zIndex: 1000,
        transition: 'top 0.3s ease',
      }}
      onFocus={e => {
        e.currentTarget.style.top = '10px';
      }}
      onBlur={e => {
        e.currentTarget.style.top = '-100px';
      }}
      aria-label={`Skip to ${targetId}`}
    >
      {children}
    </Button>
  );
}
