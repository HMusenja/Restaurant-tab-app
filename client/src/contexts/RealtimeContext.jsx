import { createContext, useContext, useEffect, useMemo, useRef } from "react";
import { socket } from "../realtime/socket";

const RealtimeContext = createContext(null);

function createDebounceMap() {
  const timers = new Map();
  return (key, fn, delay = 150) => {
    if (timers.has(key)) clearTimeout(timers.get(key));
    const t = setTimeout(() => {
      timers.delete(key);
      fn();
    }, delay);
    timers.set(key, t);
  };
}

function randomId() {
  return Math.random().toString(36).slice(2);
}

export function RealtimeProvider({ children }) {
  const debounced = useMemo(() => createDebounceMap(), []);

  // ✅ allow many registrations (no overwriting)
  const guests = useRef(new Map()); // id -> { tableId, reloadTab, reloadTickets }
  const staffs = useRef(new Map()); // id -> { reloadTickets, reloadServices, reloadTables }

  

  const api = useMemo(() => {
    return {
      registerGuest({ tableId, reloadTab, reloadTickets, reloadServices, reloadMenu }) {

        const id = randomId();
        guests.current.set(id, {
          tableId: tableId || null,
          reloadTab: reloadTab || null,
          reloadTickets: reloadTickets || null,
          reloadServices: reloadServices || null,
          reloadMenu: reloadMenu || null,
        });

        if (socket.connected && tableId) {
          socket.emit("table:join", { tableId });
        }

        return id;
      },

      unregisterGuest(id) {
        if (!id) return;
        guests.current.delete(id);
      },

      registerStaff({ reloadTickets, reloadServices, reloadTables,reloadMenu }) {
        const id = randomId();
        staffs.current.set(id, {
          reloadTickets: reloadTickets || null,
          reloadServices: reloadServices || null,
          reloadTables: reloadTables || null,
          reloadMenu: reloadMenu || null,
        });

        if (socket.connected) {
          socket.emit("staff:join");
        }

        return id;
      },

      

      unregisterStaff(id) {
        if (!id) return;
        staffs.current.delete(id);
      },
    };
  }, []);

  const runGuestServices = () => {
  for (const [id, g] of guests.current.entries()) {
    if (g.reloadServices) debounced(`guest:${id}:services`, g.reloadServices, 150);
  }
};

  useEffect(() => {
    const joinRooms = () => {
      // if any staff is registered -> join staff room
      if (staffs.current.size > 0) {
        socket.emit("staff:join");
      }

      // join all guest table rooms
      for (const g of guests.current.values()) {
        if (g.tableId) socket.emit("table:join", { tableId: g.tableId });
      }
    };

    const runGuestMenu = () => {
  for (const [id, g] of guests.current.entries()) {
    if (g.reloadMenu) debounced(`guest:${id}:menu`, g.reloadMenu, 180);
  }
};

const runStaffMenu = () => {
  for (const [id, s] of staffs.current.entries()) {
    if (s.reloadMenu) debounced(`staff:${id}:menu`, s.reloadMenu, 180);
  }
};

const runMenuAll = () => {
  runGuestMenu();
  runStaffMenu();
};

    const runGuestTickets = () => {
      for (const [id, g] of guests.current.entries()) {
        if (g.reloadTickets) debounced(`guest:${id}:tickets`, g.reloadTickets, 120);
      }
    };

    const runGuestTab = () => {
      for (const [id, g] of guests.current.entries()) {
        if (g.reloadTab) debounced(`guest:${id}:tab`, g.reloadTab, 120);
      }
    };

    const runStaffTickets = () => {
      for (const [id, s] of staffs.current.entries()) {
        if (s.reloadTickets) debounced(`staff:${id}:tickets`, s.reloadTickets, 150);
      }
    };

    const runStaffServices = () => {
      for (const [id, s] of staffs.current.entries()) {
        if (s.reloadServices) debounced(`staff:${id}:services`, s.reloadServices, 150);
      }
    };

    const runStaffTables = () => {
      for (const [id, s] of staffs.current.entries()) {
        if (s.reloadTables) debounced(`staff:${id}:tables`, s.reloadTables, 220);
      }
    };

    const runStaffAll = () => {
      runStaffTickets();
      runStaffServices();
      runStaffTables();
    };

    const onTabUpdated = () => {
      runGuestTab();
      runGuestTickets();
      runStaffAll();
    };

    // join rooms on connect
    socket.on("connect", joinRooms);

    // ---------- Guest events ----------
    socket.on("ticket:created", runGuestTickets);
    socket.on("ticket:updated", runGuestTickets);

    socket.on("tab:updated", onTabUpdated);

    socket.on("service:created", runGuestServices);
    socket.on("service:updated", runGuestServices);
    
    socket.on("menu:updated", runMenuAll);


    // ---------- Staff events ----------
    socket.on("ticket:new", runStaffTickets);
    socket.on("ticket:updated", runStaffTickets);

    socket.on("service:new", runStaffServices);
    socket.on("service:updated", runStaffServices);

    socket.on("tickets:updated", runStaffTickets);
    socket.on("services:updated", runStaffServices);
    socket.on("tables:updated", runStaffTables);

    // ---------- Reservations (Staff) ----------
socket.on("reservations:updated", runStaffTables);

    // if already connected, join once
    if (socket.connected) joinRooms();

    return () => {
      socket.off("connect", joinRooms);

      socket.off("menu:updated", runMenuAll);

      socket.off("ticket:created", runGuestTickets);
      socket.off("ticket:updated", runGuestTickets);

      socket.off("service:created", runGuestServices);
socket.off("service:updated", runGuestServices);

      socket.off("tab:updated", onTabUpdated);

      socket.off("ticket:new", runStaffTickets);
      socket.off("ticket:updated", runStaffTickets);

      socket.off("service:new", runStaffServices);
      socket.off("service:updated", runStaffServices);

      socket.off("tickets:updated", runStaffTickets);
      socket.off("services:updated", runStaffServices);
      socket.off("tables:updated", runStaffTables);
      socket.off("reservations:updated", runStaffTables);
    };
  }, [debounced]);

  return <RealtimeContext.Provider value={api}>{children}</RealtimeContext.Provider>;
}

export function useRealtime() {
  const ctx = useContext(RealtimeContext);
  if (!ctx) throw new Error("useRealtime must be used inside <RealtimeProvider />");
  return ctx;
}
