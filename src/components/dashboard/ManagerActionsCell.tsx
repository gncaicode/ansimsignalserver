"use client";

import { useState, useRef, useEffect } from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface RoleOption { value: string; label: string; }

interface T {
  actions: {
    changeRole: string;
    moreA11y: string;
    editInfo: string;
    delete: string;
  };
  changeRoleModal: {
    title: string;
    save: string;
    saving: string;
    cancel: string;
    errorServer: string;
  };
  editModal: {
    title: string;
    name: string;
    namePlaceholder: string;
    phone: string;
    phonePlaceholder: string;
    position: string;
    positionPlaceholder: string;
    department: string;
    departmentPlaceholder: string;
    save: string;
    saving: string;
    cancel: string;
    errorServer: string;
  };
  deleteConfirm: {
    title: string;
    body: string;
    confirm: string;
    deleting: string;
    cancel: string;
    errorServer: string;
  };
}

interface Props {
  adminId: number;
  name: string;
  phone: string;
  position: string;
  department: string;
  currentDbRole: string;
  roles: RoleOption[];
  t: T;
}

export function ManagerActionsCell({
  adminId, name, phone, position, department, currentDbRole, roles, t,
}: Props) {
  const [dropOpen, setDropOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [selectedRole, setSelectedRole] = useState(currentDbRole);
  const [editForm, setEditForm] = useState({ name, phone, position, department });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const dropRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [dropPos, setDropPos] = useState({ top: 0, right: 0 });

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    if (!dropOpen) return;
    function handleClick(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropOpen]);

  async function callApi(method: string, body: object) {
    const res = await fetch(`/api/admin/managers/${adminId}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: method !== "DELETE" ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || t.changeRoleModal.errorServer);
    return data;
  }

  async function submitRole() {
    setError(""); setLoading(true);
    try {
      await callApi("PATCH", { type: "role", role: selectedRole });
      setRoleOpen(false);
      window.location.reload();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t.changeRoleModal.errorServer);
    } finally { setLoading(false); }
  }

  async function submitEdit() {
    setError(""); setLoading(true);
    try {
      await callApi("PATCH", { type: "info", ...editForm });
      setEditOpen(false);
      window.location.reload();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t.editModal.errorServer);
    } finally { setLoading(false); }
  }

  async function submitDelete() {
    setError(""); setLoading(true);
    try {
      await callApi("DELETE", {});
      setDeleteOpen(false);
      window.location.reload();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t.deleteConfirm.errorServer);
    } finally { setLoading(false); }
  }

  function openRole() { setSelectedRole(currentDbRole); setError(""); setRoleOpen(true); }
  function openEdit() { setEditForm({ name, phone, position, department }); setError(""); setEditOpen(true); setDropOpen(false); }
  function openDelete() { setError(""); setDeleteOpen(true); setDropOpen(false); }

  return (
    <>
      <div className="flex items-center gap-1">
        {/* 권한변경 버튼 */}
        <Button size="sm" variant="outline" onClick={openRole}>
          {t.actions.changeRole}
        </Button>

        {/* ··· 드롭다운 */}
        <div ref={dropRef}>
          <Button
            ref={btnRef}
            size="icon"
            variant="ghost"
            aria-label={t.actions.moreA11y}
            onClick={() => {
              if (!dropOpen && btnRef.current) {
                const r = btnRef.current.getBoundingClientRect();
                setDropPos({ top: r.bottom + window.scrollY + 4, right: window.innerWidth - r.right });
              }
              setDropOpen((v) => !v);
            }}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
          {dropOpen && (
            <div
              className="fixed z-50 w-32 rounded-lg border border-border bg-white shadow-lg py-1 text-sm"
              style={{ top: dropPos.top, right: dropPos.right }}
            >
              <button className="w-full px-3 py-2 text-left hover:bg-gray-50" onClick={openEdit}>
                {t.actions.editInfo}
              </button>
              <button className="w-full px-3 py-2 text-left text-red-600 hover:bg-red-50" onClick={openDelete}>
                {t.actions.delete}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 권한변경 모달 */}
      {roleOpen && (
        <Modal onClose={() => setRoleOpen(false)}>
          <h2 className="text-lg font-bold mb-4">{t.changeRoleModal.title} — {name}</h2>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-trust-500"
          >
            {roles.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setRoleOpen(false)} disabled={loading}>
              {t.changeRoleModal.cancel}
            </Button>
            <Button onClick={submitRole} disabled={loading}>
              {loading ? t.changeRoleModal.saving : t.changeRoleModal.save}
            </Button>
          </div>
        </Modal>
      )}

      {/* 정보수정 모달 */}
      {editOpen && (
        <Modal onClose={() => setEditOpen(false)}>
          <h2 className="text-lg font-bold mb-4">{t.editModal.title} — {name}</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">{t.editModal.name}</label>
              <Input value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} placeholder={t.editModal.namePlaceholder} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t.editModal.phone}</label>
              <Input value={editForm.phone} onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))} placeholder={t.editModal.phonePlaceholder} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">{t.editModal.position}</label>
                <Input value={editForm.position} onChange={(e) => setEditForm((p) => ({ ...p, position: e.target.value }))} placeholder={t.editModal.positionPlaceholder} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t.editModal.department}</label>
                <Input value={editForm.department} onChange={(e) => setEditForm((p) => ({ ...p, department: e.target.value }))} placeholder={t.editModal.departmentPlaceholder} />
              </div>
            </div>
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={loading}>
              {t.editModal.cancel}
            </Button>
            <Button onClick={submitEdit} disabled={loading}>
              {loading ? t.editModal.saving : t.editModal.save}
            </Button>
          </div>
        </Modal>
      )}

      {/* 삭제 확인 모달 */}
      {deleteOpen && (
        <Modal onClose={() => setDeleteOpen(false)}>
          <h2 className="text-lg font-bold mb-2">{t.deleteConfirm.title}</h2>
          <p className="text-sm text-muted mb-1 font-semibold">{name}</p>
          <p className="text-sm text-gray-600 mb-4">{t.deleteConfirm.body}</p>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={loading}>
              {t.deleteConfirm.cancel}
            </Button>
            <Button
              onClick={submitDelete}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? t.deleteConfirm.deleting : t.deleteConfirm.confirm}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-xl bg-white shadow-xl p-6 max-h-[90vh] overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
