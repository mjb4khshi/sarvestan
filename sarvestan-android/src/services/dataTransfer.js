/**
 * Sarvestan Data Transfer Engine
 * Supports:
 * 1. JSON file Export / Import
 * 2. Animated QR Stream Export / Reassembly
 * 100% Client-Side, Zero Server, Zero MITM
 */

const STORAGE_KEYS = [
  'sarvestan_live_profile',
  'sarvestan_live_schedule',
  'sarvestan_live_exams',
  'sarvestan_live_transcripts',
  'sarvestan_live_courses',
  'sarvestan_live_finance',
  'sarvestan_live_workflows',
  'sarvestan_live_curriculum_stats',
  'sarvestan_selected_university',
  'sarvestan_auth_status',
  'sarvestan_theme',
];

const PROTOCOL_HEADER = 'SRV1';
const CHUNK_SIZE = 750; // Optimized density for rapid multi-frame camera scanning

/**
 * Creates a clean snapshot of all stored student data
 */
export function exportSnapshotBundle({ shrinkPhoto = false } = {}) {
  const bundle = {
    version: '2.0.1',
    exportedAt: new Date().toISOString(),
    data: {},
  };

  for (const key of STORAGE_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null && raw !== undefined) {
        try {
          bundle.data[key] = JSON.parse(raw);
        } catch {
          bundle.data[key] = raw;
        }
      }
    } catch {}
  }

  // Lightweight QR stream optimizations:
  // Removes 100KB+ base64 student photo and bulky raw Behestan workflow dumps
  if (shrinkPhoto) {
    if (bundle.data.sarvestan_live_profile) {
      bundle.data.sarvestan_live_profile = { ...bundle.data.sarvestan_live_profile };
      delete bundle.data.sarvestan_live_profile.photo;
      bundle.data.sarvestan_live_profile.photoLight = true;
    }
    // Delete bulky server-side workflows (not needed for schedule/grades/dashboard)
    delete bundle.data.sarvestan_live_workflows;

    // Clean courses if present to keep only essential fields
    if (Array.isArray(bundle.data.sarvestan_live_courses)) {
      bundle.data.sarvestan_live_courses = bundle.data.sarvestan_live_courses.map((c) => ({
        code: c.code,
        name: c.name,
        group: c.group,
        units: c.units,
        grade: c.grade,
        status: c.status,
        termId: c.termId,
        instructor: c.instructor,
      }));
    }
  }

  return bundle;
}

/**
 * Compresses string using gzip when available, with raw fallback
 */
export async function compressString(str) {
  if (typeof CompressionStream !== 'undefined') {
    try {
      const stream = new Blob([new TextEncoder().encode(str)]).stream().pipeThrough(new CompressionStream('gzip'));
      const buf = await new Response(stream).arrayBuffer();
      let binary = '';
      const bytes = new Uint8Array(buf);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return 'gz:' + btoa(binary);
    } catch (e) {
      console.warn('[dataTransfer] compression fallback:', e);
    }
  }
  return 'raw:' + encodeURIComponent(str);
}

/**
 * Decompresses string using gzip or raw fallback
 */
export async function decompressString(payload) {
  if (typeof payload !== 'string') return '';
  if (payload.startsWith('gz:') && typeof DecompressionStream !== 'undefined') {
    const binary = atob(payload.slice(3));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    return await new Response(stream).text();
  }
  if (payload.startsWith('raw:')) {
    return decodeURIComponent(payload.slice(4));
  }
  return payload;
}

/**
 * Prepares an array of QR chunks for animated display
 */
export async function generateQrChunks(bundle, { chunkSize = CHUNK_SIZE } = {}) {
  const jsonStr = JSON.stringify(bundle);
  const compressed = await compressString(jsonStr);

  const sessionId = Math.random().toString(36).substring(2, 6).toUpperCase();
  const totalLength = compressed.length;
  const numChunks = Math.ceil(totalLength / chunkSize);

  const chunks = [];
  for (let i = 0; i < numChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, totalLength);
    const slice = compressed.slice(start, end);
    const frameIndex = i + 1;
    // Format: SRV1|SESSION_ID|INDEX|TOTAL|DATA
    const framePayload = `${PROTOCOL_HEADER}|${sessionId}|${frameIndex}|${numChunks}|${slice}`;
    chunks.push({
      frameIndex,
      totalChunks: numChunks,
      sessionId,
      payload: framePayload,
    });
  }

  return {
    sessionId,
    totalChunks: numChunks,
    uncompressedBytes: jsonStr.length,
    compressedBytes: compressed.length,
    chunks,
  };
}

/**
 * State manager for the scanner camera stream to reassemble incoming frames
 */
