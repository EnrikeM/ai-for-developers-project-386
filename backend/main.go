package main

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"os"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
)

type CalendarOwner struct {
	ID          string `json:"id"`
	DisplayName string `json:"displayName"`
}

type EventType struct {
	ID              string `json:"id"`
	Name            string `json:"name"`
	Description     string `json:"description"`
	DurationMinutes int    `json:"durationMinutes"`
}

type Slot struct {
	ID       string    `json:"id"`
	StartsAt time.Time `json:"startsAt"`
	EndsAt   time.Time `json:"endsAt"`
}

type SlotList struct {
	Items []Slot `json:"items"`
}

type BookingCreate struct {
	EventTypeID string    `json:"eventTypeId"`
	SlotID      string    `json:"slotId"`
	StartsAt    time.Time `json:"startsAt"`
}

type Booking struct {
	ID          string    `json:"id"`
	OwnerID     string    `json:"ownerId"`
	EventTypeID string    `json:"eventTypeId"`
	SlotID      string    `json:"slotId"`
	StartsAt    time.Time `json:"startsAt"`
	EndsAt      time.Time `json:"endsAt"`
}

type SlotAlreadyBookedError struct {
	Message string `json:"message"`
}

var (
	errNotFound       = errors.New("not found")
	errSlotBooked     = errors.New("slot already booked")
	errInvalidRequest = errors.New("invalid request")
)

type Store struct {
	mu         sync.RWMutex
	owner      CalendarOwner
	eventTypes []EventType
	slots      map[string][]Slot
	bookings   []Booking
}

func newStore() *Store {
	owner := CalendarOwner{ID: "owner-1", DisplayName: "Tota"}

	firstEventType := EventType{ID: "et-15", Name: "Встреча 15 минут", Description: "Короткий тип события для быстрого слота.", DurationMinutes: 15}
	secondEventType := EventType{ID: "et-30", Name: "Встреча 30 минут", Description: "Базовый тип события для бронирования.", DurationMinutes: 30}

	day := time.Date(2026, time.March, 31, 0, 0, 0, 0, time.UTC)
	makeSlot := func(id string, start time.Time, duration time.Duration) Slot {
		return Slot{ID: id, StartsAt: start, EndsAt: start.Add(duration)}
	}

	firstSlots := []Slot{
		makeSlot("s1", day.Add(9*time.Hour), 15*time.Minute),
		makeSlot("s2", day.Add(9*time.Hour+15*time.Minute), 15*time.Minute),
		makeSlot("s3", day.Add(9*time.Hour+30*time.Minute), 15*time.Minute),
		makeSlot("s4", day.Add(9*time.Hour+45*time.Minute), 15*time.Minute),
		makeSlot("s5", day.Add(10*time.Hour), 15*time.Minute),
		makeSlot("s6", day.Add(10*time.Hour+15*time.Minute), 15*time.Minute),
		makeSlot("s7", day.Add(10*time.Hour+30*time.Minute), 15*time.Minute),
		makeSlot("s8", day.Add(10*time.Hour+45*time.Minute), 15*time.Minute),
		makeSlot("s9", day.Add(11*time.Hour), 15*time.Minute),
		makeSlot("s10", day.Add(11*time.Hour+15*time.Minute), 15*time.Minute),
		makeSlot("s11", day.Add(11*time.Hour+30*time.Minute), 15*time.Minute),
		makeSlot("s12", day.Add(11*time.Hour+45*time.Minute), 15*time.Minute),
		makeSlot("s13", day.AddDate(0, 0, 1).Add(9*time.Hour), 15*time.Minute),
		makeSlot("s14", day.AddDate(0, 0, 1).Add(9*time.Hour+15*time.Minute), 15*time.Minute),
	}

	secondSlots := []Slot{
		makeSlot("s15", day.Add(13*time.Hour), 30*time.Minute),
		makeSlot("s16", day.Add(13*time.Hour+30*time.Minute), 30*time.Minute),
		makeSlot("s17", day.Add(14*time.Hour), 30*time.Minute),
		makeSlot("s18", day.Add(14*time.Hour+30*time.Minute), 30*time.Minute),
	}

	bookings := []Booking{
		{
			ID:          "b1",
			OwnerID:     owner.ID,
			EventTypeID: firstEventType.ID,
			SlotID:      "s1",
			StartsAt:    firstSlots[0].StartsAt,
			EndsAt:      firstSlots[0].EndsAt,
		},
		{
			ID:          "b2",
			OwnerID:     owner.ID,
			EventTypeID: firstEventType.ID,
			SlotID:      "s2",
			StartsAt:    firstSlots[1].StartsAt,
			EndsAt:      firstSlots[1].EndsAt,
		},
	}

	return &Store{
		owner:      owner,
		eventTypes: []EventType{firstEventType, secondEventType},
		slots: map[string][]Slot{
			firstEventType.ID:  firstSlots,
			secondEventType.ID: secondSlots,
		},
		bookings: bookings,
	}
}

func (s *Store) Owner() CalendarOwner {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.owner
}

func (s *Store) EventTypes() []EventType {
	s.mu.RLock()
	defer s.mu.RUnlock()
	result := make([]EventType, len(s.eventTypes))
	copy(result, s.eventTypes)
	return result
}

func (s *Store) CreateEventType(eventType EventType) EventType {
	s.mu.Lock()
	defer s.mu.Unlock()
	if eventType.ID == "" {
		eventType.ID = generateID("et")
	}
	s.eventTypes = append(s.eventTypes, eventType)
	return eventType
}

