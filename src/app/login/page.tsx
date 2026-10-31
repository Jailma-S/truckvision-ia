"use client";

import { Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, Card, Input, Label } from "@/components/ui";
import { createSupabaseBrowserClient } from "@/infrastructure/supabase/clients-browser";

/** Traduz os erros do link mágico que o Supabase devolve na URL. */
function linkErrorMessage(raw: string): string {
  const text = raw.toLowerCase();
  if (text.includes("expired") || text.includes("invalid"))
    return "O link expirou ou já foi usado. Cada link funciona uma única vez: peça um novo abaixo.";
  if (text.includes("code verifier") || text.includes("code_verifier"))
    return "Abra o link do e-mail no mesmo navegador em que você pediu o acesso e peça um novo link.";
  if (text.includes("signups not allowed") || text.includes("not allowed"))
    return "Este e-mail não está liberado. Peça um convite ao administrador do TruckVision IA.";
  return `Não foi possível entrar: ${raw}`;
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const raw = query.get("erro") ?? hash.get("error_description") ?? hash.get("error_code");
    if (raw) {
      setError(linkErrorMessage(raw));
      setStatus("error");
    }
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const { error } = await createSupabaseBrowserClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError(linkErrorMessage(error.message));
      setStatus("error");
    } else setStatus("sent");
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="card-glow w-full max-w-sm p-7">
        <div className="mb-7 flex items-center gap-3">
          <span className="tile-3d flex h-11 w-11 items-center justify-center rounded-xl">
            <Truck className="h-5 w-5 text-white" />
          </span>
          <div>
            <h1 className="font-semibold text-white">TruckVision IA</h1>
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
            {status === "error" && <p className="text-sm text-red-400">{error}</p>}
          </form>
        )}
      </Card>
    </main>
  );
}
