import { useId, useRef, useState, type DragEvent, type ReactNode } from 'react';
import { Button } from './Button';
import { Icon } from './Icon';
import { cx } from '../utils';

export interface UploadTileProps {
  label: ReactNode;
  /** Under the label, e.g. "PNG or JPG, at least 650 × 500". */
  hint?: ReactNode;
  /** The current file (a URL), if there is one. */
  src?: string;
  /**
   * What `src` is. Default: "video" for a video data URL, otherwise "image". Pass it for object or hosted URLs.
   * "file" (a PDF or other document) shows a document icon and `fileName` instead of a picture.
   */
  kind?: 'image' | 'video' | 'file';
  /** The file's name, shown for a "file". */
  fileName?: ReactNode;
  alt?: string;
  /**
   * How big the chosen picture or video shows. "sm" (default) is a thumbnail. "lg" fills the tile's width at 4:3, cropped the way
   * a site shows a photo, for pictures people need to judge (a cause photo).
   */
  preview?: 'sm' | 'lg';
  /** Default "image/*". Add video types (e.g. "image/*,video/mp4,video/webm") to take videos too. */
  accept?: string;
  /**
   * Called with the chosen or dropped file and a URL for previewing it: a data URL for an image, an object URL
   * (URL.createObjectURL) for anything else (videos, PDFs), which can be too large to read into memory as text.
   */
  onFile: (file: File, dataUrl: string) => void;
  onRemove?: () => void;
  /** Smallest size accepted, in pixels; smaller images are refused with a message. */
  minWidth?: number;
  minHeight?: number;
  /** Largest file accepted, in bytes. */
  maxBytes?: number;
  /** An error from the form (shown under the tile). */
  error?: ReactNode;
  disabled?: boolean;
  chooseLabel?: string;
  replaceLabel?: string;
  removeLabel?: string;
}

const readAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const r = new FileReader(); r.onload = () => resolve(String(r.result)); r.onerror = () => reject(r.error); r.readAsDataURL(file);
});
const sizeOf = (url: string) => new Promise<{ w: number; h: number }>((resolve) => {
  const img = new Image(); img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight }); img.onerror = () => resolve({ w: 0, h: 0 }); img.src = url;
});

/** Choose or drop a file. The tile lights up while a file is dragged over it, checks the size, and shows the image (or plays back the video) with Replace and Remove. */
export function UploadTile({
  label, hint, src, kind, fileName, alt = '', preview = 'sm', accept = 'image/*', onFile, onRemove, minWidth, minHeight, maxBytes, error, disabled,
  chooseLabel = 'Choose a file', replaceLabel = 'Replace', removeLabel = 'Remove',
}: UploadTileProps) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const take = async (file?: File | null) => {
    if (!file || disabled) return;
    setProblem(null);
    if (maxBytes && file.size > maxBytes) { setProblem(`That file is ${Math.round(file.size / 1024 / 1024)} MB. Use one under ${Math.round(maxBytes / 1024 / 1024)} MB.`); return; }
    if (!file.type.startsWith('image/')) { onFile(file, URL.createObjectURL(file)); return; }
    const url = await readAsDataUrl(file);
    if ((minWidth || minHeight) && file.type.startsWith('image/')) {
      const { w, h } = await sizeOf(url);
      if (w && ((minWidth && w < minWidth) || (minHeight && h < minHeight))) {
        setProblem(`That image is ${w} × ${h}. Use one at least ${minWidth ?? 0} × ${minHeight ?? 0}.`); return;
      }
    }
    onFile(file, url);
  };
  const drop = (e: DragEvent) => { e.preventDefault(); setOver(false); void take(e.dataTransfer.files?.[0]); };
  const shown = error ?? problem;
  return (
    <div className={cx('rnc-upload', preview === 'lg' && 'is-lg')}>
      <span className="rnc-field-label" id={`${id}-l`}>{label}</span>
      {/* Always four parts (label, hint, tile, message), so tiles side by side line up on a shared grid. */}
      {hint ? <span className="rnc-field-hint" id={`${id}-h`}>{hint}</span> : <span aria-hidden="true" />}
      <div
        className={cx('rnc-upload-zone', over && 'is-over', src && 'has-file')}
        onDragOver={(e) => { if (disabled) return; e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={drop}
      >
        {src ? (() => {
          const shownKind = kind ?? (src.startsWith('data:video') ? 'video' : 'image');
          if (shownKind === 'video') return <video src={src} key={src} muted playsInline controls preload="metadata" aria-label={alt || 'Uploaded video'} />;
          if (shownKind === 'file') return <span className="rnc-upload-file" key={src}><Icon name="clipboard-text" size={28} /><span>{fileName ?? 'File added'}</span></span>;
          return <img src={src} alt={alt} key={src} />;
        })() : <><Icon name={/image|video/.test(accept) ? 'image' : 'clipboard-text'} size={28} /><span>Drop a file here, or</span></>}
        <span className="rnc-upload-actions">
          <Button variant="secondary" size="sm" disabled={disabled} aria-describedby={`${id}-l`} onClick={() => input.current?.click()}>{src ? replaceLabel : chooseLabel}</Button>
        </span>
        {/* Remove is quiet: a trash icon in the corner (Miguel, 2026-10-16: "make remove or delete buttons less emphasized"). */}
        {src && onRemove ? <Button className="rnc-upload-remove" variant="ghost" size="sm" iconOnly startIcon="trash" disabled={disabled} aria-label={removeLabel} aria-describedby={`${id}-l`} onClick={onRemove} /> : null}
        <input ref={input} className="rnc-upload-input" type="file" accept={accept} tabIndex={-1} aria-hidden="true" onChange={(e) => { void take(e.target.files?.[0]); e.target.value = ''; }} />
      </div>
      <div className="rnc-upload-msg" role="alert">{shown ? <p className="rnc-field-error">{shown}</p> : null}</div>
    </div>
  );
}
