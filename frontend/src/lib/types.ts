export type CalendarOwner = {
  id: string;
  displayName: string;
};

export type EventType = {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
};

export type Slot = {
  id: string;
  startsAt: string;
  endsAt: string;
};

export type SlotList = {
  items: Slot[];
};

export type Booking = {
  id: string;
  ownerId: string;
  eventTypeId: string;
  slotId: string;
  startsAt: string;
  endsAt: string;
};

export type BookingCreate = {
  eventTypeId: string;
  slotId: string;
  startsAt: string;
};

export type SlotAlreadyBookedError = {
  message: string;
};
