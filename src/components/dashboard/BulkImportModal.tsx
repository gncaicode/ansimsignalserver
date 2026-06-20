"use client";

import { useState, useRef } from "react";
import { X, Upload, Download, FileSpreadsheet, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BulkImportModal() {
  const [open, setOpen]       = useState(false);
  const [file, setFile]       = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<{ inserted: number; errors: string[] } | null>(null);
  const [error, setError]     = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function close() {
    setOpen(false);
    setFile(null);
    setResult(null);
    setError("");
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setResult(null);
    setError("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/users/import", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setResult(data);
      if (data.inserted > 0 && data.errors.length === 0) {
        setTimeout(() => { close(); window.location.reload(); }, 1500);
      }
    } catch {
      setError("서버와 통신할 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button variant="outline" size="md" onClick={() => setOpen(true)}>
        <Upload className="h-4 w-4" />
        엑셀 일괄 등록
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={close} />
          <div className="relative z-10 w-full max-w-lg bg-white rounded-xl shadow-2xl mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-bold">엑셀 일괄 등록</h2>
              <button onClick={close} className="text-muted hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* 양식 다운로드 */}
              <div className="flex items-center justify-between rounded-lg bg-surface-muted px-4 py-3">
                <div className="flex items-center gap-2 text-sm">
                  <FileSpreadsheet className="h-4 w-4 text-trust-700" />
                  <span className="font-medium">등록 양식 다운로드</span>
                  <span className="text-xs text-muted">· 이름, 연령, 구역, 주소, 연락처, 담당자</span>
                </div>
                <a href="/api/admin/users/template" download>
                  <Button variant="outline" size="sm">
                    <Download className="h-3.5 w-3.5" />
                    양식
                  </Button>
                </a>
              </div>

              {/* 파일 업로드 */}
              <form onSubmit={submit} className="space-y-4">
                <div
                  className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-surface-muted/40 py-8 cursor-pointer hover:bg-surface-muted transition-colors"
                  onClick={() => inputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 text-subtle" />
                  {file ? (
                    <p className="text-sm font-medium text-foreground">{file.name}</p>
                  ) : (
                    <>
                      <p className="text-sm font-medium">클릭하여 파일 선택</p>
                      <p className="text-xs text-muted">.xlsx 파일만 지원합니다</p>
                    </>
                  )}
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".xlsx"
                    className="hidden"
                    onChange={onFileChange}
                  />
                </div>

                {/* 결과 */}
                {result && (
                  <div className="space-y-2">
                    {result.inserted > 0 && (
                      <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
                        <CheckCircle className="h-4 w-4 shrink-0" />
                        <span>{result.inserted}명 등록 완료</span>
                      </div>
                    )}
                    {result.errors.length > 0 && (
                      <div className="rounded-lg bg-red-50 px-4 py-3 space-y-1">
                        <div className="flex items-center gap-2 text-sm text-red-700 font-medium">
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          <span>오류 {result.errors.length}건</span>
                        </div>
                        <ul className="ml-6 text-xs text-red-600 space-y-0.5 list-disc">
                          {result.errors.map((e, i) => <li key={i}>{e}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {error && (
                  <p className="text-sm text-red-600">{error}</p>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <Button type="button" variant="outline" onClick={close}>취소</Button>
                  <Button type="submit" disabled={!file || loading}>
                    {loading ? "등록 중..." : "등록하기"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
