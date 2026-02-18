import { SnackbarProvider } from "./contexts/SnackbarContext";

import AppRoutes2 from "./routes/AppRoutes2";

export default function App() {
  return (
    

    <SnackbarProvider>
      <AppRoutes2 />
    </SnackbarProvider>
  );
}
