'use client';

import { Image } from '@mantine/core';
import { useState } from 'react';

interface ICOPreviewProps {
  src: string;
  alt: string;
  fallbackSrc?: string;
  height?: number;
  width?: number;
  style?: React.CSSProperties;
}

export function ICOPreview({ src, alt, fallbackSrc = '/favicon.svg', height = 32, width = 32, style }: ICOPreviewProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  // For .ico files, use a native img element with proper error handling
  if (src.toLowerCase().includes('.ico')) {
    return (
      <div style={{ position: 'relative', display: 'inline-block', width, height }}>
        {isLoading && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: '#f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              color: '#666',
              borderRadius: '4px',
            }}
          >
            Loading...
          </div>
        )}
        <Image
          src={src}
          alt={alt}
          height={height}
          width={width}
          fit="contain"
          onError={handleImageError}
          onLoad={handleImageLoad}
          style={style}
        />
        {imageError && (
          <Image
            src={fallbackSrc}
            alt={alt}
            height={height}
            width={width}
            fit="contain"
            style={{
              opacity: 0.7,
              ...style,
            }}
          />
        )}
      </div>
    );
  }

  // For non-.ico files, use the regular Image component
  return (
    <Image
      src={src}
      alt={alt}
      height={height}
      width={width}
      fit="contain"
      onError={handleImageError}
      onLoad={handleImageLoad}
      style={style}
    />
  );
}
