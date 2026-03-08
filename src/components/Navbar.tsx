import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { APP_NAME, APP_LOGO_URL } from "@/config/constants";

interface NavbarProps {
  activePage: "home" | "requests";
  onNavigate: (page: "home" | "requests") => void;
}

export function Navbar({ activePage, onNavigate }: NavbarProps) {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b bg-primary text-primary-foreground">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-lg">
            <img src={APP_LOGO_URL} alt={APP_NAME} className="h-8 w-8 rounded" />
            <span>ReqEase</span>
          </div>
          <nav className="flex gap-1">
            <button
              onClick={() => onNavigate("home")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activePage === "home"
                  ? "bg-primary-foreground/20"
                  : "hover:bg-primary-foreground/10"
              }`}
            >
              Home
            </button>
            <button
              onClick={() => onNavigate("requests")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activePage === "requests"
                  ? "bg-primary-foreground/20"
                  : "hover:bg-primary-foreground/10"
              }`}
            >
              Requests
            </button>
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
