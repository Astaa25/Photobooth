'use client';

import React from 'react';

/**
 * Komponen Pixel Art SVG yang terinspirasi langsung dari poster:
 * "WELCOME TO EXPO WISUDA JURUSAN TIK 2026"
 * Menggunakan shapeRendering="crispEdges" untuk ketajaman pixel 100%.
 */

// 1. Lampu Jalan Ornamen Kembar dengan Kerucut Cahaya Kuning (#FFD84D)
export function PixelStreetLamp({ className = '', height = 120 }: { className?: string; height?: number }) {
  return (
    <div className={`relative flex flex-col items-center select-none ${className}`}>
      <svg
        width={height * 0.75}
        height={height}
        viewBox="0 0 60 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        shapeRendering="crispEdges"
        className="pixel-art filter drop-shadow-[0_0_8px_rgba(255,216,77,0.5)]"
      >
        {/* Tiang Utama & Ornamen Lengkung */}
        {/* Basis Tiang */}
        <rect x="26" y="74" width="8" height="6" fill="#1C1E3A" />
        <rect x="27" y="72" width="6" height="2" fill="#3D4478" />
        <rect x="28" y="24" width="4" height="48" fill="#282D54" />
        <rect x="29" y="24" width="2" height="48" fill="#4B57B2" />

        {/* Ornamen Tengah */}
        <rect x="26" y="44" width="8" height="3" fill="#E02F75" />
        <rect x="27" y="45" width="6" height="1" fill="#FF8E72" />

        {/* Cabang Kiri */}
        <rect x="18" y="22" width="10" height="3" fill="#3D4478" />
        <rect x="14" y="18" width="6" height="4" fill="#3D4478" />
        <rect x="12" y="14" width="4" height="4" fill="#3D4478" />
        <rect x="10" y="12" width="4" height="4" fill="#4B57B2" />
        {/* Tudung Lampu Kiri */}
        <rect x="6" y="14" width="12" height="3" fill="#E02F75" />
        <rect x="8" y="12" width="8" height="2" fill="#FF8E72" />
        {/* Bohlam Kuning Kiri */}
        <rect x="8" y="17" width="8" height="5" fill="#FFD84D" />
        <rect x="10" y="18" width="4" height="3" fill="#FFFFFF" />

        {/* Cabang Kanan */}
        <rect x="32" y="22" width="10" height="3" fill="#3D4478" />
        <rect x="40" y="18" width="6" height="4" fill="#3D4478" />
        <rect x="44" y="14" width="4" height="4" fill="#3D4478" />
        <rect x="46" y="12" width="4" height="4" fill="#4B57B2" />
        {/* Tudung Lampu Kanan */}
        <rect x="42" y="14" width="12" height="3" fill="#E02F75" />
        <rect x="44" y="12" width="8" height="2" fill="#FF8E72" />
        {/* Bohlam Kuning Kanan */}
        <rect x="44" y="17" width="8" height="5" fill="#FFD84D" />
        <rect x="46" y="18" width="4" height="3" fill="#FFFFFF" />

        {/* Ujung Puncak Tiang */}
        <rect x="29" y="18" width="2" height="6" fill="#4B57B2" />
        <rect x="28" y="16" width="4" height="2" fill="#FF8E72" />
      </svg>

      {/* Kerucut Sorot Cahaya Kuning ke Bawah */}
      <div
        className="w-28 h-20 -mt-8 pointer-events-none opacity-40 animate-pulse"
        style={{
          background: 'radial-gradient(ellipse at top, rgba(255, 216, 77, 0.6) 0%, rgba(255, 216, 77, 0.1) 50%, transparent 80%)',
        }}
      />
    </div>
  );
}

// 2. Bangku Taman Kayu Berbingkai Magenta (#E02F75 & Kayu Cokelat)
export function PixelBench({ className = '', width = 110 }: { className?: string; width?: number }) {
  return (
    <svg
      width={width}
      height={width * 0.45}
      viewBox="0 0 80 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="crispEdges"
      className={`pixel-art select-none ${className}`}
    >
      {/* Sandaran Kayu */}
      <rect x="8" y="6" width="64" height="4" fill="#BA6E46" />
      <rect x="8" y="7" width="64" height="2" fill="#D98A60" />
      <rect x="8" y="12" width="64" height="4" fill="#BA6E46" />
      <rect x="8" y="13" width="64" height="2" fill="#D98A60" />

      {/* Dudukan Kayu */}
      <rect x="6" y="18" width="68" height="4" fill="#8C5135" />
      <rect x="6" y="19" width="68" height="2" fill="#BA6E46" />

      {/* Rangka Besi Magenta */}
      {/* Tiang Sandaran Kiri & Kanan */}
      <rect x="12" y="4" width="4" height="18" fill="#E02F75" />
      <rect x="64" y="4" width="4" height="18" fill="#E02F75" />
      <rect x="38" y="4" width="4" height="18" fill="#A81D53" />

      {/* Sandaran Tangan */}
      <rect x="8" y="14" width="8" height="3" fill="#FE0168" />
      <rect x="64" y="14" width="8" height="3" fill="#FE0168" />

      {/* Kaki Kiri */}
      <rect x="10" y="22" width="4" height="12" fill="#6700A3" />
      <rect x="8" y="32" width="8" height="3" fill="#3A005C" />

      {/* Kaki Kanan */}
      <rect x="66" y="22" width="4" height="12" fill="#6700A3" />
      <rect x="64" y="32" width="8" height="3" fill="#3A005C" />

      {/* Palang Penyangga Tengah */}
      <rect x="14" y="26" width="52" height="2" fill="#4B57B2" />
    </svg>
  );
}

