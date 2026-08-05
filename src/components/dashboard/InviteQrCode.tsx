"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Copy, Check, Download, Link as LinkIcon, QrCode as QrCodeIcon, X } from "lucide-react";
import { buildInviteDeepLink } from "@/lib/invite-link";
import { copyToClipboard } from "@/lib/clipboard";

interface QrLabels {
  copyDeepLink: string;
  copied: string;
  qrCode: string;
  downloadQrCode: string;
}

export function DeepLinkCopyButton({
  code, copyDeepLink, copied: copiedLabel,
}: {
  code: string;
  copyDeepLink: string;
  copied: string;
}) {
  const [copied, setCopied] = useState(false);
  function copy() {
    copyToClipboard(buildInviteDeepLink(code), () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }
  return (
    <button
      type="button"
      onClick={copy}
      title={copyDeepLink}
      className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium text-trust-700 bg-trust-50 hover:bg-trust-100 transition-colors"
    >
      {copied ? <Check className="h-3 w-3 shrink-0" /> : <LinkIcon className="h-3 w-3 shrink-0" />}
      <span>{copied ? copiedLabel : copyDeepLink}</span>
    </button>
  );
}

export function InviteQrPanel({
  code, labels, showCopyLink = true,
}: {
  code: string;
  labels: QrLabels;
  showCopyLink?: boolean;
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const deepLink = buildInviteDeepLink(code);

  useEffect(() => {
    let cancelled = false;
    setDataUrl(null);
    QRCode.toDataURL(deepLink, { width: 220, margin: 1 }).then((url) => {
      if (!cancelled) setDataUrl(url);
    });
    return () => { cancelled = true; };
  }, [deepLink]);

  function copy() {
    copyToClipboard(deepLink, () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-lg bg-surface-muted px-4 py-4">
      <p className="self-start text-[11px] text-muted">{labels.qrCode}</p>
      {dataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- 동적으로 생성된 data URL이라 next/image로 다룰 수 없음
        <img
          src={dataUrl}
          alt={labels.qrCode}
          width={160}
          height={160}
          className="rounded border border-border bg-white p-2"
        />
      ) : (
        <div className="h-[160px] w-[160px] animate-pulse rounded bg-border/40" />
      )}
      <div className="flex w-full gap-2">
        {showCopyLink && (
          <button
            type="button"
            onClick={copy}
            className="flex flex-1 items-center justify-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium text-trust-700 bg-trust-50 hover:bg-trust-100 transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? labels.copied : labels.copyDeepLink}
          </button>
        )}
        {dataUrl && (
          <a
            href={dataUrl}
            download={`ansimsignal-invite-${code}.png`}
            className="flex flex-1 items-center justify-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium text-trust-700 bg-trust-50 hover:bg-trust-100 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            {labels.downloadQrCode}
          </a>
        )}
      </div>
    </div>
  );
}

export function InviteQrTrigger({
  code, showQrCode, panelLabels,
}: {
  code: string;
  showQrCode: string;
  panelLabels: QrLabels;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={showQrCode}
        aria-label={showQrCode}
        className="flex items-center justify-center rounded p-1 text-trust-700 bg-trust-50 hover:bg-trust-100 transition-colors"
      >
        <QrCodeIcon className="h-3 w-3" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-xs mx-4 rounded-xl bg-white p-4 shadow-2xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="close"
              className="absolute right-3 top-3 text-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
            <InviteQrPanel code={code} labels={panelLabels} showCopyLink={false} />
          </div>
        </div>
      )}
    </>
  );
}
