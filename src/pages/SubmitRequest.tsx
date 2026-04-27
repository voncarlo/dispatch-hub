import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useDsp } from "@/context/DspContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send } from "lucide-react";
import { toast } from "sonner";

export default function SubmitRequest() {
  const { user } = useAuth();
  const { activeDsp } = useDsp();
  const [form, setForm] = useState({ category: "tooling", subject: "", details: "", priority: "normal" });
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("submitted_requests").insert({
      user_id: user.id, dsp_id: activeDsp?.id,
      category: form.category, subject: form.subject, details: form.details, priority: form.priority,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Request submitted");
    setForm({ category: "tooling", subject: "", details: "", priority: "normal" });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Submit Request</h1>
        <p className="mt-1 text-sm text-muted-foreground">File a request for new tooling, data fixes, or operational support.</p>
      </div>
      <Card className="surface-card">
        <CardContent className="p-6">
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tooling">New Tooling / Feature</SelectItem>
                    <SelectItem value="data_fix">Data Fix</SelectItem>
                    <SelectItem value="access">Access / Permissions</SelectItem>
                    <SelectItem value="bug">Bug Report</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Subject</Label>
              <Input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Short summary" />
            </div>
            <div className="space-y-1.5">
              <Label>Details</Label>
              <Textarea rows={6} value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} placeholder="Provide as much detail as possible…" />
            </div>
            <Button type="submit" disabled={busy}><Send className="mr-2 h-4 w-4" />Submit Request</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
