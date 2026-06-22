"use client";

import { useState } from "react";
import { Plus, Trash2, MapPin } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface District { dist_id: number; name: string; }

interface T {
  title: string;
  desc: string;
  placeholder: string;
  add: string;
  empty: string;
  deleteA11y: string;
  errorServer: string;
}

export function DistrictManager({
  initial, canEdit, t,
}: {
  initial: District[];
  canEdit: boolean;
  t: T;
}) {
  const [districts, setDistricts] = useState<District[]>(initial);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function add() {
    if (!input.trim()) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/districts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: input.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setDistricts((prev) => [...prev, { dist_id: data.dist_id, name: data.name }]);
      setInput("");
    } catch {
      setError(t.errorServer);
    } finally {
      setLoading(false);
    }
  }

  async function remove(distId: number) {
    setError("");
    try {
      const res = await fetch(`/api/admin/districts/${distId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setDistricts((prev) => prev.filter((d) => d.dist_id !== distId));
    } catch {
      setError(t.errorServer);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-trust-700" />
          {t.title}
        </CardTitle>
        <p className="text-xs text-muted">{t.desc}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {canEdit && (
          <div className="flex gap-2">
            <Input
              placeholder={t.placeholder}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              className="max-w-sm"
            />
            <Button onClick={add} disabled={loading || !input.trim()}>
              <Plus className="h-4 w-4" />
              {t.add}
            </Button>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        {districts.length === 0 ? (
          <p className="text-sm text-muted py-2">{t.empty}</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border overflow-hidden">
            {districts.map((d) => (
              <li key={d.dist_id} className="flex items-center justify-between px-4 py-2.5 bg-white hover:bg-surface-muted/40">
                <span className="text-sm font-medium">{d.name}</span>
                {canEdit && (
                  <button
                    onClick={() => remove(d.dist_id)}
                    className="text-muted hover:text-red-600 transition-colors"
                    aria-label={t.deleteA11y}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
