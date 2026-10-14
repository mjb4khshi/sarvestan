/**
 * آداپتور سامانهٔ گلستان ۱.۰ (دانشگاه علم و صنعت — golestan.iust.ac.ir)
 *
 * در گلستان ۱.۰ همه چیز مبتنی بر PostBack وب‌فرم‌های ASP.NET است:
 *   - فرم منوی میزکار: 0;11130 (F0213_PROCESS_SYSMENU)
 *   - فرم مشخصات دانشجو: 0;10190 (F0546_PROCESS_STDREQINFO)
 *   - فرم پرداخت آنلاین: 0;15450 (F1312_PROCESS_STDPAYD_ONLINE)
 *   - فیلتر و نمایش گزارش‌ها: 1;<repId> (F0202_PROCESS_REP_FILTER)
 *
 * چرخهٔ ناوبری و نشست:
 *   ۱. نشست با کوکی‌های ASP.NET_SessionId و u, lt, su, ft, f, seq و ctck هدایت می‌شود.
 *   ۲. در بارگذاری هر فرم، SavAut مقداردهی کوکی‌ها و tck تازه را انجام می‌دهد.
 *   ۳. اکشن 00 فرم را مقداردهی و فیلترها (XmlVarPri) را برمی‌گرداند.
 *   ۴. اکشن 08 در فرم‌های داده‌ای (10190 و 15450) داده‌ها را در TxtMiddle برمی‌گرداند.
 *   ۵. اکشن 09 در فیلتر گزارش (F0202) گزارش را اجرا کرده و xmlDat و xmlStrc را بازمی‌گرداند.
 */

import { getUniversityOrigin, getSessionSnapshot, saveManualSession } from './session';
import {
  cleanHtml,
  normalizeCourseName,
  normalizeDayName,
  normalizeTimeRange,
  normalizeRegStatus,
  toNum,
} from './parsers';

const DEBUG_KEY = 'sarvestan_iust_debug';

function nativeHttp() {
  try {
    const C = globalThis.Capacitor;
    if (C?.isNativePlatform?.() && C?.Plugins?.CapacitorHttp) return C.Plugins.CapacitorHttp;
  } catch {}
  return null;
}

const FORM_PAGES = {
  '0;11130': '/Forms/F0213_PROCESS_SYSMENU/F0213_01_PROCESS_SYSMENU_Dat.aspx',
  '0;10190': '/Forms/F0546_PROCESS_STDREQINFO/F0546_01_PROCESS_STDREQINFO_Dat.aspx',
  '0;15450': '/Forms/F1312_PROCESS_STDPAYD_ONLINE/F1312_01_PROCESS_STDPAYD_ONLINE_Dat.aspx',
};
const REP_FILTER_PAGE = '/Forms/F0202_PROCESS_REP_FILTER/F0202_01_PROCESS_REP_FILTER_Dat.aspx';

/**
 * مهرهای زمانی تغییر فایل‌های IIS در سرور علم و صنعت.
 * checkmodi در کلاینت گلستان این مقدار را با تاریخ واقعی مقایسه می‌کند.
 */
const FORM_LASTM = {
  '0;11130': '20260203065644',
  '0;10190': '20260420065430',
  '0;15450': '20260420074446',
  rep: '20260119060814',
};

export function formPagePath(fid) {
  return FORM_PAGES[fid] || REP_FILTER_PAGE;
}

export function formLastm(fid) {
  if (fid && String(fid).startsWith('1;')) return FORM_LASTM.rep;
  return FORM_LASTM[fid] || FORM_LASTM.rep;
}

/** بلیط خام نشست */
function rawTicket() {
  const t = getSessionSnapshot()?.ticket || '';
  let s = String(t).trim();
  if (s.startsWith('{')) {
    try {
      s = JSON.parse(s)?.Ticket || '';
    } catch {
      s = '';
    }
  }
  if (s) return s;

  // فال‌بک ۱: خواندن مستقیم از کوکی نشست (ctck یا tck)
  const jar = jarOf() || lastJar;
  const m = jar.match(/(?:^|;\s*)(?:ctck|tck)=([^;]+)/i);
  if (m && m[1]) return m[1].trim();

  // فال‌بک ۲: توکن lt
  const ltM = jar.match(/(?:^|;\s*)lt=([^;]+)/i);
  if (ltM && ltM[1]) return ltM[1].trim();

  return '';
}

/** خواندن کوکی‌های نشست */
function jarOf() {
  const snap = getSessionSnapshot();
  return String(snap?.cookies || '');
}

function mergeJar(base, rawSetCookie) {
  const jar = new Map();
  const pairs = String(rawSetCookie || '')
    .split(/,(?=\s*[A-Za-z0-9_.-]+=)/)
    .map((s) => String(s).split(';')[0].trim())
    .filter((s) => s.includes('='));
  for (const p of [...String(base || '').split(';'), ...pairs]) {
    const s = p.trim();
    const i = s.indexOf('=');
    if (i > 0) jar.set(s.slice(0, i), s.slice(i + 1));
  }
  return [...jar].map(([k, v]) => `${k}=${v}`).join('; ');
}

