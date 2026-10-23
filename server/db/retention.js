/* ─────────────────────────────────────────────────────────────────────
   DATA RETENTION
   Data protection law (UK/EU GDPR "storage limitation") requires
   personal data to be deleted once it's no longer needed. Contact-form
   messages are deleted after CONTACT_RETENTION_MONTHS (default 24).

   If you change the period, update CONTACT_RETENTION in
   src/components/Privacy.jsx so the published policy stays accurate.

   Orders are not purged here: tax and accounting law requires sales
   records to be kept (six years in the UK).
───────────────────────────────────────────────────────────────────── */
const CONTACT_RETENTION_MONTHS = Number(process.env.CONTACT_RETENTION_MONTHS) || 24;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export async function purgeExpiredContactSubmissions(queryable) {
  const { rowCount } = await queryable.query(
    `DELETE FROM contact_submissions
     WHERE created_at < NOW() - ($1::int * INTERVAL '1 month')`,
    [CONTACT_RETENTION_MONTHS]
  );
  return rowCount;
}

/* Runs the purge now and then once a day for as long as the server runs. */
export function scheduleRetention(queryable) {
  const run = () =>
    purgeExpiredContactSubmissions(queryable)
      .then((count) => {
        if (count > 0) console.log(`Retention: deleted ${count} contact message(s) older than ${CONTACT_RETENTION_MONTHS} months.`);
      })
      .catch((err) => console.error("Retention purge failed:", err.message));

  run();
  setInterval(run, ONE_DAY_MS).unref();
}

export { CONTACT_RETENTION_MONTHS };
