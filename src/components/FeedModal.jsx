import { X, ExternalLink, Calendar, Megaphone } from 'lucide-react';
import { toFaDigits } from '../utils/faDigits';
import MarkdownView from './MarkdownView';

export default function FeedModal({ post, isOpen, onClose }) {
  if (!isOpen || !post) return null;

  const handleAction = () => {
    if (!post.actionUrl) return;
    if (post.actionUrl.startsWith('http')) {
      window.open(post.actionUrl, '_blank');
    } else if (post.actionUrl.startsWith('sarvestan://')) {
      const target = post.actionUrl.replace('sarvestan://', '');
      window.dispatchEvent(new CustomEvent('sarvShortcut', { detail: target }));
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-base rounded-3xl border border-base-500/30 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
      >
        {/* هدر مودال */}
        <div className="p-4 border-b border-base-500/20 flex items-center justify-between gap-3 bg-base-200/50">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-8 h-8 rounded-xl bg-primary-soft text-primary grid place-items-center shrink-0">
              <Megaphone className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {post.badge && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary text-primary-content shrink-0">
                    {post.badge}
                  </span>
                )}
                {post.date && (
                  <span className="text-[10.5px] text-neutral font-medium flex items-center gap-1 font-mono">
                    <Calendar className="w-3 h-3" />
                    {toFaDigits(post.date)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-base-500/20 text-neutral hover:text-base-content grid place-items-center cursor-pointer transition-colors"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* بدنه خبر با پشتیبانی از مارک‌داون */}
        <div className="p-5 overflow-y-auto space-y-4">
          <h2 className="text-[16px] font-black text-base-content leading-tight">
            {post.title}
          </h2>

          <MarkdownView content={post.content || post.summary} />
        </div>

        {/* فوتر اکشن */}
        {post.actionUrl && (
          <div className="p-4 border-t border-base-500/20 bg-base-200/30 flex gap-2">
            <button
              type="button"
              onClick={handleAction}
              className="flex-1 py-3 px-4 rounded-2xl bg-primary text-primary-content font-bold text-[13px] flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all cursor-pointer"
            >
              <span>{post.actionText || 'مشاهده لینک'}</span>
              <ExternalLink className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-4 rounded-2xl bg-base-500/20 text-neutral hover:text-base-content font-bold text-[13px] cursor-pointer"
            >
              بستن
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
