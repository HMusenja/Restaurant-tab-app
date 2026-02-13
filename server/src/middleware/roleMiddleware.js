// middleware/roleMiddleware.js
import createError from "http-errors";

export const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return next(createError(403, "Admin access required"));
  }
  next();
};
