'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  Play,
  RotateCcw,
  Check,
  X,
  Printer,
  DollarSign,
  AlertCircle,
  Eye,
  LogOut,
  Camera,
} from 'lucide-react';
import { QueueStatus, type QueueStatusType } from '@photobooth/shared';

interface QueueItem {
  id: string;
  number: string;
  nickname: string;
  status: QueueStatusType;
  registeredAt: string;
}

const INITIAL_QUEUE: QueueItem[] = [
  { id: '1', number: '#001', nickname: 'Diana', status: QueueStatus.IN_SESSION, registeredAt: '10:14' },
  { id: '2', number: '#002', nickname: 'Budi & Sari', status: QueueStatus.QUEUED, registeredAt: '10:18' },
  { id: '3', number: '#003', nickname: 'Kelompok 4 Wisuda', status: QueueStatus.QUEUED, registeredAt: '10:22' },
  { id: '4', number: '#004', nickname: 'Aris', status: QueueStatus.WAITING, registeredAt: '10:05' },
  { id: '5', number: '#005', nickname: 'Rani', status: QueueStatus.DONE, registeredAt: '09:55' },
];

export default function AdminDashboardPage() {
  const [queue, setQueue] = useState<QueueItem[]>(INITIAL_QUEUE);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const updateStatus = (id: string, newStatus: QueueStatusType, label: string) => {
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
    showToast(label);
  };

  const getStatusBadge = (status: QueueStatusType) => {
    switch (status) {
      case QueueStatus.IN_SESSION:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-chip text-xs font-medium bg-ultramarine-wash text-ultramarine">
            <span className="w-1.5 h-1.5 rounded-full bg-ultramarine animate-pulse" />
            Sedang Foto
          </span>
        );
      case QueueStatus.QUEUED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-chip text-xs font-medium bg-sheet text-ink-soft">
            <span className="w-1.5 h-1.5 rounded-full bg-film" />
            Dalam Antrean
          </span>
        );
      case QueueStatus.WAITING:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-chip text-xs font-medium bg-amber-50 text-signal-warn">
            <span className="w-1.5 h-1.5 rounded-full bg-signal-warn" />
            Menunggu
          </span>
        );
      case QueueStatus.DONE:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-chip text-xs font-medium bg-emerald-50 text-signal-ok">
            <span className="w-1.5 h-1.5 rounded-full bg-signal-ok" />
            Selesai Foto
          </span>
        );
      case QueueStatus.CANCELLED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-chip text-xs font-medium bg-gray-100 text-film line-through">
            Dibatalkan
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-paper">
      {/* Top Bar */}
      <header className="bg-paper-raised border-b border-sheet px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="p-2 rounded-btn hover:bg-sheet text-ink-soft transition-colors"
            title="Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-display text-xl font-bold text-ink">
              Dashboard Operator Photobooth
            </h1>
            <p className="text-xs text-film">Kendali Antrean, Sesi Tablet, dan Cetak 4R</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/booth"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-btn bg-gradient-night text-white text-xs font-medium hover:opacity-95 transition-all shadow-violet-glow"
            title="Buka Layar Kios Booth untuk Tablet"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Layar Booth (Tablet)</span>
          </a>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-chip bg-emerald-50 text-signal-ok text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-signal-ok" />
            Booth #1 Online
          </span>
          <button
            onClick={() => {
              document.cookie = 'booth_admin_session=; path=/; max-age=0; SameSite=Lax';
              window.location.href = '/admin/login';
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-btn border border-sheet text-xs text-ink-soft hover:text-signal-bad hover:bg-red-50 transition-colors"
            title="Keluar dari sesi operator"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* KPI Ringkasan */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="p-5 bg-paper-raised border border-sheet rounded-panel">
            <span className="text-xs font-medium text-film">Dalam Antrean</span>
            <div className="font-display text-3xl font-bold text-ink tabular-nums mt-1">
              {queue.filter((q) => q.status === QueueStatus.QUEUED || q.status === QueueStatus.WAITING).length}
            </div>
          </div>
          <div className="p-5 bg-paper-raised border border-sheet rounded-panel">
            <span className="text-xs font-medium text-film">Sesi Selesai</span>
            <div className="font-display text-3xl font-bold text-signal-ok tabular-nums mt-1">
              {queue.filter((q) => q.status === QueueStatus.DONE).length}
            </div>
          </div>
          <div className="p-5 bg-paper-raised border border-sheet rounded-panel">
            <span className="text-xs font-medium text-film">Harga Cetak per Lembar</span>
            <div className="font-display text-3xl font-bold text-ultramarine tabular-nums mt-1">
              Rp15.000
            </div>
          </div>
        </div>

        {/* Toast Notifikasi */}
        {toastMessage && (
          <div className="mb-4 p-3 rounded-btn bg-ink text-white text-xs font-medium shadow-raise-2 flex items-center justify-between">
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="text-film hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tabel Antrean */}
        <div className="bg-paper-raised border border-sheet rounded-panel shadow-raise-1 overflow-hidden">
          <div className="px-6 py-4 border-b border-sheet flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-ink">
              Daftar Antrean Pengunjung
            </h2>
            <span className="text-xs text-film">{queue.length} pengunjung tercatat</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-sheet bg-paper/50 text-xs text-film">
                  <th className="py-3 px-6 font-medium">Nomor</th>
                  <th className="py-3 px-6 font-medium">Pengunjung</th>
                  <th className="py-3 px-6 font-medium">Waktu Daftar</th>
                  <th className="py-3 px-6 font-medium">Status</th>
                  <th className="py-3 px-6 font-medium text-right">Tindakan Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sheet text-sm">
                {queue.map((item) => (
                  <tr key={item.id} className="hover:bg-paper/40 transition-colors">
                    <td className="py-4 px-6 font-display font-bold text-ink tabular-nums text-base">
                      {item.number}
                    </td>
                    <td className="py-4 px-6 font-medium text-ink">
                      {item.nickname}
                    </td>
                    <td className="py-4 px-6 text-film text-xs">
                      {item.registeredAt} WIB
                    </td>
                    <td className="py-4 px-6">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      {item.status === QueueStatus.QUEUED && (
                        <>
                          <button
                            onClick={() => updateStatus(item.id, QueueStatus.IN_SESSION, `Sesi dimulai untuk ${item.nickname}`)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-btn bg-ultramarine text-white text-xs font-medium hover:bg-ultramarine-press transition-colors btn-press"
                          >
                            <Play className="w-3.5 h-3.5" />
                            Mulai Sesi
                          </button>
                          <button
                            onClick={() => updateStatus(item.id, QueueStatus.WAITING, `${item.nickname} dilewati sementara`)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-btn border border-sheet text-xs text-ink-soft hover:bg-sheet transition-colors"
                          >
                            Lewati
                          </button>
                        </>
                      )}

                      {item.status === QueueStatus.IN_SESSION && (
                        <button
                          onClick={() => updateStatus(item.id, QueueStatus.DONE, `Sesi ${item.nickname} selesai dan hasil tersimpan`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-btn bg-signal-ok text-white text-xs font-medium hover:opacity-90 transition-colors btn-press"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Selesaikan Sesi
                        </button>
                      )}

                      {item.status === QueueStatus.WAITING && (
                        <button
                          onClick={() => updateStatus(item.id, QueueStatus.QUEUED, `${item.nickname} dikembalikan ke antrean`)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-btn border border-sheet text-xs text-ink-soft hover:bg-sheet transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Panggil Lagi
                        </button>
                      )}

                      {item.status === QueueStatus.DONE && (
                        <Link
                          href="/gallery"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-btn border border-sheet text-xs text-ink-soft hover:bg-sheet transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Buka Galeri
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
