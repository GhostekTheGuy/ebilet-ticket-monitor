import type { ApiResponse } from './types';

export async function fetchTicketData(): Promise<ApiResponse> {
  try {
    const response = await fetch('/api/tickets', {
      cache: 'no-store',
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch ticket data');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[v0] Error fetching ticket data:', error);
    throw error;
  }
}
