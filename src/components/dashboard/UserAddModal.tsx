"use client";

import { useState } from "react";
import { X, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Option { id: number; name: string; }

export function UserAddModal({
  districts,
  admins,
}: {
  districts: Option[];
  admins: Option[];
}) {
  const [open, setOpen] = useState(false);

  const EMPTY = { name: "", age: "", district_id: "", address: "", emergency_phone: "", admin_id: "" };

  function close() {
    setOpen(false);
    setForm(EMPTY);
    setError("");
  }
  const [form, setForm] = useState({
    name: "", age: "", district_id: "", address: "",
    emergency_phone: "", admin_id: "",
  });
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  function handle(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:            form.name,
          age:             Number(form.age),
          district_id:     form.district_id || null,
          address:         form.address,
          emergency_phone: form.emergency_phone,
          admin_id:        form.admin_id || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      close();
      window.location.reload();
    } catch {
      setError("서버와 통신할 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button size="md" onClick={() => setOpen(true)}>
        <UserPlus className="h-4 w-4" />
        개별 대상자 추가
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* 배경 */}
          <div className="absolute inset-0 bg-black/40" onClick={close} />

          {/* 모달 */}
          <div className="relative z-10 w-full max-w-lg bg-white rounded-xl shadow-2xl mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-bold">대상자 등록</h2>
              <button onClick={close} className="text-muted hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submit} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="name">이름 *</Label>
                  <Input id="name" name="name" placeholder="이름" value={form.name} onChange={handle} required />
                </div>
                <div>
                  <Label htmlFor="age">연령 *</Label>
                  <Input id="age" name="age" type="number" min={1} max={150} placeholder="연령" value={form.age} onChange={handle} required />
                </div>
              </div>

              <div>
                <Label htmlFor="district_id">관할구역</Label>
                <select
                  id="district_id" name="district_id"
                  value={form.district_id} onChange={handle}
                  className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-trust-500"
                >
                  <option value="">구역 선택</option>
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="address">주소</Label>
                <Input id="address" name="address" placeholder="주소" value={form.address} onChange={handle} />
              </div>

              <div>
                <Label htmlFor="emergency_phone">긴급연락처</Label>
                <Input id="emergency_phone" name="emergency_phone" inputMode="tel" placeholder="긴급연락처" value={form.emergency_phone} onChange={handle} />
              </div>

              <div>
                <Label htmlFor="admin_id">담당자</Label>
                <select
                  id="admin_id" name="admin_id"
                  value={form.admin_id} onChange={handle}
                  className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-trust-500"
                >
                  <option value="">담당자 선택</option>
                  {admins.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={close}>취소</Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "등록 중..." : "등록"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
