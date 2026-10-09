// Custom confirm dialog – replaces all window.confirm() calls
// Usage: const { confirm, ConfirmDialog } = useConfirm();
//        await confirm({ title, message }) → true / false

import { useState, useCallback } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export function useConfirm() {
  const [state, setState] = useState(null); // { title, message, resolve }

  const confirm = useCallback(({ title = 'Are you sure?', message = '' }) =>
    new Promise((resolve) => {
      setState({ title, message, resolve });
    }), []);

  const handleYes = () => { state?.resolve(true);  setState(null); };
  const handleNo  = () => { state?.resolve(false); setState(null); };

  const Dialog = state ? (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={handleNo}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 16, padding: '28px 28px 24px', maxWidth: 380, width: '90%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: 'rgba(239,68,68,0.12)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <AlertTriangle size={20} style={{ color: '#ef4444' }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 6 }}>
              {state.title}
            </div>
            {state.message && (
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {state.message}
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleNo}
            style={{ minWidth: 80 }}
          >
            Cancel
          </button>
          <button
            className="btn btn-sm"
            onClick={handleYes}
            style={{
              minWidth: 80, background: '#ef4444', color: '#fff',
              border: 'none', fontWeight: 700,
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return { confirm, ConfirmDialog: Dialog };
}
