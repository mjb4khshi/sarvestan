import { motion } from 'framer-motion';
import { Clock, MapPin, Table2 } from 'lucide-react';
import { getScheduleMatrix } from '../data/viewModel';

const cellTone = {
  primary: 'color-wash-primary text-primary border-primary/35',
  success: 'color-wash-success text-success border-success/35',
  info: 'color-wash-info text-info border-info/35',
  warn: 'color-wash-warn text-warn border-warn/35',
  danger: 'color-wash-danger text-danger border-danger/35',
  accent: 'color-wash-accent text-accent border-accent/35',
  secondary: 'color-wash-secondary text-secondary border-secondary/35',
};

export default function TimetableScreen() {
  const { days, slots, cells } = getScheduleMatrix();

  return (
    <div className="pt-4 space-y-4 mobile-pad-bottom">
      <div className="px-4">
        <div className="sarv-card p-4 flex items-center gap-3">
          <span className="w-10 h-10 rounded-[var(--radius-button,0.75rem)] color-wash-info text-info grid place-items-center shrink-0">
            <Table2 className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-[15px] font-bold text-base-content">جدول هفتگی</h2>
            <p className="text-[12px] text-neutral">نمای ماتریسی — برای دیدن همه سلول‌ها افقی اسکرول کن</p>
          </div>
        </div>
      </div>

      <div className="px-4">
        <div
          className="sarv-card overflow-hidden"
          role="region"
          aria-label="جدول برنامه هفتگی"
        >
          <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
            <table className="w-full text-center border-collapse min-w-[720px]">
              <thead>
                <tr className="bg-base-500/30">
                  <th className="sticky right-0 z-10 bg-base-500/70 backdrop-blur px-2 py-3 text-[11px] font-bold text-neutral min-w-[72px] border-b border-base-500/50">
                    ساعت
                  </th>
                  {days.map((d) => (
                    <th
                      key={d}
                      className="px-2 py-3 text-[12px] font-bold text-base-content border-b border-base-500/50 min-w-[120px]"
                    >
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {slots.map((slot, si) => (
                  <tr key={slot} className={si % 2 === 1 ? 'bg-base-500/10' : ''}>
                    <td className="sticky right-0 z-10 bg-base/90 backdrop-blur px-2 py-2 text-[11px] text-neutral font-mono border-b border-base-500/30 whitespace-nowrap">
                      {slot}
                    </td>
                    {days.map((_, di) => {
                      const cell = cells[`${si}-${di}`];
                      return (
                        <td key={di} className="p-1.5 border-b border-base-500/25 align-top">
                          {cell ? (
                            <div
                              className={`rounded-[var(--radius-card,0.875rem)] border px-2 py-2 text-right ${
                                cellTone[cell.color] || cellTone.primary
                              }`}
                            >
                              <p className="text-[11px] font-bold leading-tight text-base-content truncate">
                                {cell.title}
                              </p>
                              <p className="text-[10px] text-neutral mt-1 flex items-center gap-1">
                                <MapPin className="w-3 h-3 shrink-0" />
                                {cell.room}
                              </p>
                              <p className="text-[9px] text-neutral/90 truncate">{cell.professor}</p>
                            </div>
                          ) : (
                            <div className="h-10 rounded-[var(--radius-button,0.75rem)] bg-transparent" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="px-4">
        <p className="text-[11px] text-neutral text-center flex items-center justify-center gap-1">
          <Clock className="w-3 h-3" />
          برای دیدن روزهای کامل، جدول را به چپ/راست بکش
        </p>
      </div>

      {/* لیست روزانه هم مثل قبل حفظ شده */}
      <div className="px-4 pt-2">
        <h3 className="text-[14px] font-bold text-neutral mb-3">خلاصهٔ روزها</h3>
        <div className="space-y-3">
          {days.map((day, di) => {
            const dayCells = Object.entries(cells)
              .filter(([k]) => k.endsWith(`-${di}`))
              .map(([k, v]) => ({ slot: slots[parseInt(k, 10)], ...v }));
            if (!dayCells.length) return null;
            return (
              <motion.article
                key={day}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: di * 0.04 }}
                className="sarv-card p-4"
              >
                <h4 className="text-[14px] font-bold text-primary mb-2">{day}</h4>
                <div className="space-y-2">
                  {dayCells.map((c) => (
                    <div key={`${day}-${c.title}-${c.slot}`} className="flex items-center justify-between gap-2 text-[12px]">
                      <span className="text-base-content font-medium truncate">{c.title}</span>
                      <span className="text-neutral font-mono shrink-0">{c.slot}</span>
                    </div>
                  ))}
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
