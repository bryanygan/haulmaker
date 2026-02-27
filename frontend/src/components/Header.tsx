"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { clearToken, isAuthenticated } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogOut } from "lucide-react";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [showLogout, setShowLogout] = useState(false);

  useEffect(() => {
    setShowLogout(pathname !== "/login" && isAuthenticated());
  }, [pathname]);

  function handleLogout() {
    clearToken();
    router.push("/login");
  }

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <a href="/quotes" className="text-lg font-bold">
          ZR Hauls
        </a>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          {showLogout && (
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
