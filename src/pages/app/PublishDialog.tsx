import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { X, Copy, ExternalLink, Download, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useToast } from '@/context/ToastContext';

interface PublishDialogProps {
  open: boolean;
  onClose: () => void;
  formId: string;
  slug: string;
  title: string;
}

export function PublishDialog({ open, onClose, formId, slug, title }: PublishDialogProps) {
  const toast = useToast();

  const formUrl = useMemo(() => {
    const base = window.location.origin;
    return `${base}/f/${slug}`;
  }, [slug]);

  if (!open) return null;

  function copyLink() {
    navigator.clipboard.writeText(formUrl);
    toast.success('Link copied!', 'Share this link with your participants.');
  }

  function downloadQR() {
    const svg = document.querySelector('#publish-qr svg') as SVGElement | null;
    if (!svg) return;
    const data = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([data], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}_qr.svg`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('QR code downloaded!');
  }

  return (
    <div className="dialog-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dialog-content max-w-md w-full animate-scale-in">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Form Published! 🎉</h3>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              Your form is now live. Share the link below with participants.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-[var(--color-text-muted)] hover:bg-gray-100 rounded">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form title */}
        <div className="bg-[var(--color-primary-muted)] rounded-lg px-3 py-2 mb-5">
          <p className="text-xs font-medium text-[var(--color-primary)]">{title}</p>
          <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">/f/{slug}</p>
        </div>

        {/* Link */}
        <div className="form-group mb-4">
          <label className="form-label">Shareable Link</label>
          <div className="flex gap-2">
            <input
              className="input flex-1 text-xs font-mono bg-gray-50"
              value={formUrl}
              readOnly
            />
            <button onClick={copyLink} className="btn btn-secondary btn-sm shrink-0 gap-1.5">
              <Copy className="h-3.5 w-3.5" /> Copy
            </button>
          </div>
        </div>

        {/* QR Code */}
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <p className="text-xs font-semibold text-[var(--color-text-primary)] mb-1">QR Code</p>
            <p className="text-[10px] text-[var(--color-text-muted)]">Share or print this QR code for participants to scan.</p>
          </div>
          <div id="publish-qr" className="bg-white p-2 border border-[var(--color-border)] rounded-lg shrink-0">
            <QRCodeSVG value={formUrl} size={80} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Link
            to={`/f/${slug}`}
            target="_blank"
            className="btn btn-primary flex-1 justify-center gap-1.5"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Open Form
          </Link>
          <button onClick={downloadQR} className="btn btn-secondary flex-1 justify-center gap-1.5">
            <Download className="h-3.5 w-3.5" /> Download QR
          </button>
        </div>

        <div className="mt-3">
          <Link to={`/app/responses?form=${formId}`} className="text-xs text-[var(--color-primary)] hover:underline block text-center">
            View Responses →
          </Link>
        </div>
      </div>
    </div>
  );
}
