// Mirrors public.enforce_booking_transition() in the database (the database is the source of truth).
export const BOOKING_STATUSES = ["pending", "awaiting_payment", "paid", "confirmed", "cancelled", "refunded", "completed", "disputed", "expired"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const BOOKING_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending: ["awaiting_payment", "confirmed", "cancelled", "expired"],
  awaiting_payment: ["paid", "confirmed", "cancelled", "expired"],
  paid: ["confirmed", "refunded", "disputed"],
  confirmed: ["completed", "cancelled", "refunded", "disputed"],
  completed: ["disputed", "refunded"],
  disputed: ["completed", "refunded"],
  cancelled: [],
  refunded: [],
  expired: []
};

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Solicitud recibida",
  awaiting_payment: "Esperando pago",
  paid: "Pagada",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
  refunded: "Reembolsada",
  completed: "Completada",
  disputed: "En disputa",
  expired: "Expirada"
};
