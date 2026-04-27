import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

type ModuleStateRecord = {
  id: string;
  user_id: string;
  dsp_id: string | null;
  module_code: string;
  state_key: string;
  state_payload: Json;
  created_at: string;
  updated_at: string;
};

export async function loadModuleState<TState extends Json>(
  dspId: string | null | undefined,
  moduleCode: string,
  stateKey: string
): Promise<TState | null> {
  const user = await requireUserId();
  const { data, error } = await supabase
    .from("module_states")
    .select("*")
    .eq("user_id", user)
    .eq("module_code", moduleCode)
    .eq("state_key", stateKey)
    .is("dsp_id", dspId ?? null)
    .maybeSingle();

  if (error) throw error;
  return (data as ModuleStateRecord | null)?.state_payload as TState | null;
}

export async function saveModuleState(
  dspId: string | null | undefined,
  moduleCode: string,
  stateKey: string,
  statePayload: Json
) {
  const userId = await requireUserId();
  const { error } = await supabase.from("module_states").upsert(
    {
      user_id: userId,
      dsp_id: dspId ?? null,
      module_code: moduleCode,
      state_key: stateKey,
      state_payload: statePayload,
    },
    {
      onConflict: "user_id,dsp_id,module_code,state_key",
    }
  );

  if (error) throw error;
}

export async function clearModuleState(
  dspId: string | null | undefined,
  moduleCode: string,
  stateKey: string
) {
  const userId = await requireUserId();
  const { error } = await supabase
    .from("module_states")
    .delete()
    .eq("user_id", userId)
    .eq("module_code", moduleCode)
    .eq("state_key", stateKey)
    .is("dsp_id", dspId ?? null);

  if (error) throw error;
}

async function requireUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user) throw new Error("You must be signed in to manage module state.");
  return user.id;
}
