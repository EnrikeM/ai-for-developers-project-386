import type { Booking, BookingCreate, CalendarOwner, EventType, SlotList } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4010';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  publicEventTypes: () => request<EventType[]>('/public/event-types'),
  publicSlots: (eventTypeId: string) => request<SlotList>(`/public/event-types/${eventTypeId}/slots`),
  publicCreateBooking: (body: BookingCreate) =>
    request<Booking>('/public/bookings', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  ownerProfile: () => request<CalendarOwner>('/owner'),
  ownerEventTypes: () => request<EventType[]>('/owner/event-types'),
  ownerCreateEventType: (body: EventType) =>
    request<EventType>('/owner/event-types', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  ownerBookings: () => request<Booking[]>('/owner/bookings'),
};

export const apiBaseUrl = API_BASE_URL;
