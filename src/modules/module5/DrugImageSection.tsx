import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import Lightbox from 'yet-another-react-lightbox'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import 'yet-another-react-lightbox/styles.css'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import {
  useVisitImagesList,
  useVisitImagesDelete,
  visitImageKeys,
} from './useVisitImages'
import { useImageSrc } from './useImageSrc'
import { visitImageService, generateThumbnail, validateImageFile } from '@/services/visitImageService'
import type { VisitImageItem } from '@/services/visitImageService'
import { Camera, Trash2, Loader2, ImagePlus, Upload, X } from 'lucide-react'

const MAX_IMAGES = 10

interface DrugImageSectionProps {
  vn: string
}

interface PendingFile {
  file: File
  thumbUrl: string
  error?: string
}

/** Thumbnail that loads via GAS base64 proxy */
function ImageThumb({ img, onPreview, onDelete }: {
  img: VisitImageItem
  onPreview: () => void
  onDelete: () => void
}) {
  const { src, isLoading, isError } = useImageSrc(img.image_id)

  return (
    <div className="group relative aspect-square rounded-md overflow-hidden border bg-muted">
      {isLoading ? (
        <div className="w-full h-full flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <div className="w-full h-full flex items-center justify-center p-1">
          <span className="text-[10px] text-destructive text-center">โหลดไม่สำเร็จ</span>
        </div>
      ) : (
        <img
          src={src}
          alt={img.filename}
          className="w-full h-full object-cover cursor-pointer"
          onClick={onPreview}
        />
      )}
      <button
        type="button"
        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded-full p-0.5 text-white hover:bg-destructive"
        onClick={onDelete}
        title="ลบรูปภาพ"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  )
}

/** Lightbox slide renderer — loads via GAS proxy with fallback to cache */
function LightboxSlide({ slide }: {
  slide: { src: string; imageId: string }
}) {
  const { src, isLoading, isError } = useImageSrc(slide.imageId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <span className="text-white text-sm">โหลดรูปไม่สำเร็จ</span>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt="รูปภาพหลักฐานยา"
      className="w-full h-full object-contain"
    />
  )
}

