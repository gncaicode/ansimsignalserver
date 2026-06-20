"use client";

import { useState } from "react";
import { Plus, Trash2, MapPin } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface District {
  dist_id: number;
  name: string;
}

export function DistrictManager({
  initial,
  canEdit,
}: {
  initial: District[];
  canEdit: boolean;
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
      setError("서버와 통신할 수 없습니다.");
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
      setError("서버와 통신할 수 없습니다.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-trust-700" />
          관할 구역 관리
        </CardTitle>
        <p className="text-xs text-muted">대상자 배정에 사용되는 구역 목록입니다.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {canEdit && (
          <div className="flex gap-2">
            <Input
              placeholder="구역명 입력 (예: 행복동 1통)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              className="max-w-sm"
            />
            <Button onClick={add} disabled={loading || !input.trim()}>
              <Plus className="h-4 w-4" />
              추가
            </Button>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        {districts.length === 0 ? (
          <p className="text-sm text-muted py-2">등록된 구역이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border overflow-hidden">
            {districts.map((d) => (
              <li key={d.dist_id} className="flex items-center justify-between px-4 py-2.5 bg-white hover:bg-surface-muted/40">
                <span className="text-sm font-medium">{d.name}</span>
                {canEdit && (
                  <button
                    onClick={() => remove(d.dist_id)}
                    className="text-muted hover:text-red-600 transition-colors"
                    aria-label="삭제"
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
