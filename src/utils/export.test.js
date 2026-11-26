import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadCSV, printPage } from './export.js';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Export helpers', () => {
  it('builds a UTF-8 CSV with escaped values and triggers a download', async () => {
    let blob;
    const link = { href: '', download: '', click: vi.fn() };
    const appendChild = vi.fn();
    const removeChild = vi.fn();
    vi.stubGlobal('document', {
      body: { appendChild, removeChild },
      createElement: () => link,
    });
    const create = vi.spyOn(URL, 'createObjectURL').mockImplementation((value) => { blob = value; return 'blob:mock'; });
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    const ok = downloadCSV('routes.csv', [
      { Name: 'Depot, North', Cost: 12, Note: 'a "quoted" note' },
      { Name: 'Hub', Cost: 0, Note: '' },
    ]);
    expect(ok).toBe(true);
    expect(link.download).toBe('routes.csv');
    expect(link.href).toBe('blob:mock');
    expect(appendChild).toHaveBeenCalledWith(link);
    expect(link.click).toHaveBeenCalledTimes(1);
    expect(removeChild).toHaveBeenCalledWith(link);
    expect(create).toHaveBeenCalledTimes(1);
    expect(revoke).toHaveBeenCalledWith('blob:mock');
    const text = await blob.text();
    expect(blob.type).toContain('text/csv');
    expect(blob.size).toBeGreaterThan(new TextEncoder().encode(text).length); // UTF-8 BOM
    expect(text).toContain('Name,Cost,Note');
    expect(text).toContain('"Depot, North",12,"a ""quoted"" note"');
    expect(text).toContain('Hub,0,');
    expect(text).toContain('\r\n');
  });

  it('does nothing for empty rows', () => {
    const click = vi.fn();
    vi.stubGlobal('document', { body: { appendChild: vi.fn(), removeChild: vi.fn() }, createElement: () => ({ click }) });
    expect(downloadCSV('empty.csv', [])).toBe(false);
    expect(click).not.toHaveBeenCalled();
  });

  it('delegates printing to the browser', () => {
    const print = vi.fn();
    vi.stubGlobal('window', { print });
    printPage();
    expect(print).toHaveBeenCalledTimes(1);
  });
});
