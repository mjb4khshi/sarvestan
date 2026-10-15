import React from 'react';

/**
 * کامپوننت سبک، بومی و سریع برای رندر کردن مارک‌داون در خبرنامه سروستان
 * پشتیبانی از عناوین، ابیات و نقل‌قول‌ها، لیست‌ها، کلمات برجسته، خطوط جداکننده و پیوندها
 */
export default function MarkdownView({ content, className = '' }) {
  if (!content) return null;

  const lines = String(content).split('\n');
  const elements = [];
  let inList = false;
  let listItems = [];

  const flushList = () => {
    if (inList && listItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="space-y-1.5 my-2.5 pr-4 list-disc list-inside text-[13px] text-base-content/90 leading-relaxed">
          {listItems.map((item, idx) => (
            <li key={idx} className="marker:text-primary">
              {renderInline(item)}
            </li>
          ))}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  const renderInline = (text) => {
    if (!text) return null;

    // تفکیک الگوهای inline: [link](url), **bold**, *italic*, `code`
    const parts = [];
    let remaining = text;
    let keyIdx = 0;

    while (remaining.length > 0) {
      // پیوند: [title](url)
      const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);
      // کلمات بولد: **text**
      const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
      // کد درون‌خطی: `code`
      const codeMatch = remaining.match(/`([^`]+)`/);

      // یافتن نزدیک‌ترین الگو
      const matches = [
        linkMatch ? { type: 'link', match: linkMatch, index: linkMatch.index } : null,
        boldMatch ? { type: 'bold', match: boldMatch, index: boldMatch.index } : null,
        codeMatch ? { type: 'code', match: codeMatch, index: codeMatch.index } : null,
      ].filter(Boolean).sort((a, b) => a.index - b.index);

      if (matches.length === 0) {
        parts.push(<React.Fragment key={keyIdx++}>{remaining}</React.Fragment>);
        break;
      }

      const first = matches[0];
      if (first.index > 0) {
        parts.push(<React.Fragment key={keyIdx++}>{remaining.slice(0, first.index)}</React.Fragment>);
      }

      if (first.type === 'link') {
        const [, title, url] = first.match;
        parts.push(
          <a
            key={keyIdx++}
            href={url}
            target="_blank"
            rel="noreferrer"
            className="text-primary font-bold underline underline-offset-4 hover:brightness-110 cursor-pointer"
          >
            {title}
          </a>
        );
        remaining = remaining.slice(first.index + first.match[0].length);
      } else if (first.type === 'bold') {
        const [, boldText] = first.match;
        parts.push(
          <strong key={keyIdx++} className="font-black text-base-content">
            {boldText}
          </strong>
        );
        remaining = remaining.slice(first.index + first.match[0].length);
      } else if (first.type === 'code') {
        const [, codeText] = first.match;
        parts.push(
          <code key={keyIdx++} className="px-1.5 py-0.5 rounded-md bg-base-500/20 font-mono text-[11.5px] text-primary">
            {codeText}
          </code>
        );
        remaining = remaining.slice(first.index + first.match[0].length);
      }
    }

    return parts;
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      flushList();
      continue;
    }

    // خط جداکننده (Divider)
    if (/^---+$|^===+$/.test(trimmed)) {
      flushList();
      elements.push(
        <hr key={`hr-${i}`} className="my-3.5 border-base-500/25 border-dashed" />
      );
      continue;
    }

    // عناوین
    if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(
        <h4 key={`h4-${i}`} className="text-[14.5px] font-black text-base-content mt-3 mb-1.5">
          {renderInline(trimmed.slice(4))}
        </h4>
      );
      continue;
    }
    if (trimmed.startsWith('## ')) {
      flushList();
      elements.push(
        <h3 key={`h3-${i}`} className="text-[16px] font-black text-base-content mt-3.5 mb-2 pb-1 border-b border-base-500/20">
          {renderInline(trimmed.slice(3))}
        </h3>
      );
      continue;
    }
    if (trimmed.startsWith('# ')) {
      flushList();
      elements.push(
        <h2 key={`h2-${i}`} className="text-[17.5px] font-black text-base-content mt-4 mb-2 pb-1 border-b border-base-500/20">
          {renderInline(trimmed.slice(2))}
        </h2>
      );
      continue;
    }

    // ابیات و نقل‌قول‌ها (Blockquote / Poetry)
    if (trimmed.startsWith('>')) {
      flushList();
      const quoteText = trimmed.replace(/^>\s*/, '');
      elements.push(
        <blockquote
          key={`quote-${i}`}
          className="my-2 p-3 rounded-2xl bg-base-500/15 border-r-4 border-r-primary text-[13px] text-base-content font-medium leading-loose"
        >
          {renderInline(quoteText)}
        </blockquote>
      );
      continue;
    }

    // آیتم‌های لیست
    if (/^[*•-]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)) {
      inList = true;
      const itemText = trimmed.replace(/^[*•-]\s+/, '').replace(/^\d+\.\s+/, '');
      listItems.push(itemText);
      continue;
    }

    // پاراگراف‌های معمولی
    flushList();
    elements.push(
      <p key={`p-${i}`} className="text-[13px] text-base-content/90 leading-relaxed font-medium my-1.5">
        {renderInline(trimmed)}
      </p>
    );
  }

  flushList();

  return <div className={`markdown-body space-y-1 ${className}`}>{elements}</div>;
}
