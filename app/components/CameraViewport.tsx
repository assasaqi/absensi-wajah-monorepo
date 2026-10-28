import React, { useEffect, useRef, useState } from 'react'
import { Smile, CameraOff, UserCheck, RefreshCw } from 'lucide-react'

export interface CameraViewportProps {
  torchOn: boolean
  isMatching?: boolean
  onFaceMatched?: () => void
  onManualFallback: () => void
  forcePermissionDenied?: boolean
}

export function CameraViewport({
  torchOn,
  isMatching = true,
  onFaceMatched,
  onManualFallback,
  forcePermissionDenied = false,
}: CameraViewportProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [cameraStatus, setCameraStatus] = useState<
    'requesting' | 'active' | 'simulated' | 'denied'
  >('requesting')
  const [errorMessage, setErrorMessage] = useState<string>('')

  const startCamera = async () => {
    if (forcePermissionDenied) {
      stopCamera()
      setCameraStatus('denied')
      setErrorMessage(
        'Akses kamera ditolak oleh pengguna atau kebijakan peramban.',
      )
      return
    }

    setCameraStatus('requesting')
    setErrorMessage('')

    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setCameraStatus('simulated')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 720 },
          height: { ideal: 960 },
        },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => {})
      }
      setCameraStatus('active')
    } catch (err: unknown) {
      const errorName = err instanceof Error ? err.name : ''
      if (
        errorName === 'NotAllowedError' ||
        errorName === 'PermissionDeniedError' ||
        errorName === 'SecurityError'
      ) {
        setCameraStatus('denied')
        setErrorMessage(
          'Izin akses kamera ditolak. Berikan izin kamera pada browser Anda atau gunakan fitur Absen Manual di bawah.',
        )
      } else {
        // Hardware camera not present on desktop/sandbox -> show realistic classroom viewfinder with live canvas/preview
        setCameraStatus('simulated')
      }
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }

  useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
    }
  }, [forcePermissionDenied])

  // Apply hardware torch if supported by device camera track
  useEffect(() => {
    if (!streamRef.current) return
    const [track] = streamRef.current.getVideoTracks()
    if (!track) return
    try {
      const capabilities = track.getCapabilities?.() as Record<string, unknown> | undefined
      if (capabilities && 'torch' in capabilities) {
        track
          .applyConstraints({
            advanced: [{ torch: torchOn } as MediaTrackConstraintSet],
          })
          .catch(() => {})
      }
    } catch {
      // ignore if torch constraint is unsupported
    }
  }, [torchOn])

  if (cameraStatus === 'denied') {
    return (
      <div className="relative w-full aspect-[4/4.3] rounded-3xl overflow-hidden bg-[#14332B] border border-[#254D42] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-[#B42318]/20 border border-[#F97066]/30 flex items-center justify-center text-[#FDA29B] mb-3.5">
          <CameraOff className="w-7 h-7" />
        </div>
        <h3 className="text-white font-bold text-base mb-1.5">
          Izin Kamera Ditolak
        </h3>
        <p className="text-[#A8C5BC] text-xs leading-relaxed max-w-[260px] mb-5">
          {errorMessage ||
            'Aplikasi membutuhkan izin kamera untuk memindai wajah siswa secara langsung.'}
        </p>
        <div className="flex flex-col gap-2.5 w-full max-w-[240px]">
          <button
            type="button"
            onClick={ onManualFallback }
            className="w-full py-2.5 px-4 rounded-xl bg-[#4ADE80] text-[#0D261F] font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#34D399] transition-colors cursor-pointer"
          >
            <UserCheck className="w-4 h-4" />
            <span>Buka Pendaftaran / Absen Manual</span>
          </button>
          <button
            type="button"
            onClick={() => startCamera()}
            className="w-full py-2 px-4 rounded-xl bg-[#1A3F35] text-[#D1FAE5] font-semibold text-xs border border-[#2D5A4C] flex items-center justify-center gap-1.5 hover:bg-[#224F43] transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Coba Minta Izin Lagi</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={onFaceMatched}
      title="Ketuk area kamera untuk simulasi deteksi wajah siswa"
      className="relative w-full aspect-[4/4.3] rounded-3xl overflow-hidden bg-[#1A2E28] border border-white/10 shadow-inner select-none cursor-pointer group"
    >
      {/* Live WebRTC Video Element */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
          cameraStatus === 'active' ? 'opacity-100' : 'opacity-0'
        } ${torchOn ? 'brightness-125 contrast-105' : ''}`}
      />

      {/* Realistic Classroom Background Fallback when on Desktop without physical webcam */}
      {cameraStatus !== 'active' && (
        <div
          className={`absolute inset-0 w-full h-full transition-all duration-300 ${
            torchOn ? 'brightness-125' : 'brightness-95'
          }`}
          style={{
            background:
              'radial-gradient(circle at 50% 42%, rgba(44, 72, 62, 0.55) 0%, rgba(16, 36, 30, 0.88) 100%), linear-gradient(160deg, #4b3d2e 0%, #2f2820 45%, #1d221f 100%)',
          }}
        >
          {/* Classroom environment visual shapes matching the reference photo */}
          <div className="absolute inset-x-0 top-0 h-28 bg-[#D8D1C5]/25 backdrop-blur-[1px]" />
          {/* Classroom desks perspective simulation */}
          <div className="absolute bottom-8 left-4 w-28 h-24 bg-[#6E4726]/55 rounded-lg transform -skew-x-6 border-t-4 border-[#8C5B32]/60" />
          <div className="absolute bottom-8 right-4 w-28 h-24 bg-[#6E4726]/55 rounded-lg transform skew-x-6 border-t-4 border-[#8C5B32]/60" />
          <div className="absolute inset-x-10 bottom-0 h-28 bg-[#7B4F2C]/70 rounded-t-xl border-t-4 border-[#9C683E]/70" />

          {/* Center target card stand in classroom */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-36 bg-[#9CA3AF]/85 rounded-md shadow-xl flex flex-col items-center justify-center p-3 border border-white/20">
            <div className="w-16 h-16 grid grid-cols-4 grid-rows-4 gap-1 opacity-75">
              <div className="bg-[#1F2937] col-span-2 row-span-2 rounded-xs" />
              <div className="bg-[#1F2937] rounded-xs" />
              <div className="bg-[#1F2937] rounded-xs" />
              <div className="bg-[#1F2937] rounded-xs" />
              <div className="bg-[#1F2937] col-span-2 rounded-xs" />
              <div className="bg-[#1F2937] row-span-2 rounded-xs" />
              <div className="bg-[#1F2937] col-span-2 rounded-xs" />
            </div>
          </div>
        </div>
      )}

      {/* Torch / Flashlight glow overlay when enabled */}
      {torchOn && (
        <div className="
          pointer-events-none absolute inset-0
          bg-[radial-gradient(circle_at_center,rgba(255,253,230,0.22)_0%,transparent_70%)]
          transition-opacity duration-300
        " />
      )}

      {/* Top-left Status Indicator: Kamera aktif */}
      <div className="absolute top-3.5 left-3.5 z-10 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1C2C26]/80 backdrop-blur-md border border-white/10 text-white text-[11px] font-medium">
        <span className="w-2 h-2 rounded-full bg-[#4ADE80] animate-pulse" />
        <span>Kamera aktif</span>
      </div>

      {/* Center Viewfinder Frame */}
      <div className="absolute inset-0 flex items-center justify-center p-10 pointer-events-none">
        <div className="w-full max-w-[215px] aspect-[1/1.08] rounded-[26px] border-2 border-[#6EE7B7]/85 shadow-[0_0_0_9999px_rgba(10,25,20,0.18)] flex flex-col items-center justify-center p-4 text-center relative transition-transform duration-300 group-hover:scale-[1.02]">
          <div className="w-11 h-11 rounded-full bg-[#244238]/85 border border-[#6EE7B7]/60 flex items-center justify-center text-[#6EE7B7] mb-2.5 shadow-md">
            <Smile className="w-6 h-6 stroke-[2]" />
          </div>
          <span className="text-white text-xs font-semibold tracking-wide drop-shadow-xs">
            Arahkan wajah ke tengah
          </span>
        </div>
      </div>

      {/* Bottom-center Status Indicator: Mencocokkan wajah... */}
      <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 z-10 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#14231E]/85 backdrop-blur-md border border-white/10 text-white text-[11px] font-medium whitespace-nowrap">
        <span className="w-2 h-2 rounded-full bg-[#4ADE80] animate-ping" />
        <span>
          {isMatching ? 'Mencocokkan wajah...' : 'Ketuk untuk pindai wajah'}
        </span>
      </div>
    </div>
  )
}
