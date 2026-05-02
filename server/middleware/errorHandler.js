/* Global error handler — must be the last middleware registered in index.js */
export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  /* Never expose internal error details or stack traces to the client in production */
  const message =
    process.env.NODE_ENV === "production" && status === 500
      ? "Internal server error"
      : err.message || "Internal server error";
  console.error(`[${status}] ${err.message}`, err.stack);
  res.status(status).json({ error: message });
}
