export interface PrintJobOptions {
  paperSize?: '4R';
  copies?: number;
  orientation?: 'portrait' | 'landscape';
}

export interface PrintJobResult {
  jobId: string;
  success: boolean;
  message?: string;
}

export interface PrinterDriver {
  name: string;
  isReady(): Promise<boolean>;
  print(pdfOrImagePath: string, options?: PrintJobOptions): Promise<PrintJobResult>;
}
