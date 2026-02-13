import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export const socket = io(SOCKET_URL, {
  withCredentials: true,
  autoConnect: true,
});

// 🔑 JOIN STAFF ROOM ONCE PER CONNECTION
socket.on("connect", () => {
  console.log("🧠 socket connected (client):", socket.id);

  socket.emit("staff:join");
});
