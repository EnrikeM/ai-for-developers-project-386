import "@typespec/http";

using Http;

namespace BookingService;

@route("/owner")
@tag("Owner")
interface Owner {
  @get profile(): CalendarOwner;
}

@route("/owner/event-types")
@tag("OwnerEventTypes")
interface OwnerEventTypes {
  @get list(): EventType[];

  @post create(@body body: EventType): EventType;
}

@route("/owner/bookings")
@tag("OwnerBookings")
interface OwnerBookings {
  @get upcoming(): Booking[];
}