let lastJar = '';

/**
 * گلستان ۱.۰ کوکی‌های نشست و فرم فعال را با SavAut در کلاینت می‌نویسد:
 * SavAut(u, su, ft, fid, ltck, tck, seq, nam, cchg, ut, actsign)
 */
export function applySavAutCookies(html, jar) {
  const m = String(html || '').match(
    /SavAut\s*\(\s*(-?\d+)\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*([^,]+),\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*([^,]+)/i,
  );
  if (!m) return jar;
  const uid = m[1];
  // اگر کاربر لاگ‌آف شده باشد (u = -999) کوکی نشست معتبر را تخریب نکنیم
  if (uid === '-999') return jar;

  const updates = {
    u: uid,
    su: m[2],
    ft: m[3].trim(),
    f: m[4].trim().replace(/['"]/g, ''),
    lt: m[5],
    tck: m[6],
    ctck: m[6],
    seq: m[7].trim(),
  };
  const map = new Map();
  for (const part of String(jar || '').split(';')) {
    const s = part.trim();
    const i = s.indexOf('=');
    if (i > 0) map.set(s.slice(0, i), s.slice(i + 1));
  }
  for (const [k, v] of Object.entries(updates)) {
    if (v !== undefined && v !== '') map.set(k, v);
  }
  return [...map].map(([k, v]) => `${k}=${v}`).join('; ');
}

/** به‌روزرسانی نشست با کوکی‌ها و بلیط تازه */
function persistJar(jar) {
  if (!jar) return;
  lastJar = jar;
  try {
    const tckMatch = jar.match(/(?:^|;\s*)(?:tck|ctck)=([^;]+)/i);
    const update = { cookies: jar };
    if (tckMatch && tckMatch[1]) {
      update.ticket = tckMatch[1].trim();
    }
    saveManualSession(update);
  } catch {}
}

/** اعمال فرم فعال در کوکی‌ها (ft و f) */
function applyFormCookies(fid, jar) {
  const m = String(fid).match(/^(\d+);(\d+)$/);
  if (!m) return jar;
  const map = new Map();
  for (const part of String(jar || '').split(';')) {
    const s = part.trim();
    const i = s.indexOf('=');
    if (i > 0) map.set(s.slice(0, i), s.slice(i + 1));
  }
  map.set('ft', m[1]);
  map.set('f', m[2]);
  return [...map].map(([k, v]) => `${k}=${v}`).join('; ');
}

/** خلاصهٔ بدنه برای لاگ */
function redactBody(body) {
  return String(body || '')
    .split('&')
    .map((kv) => {
      const i = kv.indexOf('=');
      const k = kv.slice(0, i);
      const v = kv.slice(i + 1);
      if (/__VIEWSTATE$|__EVENTVALIDATION$/i.test(k)) return `${k}=<${v.length}>`;
      return `${k}=${v.length > 120 ? v.slice(0, 120) + '…' : v}`;
    })
    .join('&')
    .slice(0, 1400);
}

/**
 * درخواست HTML به گلستان علم و صنعت
 */
export async function g1Fetch(fullPath, { method = 'GET', body = null, referer = '' } = {}) {
  const origin = getUniversityOrigin('iust');
  const http = nativeHttp();
  const jar = jarOf() || lastJar;
  const ref = referer || `${origin}/_Templates/Commander.htm`;

  if (http) {
    const opts = {
      url: `${origin}${fullPath}`,
      method,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fa-IR,fa;q=0.9,en;q=0.8',
        Referer: ref,
        Cookie: jar,
        ...(method === 'POST' ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
      },
      connectTimeout: 20000,
      readTimeout: 30000,
    };
    if (method === 'POST') opts.data = body;
    const res = await http.request(opts);
    const sc = res.headers?.['set-cookie'] || res.headers?.['Set-Cookie'] || '';
    let jarNext = sc ? mergeJar(jar, sc) : jar;
    const textOut = typeof res.data === 'string' ? res.data : JSON.stringify(res.data ?? '');
    jarNext = applySavAutCookies(textOut, jarNext);
    persistJar(jarNext);
    const sessionErr = checkGolestanSessionError(textOut);
    if (sessionErr) throw new Error(sessionErr);
    if (res.status >= 400) {
      throw new Error(`HTTP ${res.status}: گلستان علم و صنعت`);
    }
    return textOut;
  }

  const r = await fetch(`/iust-api${fullPath}`, {
    method,
    headers: {
      ...(method === 'POST' ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'X-Behestan-Cookie': jar,
      'X-IUST-Referer': ref,
      ...(method === 'POST' ? { 'X-IUST-Body': redactBody(body) } : {}),
    },
    body: method === 'POST' ? body : undefined,
    credentials: 'omit',
    mode: 'cors',
  });
  const text = await r.text();
  persistJar(applySavAutCookies(text, jar));
  const sessionErr = checkGolestanSessionError(text);
  if (sessionErr) throw new Error(sessionErr);
  if (!r.ok) {
    const detail = cleanHtml(text).replace(/\s+/g, ' ').slice(0, 400);
    throw new Error(`HTTP ${r.status}${detail ? ': ' + detail : ''}`);
  }
  return text;
}

/** بررسی خطای نشست یا خروج خودکار در پاسخ‌های گلستان ۱.۰ */
export function checkGolestanSessionError(html) {
  const text = String(html || '');
  if (/AutoLogOff|کد24|کد56|كارنكردن بيش از حد مجاز|کارنکردن بيش از حد مجاز|بروز اشكال در احراز هويت|SavAut\s*\(\s*-999/i.test(text)) {
    const errMatch = text.match(/ErrorArr\s*=\s*new\s*Array\(\s*['"]([^'"]+)['"]/i);
    let msg = errMatch ? errMatch[1].replace(/::AutoLogOff\(\)/i, '').trim() : '';
    if (!msg) msg = 'نشست منقضی شده است (لطفاً خارج شوید و مجدداً وارد شوید)';
    return msg;
  }
  return null;
}

/** مقدار یک input از HTML */
function hiddenValue(html, key) {
  const tag = (String(html).match(new RegExp('<input[^>]*name="' + key + '"[^>]*>', 'i')) || [])[0] || '';
  return (tag.match(/value="([^"]*)"/i) || [])[1] || '';
}

/** استخراج داده‌های وب‌فرم و متغیرهای SavAut */
export function parseWebForm(html) {
  const text = String(html || '');
  const vs = hiddenValue(text, '__VIEWSTATE');
  const ev = hiddenValue(text, '__EVENTVALIDATION');
  const vsg = hiddenValue(text, '__VIEWSTATEGENERATOR') || '6A475423';
  const hiddenTicket = hiddenValue(text, 'TicketTextBox');
  const urlTck = (text.match(/tck=([0-9A-Fa-f][0-9A-Fa-f-]{7,})/i) || [])[1] || '';
  const savM = text.match(
    /SavAut\s*\(\s*(-?\d+)\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*([^,]+),\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*([^,]+)/i,
  );

  const inputs = {};
  for (const tag of text.match(/<input\b[^>]*>/gi) || []) {
    const name = (tag.match(/name="([^"]+)"/i) || [])[1];
    if (!name || name in inputs) continue;
    const type = ((tag.match(/type="([^"]*)"/i) || [])[1] || 'text').toLowerCase();
    if (type === 'submit' || type === 'button' || type === 'image') continue;
    inputs[name] = (tag.match(/value="([^"]*)"/i) || [])[1] || '';
  }
  for (const block of text.match(/<select\b[\s\S]*?<\/select>/gi) || []) {
    const name = (block.match(/name="([^"]+)"/i) || [])[1];
    if (!name) continue;
    const sel = block.match(/<option\b[^>]*\bselected[^>]*>/i);
    const openTag = sel ? sel[0] : '';
    const inner = openTag ? block.slice(openTag.length, block.indexOf('</option>', openTag.length)) : '';
    inputs[name] = (openTag.match(/value="([^"]*)"/i) || [])[1] || cleanHtml(inner);
  }

  const isDataField = (n) => n === 'MaxHlp' || /^[A-Z]\d{5,6}$/.test(n);
  const fields = {};
  for (const [name, value] of Object.entries(inputs)) {
    if (/^__/.test(name) || !isDataField(name)) continue;
    fields[name] = cleanHtml(value);
  }

  const formAction = (text.match(/<form\b[^>]*action="([^"]*)"/i) || [])[1] || '';
  const actTck = (formAction.replace(/&amp;/g, '&').match(/tck=([0-9A-Fa-f][0-9A-Fa-f-]{7,})/i) || [])[1] || '';

  const ticket = (savM ? savM[6] : '') || inputs.TicketTextBox || hiddenTicket || actTck || urlTck;

  return {
    vs,
    ev,
    vsg,
    ticket,
    uid: savM ? savM[1] : '',
    su: savM ? savM[2] : '',
    ft: savM ? savM[3] : '',
    fid: savM ? String(savM[4]).trim().replace(/['"]/g, '') : '',
    lt: savM ? savM[5] : '',
    seq: savM ? String(savM[7]).trim() : '',
    fields,
    inputs,
    formAction: formAction.replace(/&amp;/g, '&'),
    xmlVarPri: (text.match(/XmlVarPri\s*=\s*'([^']*)'/i) || [])[1] || '',
    xmlVarPub: (text.match(/XmlVarPub\s*=\s*'([^']*)'/i) || [])[1] || '',
    html: text,
  };
}

function xmlAttr(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildTxtMiddle(fields, overrides = {}) {
  const merged = { ...fields, ...overrides };
  const attrs = Object.entries(merged)
    .filter(([k]) => k === 'MaxHlp' || /^[A-Z]\d{5,6}$/.test(k))
    .map(([k, v]) => ` ${k}="${xmlAttr(v)}"`);
  return attrs.length ? `<r${attrs.join('')}/>` : '<r/>';
}

function resolveFormAction(pageUrl, formAction) {
  const a = String(formAction || '').trim();
  if (!a) return pageUrl;
  if (/^https?:/i.test(a)) {
    try {
      const u = new URL(a);
      return `${u.pathname}${u.search}`;
    } catch {
      return pageUrl;
    }
  }
  const [base] = pageUrl.split('?');
  const dir = base.slice(0, base.lastIndexOf('/') + 1);
  if (a.startsWith('./')) return `${dir}${a.slice(2)}`;
  if (a.startsWith('/')) return a;
  return `${dir}${a}`;
}

const SERVER_ONLY_FIELDS = /^(OutFields|ErrorDSC|SuccDSC|xmlStrc|tbExcel)$/;

function postBody(page, { action, txtMiddle = '<r/>', ticket, xmlPri = '', xmlPub = '', xmlMoredi = '' }) {
  const values = {};
  for (const [name, value] of Object.entries(page.inputs || {})) {
    if (SERVER_ONLY_FIELDS.test(name)) continue;
    values[name] = value;
  }
  values.__VIEWSTATE = page.vs || '';
  values.__VIEWSTATEGENERATOR = page.vsg || '6A475423';
  values.__EVENTVALIDATION = page.ev || '';
  values.Fm_Action = String(action);
  values.TicketTextBox = ticket || page.ticket || rawTicket() || '';
  values.TxtMiddle = txtMiddle;

  if (xmlPri) values.XmlPriPrm = xmlPri;
  if (xmlPub) values.XmlPubPrm = xmlPub;
  if (xmlMoredi) values.XmlMoredi = xmlMoredi;

  const ft = page.ft || '';
  const f = page.fid || '';
  const seq = page.seq || '';
  const su = page.su || '';
  values.ex = ft && f ? `${ft}|${f}|${seq}|${su}` : '';

  return new URLSearchParams(values).toString();
}

export function pagePath(datPath, fid, tck, extra = '') {
  const rnd = Math.random();
  const lastm = formLastm(fid);
  const safeTck = tck || rawTicket() || '';
  return `${datPath}?r=${rnd}&fid=${encodeURIComponent(fid)}&b=0&l=0&tck=${safeTck}${extra}&&lastm=${lastm}`;
}

function debugPush(entry) {
  try {
    if (globalThis.Capacitor?.isNativePlatform?.()) return;
    const list = JSON.parse(localStorage.getItem(DEBUG_KEY) || '[]');
    list.unshift({ ...entry, at: Date.now(), html: String(entry.html || '').slice(0, 60000) });
    localStorage.setItem(DEBUG_KEY, JSON.stringify(list.slice(0, 10)));
  } catch {}
}

/**
 * باز کردن یک فرم به همراه یک اکشن PostBack
 */
export async function openAndPost(fid, { action = '08', overrides = {}, referer = '' } = {}) {
  const state = await openForm(fid, { referer });
  const html = await postForm(state, { action, overrides });
  const next = parseWebForm(html);
  debugPush({ fid, action, url: state.url, html, stage: 'post' });
  if (next.ticket) {
    saveManualSession({ ticket: next.ticket });
  }
  return { ...state, html, page: state.page, posted: next, ticket: next.ticket || state.ticket };
}

/**
 * باز کردن فرم در گلستان ۱.۰ با هندشیک AuthNav و فراخوانی صفحه _Dat.aspx
 * به همراه ارسال اکشن مقدماتی 00 جهت مقداردهی وضعیت فرم.
 */
export async function openForm(fid, { referer = '', init = true } = {}) {
  const origin = getUniversityOrigin('iust');
  const tck = rawTicket();
  persistJar(applyFormCookies(fid, jarOf() || lastJar));
  const dat = formPagePath(fid);

  // مرحله ۱: ثبت ناوبری در هندلر ناوبری گلستان (AuthNav)
  // این درخواست به IIS اجازه انتقال نشست به فرم مقصد را می‌دهد و مانع AutoLogOff (کد ۵۶) می‌شود
  if (tck) {
    try {
      const navRnd = Math.random();
      const navUrl = `/forms/f0240_process_authnav/nav.aspx?r=${navRnd}&fid=${encodeURIComponent(fid)}&b=0&l=0&tck=${tck}`;
      await g1Fetch(navUrl, { method: 'GET', referer: referer || `${origin}/_Templates/Commander.htm` });
    } catch {}
  }

  const url = pagePath(dat, fid, tck);
  const ref = referer || `${origin}/forms/f0240_process_authnav/nav.htm?r=${Math.random()}&fid=${encodeURIComponent(fid)}&b=0&l=0&tck=${tck}`;
  const html = await g1Fetch(url, { method: 'GET', referer: ref });
  let page = parseWebForm(html);
  debugPush({ fid, url, html, stage: 'open' });

  if (!page.vs) {
    throw new Error('صفحهٔ فرم گلستان بازگشت نشد (VIEWSTATE خالی) — نشست منقضی است');
  }

  const state = { fid, url, page, ticket: page.ticket || tck };

  if (init) {
    const html0 = await postForm(state, { action: '00' });
    const page0 = parseWebForm(html0);
    debugPush({ fid, url: state.url, html: html0, stage: 'init' });
    if (page0.vs) {
      state.page = page0;
      state.url = resolveFormAction(state.url, page0.formAction) || state.url;
      state.ticket = page0.ticket || state.ticket;
      if (page0.ticket) saveManualSession({ ticket: page0.ticket });
    }
  }
  return state;
}

/**
 * ارسال POST به فرم بازشده
 */
export async function postForm(state, { action = '08', overrides = {}, xmlPri = '', xmlPub = '', xmlMoredi = '' } = {}) {
  const origin = getUniversityOrigin('iust');
  const txtMiddle = buildTxtMiddle(state.page.fields, overrides);
  const body = postBody(state.page, {
    action,
    txtMiddle,
    ticket: state.ticket,
    xmlPri,
    xmlPub,
    xmlMoredi,
  });
  return g1Fetch(resolveFormAction(state.url, state.page.formAction), {
    method: 'POST',
    body,
    referer: `${origin}${state.url}`,
  });
}

/**
 * تجزیهٔ مقادیر XML برچسب‌گذاری شده از فیلد TxtMiddle
 * مثال: <F15201 val="402442018" /><F51801 val="اسفنديار محمدرضا" />
 */
export function parseTxtMiddleXml(htmlOrTxt) {
  let xml = String(htmlOrTxt || '');
  if (xml.includes('name="TxtMiddle"')) {
    const m = xml.match(/name="TxtMiddle"[^>]*value="([^"]*)"/i);
    xml = m
      ? m[1]
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
      : '';
  }
  const dict = {};
  for (const m of xml.matchAll(/<([A-Za-z0-9_]+)\s+val="([^"]*)"/gi)) {
    dict[m[1]] = cleanHtml(m[2]).replace(/\s+/g, ' ').trim();
  }
  return dict;
}

/**
 * تجزیهٔ جدول‌های HTML به {headers, rows}
 */
export function parseHtmlTables(html) {
  const tables = [];
  const tableRe = /<table\b[^>]*>([\s\S]*?)<\/table>/gi;
  let tm;
  while ((tm = tableRe.exec(String(html || '')))) {
    const body = tm[1];
    if (/<table\b/i.test(body)) continue;
    const rowsRaw = [...body.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map((r) => {
      const cells = [...r[1].matchAll(/<(td|th)\b([^>]*)>([\s\S]*?)<\/\1>/gi)].map((c) => ({
        text: cleanHtml(c[3]).replace(/\s+/g, ' ').trim(),
        tag: c[1].toLowerCase(),
        attrs: c[2] || '',
      }));
      return cells;
    });
    const filled = rowsRaw.filter((c) => c.length);
    if (filled.length < 2) continue;
    const first = filled[0];
    const looksHeader =
      first.every((c) => c.tag === 'th') ||
      (first.filter((c) => c.text).length >= 2 && filled.slice(1).some((r) => r.length === first.length));
    const headers = looksHeader ? first.map((c) => c.text) : [];
    const rows = (looksHeader ? filled.slice(1) : filled).map((r) => r.map((c) => c.text));
    tables.push({ headers, rows });
  }
  return tables.filter((t) => t.rows.length);
}

/**
 * تجزیهٔ ساختار گزارش گلستان ۱.۰ از xmlDat و xmlStrc
 */
export function parseGolestanReport(html) {
  const tables = [];

  try {
    const text = String(html || '');
    const datMatch =
      text.match(/xmlDat\s*=\s*'([^']*)'/) ||
      text.match(/xmlDat\s*=\s*"([^"]*)"/) ||
      text.match(/name="xmlDat"[^>]*value="([^"]*)"/i);
    const strcMatch =
      text.match(/xmlStrc\s*=\s*'([^']*)'/) ||
      text.match(/xmlStrc\s*=\s*"([^"]*)"/) ||
      text.match(/name="xmlStrc"[^>]*value="([^"]*)"/i);

    const rawDat = datMatch ? datMatch[1] : '';
    const rawStrc = strcMatch ? strcMatch[1] : '';

    if (rawDat && rawDat !== '<root></root>' && rawDat !== '<Root/>') {
      const headers = [];
      const colMap = [];

      if (rawStrc) {
        const colRegex = /<[^>]+idlable="4"[^>]*>/gi;
        const colNodes = [...rawStrc.matchAll(colRegex)];
        colNodes.forEach((node, idx) => {
          const s = node[0];
          const valM = s.match(/idvalue="([^"]*)"/i);
          const idM = s.match(/\bid="([^"]+)"/i);
          const title = valM ? cleanHtml(valM[1]).trim() : '';
          const key = idM ? idM[1] : `C${idx + 1}`;
          if (title) {
            headers.push(title);
            colMap.push({ key, title });
          }
        });
      }

      const rows = [];
      const rowMatches = [...rawDat.matchAll(/<N\b([^>]+)\/?>/gi)];
      for (const rm of rowMatches) {
        const attrStr = rm[1];
        const attrs = {};
        for (const am of attrStr.matchAll(/([A-Za-z0-9_]+)="([^"]*)"/gi)) {
          attrs[am[1]] = am[2];
        }
        if (colMap.length) {
          const row = colMap.map(({ key }) => cleanHtml(attrs[key] || '').replace(/\s+/g, ' ').trim());
          rows.push(row);
        } else {
          const cKeys = Object.keys(attrs)
            .filter((k) => /^C\d+$/i.test(k))
            .sort((a, b) => parseInt(a.slice(1), 10) - parseInt(b.slice(1), 10));
          if (cKeys.length) {
            rows.push(cKeys.map((k) => cleanHtml(attrs[k] || '').replace(/\s+/g, ' ').trim()));
          }
        }
      }

      if (rows.length) {
        tables.push({ headers, rows });
      }
    }
  } catch (err) {
    console.warn('[parseGolestanReport xml error]', err);
  }

  // اضافه کردن جدول‌های HTML استاندارد
  try {
    const htmlTables = parseHtmlTables(html);
    for (const ht of htmlTables) {
      if (ht.rows.length) tables.push(ht);
    }
  } catch {}

  return tables;
}

/**
 * یافتن ایندکس ستون با نام فارسی
 */
export function columnIndex(headers, patterns, { exclude = [] } = {}) {
  const norm = (s) =>
    String(s || '')
      .replace(/[يى]/g, 'ی')
      .replace(/ك/g, 'ک')
      .replace(/[\u200c\s]+/g, '')
      .trim();
  const cells = (headers || []).map(norm);
  const free = (i) => i >= 0 && !exclude.includes(i);

  for (const p of patterns) {
    const np = norm(p);
    const i = cells.findIndex((c, idx) => c === np && !exclude.includes(idx));
    if (free(i)) return i;
  }
  const byLength = [...patterns].sort((a, b) => norm(b).length - norm(a).length);
  for (const p of byLength) {
    const np = norm(p);
    if (np.length < 3) continue;
    const i = cells.findIndex((c, idx) => c.includes(np) && !exclude.includes(idx));
    if (free(i)) return i;
  }
  return -1;
}

/**
 * فرم ۰;۱۰۱۹۰ (F0546) — دریافت اطلاعات شخصی و تحصیلی دانشجو
 */
export async function fetchStudentInfo() {
  const { html } = await openAndPost('0;10190', { action: '08' });
  const dict = parseTxtMiddleXml(html);

  const fullName = dict.F51801 || '';
  const faculty = dict.F61151 || '';
  const studentId = dict.F15201 || '';
  const nationalCode = dict.F15251 || '';
  const fatherName = dict.F15231 || '';
  const mobile = dict.E00161 || '';
  const email = dict.F20031 || '';
  const birthRaw = dict.F51803 || '';
  const birthDate = (birthRaw.match(/\d{4}\/\d{2}\/\d{2}/) || [])[0] || birthRaw;
  const militaryStatus = dict.F51804 || '';
  const gpa = dict.F63451 || '';

  return {
    fullName: fullName.replace(/\s+/g, ' '),
    faculty,
    major: faculty,
    studentId,
    nationalCode,
    fatherName,
    mobile,
    email,
    birthDate,
    militaryStatus,
    level: 'کارشناسی',
    entryYear: studentId ? studentId.slice(0, 3) : '',
    studentStatus: 'مشغول به تحصیل',
    gpa: gpa || '',
    raw: dict,
  };
}

/**
 * فرم ۰;۱۵۴۵۰ (F1312) — پرداخت‌های الکترونیکی و بدهی دانشجو
 */
export async function fetchFinance() {
  const { html } = await openAndPost('0;15450', { action: '08' });
  const dict = parseTxtMiddleXml(html);

  const debtRial = toNum(dict.F34101) || 0;
  const debtToman = Math.floor(debtRial / 10);
  const statusStr = dict.F51802 || '';
  const termId = dict.E41221 || '4051';
  const termDesc = dict.F57551 || '';

  // تراکنش‌های موجود در T01XML
  const transactions = [];
  const t01Match = html.match(/T01XML\s*=\s*'([^']*)'/i);
  if (t01Match && t01Match[1]) {
    for (const m of t01Match[1].matchAll(/<N\b([^>]+)\/?>/gi)) {
      const attrs = {};
      for (const am of m[1].matchAll(/([A-Za-z0-9_]+)="([^"]*)"/gi)) {
        attrs[am[1]] = am[2];
      }
      transactions.push({
        id: attrs.F0 || '',
        bank: attrs.F4 || '',
        amountRial: toNum(attrs.F6) || 0,
        amountToman: Math.floor((toNum(attrs.F6) || 0) / 10),
        status: attrs.F9 || '',
        date: cleanHtml(attrs.F10 || '').replace(/\s+/g, ' ').trim(),
        termId: attrs.F3 || termId,
      });
    }
  }

  const termsSummary = [
    {
      termId: termId.length === 4 ? termId : termId.slice(-4),
      termDesc,
      totalBillRial: debtRial,
      totalPaidRial: transactions.reduce((s, t) => s + (t.amountRial || 0), 0),
      debtRial,
      debtToman,
      status: debtRial > 0 ? (statusStr || 'بدهکار') : 'تسویه کامل',
    },
  ];

  return {
    finance: {
      totalDebtRial: debtRial,
      totalDebtToman: debtToman,
      status: debtRial > 0 ? (statusStr || 'بدهکار') : 'تسویه کامل',
      termsSummary,
      transactions,
    },
    raw: html,
  };
}

