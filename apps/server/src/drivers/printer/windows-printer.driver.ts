import { execFile } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import type { PrinterDriver, PrintJobOptions, PrintJobResult } from './printer.interface.js';

export interface WindowsPrinterOptions {
  printerName?: string;
  sumatraPath?: string; // Path ke SumatraPDF.exe jika ada
}

export class WindowsPrinterDriver implements PrinterDriver {
  public readonly name = 'windows';
  private printerName?: string;
  private sumatraPath?: string;

  constructor(options?: WindowsPrinterOptions) {
    this.printerName = options?.printerName;
    this.sumatraPath = options?.sumatraPath;
  }

  public async isReady(): Promise<boolean> {
    // Memeriksa ketersediaan printer di Windows spooler
    return new Promise((resolve) => {
      execFile('powershell', ['-Command', 'Get-Printer | Select-Object -ExpandProperty Name'], (err, stdout) => {
        if (err || !stdout) {
          resolve(false);
          return;
        }
        if (this.printerName) {
          resolve(stdout.toLowerCase().includes(this.printerName.toLowerCase()));
        } else {
          // Ada setidaknya satu printer terpasang di Windows
          resolve(stdout.trim().length > 0);
        }
      });
    });
  }

  public async print(filePath: string, options?: PrintJobOptions): Promise<PrintJobResult> {
    const jobId = crypto.randomUUID();

    if (!fs.existsSync(filePath)) {
      return {
        jobId,
        success: false,
        message: `File untuk dicetak tidak ditemukan: ${filePath}`,
      };
    }

    const printer = this.printerName || 'default';

    // 1. Jika SumatraPDF tersedia, gunakan pencetakan senyap presisi tinggi
    if (this.sumatraPath && fs.existsSync(this.sumatraPath)) {
      return new Promise((resolve) => {
        const args = ['-print-to', printer, '-print-settings', `${options?.copies || 1}x,fit`, filePath];
        execFile(this.sumatraPath!, args, (err) => {
          if (err) {
            resolve({
              jobId,
              success: false,
              message: `Gagal mencetak via SumatraPDF: ${err.message}`,
            });
          } else {
            resolve({
              jobId,
              success: true,
              message: `Pekerjaan cetak 4R dikirim ke printer ${printer} via SumatraPDF`,
            });
          }
        });
      });
    }

    // 2. Fallback universal Windows via PowerShell PrintTo
    return new Promise((resolve) => {
      const psCommand = this.printerName
        ? `Start-Process -FilePath "${filePath}" -Verb PrintTo -ArgumentList '"${this.printerName}"' -Wait`
        : `Start-Process -FilePath "${filePath}" -Verb Print -Wait`;

      execFile('powershell', ['-Command', psCommand], (err) => {
        if (err) {
          resolve({
            jobId,
            success: false,
            message: `Gagal mengirim dokumen ke Windows Print Spooler: ${err.message}`,
          });
        } else {
          resolve({
            jobId,
            success: true,
            message: `Pekerjaan cetak 4R berhasil dikirim ke spooler Windows (${printer})`,
          });
        }
      });
    });
  }
}
