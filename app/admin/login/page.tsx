"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const router      = useRouter();
  const params      = useSearchParams();
  const [pw, setPw]     = useState("");
  const [err, setErr]   = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr("");
    const res = await fetch("/api/admin/login", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ password: pw }),
    });
    if (res.ok) {
      router.push(params.get("next") ?? "/admin");
    } else {
      const data = await res.json();
      setErr(data.error ?? "Error de autenticación");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-xs tracking-widest text-gray-500 mb-2">CONTRASEÑA</label>
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          autoFocus
          required
          className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black"
          placeholder="••••••••"
        />
      </div>
      {err && (
        <p className="text-[#FF1E1E] text-xs tracking-wider">{err}</p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-black text-white font-bebas tracking-widest text-sm py-3 hover:bg-[#FF1E1E] transition-colors disabled:opacity-50"
      >
        {loading ? "VERIFICANDO..." : "ENTRAR →"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f3] flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white p-8 shadow-sm">
        <div className="mb-8">
          <p className="font-bebas tracking-[0.3em] text-2xl text-black leading-none">BENOT</p>
          <p className="font-bebas tracking-[0.2em] text-[#FF1E1E] text-xs mt-1">BACKOFFICE</p>
        </div>
        <p className="text-sm text-gray-500 mb-6">Acceso restringido al equipo BENOT.</p>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
