import { useCallback, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import Footer from "./Footer.jsx";
import Loader from "./Loader.jsx";
import ChatBot from "./ChatBot.jsx";
import WorkspaceModal from "./WorkspaceModal.jsx";

const AUTH_ROUTES = ["/login", "/register", "/forgot-password"];
const DASHBOARD_ROUTES = ["/dashboard", "/workspace"];

export default function Layout() {
  const { pathname } = useLocation();
  const isAuthRoute = AUTH_ROUTES.includes(pathname);
  const isDashboardRoute = DASHBOARD_ROUTES.includes(pathname);

  const [loading, setLoading] = useState(true);
  const handleLoaderDone = useCallback(() => setLoading(false), []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  return (
    <>
      {loading && <Loader onDone={handleLoaderDone} />}
      {!isDashboardRoute && (
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-mint focus:px-4 focus:py-2 focus:text-ink"
        >
          Skip to content
        </a>
      )}
      {!isDashboardRoute && <Navbar />}
      <main id="main">
        <Outlet />
      </main>
      {!isAuthRoute && !isDashboardRoute && <Footer />}
      {!isDashboardRoute && <ChatBot />}
      {!isDashboardRoute && <WorkspaceModal />}
    </>
  );
}
