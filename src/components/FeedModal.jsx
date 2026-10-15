import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Calendar, Feather, BookOpen, Megaphone } from 'lucide-react';
import { toFaDigits } from '../utils/faDigits';
import MarkdownView from './MarkdownView';

export default function FeedModal({ post, isOpen, onClose }) {
  const [activePost, setActivePost] = useState(post);

  useEffect(() => {
    if (post) {
      setActivePost(post);
    }
  }, [post]);

  const currentPost = post || activePost;

  const handleAction = () => {
    if (!currentPost?.actionUrl) return;
    if (currentPost.actionUrl.startsWith('http')) {
      window.open(currentPost.actionUrl, '_blank');
    } else if (currentPost.actionUrl.startsWith('sarvestan://')) {
      const target = currentPost.actionUrl.replace('sarvestan://', '');
      window.dispatchEvent(new CustomEvent('sarvShortcut', { detail: target }));
      onClose();
    }
  };

  const getChannelIcon = (channelId) => {
    if (channelId === 'shernameh') return <Feather className="w-4 h-4" />;
    if (channelId === 'announcements') return <Megaphone className="w-4 h-4" />;
    return <BookOpen className="w-4 h-4" />;
  };

  return (
    <AnimatePresence>
      {isOpen && currentPost && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          {/* پس‌زمینه بلورین */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
          />

          {/* محتوای مودال با ترنزیشن نرم */}
          <motion.div
            initial={{ y: '100%', opacity: 0.4 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0.4 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-base border border-base-500/50 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
          >
            {/* دستگیره موبایل */}
            <div className="w-12 h-1.5 rounded-full bg-base-500/60 mx-auto mt-3 sm:hidden" />

            {/* هدر مودال */}
            <div className="p-4 border-b border-base-500/30 flex items-center justify-between gap-3 bg-base-200/40 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-9 h-9 rounded-2xl bg-primary-soft text-primary grid place-items-center shrink-0 shadow-sm">
                  {getChannelIcon(currentPost.channelId)}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {currentPost.badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-primary text-primary-content shrink-0 shadow-xs">
                        {currentPost.badge}
                      </span>
                    )}
                    {currentPost.date && (
                      <span className="text-[11px] text-neutral font-medium flex items-center gap-1 font-mono">
                        <Calendar className="w-3.5 h-3.5" />
                        {toFaDigits(currentPost.date)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-base-500/30 text-neutral hover:text-base-content grid place-items-center transition-colors cursor-pointer"
                aria-label="بستن"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* بدنه خبر با پشتیبانی از مارک‌داون */}
            <div className="p-5 overflow-y-auto space-y-4 no-scrollbar flex-1">
              <h2 className="text-[16px] font-black text-base-content leading-snug">
                {currentPost.title}
              </h2>

              <MarkdownView content={currentPost.content || currentPost.summary} />
            </div>

            {/* فوتر اکشن */}
            {currentPost.actionUrl && (
              <div className="p-3.5 border-t border-base-500/30 bg-base-200/30 flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleAction}
                  className="flex-1 py-2.5 px-4 rounded-2xl bg-primary text-primary-content font-bold text-[12.5px] flex items-center justify-center gap-2 shadow-sm hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <span>{currentPost.actionText || 'مشاهده لینک'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-4 rounded-2xl bg-base-500/25 text-neutral hover:text-base-content font-bold text-[12.5px] active:scale-[0.98] transition-all cursor-pointer"
                >
                  بستن
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
