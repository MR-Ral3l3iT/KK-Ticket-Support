'use client';

import { useRef, useState, useCallback } from 'react';
import { Upload, X, FileText, Image, File, Loader2, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Attachment } from '@/lib/api/customer-portal';

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── LocalFile: ไฟล์ที่เลือกแต่ยังไม่ได้ upload ────────────────────────────

interface LocalFile {
  localId: string;
  file: File;
  preview: string | null;   // object URL สำหรับรูปภาพ
  status: 'pending' | 'uploading' | 'done' | 'error';
  errorMsg?: string;
  result?: Attachment;      // ข้อมูลจาก server หลัง upload สำเร็จ
}

// ─── FilePreviewCard ────────────────────────────────────────────────────────

function FilePreviewCard({
  item,
  onRemove,
}: {
  item: LocalFile;
  onRemove: () => void;
}) {
  const isImage = IMAGE_TYPES.has(item.file.type);

  return (
    <div className="relative flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
      {/* Thumbnail */}
      <div className="h-12 w-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
        {isImage && item.preview ? (
          <img src={item.preview} alt={item.file.name} className="h-full w-full object-cover" />
        ) : item.file.type === 'application/pdf' ? (
          <FileText className="h-6 w-6 text-red-500" />
        ) : isImage ? (
          <Image className="h-6 w-6 text-blue-500" />
        ) : (
          <File className="h-6 w-6 text-gray-400" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{item.file.name}</p>
        <p className="text-xs text-gray-400">{formatBytes(item.file.size)}</p>
        {item.status === 'error' && (
          <p className="text-xs text-danger-600 mt-0.5">{item.errorMsg}</p>
        )}
      </div>

      {/* Status icon */}
      <div className="flex-shrink-0">
        {item.status === 'uploading' && <Loader2 className="h-4 w-4 text-primary animate-spin" />}
        {item.status === 'done' && <CheckCircle2 className="h-4 w-4 text-success-500" />}
        {item.status === 'error' && <AlertCircle className="h-4 w-4 text-danger-500" />}
      </div>

      {/* Remove */}
      {item.status !== 'uploading' && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gray-500 text-white hover:bg-gray-700 transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

// ─── ExistingAttachmentCard ──────────────────────────────────────────────────

function ExistingAttachmentCard({
  attachment,
  onDelete,
  canDelete,
}: {
  attachment: Attachment;
  onDelete?: () => void;
  canDelete?: boolean;
}) {
  const isImage = IMAGE_TYPES.has(attachment.mimeType);

  return (
    <div className="relative flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
      <div className="h-12 w-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
        {isImage ? (
          <img
            src={attachment.url}
            alt={attachment.fileName}
            className="h-full w-full object-cover"
          />
        ) : attachment.mimeType === 'application/pdf' ? (
          <FileText className="h-6 w-6 text-red-500" />
        ) : (
          <File className="h-6 w-6 text-gray-400" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{attachment.fileName}</p>
        <p className="text-xs text-gray-400">{formatBytes(attachment.fileSize)}</p>
      </div>

      <a
        href={attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        download={attachment.fileName}
        className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-primary transition-colors"
      >
        <Download className="h-4 w-4" />
      </a>

      {canDelete && onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gray-500 text-white hover:bg-danger-600 transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

// ─── FileUploader (main) ────────────────────────────────────────────────────

interface FileUploaderProps {
  /** ถ้ามี ticketId → upload ทันทีเมื่อเลือกไฟล์  */
  ticketId?: string;
  /** ถ้าไม่มี ticketId → collect mode: เรียกผ่าน ref หรือ callback  */
  onFilesSelected?: (files: File[]) => void;
  /** เรียกหลัง upload สำเร็จแต่ละไฟล์ */
  onUploaded?: (attachment: Attachment) => void;
  /** ไฟล์แนบที่มีอยู่แล้วในระบบ */
  existingAttachments?: Attachment[];
  onDeleteExisting?: (id: string) => void;
  canDeleteExisting?: boolean;
  disabled?: boolean;
  maxFiles?: number;
  uploadFn?: (ticketId: string, files: File[]) => Promise<Attachment[]>;
}

export function FileUploader({
  ticketId,
  onFilesSelected,
  onUploaded,
  existingAttachments = [],
  onDeleteExisting,
  canDeleteExisting = false,
  disabled = false,
  maxFiles = 10,
  uploadFn,
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<LocalFile[]>([]);
  const [dragging, setDragging] = useState(false);

  const addFiles = useCallback(
    async (rawFiles: FileList | File[]) => {
      const arr = Array.from(rawFiles);
      const newItems: LocalFile[] = arr.map((file) => ({
        localId: `${Date.now()}-${Math.random()}`,
        file,
        preview: IMAGE_TYPES.has(file.type) ? URL.createObjectURL(file) : null,
        status: ticketId ? 'uploading' : 'pending',
      }));

      setItems((prev) => [...prev, ...newItems]);
      onFilesSelected?.(arr);

      if (ticketId && uploadFn) {
        // Auto-upload mode: upload each file individually for granular status
        for (const item of newItems) {
          try {
            const [result] = await uploadFn(ticketId, [item.file]);
            setItems((prev) =>
              prev.map((p) =>
                p.localId === item.localId ? { ...p, status: 'done', result } : p,
              ),
            );
            onUploaded?.(result);
          } catch (err: any) {
            setItems((prev) =>
              prev.map((p) =>
                p.localId === item.localId
                  ? { ...p, status: 'error', errorMsg: err?.message ?? 'อัปโหลดไม่สำเร็จ' }
                  : p,
              ),
            );
          }
        }
      }
    },
    [ticketId, uploadFn, onFilesSelected, onUploaded],
  );

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) addFiles(e.target.files);
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  }

  function removeItem(localId: string) {
    setItems((prev) => {
      const item = prev.find((p) => p.localId === localId);
      if (item?.preview) URL.revokeObjectURL(item.preview);
      return prev.filter((p) => p.localId !== localId);
    });
  }

  const pendingFiles = items.filter((i) => i.status === 'pending').map((i) => i.file);
  const totalItems = existingAttachments.length + items.length;
  const atLimit = totalItems >= maxFiles;

  return (
    <div className="flex flex-col gap-3">
      {/* Existing attachments */}
      {existingAttachments.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {existingAttachments.map((att) => (
            <ExistingAttachmentCard
              key={att.id}
              attachment={att}
              canDelete={canDeleteExisting}
              onDelete={() => onDeleteExisting?.(att.id)}
            />
          ))}
        </div>
      )}

      {/* New file previews */}
      {items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {items.map((item) => (
            <FilePreviewCard
              key={item.localId}
              item={item}
              onRemove={() => removeItem(item.localId)}
            />
          ))}
        </div>
      )}

      {/* Drop zone */}
      {!atLimit && !disabled && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 cursor-pointer transition-colors select-none',
            dragging
              ? 'border-primary bg-primary-50'
              : 'border-gray-300 bg-gray-50 hover:border-primary hover:bg-primary-50/50',
          )}
        >
          <Upload className={cn('h-6 w-6', dragging ? 'text-primary' : 'text-gray-400')} />
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">ลากไฟล์มาวางที่นี่ หรือ <span className="text-primary">คลิกเพื่อเลือก</span></p>
            <p className="text-xs text-gray-400 mt-0.5">
              jpg, png, gif, webp, pdf, xlsx, docx, txt — สูงสุดไฟล์ละ 10 MB (รวมไม่เกิน 30 MB)
            </p>
            <p className="text-xs text-gray-400">รูปภาพจะถูก convert เป็น WebP อัตโนมัติ</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ALLOWED_TYPES.join(',')}
            className="hidden"
            onChange={handleInputChange}
          />
        </div>
      )}
    </div>
  );
}

// ─── Export helper สำหรับ collect mode (tickets/new) ────────────────────────

export function usePendingFiles() {
  const [files, setFiles] = useState<File[]>([]);
  return {
    files,
    onFilesSelected: (newFiles: File[]) => setFiles((prev) => [...prev, ...newFiles]),
    clear: () => setFiles([]),
  };
}