// 3. Mobil Retro Sports Sedan / Coupe Magenta (#E02F75 / #FE0168)
export function PixelCar({ className = '', width = 140 }: { className?: string; width?: number }) {
  return (
    <svg
      width={width}
      height={width * 0.45}
      viewBox="0 0 100 45"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="crispEdges"
      className={`pixel-art select-none ${className}`}
    >
      {/* Bodi Atas / Kaca Depan & Belakang */}
      <rect x="28" y="8" width="36" height="12" fill="#E02F75" />
      {/* Kaca Jendela Biru Langit */}
      <rect x="32" y="10" width="14" height="8" fill="#5CE1E6" />
      <rect x="34" y="11" width="10" height="3" fill="#FFFFFF" />
      <rect x="48" y="10" width="12" height="8" fill="#3AA4CA" />
      {/* Pilar Jendela */}
      <rect x="46" y="8" width="2" height="10" fill="#6700A3" />

      {/* Bodi Utama Mobil */}
      <rect x="6" y="18" width="84" height="14" fill="#E02F75" />
      <rect x="6" y="18" width="84" height="3" fill="#FF8E72" />
      <rect x="4" y="22" width="88" height="8" fill="#FE0168" />
      <rect x="4" y="28" width="88" height="3" fill="#A81D53" />

      {/* Moncong Depan */}
      <rect x="2" y="24" width="4" height="6" fill="#A81D53" />

      {/* Lampu Depan Kuning Menyala */}
      <rect x="88" y="22" width="4" height="4" fill="#FFD84D" />
      <rect x="90" y="23" width="2" height="2" fill="#FFFFFF" />

      {/* Lampu Belakang Merah */}
      <rect x="2" y="21" width="3" height="4" fill="#FF2A2A" />

      {/* Roda Kiri */}
      <rect x="14" y="26" width="16" height="16" fill="#050C38" />
      <rect x="17" y="29" width="10" height="10" fill="#1C1E3A" />
      <rect x="20" y="32" width="4" height="4" fill="#5CE1E6" />

      {/* Roda Kanan */}
      <rect x="66" y="26" width="16" height="16" fill="#050C38" />
      <rect x="69" y="29" width="10" height="10" fill="#1C1E3A" />
      <rect x="72" y="32" width="4" height="4" fill="#5CE1E6" />

      {/* Sorot Lampu Depan */}
      <polygon points="92,23 100,20 100,28 92,25" fill="rgba(255, 216, 77, 0.4)" />
    </svg>
  );
}

// 4. Vending Machine Pixel Biru Neon dengan Minuman Bercahaya
export function PixelVendingMachine({ className = '', height = 110 }: { className?: string; height?: number }) {
  return (
    <svg
      width={height * 0.48}
      height={height}
      viewBox="0 0 40 82"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="crispEdges"
      className={`pixel-art select-none ${className}`}
    >
      {/* Kotak Mesin Luar */}
      <rect x="2" y="2" width="36" height="78" fill="#0A1E4A" />
      <rect x="3" y="3" width="34" height="76" fill="#14347A" />
      <rect x="3" y="3" width="34" height="3" fill="#5CE1E6" />

      {/* Display Kaca Produk Minuman */}
      <rect x="6" y="10" width="28" height="42" fill="#06122E" />
      <rect x="7" y="11" width="26" height="40" fill="#0D2456" />

      {/* Rak 1 (Kaleng Soda Merah & Hijau) */}
      <rect x="9" y="14" width="4" height="7" fill="#FE0168" />
      <rect x="15" y="14" width="4" height="7" fill="#00E599" />
      <rect x="21" y="14" width="4" height="7" fill="#FFD84D" />
      <rect x="27" y="14" width="4" height="7" fill="#5CE1E6" />
      <rect x="8" y="22" width="24" height="2" fill="#284882" />

      {/* Rak 2 (Kaleng Soda Ungu & Kuning) */}
      <rect x="9" y="26" width="4" height="7" fill="#7226FF" />
      <rect x="15" y="26" width="4" height="7" fill="#FF8E72" />
      <rect x="21" y="26" width="4" height="7" fill="#FE0168" />
      <rect x="27" y="26" width="4" height="7" fill="#00E599" />
      <rect x="8" y="34" width="24" height="2" fill="#284882" />

      {/* Rak 3 (Botol Air Neon) */}
      <rect x="9" y="38" width="4" height="8" fill="#5CE1E6" />
      <rect x="15" y="38" width="4" height="8" fill="#FFFFFF" />
      <rect x="21" y="38" width="4" height="8" fill="#5CE1E6" />
      <rect x="27" y="38" width="4" height="8" fill="#FFD84D" />
      <rect x="8" y="47" width="24" height="2" fill="#284882" />

      {/* Panel Masukkan Koin & Tombol */}
      <rect x="6" y="54" width="28" height="10" fill="#0B1A3D" />
      <rect x="9" y="56" width="4" height="3" fill="#FFD84D" />
      <rect x="15" y="56" width="2" height="4" fill="#00E599" />
      <rect x="19" y="56" width="2" height="4" fill="#FE0168" />
      <rect x="23" y="56" width="8" height="2" fill="#1C1E3A" /> {/* Slot Koin */}

      {/* Lubang Pengambilan Minuman Bawah */}
      <rect x="8" y="66" width="24" height="10" fill="#050C1F" />
      <rect x="10" y="68" width="20" height="2" fill="#284882" />
    </svg>
  );
}

