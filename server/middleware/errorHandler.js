/* Global error handler — must be the last middleware registered in index.js */
export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message = err.message || "Internal server error";
  console.error(`[${status}] ${message}`, err.stack);
  res.status(status).json({ error: message });
}
