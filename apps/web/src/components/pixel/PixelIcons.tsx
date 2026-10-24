'use client';

import React from 'react';

/**
 * Kumpulan ikon pixel retro 8-bit SVG dengan shapeRendering="crispEdges"
 */

export function PixelPrinterIcon({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="crispEdges"
      className={`pixel-art ${className}`}
    >
      {/* Kertas Atas */}
      <rect x="4" y="1" width="8" height="5" fill="#FFFFFF" />
      <rect x="5" y="3" width="6" height="1" fill="#8B929E" />

      {/* Bodi Printer */}
      <rect x="1" y="5" width="14" height="6" fill="#1C1E3A" />
      <rect x="2" y="6" width="12" height="4" fill="#3D4478" />

      {/* Lampu Status Hijau */}
      <rect x="11" y="7" width="2" height="2" fill="#00E599" />

      {/* Kertas Keluar Bawah */}
      <rect x="3" y="10" width="10" height="5" fill="#FFFFFF" />
      <rect x="4" y="12" width="8" height="1" fill="#E02F75" />
    </svg>
  );
}

export function PixelCameraIcon({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="crispEdges"
      className={`pixel-art ${className}`}
    >
      {/* Dudukan Flash / Viewfinder Atas */}
      <rect x="6" y="2" width="4" height="2" fill="#4B57B2" />
      <rect x="3" y="3" width="2" height="1" fill="#FE0168" /> {/* Tombol Shutter */}

      {/* Bodi Kamera */}
      <rect x="1" y="4" width="14" height="10" fill="#0C1230" />
      <rect x="2" y="5" width="12" height="8" fill="#160078" />

      {/* Lensa Kamera */}
      <rect x="5" y="6" width="6" height="6" fill="#000000" />
      <rect x="6" y="7" width="4" height="4" fill="#5CE1E6" />
      <rect x="8" y="7" width="2" height="2" fill="#FFFFFF" />
    </svg>
  );
}

export function PixelTicketIcon({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="crispEdges"
      className={`pixel-art ${className}`}
    >
      <rect x="1" y="3" width="14" height="10" fill="#E02F75" />
      <rect x="2" y="4" width="12" height="8" fill="#FF8E72" />
      {/* Lubang Sobekan Kiri dan Kanan */}
      <rect x="0" y="7" width="2" height="2" fill="#050C38" />
      <rect x="14" y="7" width="2" height="2" fill="#050C38" />
      {/* Bintang / Angka di Tengah Tiket */}
      <rect x="6" y="6" width="4" height="4" fill="#050C38" />
      <rect x="7" y="7" width="2" height="2" fill="#FFD84D" />
    </svg>
  );
}

export function PixelCoinIcon({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="crispEdges"
      className={`pixel-art ${className}`}
    >
      <rect x="3" y="1" width="10" height="14" fill="#A86400" />
      <rect x="1" y="3" width="14" height="10" fill="#A86400" />
      <rect x="2" y="2" width="12" height="12" fill="#FFD84D" />
      <rect x="4" y="4" width="8" height="8" fill="#FFE580" />
      {/* Simbol Rp atau Bintang di Koin */}
      <rect x="7" y="5" width="2" height="6" fill="#A86400" />
      <rect x="9" y="6" width="2" height="2" fill="#A86400" />
    </svg>
  );
}

export function PixelHeartIcon({ size = 18, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="crispEdges"
      className={`pixel-art ${className}`}
    >
      <rect x="2" y="3" width="4" height="4" fill="#FE0168" />
      <rect x="10" y="3" width="4" height="4" fill="#FE0168" />
      <rect x="1" y="4" width="14" height="5" fill="#FE0168" />
      <rect x="3" y="9" width="10" height="3" fill="#FE0168" />
      <rect x="5" y="12" width="6" height="2" fill="#FE0168" />
      <rect x="7" y="14" width="2" height="1" fill="#FE0168" />
      {/* Sorot Kilap Putih */}
      <rect x="3" y="4" width="2" height="2" fill="#FFFFFF" />
    </svg>
  );
}
