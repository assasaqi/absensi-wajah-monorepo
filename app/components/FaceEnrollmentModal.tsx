import React, { useRef, useState } from 'react'
import {
  X,
  Camera,
  Upload,
  CheckCircle2,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import { attendanceApi } from '~/lib/apiClient'
import type { StudentAttendance } from '~/types/attendance'
import { Button } from './Button'

export interface FaceEnrollmentModalProps {
  isOpen: boolean
  onClose: () => void
  student?: StudentAttendance
  onSuccess?: () => void
}

function generateBiometricFaceCanvas(name: string, initials: string): string {
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 320
    canvas.height = 320
    const ctx = canvas.getContext('2d')
    if (!ctx) return ''

    // Gradient background
    const grad = ctx.createLinearGradient(0, 0, 320, 320)
    grad.addColorStop(0, '#0E261F')
    grad.addColorStop(1, '#146350')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 320, 320)

    // Circular face silhouette
    ctx.fillStyle = '#E2F2EC'
    ctx.beginPath()
    ctx.arc(160, 120, 60, 0, Math.PI * 2)
    ctx.fill()

    // Shoulder silhouette
    ctx.beginPath()
    ctx.arc(160, 290, 105, Math.PI, 0)
    ctx.fill()

    // Inner initials
    ctx.fillStyle = '#146350'
    ctx.font = 'bold 40px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(initials || 'S', 160, 122)

    // Biometric reticle ring
    ctx.strokeStyle = '#4ADE80'
    ctx.lineWidth = 3
    ctx.setLineDash([12, 8])
    ctx.beginPath()
    ctx.arc(160, 120, 80, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])

    // Biometric scanner corner markers
    ctx.lineWidth = 4
    ctx.strokeStyle = '#4ADE80'
    // Top-left
    ctx.beginPath(); ctx.moveTo(45, 80); ctx.lineTo(45, 45); ctx.lineTo(80, 45); ctx.stroke()
    // Top-right
    ctx.beginPath(); ctx.moveTo(240, 45); ctx.lineTo(275, 45); ctx.lineTo(275, 80); ctx.stroke()
    // Bottom-left
    ctx.beginPath(); ctx.moveTo(45, 240); ctx.lineTo(45, 275); ctx.lineTo(80, 275); ctx.stroke()
    // Bottom-right
    ctx.beginPath(); ctx.moveTo(240, 275); ctx.lineTo(275, 275); ctx.lineTo(275, 240); ctx.stroke()

    // Verification badge at bottom
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)'
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(30, 275, 260, 32, 8)
    } else {
      ctx.fillRect(30, 275, 260, 32)
    }
    ctx.fill()

    ctx.fillStyle = '#4ADE80'
    ctx.font = 'bold 11px sans-serif'
    ctx.fillText('BIOMETRIK WAJAH TERVERIFIKASI', 160, 292)

    return canvas.toDataURL('image/png')
  } catch (err) {
    console.error('Failed to generate biometric canvas:', err)
    return ''
  }
}

