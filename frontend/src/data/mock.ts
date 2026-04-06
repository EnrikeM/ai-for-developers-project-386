import type { Booking, CalendarOwner, EventType, Slot } from '../lib/types';

export const owner: CalendarOwner = {
  id: 'owner-1',
  displayName: 'Tota',
};

export const eventTypes: EventType[] = [
  {
    id: 'et-15',
    name: 'Встреча 15 минут',
    description: 'Короткий тип события для быстрого слота.',
    durationMinutes: 15,
  },
  {
    id: 'et-30',
    name: 'Встреча 30 минут',
    description: 'Базовый тип события для бронирования.',
    durationMinutes: 30,
  },
];

export const slots: Record<string, Slot[]> = {
  'et-15': [
    { id: 's1', startsAt: '2026-03-31T09:00:00.000Z', endsAt: '2026-03-31T09:15:00.000Z' },
    { id: 's2', startsAt: '2026-03-31T09:15:00.000Z', endsAt: '2026-03-31T09:30:00.000Z' },
    { id: 's3', startsAt: '2026-03-31T09:30:00.000Z', endsAt: '2026-03-31T09:45:00.000Z' },
    { id: 's4', startsAt: '2026-03-31T09:45:00.000Z', endsAt: '2026-03-31T10:00:00.000Z' },
    { id: 's5', startsAt: '2026-03-31T10:00:00.000Z', endsAt: '2026-03-31T10:15:00.000Z' },
    { id: 's6', startsAt: '2026-03-31T10:15:00.000Z', endsAt: '2026-03-31T10:30:00.000Z' },
    { id: 's7', startsAt: '2026-03-31T10:30:00.000Z', endsAt: '2026-03-31T10:45:00.000Z' },
    { id: 's8', startsAt: '2026-03-31T10:45:00.000Z', endsAt: '2026-03-31T11:00:00.000Z' },
    { id: 's9', startsAt: '2026-03-31T11:00:00.000Z', endsAt: '2026-03-31T11:15:00.000Z' },
    { id: 's10', startsAt: '2026-03-31T11:15:00.000Z', endsAt: '2026-03-31T11:30:00.000Z' },
    { id: 's11', startsAt: '2026-03-31T11:30:00.000Z', endsAt: '2026-03-31T11:45:00.000Z' },
    { id: 's12', startsAt: '2026-03-31T11:45:00.000Z', endsAt: '2026-03-31T12:00:00.000Z' },
    { id: 's13', startsAt: '2026-04-01T09:00:00.000Z', endsAt: '2026-04-01T09:15:00.000Z' },
    { id: 's14', startsAt: '2026-04-01T09:15:00.000Z', endsAt: '2026-04-01T09:30:00.000Z' },
  ],
  'et-30': [
    { id: 's15', startsAt: '2026-03-31T13:00:00.000Z', endsAt: '2026-03-31T13:30:00.000Z' },
    { id: 's16', startsAt: '2026-03-31T13:30:00.000Z', endsAt: '2026-03-31T14:00:00.000Z' },
    { id: 's17', startsAt: '2026-03-31T14:00:00.000Z', endsAt: '2026-03-31T14:30:00.000Z' },
    { id: 's18', startsAt: '2026-03-31T14:30:00.000Z', endsAt: '2026-03-31T15:00:00.000Z' },
  ],
};

export const bookings: Booking[] = [
  {
    id: 'b1',
    ownerId: owner.id,
    eventTypeId: 'et-15',
    slotId: 's1',
    startsAt: '2026-03-31T09:00:00.000Z',
    endsAt: '2026-03-31T09:15:00.000Z',
  },
  {
    id: 'b2',
    ownerId: owner.id,
    eventTypeId: 'et-15',
    slotId: 's2',
    startsAt: '2026-03-31T09:15:00.000Z',
    endsAt: '2026-03-31T09:30:00.000Z',
  },
];
