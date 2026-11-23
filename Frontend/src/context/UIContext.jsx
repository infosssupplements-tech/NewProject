import { createContext, useCallback, useContext, useMemo, useState } from "react";

const UIContext = createContext(null);

export function UIProvider({ children }) {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatDraft, setChatDraft] = useState("");
  const [workspaceOpen, setWorkspaceOpen] = useState(false);

  const openChat = useCallback((draft = "") => {
    setChatDraft(draft);
    setChatOpen(true);
  }, []);

  const value = useMemo(
    () => ({
      chatOpen,
      setChatOpen,
      chatDraft,
      setChatDraft,
      openChat,
      workspaceOpen,
      openWorkspace: () => setWorkspaceOpen(true),
      closeWorkspace: () => setWorkspaceOpen(false),
    }),
    [chatOpen, chatDraft, openChat, workspaceOpen],
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used inside UIProvider");
  return ctx;
}