/**
 * ساخت بدنهٔ فیلتر گزارش XmlPriPrm با پارامترهای ارسالی
 */
function buildXmlPriPrm(xmlVarPri, targetTerm) {
  const nMatches = [...String(xmlVarPri || '').matchAll(/<N\b([^>]+)\/?>/gi)];
  if (!nMatches.length) {
    if (targetTerm) {
      return `<Root><N UQID="15" id="43504" F="${targetTerm}" T="${targetTerm}"/></Root>`;
    }
    return '<Root/>';
  }
  const nodes = nMatches.map((m) => {
    const raw = m[1];
    const uqid = (raw.match(/\buqid="([^"]*)"/i) || [])[1] || '15';
    const rawId = (raw.match(/\bid="([^"]*)"/i) || [])[1] || '';
    const id = rawId.length > 5 ? rawId.substr(5, rawId.length - 5) : rawId;
    const f = targetTerm || (raw.match(/\bf="([^"]*)"/i) || [])[1] || '';
    const t = targetTerm || (raw.match(/\bt="([^"]*)"/i) || [])[1] || f;
    return `<N UQID="${uqid}" id="${id}" F="${f}" T="${t}"/>`;
  });
  return `<Root>${nodes.join('')}</Root>`;
}

/**
 * اجرای گزارش گلستان ۱.۰ (F0202_PROCESS_REP_FILTER)
 * گزارش ۷۸: برنامه هفتگی، ۸۸: ثبت‌نام، ۴۲۸: کارت امتحان
 */
