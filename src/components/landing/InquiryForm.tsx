"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface Props {
  labels: {
    org: string;
    name: string;
    phone: string;
    email: string;
    message: string;
    submit: string;
    success: string;
    error: string;
  };
}

export function InquiryForm({ labels }: Props) {
  const [form, setForm] = useState({ org: "", name: "", phone: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  function handle(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setStatus(res.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-7 flex items-center justify-center min-h-[280px]">
        <div className="text-center">
          <div className="text-4xl mb-3">✓</div>
          <p className="text-white font-semibold text-lg">{labels.success}</p>
        </div>
      </div>
    );
  }

  const inputCls =
    "w-full rounded-lg bg-white/10 border border-white/20 px-3.5 py-2.5 text-sm text-white placeholder:text-trust-100/50 focus:outline-none focus:ring-2 focus:ring-white/30";

  return (
    <form onSubmit={submit} className="rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-7 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <input
            name="org"
            required
            placeholder={labels.org}
            value={form.org}
            onChange={handle}
            className={inputCls}
          />
        </div>
        <div>
          <input
            name="name"
            required
            placeholder={labels.name}
            value={form.name}
            onChange={handle}
            className={inputCls}
          />
        </div>
      </div>
      <input
        name="phone"
        required
        placeholder={labels.phone}
        value={form.phone}
        onChange={handle}
        className={inputCls}
      />
      <input
        name="email"
        type="email"
        required
        placeholder={labels.email}
        value={form.email}
        onChange={handle}
        className={inputCls}
      />
      <textarea
        name="message"
        rows={3}
        placeholder={labels.message}
        value={form.message}
        onChange={handle}
        className={inputCls + " resize-none"}
      />
      {status === "error" && (
        <p className="text-sm text-red-300">{labels.error}</p>
      )}
      <Button
        type="submit"
        size="lg"
        variant="success"
        className="w-full"
        disabled={status === "loading"}
      >
        {status === "loading" ? "…" : labels.submit}
        {status !== "loading" && <ArrowRight className="h-4 w-4" />}
      </Button>
    </form>
  );
}
