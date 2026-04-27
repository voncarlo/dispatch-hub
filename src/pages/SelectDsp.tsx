import { useNavigate } from "react-router-dom";
import { useDsp } from "@/context/DspContext";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/BrandLogo";
import { ArrowRight, Loader2, LogOut, ShieldAlert, Building2 } from "lucide-react";

export default function SelectDsp() {
  const navigate = useNavigate();
  const { accessibleDsps, setActiveDsp, loading } = useDsp();
  const { profile, signOut, isAdmin } = useAuth();

  const onPick = (dsp: any) => {
    setActiveDsp(dsp);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent">
      <header className="border-b border-border/60 bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between p-4">
          <BrandLogo />
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:block">{profile?.full_name || profile?.email}</span>
            <Button variant="ghost" size="sm" onClick={() => signOut().then(() => navigate("/sign-in"))}>
              <LogOut className="mr-2 h-4 w-4" />Log Out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Select Your DSP</h1>
          <p className="mt-3 text-muted-foreground">Choose the delivery service partner you'll be working on today.</p>
          {isAdmin && (
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary-deep">
              <ShieldAlert className="h-3.5 w-3.5" /> Admin — full access
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : accessibleDsps.length === 0 ? (
          <Card className="mx-auto max-w-md">
            <CardContent className="py-10 text-center">
              <ShieldAlert className="mx-auto mb-3 h-10 w-10 text-warning" />
              <h3 className="font-semibold">No DSP access</h3>
              <p className="mt-1 text-sm text-muted-foreground">Contact your administrator to be granted DSP access.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {accessibleDsps.map((dsp) => (
              <button key={dsp.id} onClick={() => onPick(dsp)} className="group text-left">
                <Card className="h-full border-border/60 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elevated">
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-brand shadow-brand">
                      <Building2 className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold">{dsp.name}</h3>
                    <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{dsp.code}</p>
                    <div className="mt-4 flex items-center text-sm font-medium text-primary group-hover:gap-2 transition-all">
                      Open dashboard <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        )}
      </main>

      <footer className="py-6 text-center text-xs text-muted-foreground">© 2026 VON (Projects Team)</footer>
    </div>
  );
}
