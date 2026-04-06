import "@typespec/http";

using Http;

namespace BookingService;

@route("/public")
@tag("Public")
interface Public {
}

@route("/public/event-types")
@tag("PublicEventTypes")
interface PublicEventTypes {
  @get list(): EventType[];
}

@route("/public/event-types/{eventTypeId}/slots")
@tag("PublicSlots")
interface PublicSlots {
  @get list(@path eventTypeId: string): SlotList;
}

@route("/public/bookings")
@tag("PublicBookings")
interface PublicBookings {
  /** Создает бронирование только для свободного слота. */
  @post create(@body body: BookingCreate): Booking | SlotAlreadyBookedError;
}