export class QrStreamReassembler {
  constructor({ onProgress, onComplete, onError } = {}) {
    this.onProgress = onProgress || (() => {});
    this.onComplete = onComplete || (() => {});
    this.onError = onError || (() => {});
    this.currentSessionId = null;
    this.totalChunks = 0;
    this.receivedChunks = new Map();
    this.isDone = false;
  }

  reset() {
    this.currentSessionId = null;
    this.totalChunks = 0;
    this.receivedChunks.clear();
    this.isDone = false;
  }

  feedFrame(rawText) {
    if (this.isDone || !rawText || typeof rawText !== 'string') return;
    if (!rawText.startsWith(PROTOCOL_HEADER + '|')) return;

    const parts = rawText.split('|');
    if (parts.length < 5) return;

    const [, sessionId, strIndex, strTotal, chunkData] = parts;
    const frameIndex = parseInt(strIndex, 10);
    const total = parseInt(strTotal, 10);

    if (!sessionId || isNaN(frameIndex) || isNaN(total) || total <= 0) return;

    // If new session detected, restart collector
    if (this.currentSessionId !== sessionId) {
      this.currentSessionId = sessionId;
      this.totalChunks = total;
      this.receivedChunks.clear();
    }

    if (!this.receivedChunks.has(frameIndex)) {
      this.receivedChunks.set(frameIndex, chunkData);

      const receivedCount = this.receivedChunks.size;
      const progressPercent = Math.min(100, Math.round((receivedCount / this.totalChunks) * 100));

      this.onProgress({
        sessionId,
        receivedCount,
        totalChunks: this.totalChunks,
        progressPercent,
        latestFrame: frameIndex,
      });

      if (receivedCount === this.totalChunks) {
        this.isDone = true;
        this._finalizeAssembly();
      }
    }
  }

  async _finalizeAssembly() {
    try {
      let combined = '';
      for (let i = 1; i <= this.totalChunks; i++) {
        combined += this.receivedChunks.get(i) || '';
      }
      const decompressedJson = await decompressString(combined);
      const bundle = JSON.parse(decompressedJson);
      this.onComplete(bundle);
    } catch (err) {
      console.error('[dataTransfer] reassembly error:', err);
      this.onError(err);
    }
  }
}

/**
 * Ingests a bundle into localStorage (and chrome.storage if available)
 */
export async function applyBundleToStorage(bundle) {
  if (!bundle?.data || typeof bundle.data !== 'object') {
    throw new Error('فایل یا داده انتخاب‌شده نامعتبر است.');
  }

  const { data } = bundle;
  let itemsApplied = 0;

  for (const [key, value] of Object.entries(data)) {
    if (!STORAGE_KEYS.includes(key) && !key.startsWith('sarvestan_')) continue;
    try {
      const valStr = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(key, valStr);
      itemsApplied++;
    } catch (e) {
      console.warn('[dataTransfer] write storage error:', key, e);
    }
  }

  // Also sync to chrome.storage if running in extension
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    try {
      const cleanObj = {};
      for (const [key, value] of Object.entries(data)) {
        cleanObj[key] = value;
      }
      await chrome.storage.local.set(cleanObj);
    } catch {}
  }

  // Notify store and all components of full data update
  try {
    window.dispatchEvent(new CustomEvent('sarvestan_data_restored', { detail: { count: itemsApplied } }));
    window.dispatchEvent(new StorageEvent('storage', { key: 'sarvestan_live_profile' }));
  } catch {}

  return { ok: true, itemsApplied };
}

/**
 * Downloads bundle as a .json file (with native share on Android / Mobile)
 */
export async function downloadJsonBundle(bundle) {
  const std = bundle.data?.sarvestan_live_profile?.studentId || 'student';
  const date = new Date().toISOString().slice(0, 10);
  const fileName = `sarvestan-backup-${std}-${date}.json`;
  const jsonStr = JSON.stringify(bundle, null, 2);

  // If Capacitor native share plugin is present (Android)
  if (typeof window !== 'undefined' && window.Capacitor?.Plugins?.SarvestanShare?.shareFile) {
    try {
      await window.Capacitor.Plugins.SarvestanShare.shareFile({
        content: jsonStr,
        filename: fileName,
        mimeType: 'application/json',
        title: 'فایل پشتیبان سروستان',
      });
      return;
    } catch (e) {
      console.warn('[downloadJsonBundle native err]', e);
    }
  }

  // If Web Share API is available (iOS Safari / Mobile Chrome)
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      const file = new File([jsonStr], fileName, { type: 'application/json' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'پشتیبان سروستان',
          text: `فایل پشتیبان سروستان (${fileName})`,
        });
        return;
      }
    } catch (e) {
      if (e.name === 'AbortError') return;
      console.warn('[share api err]', e);
    }
  }

  // Standard Web Download fallback (Desktop browsers)
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}
