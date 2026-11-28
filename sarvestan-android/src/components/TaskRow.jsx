import { CheckCircle2, Circle, Trash2, Calendar, Clock, Repeat, Play } from 'lucide-react';
import { toFaDigits } from '../utils/faDigits';

const PRIORITY_META = {
  high: { label: 'فوری', cls: 'bg-danger-soft text-danger' },
  medium: { label: 'متوسط', cls: 'bg-warn-soft text-warn' },
  low: { label: 'عادی', cls: 'bg-base-500/25 text-neutral' },
};

const TONE_DOT = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  accent: 'bg-accent',
  info: 'bg-info',
  success: 'bg-success',
  warn: 'bg-warn',
  danger: 'bg-danger',
};

export default function TaskRow({
  task,
  onToggleDone,
  onDelete,
  onOpen,
  onStartTimer,
  compact = false,
}) {
  if (!task) return null;
  const isDone = task.status === 'done';
  const prio = PRIORITY_META[task.priority] || PRIORITY_META.medium;
  const dotCls = TONE_DOT[task.color] || TONE_DOT.primary;
  const hasDeadline = Boolean(task.dateStr);
  const hasScheduled = Boolean(task.scheduledDateStr && task.scheduledDateStr !== task.dateStr);

  return (
    <div
      className={`group flex items-center gap-2.5 rounded-2xl border transition-all ${
        compact ? 'p-2.5' : 'p-3'
      } ${
        isDone
          ? 'bg-base-500/10 border-base-500/20 opacity-65'
          : 'bg-base-500/15 border-base-500/30 hover:border-primary/40'
      }`}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleDone?.(task);
        }}
        className="shrink-0 text-primary hover:scale-110 transition-transform cursor-pointer"
        aria-label={isDone ? 'لغو تکمیل' : 'تکمیل کار'}
      >
        {isDone ? (
          <CheckCircle2 className="w-5 h-5 text-success" />
        ) : (
          <Circle className="w-5 h-5 text-neutral hover:text-primary" />
        )}
      </button>

      <div
        onClick={() => onOpen?.(task)}
        className={`flex-1 min-w-0 text-right ${onOpen ? 'cursor-pointer' : ''}`}
      >
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`w-2 h-2 rounded-full shrink-0 ${dotCls}`} />
          <p
            className={`text-[12.5px] font-bold truncate ${
              isDone ? 'line-through text-neutral' : 'text-base-content'
            }`}
          >
            {task.title}
          </p>
          {task.recurrence === 'weekly' && (
            <span className="inline-flex items-center gap-0.5 text-[9.5px] font-bold px-1.5 py-0.5 rounded-md bg-info-soft text-info shrink-0">
              <Repeat className="w-2.5 h-2.5" />
              هفتگی
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap mt-1 text-[10px] text-neutral">
          {task.courseName && (
            <span className="px-1.5 py-0.5 rounded-md bg-base-500/30 text-base-content font-medium truncate max-w-[140px]">
              {task.courseName}
            </span>
          )}
          <span className={`px-1.5 py-0.5 rounded-md font-bold ${prio.cls}`}>{prio.label}</span>
          {hasScheduled && (
            <span className="inline-flex items-center gap-0.5 text-primary font-bold">
              <Clock className="w-2.5 h-2.5" />
              انجام: {toFaDigits(task.scheduledDateStr)}
            </span>
          )}
          {hasDeadline ? (
            <span className="inline-flex items-center gap-0.5">
              <Calendar className="w-2.5 h-2.5" />
              {hasScheduled ? 'ددلاین: ' : ''}
              {toFaDigits(task.dateStr)}
              {task.timeStr ? ` · ${toFaDigits(task.timeStr)}` : ''}
            </span>
          ) : (
            <span className="text-neutral/80">بی‌تاریخ (صندوق ورودی)</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {!isDone && onStartTimer && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onStartTimer(task);
            }}
            className="w-7 h-7 rounded-xl bg-primary-soft text-primary hover:bg-primary hover:text-primary-content grid place-items-center transition cursor-pointer"
            title="شروع تایمر برای این کار"
          >
            <Play className="w-3.5 h-3.5" />
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task);
            }}
            className="w-7 h-7 rounded-xl bg-danger-soft/70 text-danger hover:bg-danger hover:text-danger-content grid place-items-center transition cursor-pointer opacity-80 group-hover:opacity-100"
            title="حذف کار"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