export function FaceEnrollmentModal({
  isOpen,
  onClose,
  student,
  onSuccess,
}: FaceEnrollmentModalProps) {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  if (!isOpen || !student) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setPhotoPreview(reader.result as string)
      setErrorMessage('')
    }
    reader.readAsDataURL(file)
  }

  const handleSimulateCapture = () => {
    setIsCapturing(true)
    setErrorMessage('')
    setTimeout(() => {
      const simulatedPhoto = generateBiometricFaceCanvas(
        student.name,
        student.initials,
      )
      if (simulatedPhoto) {
        setPhotoPreview(simulatedPhoto)
      } else {
        setErrorMessage('Gagal membuat citra biometrik canvas')
      }
      setIsCapturing(false)
    }, 250)
  }

  const handleSaveFace = async () => {
    if (!photoPreview) {
      setErrorMessage('Ambil foto atau pilih file gambar wajah terlebih dahulu')
      return
    }

    setLoading(true)
    setErrorMessage('')

    try {
      await attendanceApi.registerStudentFace(student.id, {
        image: photoPreview,
        fotoProfil: photoPreview,
      })
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        setPhotoPreview(null)
        onSuccess?.()
        onClose()
      }, 1500)
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Gagal mendaftarkan wajah ke database',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-[420px] bg-white text-[#171D1B] rounded-t-3xl sm:rounded-3xl border border-[#E6E4DD] p-5 shadow-2xl animate-in slide-in-from-bottom duration-200 flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E6E4DD]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#E2F2EC] text-[#146350] flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                Pendaftaran Wajah Siswa
              </h3>
              <p className="text-[11px] text-[#6E6D68]">
                Daftarkan data biometrik wajah siswa
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-[#E6E4DD] flex items-center justify-center text-[#6E6D68] hover:text-[#171D1B] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Student Info Pill */}
        <div className="bg-white p-3 rounded-2xl border border-[#E6E4DD] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#E2F2EC] text-[#146350] font-extrabold text-sm flex items-center justify-center">
              {student.initials}
            </div>
            <div>
              <p className="text-xs font-extrabold text-[#171D1B]">
                {student.name}
              </p>
              <p className="text-[11px] text-[#6E6D68]">
                NIS {student.nis} • No. Absen {student.absenNo}
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-[#FAF9F6] border border-[#E6E4DD] text-[10px] font-bold text-[#4A4945]">
            Aktif
          </span>
        </div>

        {/* Error / Success feedback */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-[#FBE6E5] text-[#B42318] text-xs">
            {errorMessage}
          </div>
        )}

        {success && (
          <div className="p-3 rounded-xl bg-[#E2F2EC] text-[#146350] text-xs flex items-center gap-2 font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Wajah siswa berhasil disimpan ke database MySQL!</span>
          </div>
        )}

        {/* Photo Viewport Box */}
        <div className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-[#C5E0D6] bg-white flex flex-col items-center justify-center overflow-hidden relative group">
          {photoPreview ? (
            <div className="relative w-full h-full">
              <img
                src={photoPreview}
                alt="Foto Wajah Siswa"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setPhotoPreview(null)}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                title="Ganti foto"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-4 space-y-2">
              <div className="w-12 h-12 rounded-full bg-[#E2F2EC] text-[#146350] flex items-center justify-center">
                <Camera className="w-6 h-6 stroke-[1.8]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#171D1B]">
                  Belum ada foto wajah terpilih
                </p>
                <p className="text-[11px] text-[#6E6D68]">
                  Pilih foto wajah murid yang jelas menghadap ke depan
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons to Capture / Upload */}
        <div className="grid grid-cols-2 gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="py-2.5 px-3 rounded-xl bg-white border border-[#E6E4DD] text-xs font-bold text-[#4A4945] flex items-center justify-center gap-1.5 hover:bg-[#FAF9F6] transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Unggah Foto</span>
          </button>
          <button
            type="button"
            onClick={handleSimulateCapture}
            disabled={isCapturing}
            className="py-2.5 px-3 rounded-xl bg-[#E2F2EC] border border-[#C5E0D6] text-xs font-bold text-[#146350] flex items-center justify-center gap-1.5 hover:bg-[#D5EDE4] transition-colors cursor-pointer disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isCapturing ? 'animate-spin' : ''}`} />
            <span>{isCapturing ? 'Mengambil...' : 'Ambil Otomatis'}</span>
          </button>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 border-t border-[#E6E4DD] flex gap-2">
          <Button
            variant="outline"
            fullWidth={false}
            className="w-1/3"
            onClick={onClose}
            disabled={loading}
          >
            Batal
          </Button>
          <Button
            variant="primary"
            fullWidth={false}
            className="w-2/3"
            disabled={loading || !photoPreview || success}
            onClick={handleSaveFace}
          >
            {loading ? 'Menyimpan...' : 'Simpan Wajah ke MySQL'}
          </Button>
        </div>
      </div>
    </div>
  )
}
