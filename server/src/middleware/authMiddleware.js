// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import createError from "http-errors";

export const protect = async (req, res, next) => {
  console.log("🚫 PROTECT HIT:", req.originalUrl);
  console.log("COOKIES:", req.cookies);
  console.log("AUTH HEADER:", req.headers.authorization);



  let token = null;

  // 1️⃣ Check cookie
  if (req.cookies?.token) {
    token = req.cookies.token;
  }

  // 2️⃣ Check Authorization header
  if (
    !token &&
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  console.log("TOKEN FOUND:", token);

  if (!token) {
    return next(createError(401, "Not authenticated"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.userId);
    next();
  } catch (err) {
    return next(createError(401, "Invalid token"));
  }
};
