import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import http from "http";
import jwt from "jsonwebtoken";
import { Server as SocketIOServer } from "socket.io";
import { setIO } from "./socket/ioStore.js";

import { connectDB } from "./config/db.js";

import guestRoutes from "./routes/guestRoutes.js";
import menuRoutes from "./routes/menuRoutes.js";
import ticketRoutes from "./routes/ticketRoutes.js";
import staffTickesRoutes from "./routes/staffTicketRoutes.js";
import guestTicketsRoutes from "./routes/guestTicketsRoutes.js";
import staffTableRoutes from "./routes/staffTableRoutes.js";
import joinRoutes from "./routes/joinRoutes.js";
import joinCodeRoutes from "./routes/joinCodeRoutes.js";
import staffTabRoutes from "./routes/staffTabRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import serviceRequestRoutes from "./routes/serviceRequestRoutes.js";
import adminRoutes from "./routes/adminUserRoutes.js";
import reservationRoutes from "./routes/reservationRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";

// NEW
import notificationRoutes from "./routes/notificationRoutes.js";
import meNotificationPreferencesRoutes from "./routes/meNotificationPreferencesRoutes.js";

dotenv.config();

// ----------------------------------
// Init app + server
// ----------------------------------
const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

// ----------------------------------
// Socket.io
// ----------------------------------
const io = new SocketIOServer(server, {
  cors: {
    origin: CLIENT_ORIGIN,
    credentials: true,
  },
});

setIO(io);

/**
 * Try to extract token from:
 * - socket.handshake.auth.token (preferred)
 * - Authorization header "Bearer <token>"
 * - cookie "token=<token>"
 */
function getSocketToken(socket) {
  const authToken = socket.handshake?.auth?.token;
  if (authToken) return authToken;

  const authHeader = socket.handshake?.headers?.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  const cookieHeader = socket.handshake?.headers?.cookie || "";
  // naive cookie parse for token=
  const parts = cookieHeader.split(";").map((p) => p.trim());
  const tokenPart = parts.find((p) => p.startsWith("token="));
  if (tokenPart) return decodeURIComponent(tokenPart.replace("token=", ""));

  return null;
}

// Auth middleware for sockets (non-breaking: unauth sockets still connect, but won't join user rooms)
io.use((socket, next) => {
  try {
    const token = getSocketToken(socket);
    if (!token) {
      socket.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // your REST uses decoded.userId
    const userId = decoded.userId;
    const role = decoded.role || null;

    if (!userId) {
      socket.user = null;
      return next();
    }

    socket.user = { id: String(userId), role };
    next();
  } catch {
    socket.user = null;
    next();
  }
});

io.on("connection", (socket) => {
  console.log("🔌 socket connected:", socket.id);

  // Existing rooms (keep)
  socket.on("staff:join", () => {
    socket.join("staff");
    console.log("👩‍🍳 staff joined room: staff");
  });

  socket.on("table:join", ({ tableId }) => {
    if (!tableId) return;
    socket.join(`table:${tableId}`);
    console.log(`🍽️ table joined room: table:${tableId}`);
  });

  // NEW: notification rooms (auto join if authenticated)
  if (socket.user?.id) {
    socket.join(`user:${socket.user.id}`);
    console.log(`🔔 joined room: user:${socket.user.id}`);
  }
  if (socket.user?.role) {
    socket.join(`role:${socket.user.role}`);
    console.log(`🔔 joined room: role:${socket.user.role}`);
  }

  // Optional: allow client to request extra role rooms (admin dashboards)
  socket.on("notifications:join", ({ roles } = {}) => {
    if (!Array.isArray(roles)) return;
    roles.forEach((r) => {
      if (typeof r === "string" && r.trim()) {
        socket.join(`role:${r}`);
        console.log(`🔔 joined room: role:${r}`);
      }
    });
  });

  socket.on("disconnect", () => {
    console.log("🔌 socket disconnected:", socket.id);
  });
});

// Make io available in controllers via req.app.get("io")
app.set("io", io);

// ----------------------------------
// Connect DB
// ----------------------------------
await connectDB(process.env.MONGO_URI);

// ----------------------------------
// Middleware
// ----------------------------------
app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// ----------------------------------
// Routes
// ----------------------------------
app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "API is running 🚀" });
});

app.use("/api", adminRoutes);
app.use("/api", userRoutes);
app.use("/api", guestRoutes);
app.use("/api", menuRoutes);
app.use("/api", ticketRoutes);
app.use("/api", staffTickesRoutes);
app.use("/api", guestTicketsRoutes);
app.use("/api", staffTableRoutes);
app.use("/api", staffTabRoutes);
app.use("/api", joinRoutes);
app.use("/api", joinCodeRoutes);
app.use("/api", serviceRequestRoutes);
app.use("/api/staff/reservations", reservationRoutes);
app.use("/api", uploadRoutes);

// NEW routes
app.use("/api", notificationRoutes);
app.use("/api", meNotificationPreferencesRoutes);

// ----------------------------------
// Error handling
// ----------------------------------
app.use((err, req, res, next) => {
  console.error("❌ Server error:", err);

  if (err?.code === 11000) {
    return res.status(400).json({ message: "Email already in use." });
  }

  res.status(err.status || 500).json({
    message: err.message || "Server error",
  });
});

// ----------------------------------
// Start server
// ----------------------------------
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});