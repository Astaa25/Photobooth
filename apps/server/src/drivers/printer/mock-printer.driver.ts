import crypto from 'node:crypto';
import type { PrinterDriver, PrintJobOptions, PrintJobResult } from './printer.interface.js';

export class MockPrinterDriver implements PrinterDriver {
  public readonly name = 'mock';
  private ready = true;
  private printedCount = 0;

  constructor(options?: { initiallyReady?: boolean }) {
    if (options?.initiallyReady !== undefined) {
      this.ready = options.initiallyReady;
    }
  }

  public setReady(status: boolean): void {
    this.ready = status;
  }

  public async isReady(): Promise<boolean> {
    return this.ready;
  }

  public async print(filePath: string, options?: PrintJobOptions): Promise<PrintJobResult> {
    if (!this.ready) {
      return {
        jobId: crypto.randomUUID(),
        success: false,
        message: 'Printer tidak siap atau kehabisan kertas/tinta (mock)',
      };
    }

    // Simulasi jeda pencetakan fisik (1 detik)
    await new Promise((resolve) => setTimeout(resolve, 1000));
    this.printedCount += options?.copies || 1;

    return {
      jobId: crypto.randomUUID(),
      success: true,
      message: `Berhasil mencetak ${options?.copies || 1} lembar ${options?.paperSize || '4R'} (Mock)`,
    };
  }

  public getPrintedCount(): number {
    return this.printedCount;
  }
}
