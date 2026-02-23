import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import http from "http";
import { Server as SocketIOServer } from "socket.io";

import { connectDB } from "./config/db.js";
import guestRoutes from "./routes/guestRoutes.js";
import menuRoutes from "./routes/menuRoutes.js";
import ticketRoutes from "./routes/ticketRoutes.js";
import staffTickesRoutes from "./routes/staffTicketRoutes.js";
import guestTicketsRoutes from "./routes/guestTicketsRoutes.js"
import staffTableRoutes from "./routes/staffTableRoutes.js";
import joinRoutes from "./routes/joinRoutes.js"
import joinCodeRoutes from "./routes/joinCodeRoutes.js";
import staffTabRoutes from "./routes/staffTabRoutes.js"
import userRoutes from "./routes/userRoutes.js"
import serviceRequestRoutes from "./routes/serviceRequetRoutes.js"
import adminRoutes from "./routes/adminUserRoutes.js"
import reservationRoutes from "./routes/reservationRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js"





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

io.on("connection", (socket) => {
  console.log("🔌 socket connected:", socket.id);

  socket.on("staff:join", () => {
    socket.join("staff");
    console.log("👩‍🍳 staff joined room: staff");
  });

  socket.on("table:join", ({ tableId }) => {
    if (!tableId) return;
    socket.join(`table:${tableId}`);
    console.log(`🍽️ table joined room: table:${tableId}`);
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

app.use("/api", adminRoutes)
app.use("/api", userRoutes)
app.use("/api", guestRoutes);
app.use("/api", menuRoutes);
app.use("/api", ticketRoutes);
app.use("/api", staffTickesRoutes);
app.use("/api", guestTicketsRoutes);
app.use("/api", staffTableRoutes);
app.use("/api", staffTabRoutes);
app.use("/api", joinRoutes);
app.use("/api", joinCodeRoutes);
app.use("/api", serviceRequestRoutes)
app.use("/api/staff/reservations", reservationRoutes);
app.use("/api", uploadRoutes);








// ----------------------------------
// 404 + Error handling
// ----------------------------------
app.use((err, req, res, next) => {
  console.error("❌ Server error:", err);

  // Handle duplicate email nicely (Mongo unique index)
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
