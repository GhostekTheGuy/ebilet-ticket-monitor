import type { ApiResponse, HistoryResponse } from './types';

export async function fetchTicketData(): Promise<ApiResponse> {
  try {
    const response = await fetch('/api/tickets', {
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch ticket data');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[v0] Error fetching ticket data:', error);
    throw error;
  }
}

export async function fetchHistory(hours: number = 24): Promise<HistoryResponse> {
  try {
    const response = await fetch(`/api/history?hours=${hours}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch history');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[v0] Error fetching history:', error);
    throw error;
  }
}
