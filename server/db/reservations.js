const RESERVATION_TTL_MINUTES = Number(process.env.RESERVATION_TTL_MINUTES) || 30;

export async function releaseExpiredReservations(queryable) {
  await queryable.query(
    `UPDATE products
     SET reserved = FALSE, reserved_at = NULL, reservation_id = NULL
     WHERE reserved = TRUE
       AND reserved_at IS NOT NULL
       AND reserved_at < NOW() - ($1::int * INTERVAL '1 minute')`,
    [RESERVATION_TTL_MINUTES]
  );
}

/* Releases only the items held by one checkout attempt, so a stale
   attempt can never free items another buyer is now holding. */
export async function releaseReservation(queryable, reservationId) {
  if (!reservationId) return;

  await queryable.query(
    `UPDATE products
     SET reserved = FALSE, reserved_at = NULL, reservation_id = NULL
     WHERE reservation_id = $1`,
    [reservationId]
  );
}

export { RESERVATION_TTL_MINUTES };
