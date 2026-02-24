// Shared utility: cn() merges Tailwind CSS classes

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extracts a user-friendly error message from an Axios error response.
 * Handles both `errors` (validation) and plain `message` shapes.
 */

export function getAxiosErrorMessage(
  err: unknown,
  fallback = 'Something went wrong',
): string {
  const axiosErr = err as {
    response?: {
      data?: {
        message?: string;
        errors?: Record<string, string[]>;
      };
    };
  };
  const serverErrors = axiosErr.response?.data?.errors;
  if (serverErrors) {
    return Object.values(serverErrors).flat().join(' ');
  }
  return axiosErr.response?.data?.message || fallback;
}
