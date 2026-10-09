// Imperative confirm – shows a toast with Confirm/Cancel buttons.
// No browser dialog. Returns Promise<boolean>.
// Usage (in any async function):
//   import { confirmAction } from '../util/confirmToast';
//   const ok = await confirmAction('Delete this post?');
//   if (!ok) return;
import toast from 'react-hot-toast';

export function confirmAction(message) {
  return new Promise((resolve) => {
    toast(
      (t) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 230 }}>
          <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>{message}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              style={{ flex: 1, padding: '7px 12px', borderRadius: 8, background: '#ef4444', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}
              onClick={() => { toast.dismiss(t.id); resolve(true); }}>
              Confirm
            </button>
            <button
              style={{ flex: 1, padding: '7px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.08)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.15)', fontWeight: 600, cursor: 'pointer', fontSize: 12 }}
              onClick={() => { toast.dismiss(t.id); resolve(false); }}>
              Cancel
            </button>
          </div>
        </div>
      ),
      {
        duration: Infinity,
        style: { background: '#1a1a35', color: '#e2e8f0', border: '1px solid #7c3aed', padding: '14px 16px' },
      }
    );
  });
}
