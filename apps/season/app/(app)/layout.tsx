"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken, getActiveTeam, setActiveTeam as persistTeam } from "@/lib/auth";
import type { TeamWithMeta } from "@/lib/types";
import AppHeader from "@/components/layout/AppHeader";
import TabBar from "@/components/layout/TabBar";

interface ActiveTeamContextValue {
  team: TeamWithMeta | null;
  setTeam: (t: TeamWithMeta) => void;
}

const ActiveTeamContext = createContext<ActiveTeamContextValue>({
  team: null,
  setTeam: () => {},
});

export function useActiveTeam() {
  return useContext(ActiveTeamContext);
}

export { ActiveTeamContext };

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [team, setTeamState] = useState<TeamWithMeta | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    const savedTeam = getActiveTeam();
    if (savedTeam) {
      setTeamState(savedTeam);
    }
    setChecked(true);
  }, [router]);

  function setTeam(t: TeamWithMeta) {
    setTeamState(t);
    persistTeam(t);
  }

  if (!checked) {
    return null;
  }

  return (
    <ActiveTeamContext.Provider value={{ team, setTeam }}>
      <div className="flex flex-col min-h-screen">
        <AppHeader />
        <main className="flex-1">{children}</main>
        <TabBar />
      </div>
    </ActiveTeamContext.Provider>
  );
}