// 5. Tanaman Semak & Bunga Pixel Hijau & Pink (#049A5C, #00E599, #FE0168)
export function PixelBushes({ className = '', width = 90 }: { className?: string; width?: number }) {
  return (
    <svg
      width={width}
      height={width * 0.42}
      viewBox="0 0 60 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="crispEdges"
      className={`pixel-art select-none ${className}`}
    >
      {/* Daun Semak Hijau Tua */}
      <rect x="6" y="8" width="48" height="17" fill="#0D5235" />
      <rect x="12" y="4" width="36" height="18" fill="#0D5235" />

      {/* Daun Semak Hijau Segar */}
      <rect x="8" y="10" width="44" height="13" fill="#049A5C" />
      <rect x="14" y="6" width="32" height="12" fill="#049A5C" />

      {/* Daun Sorot Terang */}
      <rect x="16" y="4" width="10" height="4" fill="#00E599" />
      <rect x="34" y="5" width="8" height="3" fill="#00E599" />
      <rect x="10" y="11" width="6" height="3" fill="#00E599" />
      <rect x="42" y="9" width="6" height="3" fill="#00E599" />

      {/* Bunga-bunga Magenta & Cyan */}
      <rect x="18" y="9" width="3" height="3" fill="#FE0168" />
      <rect x="19" y="10" width="1" height="1" fill="#FFD84D" />

      <rect x="30" y="8" width="3" height="3" fill="#FE0168" />
      <rect x="31" y="9" width="1" height="1" fill="#FFD84D" />

      <rect x="40" y="12" width="3" height="3" fill="#5CE1E6" />
      <rect x="41" y="13" width="1" height="1" fill="#FFFFFF" />

      <rect x="12" y="15" width="3" height="3" fill="#5CE1E6" />
      <rect x="25" y="14" width="3" height="3" fill="#FE0168" />
    </svg>
  );
}

// 6. Siluet Burung Terbang di Langit Malam
export function PixelFlyingBirds({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-6 pointer-events-none select-none opacity-60 ${className}`}>
      {/* Burung 1 */}
      <svg
        width="22"
        height="12"
        viewBox="0 0 22 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        shapeRendering="crispEdges"
        className="pixel-art animate-bounce"
        style={{ animationDuration: '2.5s' }}
      >
        <rect x="0" y="2" width="4" height="2" fill="#1C2140" />
        <rect x="4" y="4" width="4" height="2" fill="#1C2140" />
        <rect x="8" y="6" width="6" height="3" fill="#0C1230" />
        <rect x="14" y="4" width="4" height="2" fill="#1C2140" />
        <rect x="18" y="2" width="4" height="2" fill="#1C2140" />
      </svg>

      {/* Burung 2 (Lebih Kecil di Jarak Jauh) */}
      <svg
        width="16"
        height="9"
        viewBox="0 0 16 9"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        shapeRendering="crispEdges"
        className="pixel-art animate-bounce"
        style={{ animationDuration: '3.2s', animationDelay: '0.8s' }}
      >
        <rect x="0" y="1" width="3" height="2" fill="#1C2140" />
        <rect x="3" y="3" width="3" height="2" fill="#1C2140" />
        <rect x="6" y="5" width="4" height="2" fill="#0C1230" />
        <rect x="10" y="3" width="3" height="2" fill="#1C2140" />
        <rect x="13" y="1" width="3" height="2" fill="#1C2140" />
      </svg>
    </div>
  );
}

// 7. Bintang Silang 4 Sudut Shimmering (#FFD84D & Putih)
export function PixelCrossStar({
  size = 18,
  className = '',
  color = '#FFD84D',
}: {
  size?: number;
  className?: string;
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="crispEdges"
      className={`pixel-art select-none ${className}`}
    >
      <rect x="7" y="0" width="2" height="16" fill={color} />
      <rect x="0" y="7" width="16" height="2" fill={color} />
      <rect x="5" y="5" width="6" height="6" fill="#FFFFFF" />
    </svg>
  );
}
