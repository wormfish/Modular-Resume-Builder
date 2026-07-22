import { useCallback } from 'react';

export function useExportPdf() {
  const exportPdf = useCallback(() => {
    window.print();
  }, []);

  return exportPdf;
}
