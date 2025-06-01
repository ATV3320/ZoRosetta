import { useState } from 'react';
import Image from 'next/image';

interface AvatarWithSpinnerProps {
  imageUrl?: string;
  alt: string;
  fallback: string;
  size?: 'sm' | 'md' | 'lg';
}

export function AvatarWithSpinner({ imageUrl, alt, fallback, size = 'md' }: AvatarWithSpinnerProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  const sizeClasses = {
    sm: 'w-7 h-7 text-md',
    md: 'w-8 h-8 text-lg',
    lg: 'w-12 h-12 text-xl'
  };

  return (
    <span className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold bg-blue-700 text-white overflow-hidden border border-blue-700 bg-[#232b3e] relative`}>
      {imageUrl ? (
        <>
          {!imageLoaded && (
            <span className="absolute inset-0 flex items-center justify-center z-0">
              <svg
                className="animate-spin h-4 w-4 text-blue-300"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
            </span>
          )}
          <Image
            src={imageUrl}
            alt={alt}
            width={size === 'lg' ? 48 : size === 'md' ? 32 : 28}
            height={size === 'lg' ? 48 : size === 'md' ? 32 : 28}
            className={`${sizeClasses[size]} rounded-full object-cover z-10`}
            onLoadingComplete={() => setImageLoaded(true)}
          />
        </>
      ) : (
        fallback
      )}
    </span>
  );
} 