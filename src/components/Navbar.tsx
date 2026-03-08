import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { APP_NAME } from "@/config/constants";
import { isAdmin } from "@/config/adminList";
import logoImg from "@/assets/logo.png";

export type AppPage = "home" | "requests" | "review";

interface NavbarProps {
  activePage: AppPage;
  onNavigate: (page: AppPage) => void;
}

export function Navbar({ activePage, onNavigate }: NavbarProps) {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b bg-primary text-primary-foreground">
      <div className="flex h-14 sm:h-16 items-center justify-between px-3 sm:px-6">
        <div className="flex items-center gap-3 sm:gap-6">
          <div className="flex items-center gap-1.5 sm:gap-2 text-base sm:text-lg shrink-0">
            <img src={logoImg} alt={APP_NAME} className="h-7 w-7 sm:h-8 sm:w-8 rounded" />
            <span className="font-medium">SHAP ReqEase</span>
          </div>
          <nav className="flex gap-0.5 sm:gap-1">
            <button
              onClick={() => onNavigate("home")}
              className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                activePage === "home"
                  ? "bg-primary-foreground/20"
                  : "hover:bg-primary-foreground/10"
              }`}
            >
              Home
            </button>
            <button
              onClick={() => onNavigate("requests")}
              className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                activePage === "requests"
                  ? "bg-primary-foreground/20"
                  : "hover:bg-primary-foreground/10"
              }`}
            >
              Requests
            </button>
            {isAdmin(user?.email) && (
              <button
                onClick={() => onNavigate("review")}
                className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  activePage === "review"
                    ? "bg-primary-foreground/20"
                    : "hover:bg-primary-foreground/10"
                }`}
              >
                Review
              </button>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm opacity-80 hidden sm:inline">
            {user?.email}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
