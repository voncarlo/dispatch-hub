import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

export type Dsp = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  active: boolean;
};

export type Module = {
  id: string;
  dsp_id: string;
  parent_id: string | null;
  code: string;
  name: string;
  icon: string | null;
  sort_order: number;
};

interface DspContextValue {
  allDsps: Dsp[];
  accessibleDsps: Dsp[];
  activeDsp: Dsp | null;
  modules: Module[];
  accessibleModules: Module[];
  setActiveDsp: (dsp: Dsp | null) => void;
  loading: boolean;
  refresh: () => Promise<void>;
}

const DspContext = createContext<DspContextValue | undefined>(undefined);

export function DspProvider({ children }: { children: ReactNode }) {
  const { user, isAdmin } = useAuth();
  const [allDsps, setAllDsps] = useState<Dsp[]>([]);
  const [accessibleDspIds, setAccessibleDspIds] = useState<Set<string>>(new Set());
  const [activeDsp, setActiveDspState] = useState<Dsp | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [accessibleModuleIds, setAccessibleModuleIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const { data: dsps } = await supabase.from("dsps").select("*").eq("active", true).order("sort_order");
    const dspList = (dsps || []) as Dsp[];
    setAllDsps(dspList);

    let nextAccessibleDspIds = new Set<string>();
    if (isAdmin) {
      nextAccessibleDspIds = new Set(dspList.map((d) => d.id));
    } else {
      const { data: access } = await supabase.from("user_dsp_access").select("dsp_id").eq("user_id", user.id);
      nextAccessibleDspIds = new Set((access || []).map((a: any) => a.dsp_id));
    }
    setAccessibleDspIds(nextAccessibleDspIds);

    if (!isAdmin) {
      const { data: modAccess } = await supabase.from("user_module_access").select("module_id").eq("user_id", user.id);
      setAccessibleModuleIds(new Set((modAccess || []).map((m: any) => m.module_id)));
    }

    // Restore active DSP only if the current user can still access it.
    const stored = localStorage.getItem("tgo_active_dsp");
    if (stored) {
      const found = dspList.find((d) => d.id === stored && nextAccessibleDspIds.has(d.id));
      if (found) {
        setActiveDspState(found);
      } else {
        setActiveDspState(null);
        localStorage.removeItem("tgo_active_dsp");
      }
    }
    setLoading(false);
  }, [user, isAdmin]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // When active DSP changes, load its modules
  useEffect(() => {
    if (!activeDsp) { setModules([]); return; }
    supabase.from("modules").select("*").eq("dsp_id", activeDsp.id).order("sort_order").then(({ data }) => {
      setModules((data || []) as Module[]);
    });
  }, [activeDsp]);

  const setActiveDsp = (dsp: Dsp | null) => {
    setActiveDspState(dsp);
    if (dsp) localStorage.setItem("tgo_active_dsp", dsp.id);
    else localStorage.removeItem("tgo_active_dsp");
  };

  const accessibleDsps = allDsps.filter((d) => accessibleDspIds.has(d.id));
  const accessibleModules = isAdmin ? modules : modules.filter((m) => accessibleModuleIds.has(m.id));

  return (
    <DspContext.Provider value={{ allDsps, accessibleDsps, activeDsp, modules, accessibleModules, setActiveDsp, loading, refresh: loadAll }}>
      {children}
    </DspContext.Provider>
  );
}

export function useDsp() {
  const ctx = useContext(DspContext);
  if (!ctx) throw new Error("useDsp must be used within DspProvider");
  return ctx;
}
