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
      <div className="p-3 bg-white rounded-2xl shadow-card border border-slate-100">
        <img src={dataUrl} alt="QR Code" width={size} height={size} className="rounded-lg" />
      </div>
      {label && (
        <p className="text-xs text-slate-500 text-center max-w-[200px] leading-relaxed">{label}</p>
      )}
    </div>
  );
}
