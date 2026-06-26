import { MongoServerError } from "mongodb";
import { ZodError } from "zod";

export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      details: error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message
      }))
    });
  }

  if (error instanceof MongoServerError && error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "A record with the same unique value already exists",
      details: error.keyValue
    });
  }

  const status = error.status || 500;
  if (status >= 500) console.error(error);

  return res.status(status).json({
    success: false,
    message: error.message || "Internal server error",
    ...(error.details ? { details: error.details } : {}),
    ...(process.env.NODE_ENV !== "production" && status >= 500
      ? { stack: error.stack }
      : {})
  });
}
