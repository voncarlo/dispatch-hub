import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { hasSupabaseEnv } from "./integrations/supabase/client";

createRoot(document.getElementById("root")!).render(
  hasSupabaseEnv ? <App /> : <MissingConfigScreen />
);

function MissingConfigScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-accent p-6">
      <div className="surface-elevated w-full max-w-xl p-8">
        <div className="space-y-4">
          <div>
            <h1 className="apple-page-title text-3xl text-foreground">Dispatch Hub needs Supabase configuration</h1>
            <p className="apple-body mt-3 text-sm text-muted-foreground">
              This deployment is running, but the required client environment variables are missing, so the app cannot connect to Supabase yet.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="font-display text-base font-semibold tracking-[-0.02em] text-foreground">Set these Railway variables:</p>
            <div className="mt-3 space-y-2 font-mono text-sm">
              <div>VITE_SUPABASE_URL</div>
              <div>VITE_SUPABASE_PUBLISHABLE_KEY</div>
            </div>
          </div>

          <p className="apple-body text-sm text-muted-foreground">
            After adding them in Railway, trigger a redeploy and this screen should be replaced by the sign-in page.
          </p>
        </div>
      </div>
    </div>
  );
}
