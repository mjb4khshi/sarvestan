import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Check,
  Clock,
  Lock,
  X,
  Layers,
  Network,
  GitBranch,
  Layers3,
} from 'lucide-react';
import { toFaDigits, toPersianCourseName } from '../utils/faDigits';
import { normName, computeTopologicalStages } from '../services/curriculumEngine';


/**
 * گروه‌بندی بر اساس سرفصل‌ها و دسته‌بندی موضوعی
 */
function computeCategoryGroups(courses) {
  const order = ['پایه', 'تخصصی', 'مهارتی', 'اختیاری', 'عمومی', 'سایر'];
  const groups = new Map();

  for (const c of courses) {
    const cat = c.category || 'دروس تخصصی';
    let bucket = 'سایر';
    if (/پایه/i.test(cat)) bucket = 'پایه';
    else if (/تخصصی/i.test(cat) && !/اختیاری/i.test(cat)) bucket = 'تخصصی';
    else if (/مهارت|کارگاه|آزمایشگاه/i.test(cat)) bucket = 'مهارتی';
    else if (/اختیاری/i.test(cat)) bucket = 'اختیاری';
    else if (/عمومی|معارف/i.test(cat)) bucket = 'عمومی';

    if (!groups.has(bucket)) groups.set(bucket, []);
    groups.get(bucket).push(c);
  }

  const titles = {
    پایه: 'دروس پایه دانشگاهی',
    تخصصی: 'دروس تخصصی الزامی',
    مهارتی: 'دروس مهارتی و کارگاهی',
    اختیاری: 'دروس تخصصی اختیاری',
    عمومی: 'دروس عمومی و معارف',
    سایر: 'سایر دروس',
  };

  return order
    .filter((k) => groups.has(k) && groups.get(k).length > 0)
    .map((k) => ({
      id: `cat_${k}`,
      title: titles[k] || k,
      desc: `${toFaDigits(groups.get(k).length)} درس`,
      courses: groups.get(k),
    }));
}

