/**
 * پل ارتباطی رسمی سروستان و مهستان (Sarvestan-Mehestan Bridge)
 * تبادل داده‌های دروس، اساتید، رنگ‌ها و دریافت تکالیف مودل
 */
import { getSnapshot, getCurrentTermSchedule } from './behestan/store';
import { detectCurrentTermId } from './behestan/parsers';

export function initMehestanBridge() {
  if (typeof window === 'undefined') return () => {};

  let bc = null;
  try {
    if ('BroadcastChannel' in window) {
      bc = new BroadcastChannel('sarvestan_mehestan_channel');

      const broadcastData = () => {
        const snap = getSnapshot();
        const term = detectCurrentTermId(snap?.courses || []) || '4051';
        const schedule = getCurrentTermSchedule(term) || [];
        const payload = {
          courses: snap?.courses || [],
          schedule,
          profile: snap?.profile || null,
          sentAt: Date.now(),
        };
        bc.postMessage({ type: 'SARVESTAN_DATA_RESPONSE', payload });
        try {
          localStorage.setItem('mehestan_sarvestan_synced_data', JSON.stringify(payload));
        } catch {}
      };

      bc.onmessage = (event) => {
        const { type, payload } = event.data || {};
        if (type === 'REQUEST_SARVESTAN_DATA') {
          broadcastData();
        } else if (type === 'full_sync' || type === 'batch_tasks') {
          try {
            localStorage.setItem('sarvestan_moodle_synced_tasks', JSON.stringify(payload));
          } catch {}
        }
      };

      // ارسال اولیه دیتای ترم جاری به مهستان
      broadcastData();
    }
  } catch (err) {
    console.warn('Sarvestan-Mehestan BroadcastChannel error:', err);
  }

  return () => {
    if (bc) bc.close();
  };
}
