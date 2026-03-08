import { useState } from "react";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { BookingProvider } from "@/hooks/useBooking";
import { LoginPage } from "@/components/LoginPage";
import { Navbar, type AppPage } from "@/components/Navbar";
import { BookingWizard } from "@/components/wizard/BookingWizard";
import { RequestsPage } from "@/components/RequestsPage";
import { ReviewPage } from "@/components/ReviewPage";
import { Loader2 } from "lucide-react";

/** Inner app shell. Gates on auth, then renders Navbar + active page (Home/Requests/Review). */
function AppContent() {
  const { user, loading } = useAuth();
  const [activePage, setActivePage] = useState<AppPage>("home");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return (
    <BookingProvider>
      <div className="min-h-screen bg-background">
        <Navbar activePage={activePage} onNavigate={setActivePage} />
        {activePage === "home" && <BookingWizard />}
        {activePage === "requests" && <RequestsPage />}
        {activePage === "review" && <ReviewPage />}
      </div>
    </BookingProvider>
  );
}

export default function Index() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