export default function CurriculumGraphView({
  allCourses = [],
  categories = [],
  onSelectCourseDetails,
}) {
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [viewFilter, setViewFilter] = useState('all'); // all | current_path | available | locked
  const [columnMode, setColumnMode] = useState('workflow'); // 'workflow' | 'category'

  const [flowLines, setFlowLines] = useState({ prereqLines: [], unlockLines: [], defaultLines: [] });
  const containerRef = useRef(null);
  const cardRefs = useRef({});

  // کلید یکتا برای هر درس
  const getCourseKey = useCallback((c) => c?.code || normName(c?.name || ''), []);

  // مپ سریع تمام دروس
  const courseMap = useMemo(() => {
    const map = new Map();
    for (const c of allCourses) {
      if (!c) continue;
      const k = getCourseKey(c);
      map.set(k, c);
      map.set(normName(c.name || ''), c);
      if (c.code) map.set(String(c.code), c);
    }
    return map;
  }, [allCourses, getCourseKey]);

  // شناسه گره فعال (کلیک‌شده یا هاور شده)
  const activeNodeId = selectedNodeId || hoveredNodeId;

  // درس فعال
  const activeCourse = useMemo(() => {
    if (!activeNodeId) return null;
    return allCourses.find((c) => getCourseKey(c) === activeNodeId) || null;
  }, [activeNodeId, allCourses, getCourseKey]);

  // ردیابی زنجیره پیش‌نیازها و گشودگی‌ها برای درس فعال
  const relationData = useMemo(() => {
    if (!activeCourse) {
      return { prereqKeys: new Set(), unlockKeys: new Set() };
    }

    const prereqKeys = new Set();
    const unlockKeys = new Set();

    // ۱. پیش‌نیازهای مستقیم این درس در داخل چارت
    for (const p of activeCourse.prerequisites || []) {
      const pKey = p.code || normName(p.name || '');
      const matched = courseMap.get(pKey);
      if (matched) {
        prereqKeys.add(getCourseKey(matched));
      }
    }

    // ۲. دروسی که این درس پیش‌نیاز آن‌هاست (Unlocks)
    const thisNorm = normName(activeCourse.name || '');
    const thisCode = activeCourse.code ? String(activeCourse.code) : null;

    for (const c of allCourses) {
      if (c === activeCourse) continue;
      const hasThisAsPrereq =
        (c.prerequisites || []).some((p) => {
          const pNorm = normName(p.name || '');
          const pCode = p.code ? String(p.code) : null;
          return (
            (thisCode && pCode && thisCode === pCode) ||
            pNorm === thisNorm ||
            pNorm.includes(thisNorm) ||
            thisNorm.includes(pNorm)
          );
        }) ||
        (activeCourse.unlocks || []).some((u) => {
          const uCode = u.code ? String(u.code) : null;
          const uNorm = normName(u.name || '');
          const cCode = c.code ? String(c.code) : null;
          const cNorm = normName(c.name || '');
          return (
            (uCode && cCode && uCode === cCode) ||
            (uNorm && cNorm && (uNorm === cNorm || cNorm.includes(uNorm) || uNorm.includes(cNorm)))
          );
        });

      if (hasThisAsPrereq) {
        unlockKeys.add(getCourseKey(c));
      }
    }

    return { prereqKeys, unlockKeys };
  }, [activeCourse, allCourses, courseMap, getCourseKey]);

  // ستون‌ها بر اساس حالت انتخابی (ورک‌فلو یا دسته‌بندی موضوعی) بدون هیچ ترم‌بندی مصنوعی
  const columns = useMemo(() => {
    const rawCols =
      columnMode === 'workflow'
        ? computeTopologicalStages(allCourses, courseMap)
        : computeCategoryGroups(allCourses);

    return rawCols.map((col) => {
      const courses = (col.courses || []).filter((c) => {
        if (viewFilter === 'available') return c.status === 'available';
        if (viewFilter === 'locked') return c.status === 'locked';
        if (viewFilter === 'current_path') return c.status === 'enrolled' || c.status === 'available';
        return true;
      });
      return { ...col, courses };
    });
  }, [columnMode, allCourses, courseMap, viewFilter]);

  // محاسبه خطوط جریان بر اساس موقعیت مکانی DOM کارت‌ها درون کانتینر
  const updateFlowLines = useCallback(() => {
    if (!containerRef.current) {
      setFlowLines({ prereqLines: [], unlockLines: [], defaultLines: [] });
      return;
    }

    const containerEl = containerRef.current;
    const containerRect = containerEl.getBoundingClientRect();

    // محاسبه پورت‌های عمودی جهت جلوگیری قطعی از همپوشانی خطوط و فلش‌ها
    const getPortFraction = (index, total) => {
      if (total <= 1) return 0.5;
      if (total === 2) return index === 0 ? 0.35 : 0.65;
      if (total === 3) return index === 0 ? 0.25 : index === 1 ? 0.5 : 0.75;
      return 0.2 + (0.6 * index) / (total - 1);
    };

    // تابع ترسیم مسیر Bezier منحنی جریان با انحنای طبیعی و درگاه‌های تفکیک‌شده
    const makeBezierPath = (sourceRect, targetRect, sourcePort = 0.5, targetPort = 0.5) => {
      const isSourceRight = sourceRect.left > targetRect.right - 10;
      const isSourceLeft = sourceRect.right < targetRect.left + 10;

      let x1, y1, x2, y2;

      if (isSourceRight) {
        // جریان راست‌به‌چپ (استاندارد RTL فارسی)
        x1 = sourceRect.left - containerRect.left;
        y1 = sourceRect.top - containerRect.top + sourceRect.height * sourcePort;
        x2 = targetRect.right - containerRect.left;
        y2 = targetRect.top - containerRect.top + targetRect.height * targetPort;
      } else if (isSourceLeft) {
        // جریان چپ‌به‌راست (LTR)
        x1 = sourceRect.right - containerRect.left;
        y1 = sourceRect.top - containerRect.top + sourceRect.height * sourcePort;
        x2 = targetRect.left - containerRect.left;
        y2 = targetRect.top - containerRect.top + targetRect.height * targetPort;
      } else {
        // در یک ستون یکسان
        x1 = sourceRect.left - containerRect.left + sourceRect.width * (0.3 + 0.4 * sourcePort);
        x2 = targetRect.left - containerRect.left + targetRect.width * (0.3 + 0.4 * targetPort);
        if (sourceRect.top < targetRect.top) {
          y1 = sourceRect.bottom - containerRect.top;
          y2 = targetRect.top - containerRect.top;
        } else {
          y1 = sourceRect.top - containerRect.top;
          y2 = targetRect.bottom - containerRect.top;
        }
        return `M ${x1} ${y1} C ${x1} ${y1 + (y2 - y1) * 0.4}, ${x2} ${y2 - (y2 - y1) * 0.4}, ${x2} ${y2}`;
      }

      // انحنای نرم و بدون شکستگی با امتداد افقی در مبدأ و مقصد
      const dx = (x2 - x1) * 0.45;
      return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
    };

    // اگر گرهی در حالت فعال باشد، فقط جریان شفاف همان گره بدون شلوغی پس‌زمینه نمایش می‌یابد
    if (activeNodeId) {
      const activeEl = cardRefs.current[activeNodeId];
      if (!activeEl) {
        setFlowLines({ prereqLines: [], unlockLines: [], defaultLines: [] });
        return;
      }

      const activeRect = activeEl.getBoundingClientRect();

      // ۱. خطوط از پیش‌نیازها به درس فعال (کهربایی)
      // مرتب‌سازی بر اساس مختصات Y مبدأ تا هیچ خطی دیگری را قطع نکند
      const validPrereqs = [];
      for (const pKey of relationData.prereqKeys) {
        const pEl = cardRefs.current[pKey];
        if (pEl) {
          const pRect = pEl.getBoundingClientRect();
          validPrereqs.push({
            key: pKey,
            rect: pRect,
            centerY: pRect.top + pRect.height / 2,
          });
        }
      }
      validPrereqs.sort((a, b) => a.centerY - b.centerY);

      const pLines = validPrereqs.map((pr, idx) => {
        const targetPort = getPortFraction(idx, validPrereqs.length);
        return {
          id: `${pr.key}->${activeNodeId}`,
          path: makeBezierPath(pr.rect, activeRect, 0.5, targetPort),
        };
      });

      // ۲. خطوط از درس فعال به دروس بازگشایی‌شونده (زمردی)
      // مرتب‌سازی بر اساس مختصات Y مقصد تا پورت‌های خروجی موازی و منظم خارج شوند
      const validUnlocks = [];
      for (const uKey of relationData.unlockKeys) {
        const uEl = cardRefs.current[uKey];
        if (uEl) {
          const uRect = uEl.getBoundingClientRect();
          validUnlocks.push({
            key: uKey,
            rect: uRect,
            centerY: uRect.top + uRect.height / 2,
          });
        }
      }
      validUnlocks.sort((a, b) => a.centerY - b.centerY);

      const uLines = validUnlocks.map((un, idx) => {
        const sourcePort = getPortFraction(idx, validUnlocks.length);
        return {
          id: `${activeNodeId}->${un.key}`,
          path: makeBezierPath(activeRect, un.rect, sourcePort, 0.5),
        };
      });

      // در حالت فوکوس، خطوط پس‌زمینه محو می‌شوند تا فقط مسیر مرتبط بدرخشد
      setFlowLines({ prereqLines: pLines, unlockLines: uLines, defaultLines: [] });
      return;
    }

    // خطوط پیش‌فرض ارتباطی بین دروس چارت (تنها زنجیره‌های تمیز بین مراحل مجاور بدون درهم‌تنیدگی)
    const defLines = [];
    const sourceUsage = new Map();
    const targetUsage = new Map();
    const pendingConnections = [];

    // ایجاد ارتباط فقط بین مراحل متوالی
    for (let colIdx = 0; colIdx < columns.length - 1; colIdx++) {
      const fromCourses = columns[colIdx].courses || [];
      const toCourses = columns[colIdx + 1]?.courses || [];
      const fromKeySet = new Set(fromCourses.map((c) => getCourseKey(c)));

      for (const toC of toCourses) {
        const toKey = getCourseKey(toC);
        const toEl = cardRefs.current[toKey];
        if (!toEl) continue;

        // یافتن اولین پیش‌نیاز مستقیم که در مرحله قبل وجود دارد
        for (const p of toC.prerequisites || []) {
          const pKey = p.code || normName(p.name || '');
          const parent = courseMap.get(pKey);
          if (!parent) continue;
          const parentKey = getCourseKey(parent);
          if (!fromKeySet.has(parentKey)) continue;

          const pEl = cardRefs.current[parentKey];
          if (!pEl) continue;

          pendingConnections.push({
            fromKey: parentKey,
            toKey: toKey,
            fromRect: pEl.getBoundingClientRect(),
            toRect: toEl.getBoundingClientRect(),
          });

          sourceUsage.set(parentKey, (sourceUsage.get(parentKey) || 0) + 1);
          targetUsage.set(toKey, (targetUsage.get(toKey) || 0) + 1);
          break; // حداکثر ۱ اتصال ورودی تمیز برای هر درس
        }

        if (pendingConnections.length >= 16) break;
      }
      if (pendingConnections.length >= 16) break;
    }

    const sourceCurrent = new Map();
    const targetCurrent = new Map();

    for (const conn of pendingConnections) {
      const srcTotal = sourceUsage.get(conn.fromKey) || 1;
      const srcIdx = sourceCurrent.get(conn.fromKey) || 0;
      sourceCurrent.set(conn.fromKey, srcIdx + 1);

      const tgtTotal = targetUsage.get(conn.toKey) || 1;
      const tgtIdx = targetCurrent.get(conn.toKey) || 0;
      targetCurrent.set(conn.toKey, tgtIdx + 1);

      const srcPort = getPortFraction(srcIdx, srcTotal);
      const tgtPort = getPortFraction(tgtIdx, tgtTotal);

      defLines.push({
        id: `def_${conn.fromKey}->${conn.toKey}`,
        path: makeBezierPath(conn.fromRect, conn.toRect, srcPort, tgtPort),
      });
    }

    setFlowLines({ prereqLines: [], unlockLines: [], defaultLines: defLines });
  }, [activeNodeId, relationData, allCourses, courseMap, columns, getCourseKey]);

  // به‌روزرسانی خطوط در تغییر وضعیت و تغییر اندازه صفحه
  useEffect(() => {
    updateFlowLines();
    const timer = setTimeout(updateFlowLines, 60);
    window.addEventListener('resize', updateFlowLines);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateFlowLines);
    };
  }, [updateFlowLines, columns]);

  return (
    <div className="space-y-3">
      {/* راهنما و فیلترهای سریع گراف */}
      <div className="sarv-card p-3 space-y-2.5 border border-base-500/30">
        <div className="flex items-center justify-between gap-2 flex-wrap text-[11px]">
          {/* انتخاب حالت چیدمان ستون‌ها (ورک‌فلو یا دسته‌بندی موضوعی) */}
          <div className="flex items-center gap-1 p-0.5 rounded-xl bg-base-500/25 border border-base-500/30">
            <button
              type="button"
              onClick={() => setColumnMode('workflow')}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                columnMode === 'workflow'
                  ? 'bg-primary text-primary-content shadow-xs'
                  : 'text-neutral hover:text-base-content'
              }`}
            >
              <GitBranch className="w-3 h-3" />
              <span>مراحل زنجیره پیش‌نیاز</span>
            </button>
            <button
              type="button"
              onClick={() => setColumnMode('category')}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                columnMode === 'category'
                  ? 'bg-primary text-primary-content shadow-xs'
                  : 'text-neutral hover:text-base-content'
              }`}
            >
              <Layers3 className="w-3 h-3" />
              <span>دسته‌بندی موضوعی</span>
            </button>
          </div>

          {/* فیلترهای وضعیت دروس */}
          <div className="flex items-center gap-1 bg-base-500/20 p-1 rounded-xl">
            {[
              { id: 'all', label: 'همه' },
              { id: 'current_path', label: 'جاری و مجاز' },
              { id: 'available', label: 'مجاز ⭐' },
              { id: 'locked', label: 'قفل 🔒' },
            ].map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => setViewFilter(btn.id)}
                className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  viewFilter === btn.id
                    ? 'bg-accent text-accent-content shadow-2xs'
                    : 'text-neutral hover:text-base-content'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* نوار راهنما و علائم */}
        <div className="flex items-center justify-between text-[10px] text-neutral flex-wrap gap-2 pt-1 border-t border-base-500/20">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-amber-500 font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
              پیش‌نیاز (ورودی)
            </span>
            <span className="flex items-center gap-1 text-emerald-500 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              بازگشایی‌شونده (خروجی)
            </span>
          </div>
          <span className="text-neutral">
            روی هر درس کلیک کنید تا جریان روابط آن روشن شود
          </span>
        </div>

        {/* نوار فوکوس روی درس فعال */}
        <AnimatePresence>
          {activeCourse && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden pt-2 border-t border-base-500/20"
            >
              <div className="p-2.5 rounded-xl bg-base/80 border border-primary/30 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary animate-ping shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[12px] font-black text-base-content truncate">
                      {toPersianCourseName(activeCourse.name)}
                      <span className="text-neutral font-medium mr-1.5">
                        ({toFaDigits(activeCourse.units)} واحد · {activeCourse.category})
                      </span>
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-neutral mt-0.5 flex-wrap">
                      <span className="text-amber-500 font-black flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-500 inline-block animate-pulse" />
                        ⬅ {toFaDigits(relationData.prereqKeys.size)} درس پیش‌نیاز
                      </span>
                      <span>·</span>
                      <span className="text-emerald-500 font-black flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                        ➡ {toFaDigits(relationData.unlockKeys.size)} درس بازگشایی‌شونده
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onSelectCourseDetails(activeCourse)}
                    className="px-2.5 py-1 rounded-lg bg-primary text-primary-content text-[11px] font-bold shadow-2xs cursor-pointer"
                  >
                    مشاهده جزئیات
                  </button>
                  {selectedNodeId && (
                    <button
                      type="button"
                      onClick={() => setSelectedNodeId(null)}
                      className="p-1 rounded-lg bg-base-500/25 text-neutral hover:text-base-content cursor-pointer"
                      title="لغو انتخاب"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ستون‌های جریان ورک‌فلو با خطوط متصل پیوسته */}
      <div className="overflow-x-auto pb-4 pt-1 no-scrollbar">
        <div ref={containerRef} className="relative flex gap-3 min-w-[880px]">
          {/* لایهٔ خطوط جریان ورک‌فلو با انیمیشن زنده و سرپیکان فلش */}
          <svg
            className="absolute inset-0 pointer-events-none w-full h-full overflow-visible z-15"
            style={{ minHeight: '100%' }}
          >
            <defs>
              <style>{`
                @keyframes flowDashAnim {
                  from { stroke-dashoffset: 24; }
                  to { stroke-dashoffset: 0; }
                }
                .flow-line-default {
                  stroke: var(--color-base-content, #64748b);
                  stroke-width: 1.5;
                  stroke-opacity: 0.22;
                  stroke-dasharray: 4 3;
                }
                .flow-line-prereq {
                  stroke: #f59e0b;
                  stroke-width: 2.6;
                  stroke-dasharray: 6 4;
                  animation: flowDashAnim 0.75s linear infinite;
                  filter: drop-shadow(0 0 4px rgba(245, 158, 11, 0.6));
                }
                .flow-line-unlock {
                  stroke: #10b981;
                  stroke-width: 2.6;
                  stroke-dasharray: 6 4;
                  animation: flowDashAnim 0.75s linear infinite;
                  filter: drop-shadow(0 0 4px rgba(16, 185, 129, 0.6));
                }
              `}</style>

              <marker
                id="flow-arrow-default"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto"
              >
                <path d="M 0 2 L 7 5 L 0 8 z" fill="currentColor" opacity="0.3" />
              </marker>

              <marker
                id="flow-arrow-prereq"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f59e0b" />
              </marker>

              <marker
                id="flow-arrow-unlock"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#10b981" />
              </marker>
            </defs>

            {/* خطوط زمینه پیش‌فرض اتصال بین دروس مرتبط (برای ایجاد حس گرافیک ورک‌فلو) */}
            {flowLines.defaultLines.map((l) => (
              <path
                key={l.id}
                d={l.path}
                className="flow-line-default"
                fill="none"
                style={{ opacity: activeNodeId ? 0.08 : 0.28 }}
                markerEnd="url(#flow-arrow-default)"
              />
            ))}

            {/* خطوط پیش‌نیاز به کارت فعال */}
            {flowLines.prereqLines.map((l) => (
              <path
                key={l.id}
                d={l.path}
                className="flow-line-prereq"
                fill="none"
                markerEnd="url(#flow-arrow-prereq)"
              />
            ))}

            {/* خطوط از کارت فعال به کارت‌های بازگشایی‌شونده */}
            {flowLines.unlockLines.map((l) => (
              <path
                key={l.id}
                d={l.path}
                className="flow-line-unlock"
                fill="none"
                markerEnd="url(#flow-arrow-unlock)"
              />
            ))}
          </svg>

          {columns.map((col) => (
            <div
              key={col.id}
              className="flex-1 min-w-[170px] flex flex-col gap-2 p-2.5 rounded-2xl bg-base-500/10 border border-base-500/20 z-10"
            >
              {/* هدر ستون جریان */}
              <div className="pb-1.5 border-b border-base-500/25 text-right">
                <span className="text-[11.5px] font-black text-base-content block">
                  {col.title}
                </span>
                <span className="text-[9.5px] text-neutral block mt-0.5">
                  {col.desc}
                </span>
              </div>

              {/* کارت‌های دروس در این مرحله */}
              <div className="flex flex-col gap-1.5 flex-1">
                {col.courses.map((course) => {
                  const cKey = getCourseKey(course);
                  const isSelected = selectedNodeId === cKey;
                  const isActive = activeNodeId === cKey;
                  const isPrereq = relationData.prereqKeys.has(cKey);
                  const isUnlock = relationData.unlockKeys.has(cKey);

                  const isDimmed =
                    activeCourse != null && !isActive && !isPrereq && !isUnlock;

                  return (
                    <motion.button
                      key={cKey}
                      ref={(el) => {
                        if (el) cardRefs.current[cKey] = el;
                        else delete cardRefs.current[cKey];
                      }}
                      type="button"
                      onMouseEnter={() => setHoveredNodeId(cKey)}
                      onMouseLeave={() => setHoveredNodeId(null)}
                      onClick={() => {
                        setSelectedNodeId(isSelected ? null : cKey);
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`relative p-2.5 rounded-xl text-right transition-all flex flex-col justify-between gap-1 border cursor-pointer ${
                        isActive
                          ? 'bg-primary/20 border-primary shadow-md ring-2 ring-primary/40 z-20 scale-[1.01]'
                          : isPrereq
                          ? 'bg-amber-500/15 border-amber-500 shadow-sm ring-1 ring-amber-500/40 z-20'
                          : isUnlock
                          ? 'bg-emerald-500/15 border-emerald-500 shadow-sm ring-1 ring-emerald-500/40 z-20'
                          : course.status === 'passed'
                          ? 'bg-success-soft/20 border-success/30 hover:border-success/60'
                          : course.status === 'enrolled'
                          ? 'bg-accent-soft/25 border-accent/40 hover:border-accent'
                          : course.status === 'available'
                          ? 'bg-warning-soft/30 border-warning/45 hover:border-warning'
                          : 'bg-base-500/15 border-base-500/25 hover:border-base-500/45'
                      } ${isDimmed ? 'opacity-35 grayscale-[50%]' : 'opacity-100'}`}
                    >
                      {/* نام درس و واحد */}
                      <div className="flex items-start justify-between gap-1 w-full">
                        <span className="text-[11.5px] font-black text-base-content line-clamp-2 leading-tight">
                          {toPersianCourseName(course.name)}
                        </span>
                        <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-md bg-base-500/25 text-neutral shrink-0">
                          {toFaDigits(course.units)} و
                        </span>
                      </div>

                      {/* نشانگر وضعیت و گشودگی */}
                      <div className="flex items-center justify-between gap-1 pt-1 border-t border-base-500/15 text-[10px] w-full">
                        <span
                          className={`font-bold flex items-center gap-0.5 ${
                            course.status === 'passed'
                              ? 'text-success'
                              : course.status === 'enrolled'
                              ? 'text-accent'
                              : course.status === 'available'
                              ? 'text-warning'
                              : 'text-neutral'
                          }`}
                        >
                          {course.status === 'passed' && (
                            <>
                              <Check className="w-2.5 h-2.5" />
                              <span>{course.gradeDisplay || 'قبول'}</span>
                            </>
                          )}
                          {course.status === 'enrolled' && (
                            <>
                              <Clock className="w-2.5 h-2.5" />
                              <span>در حال اخذ</span>
                            </>
                          )}
                          {course.status === 'available' && (
                            <>
                              <Sparkles className="w-2.5 h-2.5 text-warning" />
                              <span>مجاز ⭐</span>
                            </>
                          )}
                          {course.status === 'locked' && (
                            <>
                              <Lock className="w-2.5 h-2.5" />
                              <span>قفل</span>
                            </>
                          )}
                        </span>

                        {/* تعداد دروس وابسته */}
                        <div className="flex items-center gap-1 text-[9px] text-neutral font-bold">
                          {course.prerequisites?.length > 0 && (
                            <span title="تعداد پیش‌نیازها">
                              ⬅ {toFaDigits(course.prerequisites.length)}
                            </span>
                          )}
                          {course.unlocks?.filter((u) => u.inCurriculum)?.length > 0 && (
                            <span title="تعداد دروس بازشونده" className="text-emerald-500">
                              ⚡ {toFaDigits(course.unlocks.filter((u) => u.inCurriculum).length)}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
