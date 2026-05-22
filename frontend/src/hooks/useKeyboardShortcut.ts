import { useEffect, useCallback } from 'react';

interface KeyCombo {
  ctrl?: boolean;
  shift?: boolean;
  key: string;
}

export function useKeyboardShortcut(combo: KeyCombo, callback: () => void) {
  const handler = useCallback(
    (e: KeyboardEvent) => {
      const ctrlMatch = combo.ctrl ? e.ctrlKey || e.metaKey : true;
      const shiftMatch = combo.shift ? e.shiftKey : true;
      if (ctrlMatch && shiftMatch && e.key.toLowerCase() === combo.key.toLowerCase()) {
        e.preventDefault();
        callback();
      }
    },
    [callback, combo.ctrl, combo.shift, combo.key],
  );

  useEffect(() => {
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handler]);
}
