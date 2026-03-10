import { Outlet } from "react-router-dom";

export default function GuestShellLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background to-muted/20">
        <main className="flex-1">
          <Outlet />
        </main>

        {/* Reserved safe-area space for floating buttons */}
        <div className="h-24 shrink-0" />
      </div>
    </div>
  );
}
