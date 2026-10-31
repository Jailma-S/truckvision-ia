"use client";

import { Truck } from "lucide-react";
import { useState } from "react";
import { Button, Card, Input, Label } from "@/components/ui";
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/clients-browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const { error } = await createSupabaseBrowserClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message);
      setStatus("error");
    } else setStatus("sent");
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm p-6">
        <div className="mb-6 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Truck className="h-5 w-5 text-white" />
          </span>
          <div>
            <h1 className="font-semibold">TruckVision IA</h1>
            <p className="text-xs text-muted">Enxergue hoje as oportunidades de amanhã</p>
          </div>
        </div>
        {status === "sent" ? (
          <p className="text-sm">Enviamos um link de acesso para <strong>{email}</strong>. Verifique seu e-mail.</p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div>
              <Label htmlFor="email">E-mail corporativo</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <Button className="w-full" disabled={status === "sending"}>
              {status === "sending" ? "Enviando…" : "Receber link de acesso"}
            </Button>
            {status === "error" && <p className="text-sm text-danger">{error}</p>}
          </form>
        )}
      </Card>
    </main>
  );
}