export async function runReport(reportId, { term = null } = {}) {
  const fid = `1;${reportId}`;
  const state = await openForm(fid);

  // استخراج ترم پیش‌فرض از فیلتر دریافتی فرم
  const defTerm = (state.page.xmlVarPri.match(/f="(\d{4})"/i) || [])[1] || '4051';
  const targetTerm = term || defTerm;

  // ارسال اکشن 09 جهت پردازش و بازگرداندن داده‌های گزارش
  const xmlPri = buildXmlPriPrm(state.page.xmlVarPri, targetTerm);
  const html = await postForm(state, {
    action: '09',
    xmlPri,
    xmlPub: '<Root/>',
    xmlMoredi: '<Root/>',
  });

  const next = parseWebForm(html);
  if (next.ticket) saveManualSession({ ticket: next.ticket });
  debugPush({ fid, url: `report/${reportId}`, html, stage: 'report' });

  const tables = parseGolestanReport(html);
  return { fid, html, tables, page: next, termId: targetTerm };
}

/**
 * تبدیل ردیف‌های جدول گزارش به دروس سامانه
 */
export function tableToCourses(tables, termId) {
  const courses = [];
  for (const t of tables || []) {
    const used = [];
    const take = (pats) => {
      const i = columnIndex(t.headers, pats, { exclude: used });
      if (i >= 0) used.push(i);
      return i;
    };

    const cCode = take(['كد درس', 'کد درس', 'شماره درس', 'کد']);
    const cName = take(['نام درس', 'عنوان درس', 'عنوان', 'درس']);
    if (cName < 0 && cCode < 0) continue;

    const cExamDate = take(['تاريخ امتحان', 'تاریخ امتحان', 'روز امتحان', 'امتحان']);
    const cExamTime = take(['ساعت امتحان']);
    const cDay = take(['روز', 'يوم', 'روز تشکیل']);
    const cTime = take(['ساعت', 'ساعت تشکیل']);
    const cHall = take(['مکان', 'مكان', 'سالن', 'نشانی', 'آدرس', 'محل تشکیل']);
    const cProf = take(['استاد', 'مدرس', 'استاد مسئول']);
    const cGroup = take(['گروه', 'گروہ']);
    const cUnits = take(['واحدي', 'واحدی', 'واحد', 'تعداد واحد']);
    const cGrade = take(['نمره نهايي', 'نمره نهایی', 'نمره']);
    const cStatus = take(['وضعيت', 'وضعیت', 'وضع', 'وضعیت درس']);

    for (const row of t.rows) {
      const name = String(row[cName] || '').trim();
      const code = String(row[cCode] || '').replace(/[^\d]/g, '');
      if (!name && !code) continue;
      if (name && !/[\u0600-\u06FF]/.test(name) && name.length < 3) continue;

      const days = cDay >= 0 ? [normalizeDayName(row[cDay])].filter(Boolean) : [];
      const realDays = days.filter((d) => d && d !== 'ـ' && /[\u0600-\u06FF]/.test(d));
      const timeRaw = cTime >= 0 ? String(row[cTime] || '') : '';
      const grade = cGrade >= 0 ? String(row[cGrade] || '').trim() : '';

      courses.push({
        id: code ? `${code}_${termId}` : `${name}_${termId}`,
        code: code || '',
        name: normalizeCourseName(name || code),
        group: cGroup >= 0 ? String(row[cGroup] || '').trim() : '',
        units: cUnits >= 0 ? toNum(String(row[cUnits] || '')) || 0 : 0,
        professor: cProf >= 0 ? String(row[cProf] || '').trim() || 'ـ' : 'ـ',
        days: realDays,
        daySlots: realDays.map((day) => ({ day, time: normalizeTimeRange(timeRaw) })),
        time: normalizeTimeRange(timeRaw) || 'ـ',
        hall: cHall >= 0 ? String(row[cHall] || '').trim() || 'ـ' : 'ـ',
        grade: grade || 'ـ',
        examDate: cExamDate >= 0 ? String(row[cExamDate] || '').trim() || 'ـ' : 'ـ',
        examTime: cExamTime >= 0 ? String(row[cExamTime] || '').trim() || 'ـ' : 'ـ',
        termId,
        isLive: true,
        onSchedule: realDays.length > 0,
        regStatus: normalizeRegStatus(cStatus >= 0 ? row[cStatus] : '', {
          onSchedule: realDays.length > 0,
          hasGrade: Boolean(grade && grade !== 'ـ'),
        }),
      });
    }
  }
  return courses;
}

