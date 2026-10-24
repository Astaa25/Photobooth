import { describe, it, expect } from 'vitest';
import { MockPrinterDriver } from './mock-printer.driver.js';

describe('MockPrinterDriver', () => {
  it('berhasil mencetak satu lembar 4R dalam keadaan siap', async () => {
    const driver = new MockPrinterDriver();
    const isReady = await driver.isReady();
    expect(isReady).toBe(true);

    const result = await driver.print('mock-file.pdf', { paperSize: '4R', copies: 1 });
    expect(result.success).toBe(true);
    expect(result.jobId).toBeDefined();
    expect(driver.getPrintedCount()).toBe(1);
  });

  it('gagal mencetak jika status printer tidak siap', async () => {
    const driver = new MockPrinterDriver({ initiallyReady: false });
    const result = await driver.print('mock-file.pdf');
    expect(result.success).toBe(false);
    expect(result.message).toContain('tidak siap');
  });
});
