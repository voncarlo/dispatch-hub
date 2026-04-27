import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function AccountSettings() {
  const { user, profile, refresh } = useAuth();
  const [fullName, setFullName] = useState("");
  const [position, setPosition] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setFullName(profile?.full_name || "");
    setPosition(profile?.position || "");
  }, [profile]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName, position }).eq("id", user!.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
    refresh();
  };

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    const pw = fd.get("password") as string;
    if (!pw || pw.length < 8) return toast.error("Password must be at least 8 characters");
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    (e.target as HTMLFormElement).reset();
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Account Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your profile and security.</p>
      </div>
      <Card className="surface-card">
        <CardContent className="p-6">
          <h2 className="font-semibold mb-4">Profile</h2>
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="space-y-1.5"><Label>Email</Label><Input value={profile?.email || ""} disabled /></div>
            <div className="space-y-1.5"><Label>Full Name</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Position</Label><Input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="e.g. Dispatch Lead" /></div>
            <Button type="submit" disabled={busy}>Save Profile</Button>
          </form>
        </CardContent>
      </Card>
      <Card className="surface-card">
        <CardContent className="p-6">
          <h2 className="font-semibold mb-4">Change Password</h2>
          <form onSubmit={updatePassword} className="space-y-4">
            <div className="space-y-1.5"><Label>New Password</Label><Input name="password" type="password" minLength={8} required /></div>
            <Button type="submit" variant="outline">Update Password</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
