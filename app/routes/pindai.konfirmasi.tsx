import React, { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  Check,
  X,
  User,
  Clock,
  Camera,
} from 'lucide-react'
import {
  attendanceApi,
  getValidActiveClassId,
  getLastScannedStudentId,
  setLastScannedStudentId,
} from '~/lib/apiClient'
import { formatIndonesianDate, type AttendanceStatus } from '~/types/attendance'
import { StatusBadge } from '~/components/StatusBadge'
import { Button } from '~/components/Button'
import { BottomNavigation } from '~/components/BottomNavigation'
import { ManualAttendanceModal } from '~/components/ManualAttendanceModal'

export const Route = createFileRoute('/pindai/konfirmasi')({
  loader: async () => {
    const classId = await getValidActiveClassId()
    const lastId = getLastScannedStudentId()
    const { summary, students } =
      await attendanceApi.getLatestSessionForClass(classId)

    const matchedStudent =
      (lastId ? students.find((s) => s.id === lastId) : undefined) ??
      students.find((s) => s.absenNo === '24') ??
      students[0]

    return {
      sessionSummary: summary,
      student: matchedStudent,
      students,
      dateInfo: formatIndonesianDate(summary.tanggal),
    }
  },
  component: KonfirmasiKehadiranPage,
})

function KonfirmasiKehadiranPage() {
  const {
    sessionSummary,
    student: initialStudent,
    students: initialStudents,
    dateInfo,
  } = Route.useLoaderData()
  const navigate = useNavigate()
  const [students, setStudents] = useState(initialStudents)
  const [currentStudent, setCurrentStudent] = useState(initialStudent)
  const [selectedStatus, setSelectedStatus] = useState<AttendanceStatus>(
    initialStudent?.status && initialStudent.status !== 'belum_tercatat'
      ? initialStudent.status
      : 'hadir',
  )
  const [manualModalOpen, setManualModalOpen] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)

  React.useEffect(() => {
    if (currentStudent) {
      if (currentStudent.status && currentStudent.status !== 'belum_tercatat') {
        setSelectedStatus(currentStudent.status)
      } else {
        setSelectedStatus('hadir')
      }
    }
  }, [currentStudent])

  const handleConfirmPresent = async (goToNext = false) => {
    if (!currentStudent) return
    setIsConfirming(true)
    try {
      const isManual = selectedStatus !== 'hadir'
      const catatan =
        selectedStatus === 'hadir'
          ? 'Wajah cocok'
          : selectedStatus === 'izin'
            ? 'Surat izin'
            : selectedStatus === 'sakit'
              ? 'Surat sakit'
              : 'Tanpa keterangan'

      await attendanceApi.recordAttendance({
        sessionId: sessionSummary.sessionId,
        studentId: currentStudent.id,
        status: selectedStatus,
        metode: isManual ? 'MANUAL' : 'WAJAH',
        catatan,
      })
      if (goToNext) {
        navigate({ to: '/pindai' })
      } else {
        navigate({ to: '/sesi/tinjau' })
      }
    } finally {
      setIsConfirming(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col justify-between bg-white">
      <div className="px-5 pt-5 pb-5 space-y-4">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate({ to: '/pindai' })}
              aria-label="Kembali ke pindai wajah"
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#171D1B] hover:bg-black/5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-extrabold text-[#171D1B] leading-tight">
                Konfirmasi kehadiran
              </h1>
              <p className="text-[11px] text-[#6E6D68] font-medium">
                Periksa identitas siswa sebelum menandai Hadir
              </p>
            </div>
          </div>
        </header>

        {/* Center Hero Recognition Status */}
        <div className="flex flex-col items-center text-center pt-2 pb-1">
          <div className="w-20 h-20 rounded-full bg-[#E3F1EC] flex items-center justify-center mb-3">
            <div className="w-12 h-12 rounded-full bg-[#146350] text-white flex items-center justify-center shadow-sm">
              <Check className="w-6 h-6 stroke-[2.8]" />
            </div>
          </div>
          <h2 className="text-[22px] font-extrabold tracking-tight text-[#171D1B]">
            Identitas siswa dikenali
          </h2>
          <p className="text-xs text-[#6E6D68] max-w-[290px] leading-relaxed mt-1">
            Periksa data berikut sebelum menandai kehadiran. Pastikan identitas
            cocok sebelum melanjutkan.
          </p>
        </div>

        {/* Student Information Card */}
        {currentStudent && (
          <section className="bg-white rounded-3xl border border-[#E6E4DD] p-4.5 shadow-2xs space-y-3.5">
            <div className="flex items-start justify-between pb-3 border-b border-[#EFECE6]">
              <div>
                <h3 className="text-base font-extrabold text-[#171D1B]">
                  {currentStudent.name}
                </h3>
                <p className="text-xs text-[#6E6D68] font-medium mt-0.5">
                  NIS {currentStudent.nis} • No. absen {currentStudent.absenNo}
                </p>
              </div>
              <StatusBadge status={selectedStatus} />
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#6E6D68] font-medium">Tanggal</span>
                <span className="font-bold text-[#171D1B]">{dateInfo.full}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6E6D68] font-medium">Waktu scan</span>
                <span className="font-extrabold text-[#146350]">
                  {currentStudent.scanTime !== '-'
                    ? currentStudent.scanTime
                    : '07.12 WIB'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6E6D68] font-medium">Kelas</span>
                <span className="font-bold text-[#171D1B]">
                  {sessionSummary.namaKelas}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6E6D68] font-medium">
                  Metode absensi
                </span>
                <span className="font-bold text-[#171D1B]">
                  {selectedStatus === 'hadir' ? 'Pengenalan wajah' : 'Input manual'}
                </span>
              </div>
            </div>

            {/* Status Selection Options */}
            <div className="pt-3 border-t border-[#EFECE6] space-y-1.5">
              <label className="block text-xs font-bold text-[#4A4945]">
                Pilih status kehadiran:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: 'hadir', label: 'Hadir' },
                  { value: 'izin', label: 'Izin' },
                  { value: 'sakit', label: 'Sakit' },
                  { value: 'alpa', label: 'Alpa' },
                ].map((opt) => {
                  const isActive = selectedStatus === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setSelectedStatus(opt.value as AttendanceStatus)
                      }
                      className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                        isActive
                          ? 'bg-[#146350] text-white border-[#146350] shadow-xs'
                          : 'bg-white text-[#4A4945] border-[#E6E4DD] hover:border-[#146350]/40'
                      }`}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="pt-2.5 border-t border-[#EFECE6] flex items-center justify-center gap-1.5 text-[11px] text-[#6E6D68] font-medium">
              <Clock className="w-3.5 h-3.5 text-[#146350]" />
              <span>Belum disimpan — tunggu konfirmasi guru</span>
            </div>
          </section>
        )}

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-1">
          <Button
            variant="primary"
            disabled={isConfirming}
            icon={<Check className="w-4 h-4 stroke-[2.5]" />}
            onClick={() => handleConfirmPresent(false)}
          >
            {isConfirming
              ? 'Menyimpan...'
              : `Konfirmasi ${
                  selectedStatus === 'hadir'
                    ? 'Hadir'
                    : selectedStatus === 'izin'
                      ? 'Izin'
                      : selectedStatus === 'sakit'
                        ? 'Sakit'
                        : 'Alpa'
                } & Selesai`}
          </Button>

          <Button
            variant="secondary"
            disabled={isConfirming}
            icon={<Camera className="w-4 h-4 stroke-[2]" />}
            onClick={() => handleConfirmPresent(true)}
          >
            Konfirmasi & Pindai Siswa Berikutnya
          </Button>

          <Button
            variant="outline"
            icon={<X className="w-4 h-4 stroke-[2.3]" />}
            onClick={() => navigate({ to: '/pindai' })}
          >
            Tolak / pindai ulang
          </Button>

          <Button
            variant="ghost"
            icon={<User className="w-4 h-4 stroke-[2.2]" />}
            onClick={() => setManualModalOpen(true)}
          >
            Pilih manual
          </Button>
        </div>
      </div>

      <BottomNavigation variant="default" />

      <ManualAttendanceModal
        isOpen={manualModalOpen}
        onClose={() => setManualModalOpen(false)}
        students={students}
        initialStudentId={currentStudent?.id}
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
          const refreshed = await attendanceApi.getLatestSessionForClass(
            sessionSummary.classId,
          )
          setStudents(refreshed.students)
          const picked = refreshed.students.find((s) => s.id === studentId)
          if (picked) {
            setCurrentStudent(picked)
            setSelectedStatus(status)
          }
          setManualModalOpen(false)
        }}
      />
    </div>
  )
}
