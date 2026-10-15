import { useId, useRef, useState, type DragEvent, type ReactNode } from 'react';
import { Button } from './Button';
import { Icon } from './Icon';
import { cx } from '../utils';

export interface UploadTileProps {
  label: ReactNode;
  /** Under the label, e.g. "PNG or JPG, at least 650 × 500". */
  hint?: ReactNode;
  /** The current image, if there is one. */
  src?: string;
  alt?: string;
  /** Default "image/*". */
  accept?: string;
  /** Called with the chosen or dropped file and a data URL for previewing it. */
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

/** Choose or drop a file. The tile lights up while a file is dragged over it, checks the size, and shows the image with Replace and Remove. */
export function UploadTile({
  label, hint, src, alt = '', accept = 'image/*', onFile, onRemove, minWidth, minHeight, maxBytes, error, disabled,
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
    <div className="rnc-upload">
      <span className="rnc-field-label" id={`${id}-l`}>{label}</span>
      {/* Always four parts (label, hint, tile, message), so tiles side by side line up on a shared grid. */}
      {hint ? <span className="rnc-field-hint" id={`${id}-h`}>{hint}</span> : <span aria-hidden="true" />}
      <div
        className={cx('rnc-upload-zone', over && 'is-over', src && 'has-file')}
        onDragOver={(e) => { if (disabled) return; e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={drop}
      >
        {src ? <img src={src} alt={alt} key={src} /> : <><Icon name="image" size={28} /><span>Drop a file here, or</span></>}
        <span className="rnc-upload-actions">
          <Button variant="secondary" size="sm" disabled={disabled} aria-describedby={`${id}-l`} onClick={() => input.current?.click()}>{src ? replaceLabel : chooseLabel}</Button>
          {src && onRemove ? <Button variant="danger-ghost" size="sm" startIcon="trash" disabled={disabled} aria-describedby={`${id}-l`} onClick={onRemove}>{removeLabel}</Button> : null}
        </span>
        <input ref={input} className="rnc-upload-input" type="file" accept={accept} tabIndex={-1} aria-hidden="true" onChange={(e) => { void take(e.target.files?.[0]); e.target.value = ''; }} />
      </div>
      <div className="rnc-upload-msg" role="alert">{shown ? <p className="rnc-field-error">{shown}</p> : null}</div>
    </div>
  );
}
