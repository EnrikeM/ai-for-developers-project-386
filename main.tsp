import "@typespec/http";
import "./models/calendar-owner.tsp";
import "./models/event-type.tsp";
import "./models/slot.tsp";
import "./models/booking.tsp";
import "./routes/owner.tsp";
import "./routes/public.tsp";

using Http;

@service(#{ title: "Booking Service" })
namespace BookingService;
