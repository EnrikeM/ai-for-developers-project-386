namespace BookingService;

model BookingCreate {
  eventTypeId: string;
  slotId: string;
  startsAt: utcDateTime;
}

model Booking {
  id: string;
  ownerId: string;
  eventTypeId: string;
  slotId: string;
  startsAt: utcDateTime;
  endsAt: utcDateTime;
}

@error
model SlotAlreadyBookedError {
  message: string;
}