/**
 * تبدیل جدول گزارش ۴۲۸ به امتحانات پایان ترم
 */
export function tableToExams(tables, termId) {
  const exams = [];
  for (const t of tables || []) {
    const used = [];
    const take = (pats) => {
      const i = columnIndex(t.headers, pats, { exclude: used });
      if (i >= 0) used.push(i);
      return i;
    };
    const cName = take(['نام درس', 'عنوان درس', 'درس']);
    const cDate = take(['تاريخ', 'تاریخ', 'روز', 'تاریخ امتحان', 'روز امتحان']);
    const cTime = take(['ساعت', 'ساعت امتحان']);
    const cHall = take(['مکان', 'مكان', 'سالن', 'نشانی', 'صندلی', 'شماره صندلی']);
    const cProf = take(['استاد', 'مدرس']);
    const cCode = take(['كد درس', 'کد درس', 'شماره درس']);
    if (cName < 0 || cDate < 0) continue;

    for (const row of t.rows) {
      const name = String(row[cName] || '').trim();
      const date = String(row[cDate] || '').trim();
      if (!name || !date || date === 'ـ' || !/\d{3,}/.test(date)) continue;
      exams.push({
        id: `${name}_${date}_${row[cTime] || ''}`,
        code: cCode >= 0 ? String(row[cCode] || '').replace(/[^\d]/g, '') : '',
        name: normalizeCourseName(name),
        date,
        time: cTime >= 0 ? normalizeTimeRange(String(row[cTime] || '')) : 'ـ',
        hall: cHall >= 0 ? String(row[cHall] || '').trim() || 'ـ' : 'ـ',
        professor: cProf >= 0 ? String(row[cProf] || '').trim() || 'ـ' : 'ـ',
        termId,
        isLive: true,
      });
    }
  }
  return exams;
}

export function readIustDebug() {
  try {
    return JSON.parse(localStorage.getItem(DEBUG_KEY) || '[]');
  } catch {
    return [];
  }
}

export function clearIustDebug() {
  try {
    localStorage.removeItem(DEBUG_KEY);
  } catch {}
}
