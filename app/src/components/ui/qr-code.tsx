'use client';

import { useEffect, useState } from 'react';

interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
  label?: string;
}

export function QRCode({ value, size = 200, className, label }: QRCodeProps) {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function generate() {
      try {
        const QRCodeLib = await import('qrcode');
        const url = await QRCodeLib.toDataURL(value, {
          width: size,
          margin: 2,
          color: { dark: '#1e293b', light: '#ffffff' },
          errorCorrectionLevel: 'M',
        });
        setDataUrl(url);
      } catch (err) {
        console.error('QR generation failed:', err);
      }
    }
    if (value) generate();
  }, [value, size]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const input = document.createElement('input');
      input.value = value;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!dataUrl) {
    return (
      <div
        className={`bg-slate-100 rounded-xl animate-pulse ${className || ''}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div className={`flex flex-col items-center gap-3 ${className || ''}`}>
      <div className="p-3 bg-white rounded-2xl shadow-card border border-slate-100 hover:shadow-lg transition-all duration-300">
        <img src={dataUrl} alt="QR Code" width={size} height={size} className="rounded-lg" />
      </div>
      {label && (
        <p className="text-xs text-slate-500 text-center max-w-[200px] leading-relaxed">{label}</p>
      )}
      <button
        onClick={handleCopy}
        className={`text-xs font-medium px-4 py-2 rounded-xl transition-all duration-300 ${
          copied 
            ? 'bg-emerald-100 text-emerald-700 shadow-[0_4px_12px_rgba(16,185,129,0.2)]' 
            : 'bg-brand-50 text-brand-600 hover:bg-brand-100 hover:shadow-[0_4px_12px_rgba(99,102,241,0.2)]'
        }`}
      >
        {copied ? '✓ Link Copied!' : '📋 Copy Upload Link'}
      </button>
    </div>
  );
}
