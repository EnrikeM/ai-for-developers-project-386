namespace BookingService;

/** Слот можно забронировать только один раз. */
model Slot {
  id: string;
  startsAt: utcDateTime;
  endsAt: utcDateTime;
}

model SlotList {
  items: Slot[];
}