export function DrugImageSection({ vn }: DrugImageSectionProps) {
  const qc = useQueryClient()
  const { data: images = [], isLoading } = useVisitImagesList(vn)
  const deleteMutation = useVisitImagesDelete()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState(-1)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  // Pending files for confirm flow
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [doneIndices, setDoneIndices] = useState<Set<number>>(new Set())

  const canUpload = images.length + pendingFiles.length < MAX_IMAGES

  // Lightbox slides — use imageId as src placeholder, actual data loaded in render
  const imageIds = images.map((img) => img.image_id)
  const lightboxSlides = imageIds.map((id) => ({ src: '', imageId: id }))

  // --- File selection (multi) ---
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0) return

    const remaining = MAX_IMAGES - images.length - pendingFiles.length
    const toAdd = files.slice(0, remaining)

    const validated: PendingFile[] = []
    for (const file of toAdd) {
      const error = validateImageFile(file)
      try {
        const thumbUrl = error ? '' : await generateThumbnail(file)
        validated.push({ file, thumbUrl, error: error ?? undefined })
      } catch {
        validated.push({ file, thumbUrl: '', error: 'ไม่สามารถอ่านไฟล์ได้' })
      }
    }

    setPendingFiles((prev) => [...prev, ...validated])
  }

  const removePending = (idx: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== idx))
  }

  const clearPending = () => {
    setPendingFiles([])
    setDoneIndices(new Set())
  }

  // --- Upload confirmed ---
  const handleConfirmUpload = async () => {
    const validEntries: { pendingIdx: number; file: File }[] = []
    pendingFiles.forEach((p, idx) => {
      if (!p.error) validEntries.push({ pendingIdx: idx, file: p.file })
    })
    if (validEntries.length === 0) return

    setIsUploading(true)
    setDoneIndices(new Set())

    let errorCount = 0
    for (let i = 0; i < validEntries.length; i++) {
      const { pendingIdx, file } = validEntries[i]
      try {
        await visitImageService.upload(vn, file)
        setDoneIndices((prev) => new Set(prev).add(pendingIdx))
      } catch (err) {
        errorCount++
        const msg = err instanceof Error ? err.message : `อัปโหลด "${file.name}" ไม่สำเร็จ`
        toast.error(msg)
      }
    }

    await qc.invalidateQueries({ queryKey: visitImageKeys.byVn(vn) })

    setIsUploading(false)
    clearPending()

    if (errorCount === 0) {
      toast.success(`อัปโหลดรูปภาพสำเร็จ ${validEntries.length} รูป`)
    }
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteMutation.mutate(
      { imageId: deleteTarget, vn },
      { onSettled: () => setDeleteTarget(null) },
    )
  }

  const validCount = pendingFiles.filter((p) => !p.error).length
  const doneCount = doneIndices.size

  return (
    <>
      <div className="pt-3 border-t mt-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">
            รูปภาพหลักฐานยา ({images.length}/{MAX_IMAGES})
          </span>
          {canUpload && !isUploading && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-7"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="h-3.5 w-3.5 mr-1" />
              อัพโหลดรูปภาพ
            </Button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            กำลังโหลดรูปภาพ...
          </div>
        )}

        {/* Empty state */}
        {!isLoading && images.length === 0 && pendingFiles.length === 0 && (
          <div className="text-xs text-muted-foreground py-3 text-center border border-dashed rounded-md">
            <ImagePlus className="h-6 w-6 mx-auto mb-1 opacity-40" />
            ยังไม่มีรูปภาพหลักฐาน
          </div>
        )}

        {/* Existing images grid — loaded via GAS proxy */}
        {images.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {images.map((img, idx) => (
              <ImageThumb
                key={img.image_id}
                img={img}
                onPreview={() => setLightboxIndex(idx)}
                onDelete={() => setDeleteTarget(img.image_id)}
              />
            ))}
          </div>
        )}

        {/* Pending files — confirm before upload */}
        {pendingFiles.length > 0 && (
          <div className="mt-3 rounded-md border bg-muted/30 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">
                รูปที่เลือก ({validCount} รูป)
              </span>
              {!isUploading && (
                <Button size="sm" variant="ghost" className="text-xs h-6 px-2" onClick={clearPending}>
                  ยกเลิกทั้งหมด
                </Button>
              )}
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {pendingFiles.map((p, idx) => (
                <div
                  key={`pending-${idx}`}
                  className="relative aspect-square rounded-md overflow-hidden border bg-muted"
                >
                  {p.error ? (
                    <div className="w-full h-full flex items-center justify-center bg-destructive/10 p-1">
                      <span className="text-[10px] text-destructive text-center leading-tight">{p.error}</span>
                    </div>
                  ) : (
                    <img
                      src={p.thumbUrl}
                      alt={p.file.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                  {!isUploading && (
                    <button
                      type="button"
                      className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-white hover:bg-destructive"
                      onClick={() => removePending(idx)}
                      title="นำออก"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                  {isUploading && !p.error && doneIndices.has(idx) && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {validCount > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <Button
                  size="sm"
                  className="text-xs h-7 bg-apple-blue hover:bg-apple-blue/90"
                  onClick={handleConfirmUpload}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                      กำลังอัปโหลด {doneCount}/{validCount}...
                    </>
                  ) : (
                    <>
                      <Upload className="h-3.5 w-3.5 mr-1" />
                      อัปโหลด {validCount} รูป
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lightbox — full-screen responsive preview with zoom */}
      <Lightbox
        open={lightboxIndex >= 0}
        close={() => setLightboxIndex(-1)}
        index={lightboxIndex >= 0 ? lightboxIndex : 0}
        slides={lightboxSlides}
        plugins={[Zoom]}
        zoom={{
          maxZoomPixelRatio: 3,
          zoomInMultiplier: 2,
          scrollToZoom: true,
        }}
        carousel={{ finite: true }}
        animation={{ zoom: 300 }}
        controller={{ closeOnPullDown: true, closeOnBackdropClick: true }}
        render={{
          slide: ({ slide }) => (
            <LightboxSlide
              slide={slide as { src: string; imageId: string }}
            />
          ),
        }}
      />

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent className="max-w-sm">
          <div className="text-center py-2">
            <p className="font-medium">ยืนยันลบรูปภาพ</p>
            <p className="text-sm text-muted-foreground mt-1">รูปภาพจะถูกลบถาวร</p>
          </div>
          <div className="flex justify-center gap-3 mt-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>
              ยกเลิก
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5 mr-1" />
              )}
              ลบ
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
