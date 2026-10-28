import React, { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  HelpCircle,
  Flashlight,
  ShieldCheck,
} from 'lucide-react'
import {
  attendanceApi,
  getValidActiveClassId,
  setLastScannedStudentId,
} from '~/lib/apiClient'
import { formatIndonesianDate } from '~/types/attendance'
import { CameraViewport } from '~/components/CameraViewport'
import { ManualAttendanceModal } from '~/components/ManualAttendanceModal'

export const Route = createFileRoute('/pindai/')({
  loader: async () => {
    const classId = await getValidActiveClassId()
    const { summary, students } =
      await attendanceApi.getLatestSessionForClass(classId)

    return {
      sessionSummary: summary,
      students,
      dateInfo: formatIndonesianDate(summary.tanggal),
    }
  },
  component: PindaiWajahPage,
})

function PindaiWajahPage() {
  const { sessionSummary, students, dateInfo } = Route.useLoaderData()
  const navigate = useNavigate()
  const [torchOn, setTorchOn] = useState(false)
  const [manualModalOpen, setManualModalOpen] = useState(false)
  const [simulateDenied, setSimulateDenied] = useState(false)

  const handleFaceDetected = async () => {
    const scanRes = await attendanceApi.scanFace(sessionSummary.sessionId, {
      image: `student:${students[0]?.id || 1}`,
    })
    if (scanRes.match && scanRes.studentId) {
      setLastScannedStudentId(scanRes.studentId)
    } else if (students[0]?.id) {
      setLastScannedStudentId(students[0].id)
    }
    navigate({ to: '/pindai/konfirmasi' })
  }

  return (
    <div className="flex-1 flex flex-col justify-between bg-[#0E261F] text-white px-5 pt-5 pb-5">
      <div className="space-y-4">
        {/* Top Bar */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate({ to: '/beranda' })}
              aria-label="Kembali ke beranda"
              className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-extrabold leading-tight">
                Absen wajah
              </h1>
              <p className="text-xs text-[#9BB8AF] font-medium">
                Kelas {sessionSummary.namaKelas} • {sessionSummary.totalSiswa}{' '}
                siswa
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSimulateDenied((prev) => !prev)}
            title="Klik untuk menguji tampilan saat izin kamera ditolak / diizinkan"
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              simulateDenied
                ? 'bg-[#F97066]/20 text-[#FDA29B]'
                : 'text-[#9BB8AF] hover:bg-white/10 hover:text-white'
            }`}
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </header>

        {/* Instruction Heading */}
        <div className="space-y-1 pt-0.5">
          <h2 className="text-[19px] font-extrabold tracking-tight text-white">
            Arahkan kamera ke wajah murid
          </h2>
          <p className="text-xs text-[#9BB8AF] leading-relaxed">
            Pastikan wajah terlihat jelas dan tidak tertutup. Aplikasi akan
            mencocokkan wajah dengan data kelas.
          </p>
        </div>

        {/* WebRTC Camera Viewport */}
        <CameraViewport
          torchOn={torchOn}
          isMatching={true}
          onFaceMatched={handleFaceDetected}
          onManualFallback={() => setManualModalOpen(true)}
          forcePermissionDenied={simulateDenied}
        />

        {/* Flashlight / Torch Control Button */}
        <button
          type="button"
          onClick={() => setTorchOn((prev) => !prev)}
          className={`w-full py-3.5 px-4 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            torchOn
              ? 'bg-[#285E4E] border-[#6EE7B7] text-white shadow-sm'
              : 'bg-[#17362D] border-[#264E42] text-white hover:bg-[#1E4439]'
          }`}
        >
          <Flashlight className="w-4 h-4 stroke-[2]" />
          <span>{torchOn ? 'Matikan senter' : 'Nyalakan senter'}</span>
        </button>

        {/* Class Rule Info Box */}
        <div className="bg-[#153229] border border-[#23493E] rounded-2xl p-3.5 flex items-start gap-3">
          <ShieldCheck className="w-4.5 h-4.5 text-[#4ADE80] shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-white">
              Kelas {sessionSummary.namaKelas} • {dateInfo.short}
            </p>
            <p className="text-[11px] text-[#9BB8AF] leading-relaxed">
              {sessionSummary.totalSiswa} siswa • Batas masuk 07.30 WIB •
              Gunakan absen manual jika pengenalan wajah gagal.
            </p>
          </div>
        </div>
      </div>

      {/* Footer Fallback Link */}
      <div className="pt-4 pb-1 text-center">
        <p className="text-xs text-[#9BB8AF]">
          Pengenalan gagal?{' '}
          <button
            type="button"
            onClick={() => setManualModalOpen(true)}
            className="text-[#4ADE80] font-bold hover:underline cursor-pointer"
          >
            Absen manual
          </button>
        </p>
      </div>

      <ManualAttendanceModal
        isOpen={manualModalOpen}
        onClose={() => setManualModalOpen(false)}
        students={students}
        title="Pilih Siswa Secara Manual"
        onSelectAndSave={async (studentId, status) => {
          const catatan =
            status === 'hadir'
              ? 'Hadir manual'
              : status === 'izin'
                ? 'Surat izin'
                : status === 'sakit'
                  ? 'Surat sakit'
                  : 'Tanpa keterangan'
          await attendanceApi.recordAttendance({
            sessionId: sessionSummary.sessionId,
            studentId,
            status,
            metode: 'MANUAL',
            catatan,
          })
          setLastScannedStudentId(studentId)
          setManualModalOpen(false)
          navigate({ to: '/pindai/konfirmasi' })
        }}
      />
    </div>
  )
}
