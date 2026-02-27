import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import { setAxiosDefaults } from "./api/axiosConfig.js";
import { RealtimeProvider } from "./contexts/RealtimeContext.jsx";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { ServiceProvider } from "./contexts/ServiceContext.jsx";
import { ReservationsProvider } from "./contexts/reservations/ReservationsContext.jsx";
import { MenuProvider } from "./contexts/MenuContext.jsx";
import { NotificationsProvider } from "./contexts/NotificationsContext.jsx";

setAxiosDefaults();

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <RealtimeProvider>
        <NotificationsProvider>
          <MenuProvider>
          <ServiceProvider>
            <ReservationsProvider>
              <App />
            </ReservationsProvider>
          </ServiceProvider>
        </MenuProvider>
        </NotificationsProvider>
      </RealtimeProvider>
    </AuthProvider>
  </BrowserRouter>,
);
