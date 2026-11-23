import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import DashboardHeader from "../components/dashboard/DashboardHeader.jsx";
import DashboardBody from "../components/dashboard/DashboardBody.jsx";
import DashboardFooter from "../components/dashboard/DashboardFooter.jsx";
import DocumentsWorkspace from "./DocumentsWorkspace.jsx";
import AskWorkspace from "./AskWorkspace.jsx";
import ProfileSettings from "./ProfileSettings.jsx";
import "../components/dashboard/dashboard.css";
import "../components/dashboard/account.css";

export default function Workspace() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const name = user?.name || user?.email || "there";
  const firstName = name.trim().split(/\s+/)[0];
  const [activeView, setActiveView] = useState(
    location.hash === "#documents" ? "Documents" : location.hash === "#ask" ? "Ask উপলব্ধি" : "Dashboard",
  );
  const [initialDocumentId, setInitialDocumentId] = useState(null);
  const [initialChatId, setInitialChatId] = useState(null);

  const onSignOut = () => {
    signOut();
    navigate("/login", { replace: true });
  };

  const handleNavigate = (view, targetId = null) => {
    if (view === "Home") {
      navigate("/", { replace: true });
    } else if (view === "Documents") {
      setInitialDocumentId(targetId);
      setInitialChatId(null);
      setActiveView("Documents");
      navigate("/workspace#documents");
    } else if (view === "Ask উপলব্ধি") {
      setInitialChatId(targetId);
      setInitialDocumentId(null);
      setActiveView("Ask উপলব্ধি");
      navigate("/workspace#ask");
    } else if (view === "Dashboard") {
      setInitialDocumentId(null);
      setInitialChatId(null);
      setActiveView("Dashboard");
      navigate("/dashboard");
    } else if (view === "Profile") {
      setActiveView("Profile");
      navigate("/workspace#profile");
    } else if (view === "Settings") {
      setActiveView("Settings");
      navigate("/workspace#settings");
    } else if (view === "Help") {
      setActiveView("Help");
      navigate("/contact");
    } else if (view === "Sign out") onSignOut();
  };

  const askAboutDocument = (document) => {
    setInitialDocumentId(document?.id || null);
    setInitialChatId(null);
    setActiveView("Ask উপলব্ধি");
    navigate("/workspace#ask");
  };

  useEffect(() => {
    if (location.hash === "#documents") setActiveView("Documents");
    else if (location.hash === "#ask") setActiveView("Ask উপলব্ধি");
    else if (location.hash === "#profile") setActiveView("Profile");
    else if (location.hash === "#settings") setActiveView("Settings");
    else setActiveView("Dashboard");
  }, [location.hash]);

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  return (
    <div className="dashboard-app">
      <DashboardHeader onNavigate={handleNavigate} activeView={activeView} user={user} />
      <div hidden={activeView !== "Dashboard"} aria-hidden={activeView !== "Dashboard"}>
        <DashboardBody onNavigate={handleNavigate} userName={firstName} onSignOut={onSignOut} />
      </div>
      <div hidden={activeView !== "Documents"} aria-hidden={activeView !== "Documents"}>
        <DocumentsWorkspace initialDocumentId={initialDocumentId} onAskDocument={askAboutDocument} />
      </div>
      <div hidden={activeView !== "Ask উপলব্ধি"} aria-hidden={activeView !== "Ask উপলব্ধি"}>
        <AskWorkspace initialDocumentId={initialDocumentId} initialChatId={initialChatId} />
      </div>
      <div hidden={activeView !== "Profile"} aria-hidden={activeView !== "Profile"}>
        <ProfileSettings mode="Profile" />
      </div>
      <div hidden={activeView !== "Settings"} aria-hidden={activeView !== "Settings"}>
        <ProfileSettings mode="Settings" />
      </div>
      {activeView !== "Ask উপলব্ধি" && <DashboardFooter />}
    </div>
  );
}
