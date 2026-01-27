import type { ApiResponse } from './types';

export class CaptchaRequiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CaptchaRequiredError';
  }
}

export async function fetchTicketData(): Promise<ApiResponse> {
  try {
    const response = await fetch('/api/tickets', {
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      if (response.status === 429 || errorData.code === 'CAPTCHA_REQUIRED') {
        throw new CaptchaRequiredError(
          errorData.error || 'eBilet API requires captcha verification. Run the Python backend or try again later.'
        );
      }

      throw new Error(errorData.error || 'Failed to fetch ticket data');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[v0] Error fetching ticket data:', error);
    throw error;
  }
}