func (s *Store) Bookings() []Booking {
	s.mu.RLock()
	defer s.mu.RUnlock()
	result := make([]Booking, len(s.bookings))
	copy(result, s.bookings)
	sort.Slice(result, func(i, j int) bool {
		return result[i].StartsAt.Before(result[j].StartsAt)
	})
	return result
}

func (s *Store) Slots(eventTypeID string) ([]Slot, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	slots, ok := s.slots[eventTypeID]
	if !ok {
		return nil, errNotFound
	}
	result := make([]Slot, len(slots))
	copy(result, slots)
	return result, nil
}

func (s *Store) CreateBooking(input BookingCreate) (Booking, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if !s.eventTypeExists(input.EventTypeID) {
		return Booking{}, errNotFound
	}

	slots, ok := s.slots[input.EventTypeID]
	if !ok {
		return Booking{}, errNotFound
	}

	var matched *Slot
	for i := range slots {
		if slots[i].ID == input.SlotID {
			matched = &slots[i]
			break
		}
	}
	if matched == nil {
		return Booking{}, errNotFound
	}

	if !matched.StartsAt.Equal(input.StartsAt) {
		return Booking{}, errInvalidRequest
	}

	for _, booking := range s.bookings {
		if booking.SlotID == input.SlotID {
			return Booking{}, errSlotBooked
		}
	}

	booking := Booking{
		ID:          generateID("b"),
		OwnerID:     s.owner.ID,
		EventTypeID: input.EventTypeID,
		SlotID:      input.SlotID,
		StartsAt:    matched.StartsAt,
		EndsAt:      matched.EndsAt,
	}
	s.bookings = append(s.bookings, booking)
	return booking, nil
}

func (s *Store) eventTypeExists(id string) bool {
	for _, eventType := range s.eventTypes {
		if eventType.ID == id {
			return true
		}
	}
	return false
}

func generateID(prefix string) string {
	var b [6]byte
	if _, err := rand.Read(b[:]); err != nil {
		return prefix + "-fallback"
	}
	return prefix + "-" + hex.EncodeToString(b[:])
}

type API struct {
	store *Store
}

func (api *API) router() http.Handler {
	r := chi.NewRouter()
	r.Use(cors.Handler(cors.Options{
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
		AllowOriginFunc: func(_ *http.Request, _ string) bool {
			return true
		},
	}))
	r.Use(middlewareRecoverer)

	r.Get("/owner", api.handleOwner)
	r.Get("/owner/event-types", api.handleOwnerEventTypes)
	r.Post("/owner/event-types", api.handleOwnerCreateEventType)
	r.Get("/owner/bookings", api.handleOwnerBookings)
	r.Get("/public/event-types", api.handlePublicEventTypes)
	r.Get("/public/event-types/{eventTypeId}/slots", api.handlePublicSlots)
	r.Post("/public/bookings", api.handlePublicCreateBooking)

	return r
}

func (api *API) handleOwner(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, api.store.Owner())
}

func (api *API) handleOwnerEventTypes(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, api.store.EventTypes())
}

func (api *API) handleOwnerCreateEventType(w http.ResponseWriter, r *http.Request) {
	var input EventType
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, http.StatusBadRequest, errInvalidRequest.Error())
		return
	}
	if strings.TrimSpace(input.Name) == "" || strings.TrimSpace(input.Description) == "" || input.DurationMinutes <= 0 {
		writeError(w, http.StatusBadRequest, errInvalidRequest.Error())
		return
	}
	writeJSON(w, http.StatusOK, api.store.CreateEventType(input))
}

func (api *API) handleOwnerBookings(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, api.store.Bookings())
}

func (api *API) handlePublicEventTypes(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, api.store.EventTypes())
}

func (api *API) handlePublicSlots(w http.ResponseWriter, r *http.Request) {
	eventTypeID := chi.URLParam(r, "eventTypeId")
	slots, err := api.store.Slots(eventTypeID)
	if err != nil {
		writeError(w, http.StatusNotFound, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, SlotList{Items: slots})
}

func (api *API) handlePublicCreateBooking(w http.ResponseWriter, r *http.Request) {
	var input BookingCreate
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, http.StatusBadRequest, errInvalidRequest.Error())
		return
	}
	booking, err := api.store.CreateBooking(input)
	if err != nil {
		switch {
		case errors.Is(err, errSlotBooked):
			writeError(w, http.StatusConflict, SlotAlreadyBookedError{Message: "Slot already booked"})
		case errors.Is(err, errNotFound):
			writeError(w, http.StatusNotFound, err.Error())
		default:
			writeError(w, http.StatusBadRequest, errInvalidRequest.Error())
		}
		return
	}
	writeJSON(w, http.StatusOK, booking)
}

func decodeJSON(r *http.Request, dst any) error {
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	return dec.Decode(dst)
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func writeError(w http.ResponseWriter, status int, payload any) {
	writeJSON(w, status, payload)
}

func middlewareRecoverer(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if recovered := recover(); recovered != nil {
				log.Printf("panic: %v", recovered)
				writeError(w, http.StatusInternalServerError, map[string]string{"message": "internal server error"})
			}
		}()
		next.ServeHTTP(w, r)
	})
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "4010"
	}

	server := &http.Server{
		Addr:         ":" + port,
		Handler:      (&API{store: newStore()}).router(),
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 5 * time.Second,
	}

	log.Printf("listening on %s", server.Addr)
	if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Fatal(err)
	}
}
