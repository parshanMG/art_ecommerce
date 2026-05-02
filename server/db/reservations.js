const RESERVATION_TTL_MINUTES = Number(process.env.RESERVATION_TTL_MINUTES) || 30;

export async function releaseExpiredReservations(queryable) {
  await queryable.query(
    `UPDATE products
     SET reserved = FALSE, reserved_at = NULL
     WHERE reserved = TRUE
       AND reserved_at IS NOT NULL
       AND reserved_at < NOW() - ($1::int * INTERVAL '1 minute')`,
    [RESERVATION_TTL_MINUTES]
  );
}

export { RESERVATION_TTL_MINUTES };