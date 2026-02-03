import type { ApiResponse, HistoryResponse, AleBiletApiResponse, AleBiletSoldTicket, AleBiletEventData } from './types';

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

export async function fetchHistory(hours: number = 72, sinceTimestamp?: number): Promise<HistoryResponse> {
  try {
    let url = `/api/history?hours=${hours}`;
    if (sinceTimestamp) {
      url += `&since=${sinceTimestamp}`;
    }

    const response = await fetch(url, {
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

export async function fetchAleBiletData(): Promise<AleBiletApiResponse> {
  try {
    const response = await fetch('/api/alebilet', {
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch AleBilet data');
    }

    return await response.json();
  } catch (error) {
    console.error('[AleBilet] Error fetching data:', error);
    throw error;
  }
}

export async function fetchAleBiletSoldTickets(hours: number = 24): Promise<{ soldTickets: AleBiletSoldTicket[] }> {
  try {
    const response = await fetch(`/api/alebilet/sold?hours=${hours}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch sold tickets');
    }

    return await response.json();
  } catch (error) {
    console.error('[AleBilet] Error fetching sold tickets:', error);
    throw error;
  }
}
