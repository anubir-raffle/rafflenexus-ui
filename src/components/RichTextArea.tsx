import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import { CharCount, CopyButton, FieldShell, useFieldA11y, useFieldId, type FieldBaseProps } from './Field';
import { Icon } from './Icon';
import { cx } from '../utils';

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/** The tags a rich text value may hold. Everything else is unwrapped to its text; every attribute is dropped. */
const KEEP: Record<string, string> = { P: 'p', BR: 'br', STRONG: 'strong', B: 'strong', EM: 'em', I: 'em', UL: 'ul', OL: 'ol', LI: 'li', DIV: 'p' };

/**
 * Cleans rich text down to paragraphs, line breaks, bold, italic and lists (p, br, strong, em, ul, ol, li), with no
 * attributes. Use it on anything you render with dangerouslySetInnerHTML. Without a DOM (server rendering) it returns
 * the text with every tag removed.
 */
export function sanitizeRichText(html: string | null | undefined): string {
  if (!html) return '';
  if (typeof document === 'undefined') return html.replace(/<[^>]*>/g, '');
  const src = document.createElement('template');
  src.innerHTML = html;
  const out = document.createElement('div');
  const walk = (from: Node, to: Node) => {
    from.childNodes.forEach((n) => {
      if (n.nodeType === 3) { to.appendChild(document.createTextNode(n.textContent ?? '')); return; }
      if (n.nodeType !== 1) return;
      const tag = KEEP[(n as Element).tagName];
      if (!tag) { walk(n, to); return; }
      const el = document.createElement(tag);
      to.appendChild(el);
      if (tag !== 'br') walk(n, el);
    });
  };
  walk(src.content, out);
  // An editor left with only an empty paragraph or a lone line break is empty.
  return out.textContent?.trim() ? out.innerHTML : '';
}

/** The number of characters a rich text value holds, as people count them (the text, not the tags). */
export function richTextLength(html: string | null | undefined): number {
  return richTextToPlain(html).length;
}

/** Rich text as plain text: paragraphs and list items on their own lines. For copying, counting and previews. */
export function richTextToPlain(html: string | null | undefined): string {
  const clean = sanitizeRichText(html);
  if (!clean || typeof document === 'undefined') return clean;
  const box = document.createElement('div');
  box.innerHTML = clean.replace(/<br>/g, '\n').replace(/<\/(p|li)>/g, '</$1>\n');
  return (box.textContent ?? '').replace(/\n+$/, '');
}

export interface RichTextProps {
  /** A rich text value (from RichTextArea). It's cleaned before it's shown. */
  html?: string | null;
  className?: string;
  style?: CSSProperties;
  as?: 'div' | 'section' | 'article';
}

/** Shows a rich text value: cleaned, then styled with the design system's spacing for paragraphs and lists. */
export function RichText({ html, className, style, as: Tag = 'div' }: RichTextProps) {
  return <Tag className={cx('rnc-richtext', className)} style={style} dangerouslySetInnerHTML={{ __html: sanitizeRichText(html) }} />;
}

type Format = 'bold' | 'italic' | 'insertUnorderedList' | 'insertOrderedList';
const TOOLS: { cmd: Format; label: string; icon: 'text-b' | 'text-italic' | 'list-bullets' | 'list-numbers'; keys: string }[] = [
  { cmd: 'bold', label: 'Bold', icon: 'text-b', keys: 'Ctrl+B' },
  { cmd: 'italic', label: 'Italic', icon: 'text-italic', keys: 'Ctrl+I' },
  { cmd: 'insertUnorderedList', label: 'Bulleted list', icon: 'list-bullets', keys: 'Ctrl+Shift+8' },
  { cmd: 'insertOrderedList', label: 'Numbered list', icon: 'list-numbers', keys: 'Ctrl+Shift+7' },
];

export interface RichTextAreaProps extends FieldBaseProps {
  /** The value as HTML (p, strong, em, ul, ol, li, br). */
  value?: string | null;
  /** Called with the cleaned HTML ('' when empty). */
  onChange?: (html: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  /** The most characters allowed, counted on the text (not the tags). Shows how many are left. */
  maxLength?: number;
  showCount?: boolean;
  placeholder?: string;
  disabled?: boolean;
  /** The box's starting height. Default 180px; people can drag it taller. */
  minHeight?: number | string;
  id?: string;
  className?: string;
  /** Names the formatting toolbar for screen readers. Default "Formatting". */
  toolbarLabel?: string;
}

/**
 * A larger text box with basic formatting: bold, italic, bulleted and numbered lists. The value is clean HTML; show it
 * with `<RichText html={value} />`. Pasted text comes in as plain text. With `maxLength` it counts the characters left
 * and stops at the limit; with `review` it's read-only with a Copy button (copies the text).
 */
export function RichTextArea({
  label, hint, error, optional, review, value, onChange, onBlur, onFocus, maxLength, showCount = true, placeholder, disabled,
  minHeight, id, className, toolbarLabel = 'Formatting',
}: RichTextAreaProps) {
  const fid = useFieldId(id);
  const box = useRef<HTMLDivElement>(null);
  const last = useRef<string>('');
  const [active, setActive] = useState<Partial<Record<Format, boolean>>>({});
  const [length, setLength] = useState(() => richTextLength(value));
  const locked = disabled || review;
  const counted = !!maxLength && showCount && !review;
  const countId = counted ? `${fid}-count` : undefined;
  const labelId = `${fid}-label`;
  const { hintId, errorId, aria } = useFieldA11y(fid, hint, error, countId);

  // Take outside changes (a reset, a loaded draft) without fighting the caret while someone types.
  useIsoLayoutEffect(() => {
    const el = box.current; if (!el) return;
    const next = sanitizeRichText(value);
    if (next !== last.current) { el.innerHTML = next; last.current = next; setLength(richTextLength(next)); }
  }, [value]);

  const refresh = useCallback(() => {
    if (typeof document === 'undefined' || !box.current?.contains(document.getSelection()?.anchorNode ?? null)) return;
    const q = (c: Format) => { try { return document.queryCommandState(c); } catch { return false; } };
    setActive({ bold: q('bold'), italic: q('italic'), insertUnorderedList: q('insertUnorderedList'), insertOrderedList: q('insertOrderedList') });
  }, []);
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.addEventListener('selectionchange', refresh);
    return () => document.removeEventListener('selectionchange', refresh);
  }, [refresh]);

  const emit = () => {
    const el = box.current; if (!el) return;
    const html = sanitizeRichText(el.innerHTML);
    if (!html && el.innerHTML) el.innerHTML = ''; // so the placeholder shows again
    last.current = html;
    setLength(richTextLength(html));
    onChange?.(html);
  };
  const run = (cmd: Format) => {
    if (locked) return;
    box.current?.focus();
    document.execCommand(cmd);
    emit(); refresh();
  };
  const room = () => (maxLength ? maxLength - richTextLength(box.current?.innerHTML) : Infinity);

  const keys = (e: KeyboardEvent<HTMLDivElement>) => {
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.shiftKey && (e.key === '8' || e.key === '*')) { e.preventDefault(); run('insertUnorderedList'); }
    else if (mod && e.shiftKey && (e.key === '7' || e.key === '&')) { e.preventDefault(); run('insertOrderedList'); }
  };

  return (
    <FieldShell className={className} error={error} hint={hint} hintId={hintId} errorId={errorId} review={review}
      label={<span className="rnc-field-label" id={labelId} onClick={() => box.current?.focus()}>{label}{optional ? <em> (optional)</em> : null}</span>}
      count={counted ? <CharCount id={countId!} length={length} max={maxLength!} /> : null}>
      <div className={cx('rnc-rte', locked && 'is-disabled')}>
        {!review ? (
          <div className="rnc-rte-bar" role="toolbar" aria-label={toolbarLabel} aria-controls={fid}>
            {TOOLS.map((t, i) => (
              <span key={t.cmd} style={{ display: 'contents' }}>
                {i === 2 ? <span className="rnc-rte-sep" aria-hidden="true" /> : null}
                <button type="button" className="rnc-rte-btn" aria-label={t.label} title={`${t.label} (${t.keys})`} aria-pressed={!!active[t.cmd]} disabled={locked}
                  onMouseDown={(e) => e.preventDefault()} onClick={() => run(t.cmd)}>
                  <Icon name={t.icon} size={20} />
                </button>
              </span>
            ))}
          </div>
        ) : null}
        <div style={review ? { position: 'relative' } : undefined}>
          <div
            ref={box} id={fid} className="rnc-rte-area" role="textbox" aria-multiline="true" aria-labelledby={labelId} {...aria}
            aria-readonly={review || undefined} aria-disabled={disabled || undefined}
            contentEditable={!locked} suppressContentEditableWarning tabIndex={locked && !review ? -1 : 0}
            data-placeholder={placeholder}
            style={{ ['--rte-h' as string]: typeof minHeight === 'number' ? `${minHeight}px` : minHeight, ...(review ? { paddingRight: 52 } : null) } as CSSProperties}
            onFocus={() => { try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch { /* older browsers */ } onFocus?.(); }}
            onBlur={() => onBlur?.()}
            onInput={emit}
            onKeyDown={keys}
            onBeforeInput={(e) => {
              const data = (e as unknown as { data?: string | null }).data;
              if (maxLength && data && data.length > room()) e.preventDefault();
            }}
            onPaste={(e) => {
              e.preventDefault();
              let text = e.clipboardData.getData('text/plain');
              const left = room();
              if (left <= 0) return;
              if (text.length > left) text = text.slice(0, left);
              document.execCommand('insertText', false, text);
            }}
            onDrop={(e) => e.preventDefault()}
          />
          {review ? <CopyButton className="rnc-copy-float" label={label as ReactNode} value={() => richTextToPlain(value)} /> : null}
        </div>
      </div>
    </FieldShell>
  );
}
