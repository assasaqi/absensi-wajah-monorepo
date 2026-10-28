import React, { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { RefreshCw } from 'lucide-react'
import {
  attendanceApi,
  getValidActiveClassId,
} from '~/lib/apiClient'
import { formatIndonesianDate } from '~/types/attendance'
import { StatCard } from '~/components/StatCard'
import { StatusBadge } from '~/components/StatusBadge'
import { Button } from '~/components/Button'
import { BottomNavigation } from '~/components/BottomNavigation'
import { ManualAttendanceModal } from '~/components/ManualAttendanceModal'

export const Route = createFileRoute('/sesi/tinjau')({
  loader: async () => {
    const classId = await getValidActiveClassId()
    const [teacher, sessionData] = await Promise.all([
      attendanceApi.getTeacherProfile(),
      attendanceApi.getLatestSessionForClass(classId),
    ])
    return {
      teacher,
      initialSummary: sessionData.summary,
      initialStudents: sessionData.students,
      dateInfo: formatIndonesianDate(sessionData.summary.tanggal),
    }
  },
  component: TinjauSesiPage,
})

function TinjauSesiPage() {
  const { teacher, initialSummary, initialStudents, dateInfo } =
    Route.useLoaderData()
  const navigate = useNavigate()
  const [summary, setSummary] = useState(initialSummary)
  const [students, setStudents] = useState(initialStudents)
  const [teacherNote, setTeacherNote] = useState(
    initialSummary.catatanGuru || '',
  )
  const [editingStudentId, setEditingStudentId] = useState<number | undefined>(
    undefined,
  )
  const [modalOpen, setModalOpen] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)

  const handleSaveSession = async () => {
    setIsCompleting(true)
    try {
      await attendanceApi.completeSession(summary.sessionId, teacherNote)
      navigate({ to: '/absensi' })
    } finally {
      setIsCompleting(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col justify-between bg-white">
      <div className="px-5 pt-5 pb-5 space-y-4">
        {/* Header */}
        <header className="flex items-start justify-between">
          <div>
            <h1 className="text-[22px] font-extrabold tracking-tight text-[#171D1B] leading-tight">
              Tinjau sesi absensi
            </h1>
            <p className="text-xs text-[#6E6D68] font-medium mt-0.5">
              {teacher.name} • {summary.namaKelas} • {dateInfo.full}
            </p>
          </div>
        </header>

        {/* Class Attendance Progress Card */}
        <section className="bg-[#E3F1EC] rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold text-[#146350]">
                Kehadiran kelas
              </p>
              <p className="text-xs text-[#146350]/85 font-medium mt-0.5">
                {summary.totalTercatat} dari {summary.totalSiswa} siswa tercatat
              </p>
            </div>
            <span className="text-3xl font-extrabold text-[#146350] tracking-tight">
              {summary.persentase}%
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-[#C5E0D6] overflow-hidden">
            <div
              className="h-full bg-[#146350] rounded-full transition-all duration-300"
              style={{ width: `${summary.persentase}%` }}
            />
          </div>
        </section>

        {/* 4 Numeric Stat Cards */}
        <section className="grid grid-cols-4 gap-2">
          <StatCard value={summary.totalHadir} label="Hadir" variant="hadir" />
          <StatCard value={summary.totalIzin} label="Izin" variant="izin" />
          <StatCard value={summary.totalSakit} label="Sakit" variant="sakit" />
          <StatCard
            value={summary.totalBelumTercatat}
            label="Belum tercatat"
            variant="belum_tercatat"
          />
        </section>

        {/* Scan Results List */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-[#171D1B]">
              Hasil pemindaian wajah
            </h2>
            <span className="text-xs font-bold text-[#146350]">
              {summary.totalSiswa} siswa
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-[#E6E4DD] divide-y divide-[#EFECE6] overflow-hidden">
            {students.map((st) => (
              <div
                key={st.id}
                onClick={() => {
                  setEditingStudentId(st.id)
                  setModalOpen(true)
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setEditingStudentId(st.id)
                    setModalOpen(true)
                  }
                }}
                className="px-3.5 py-2.5 flex items-center justify-between gap-3 hover:bg-[#FAF9F6] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 text-center shrink-0">
                    <p className="text-base font-extrabold text-[#171D1B] leading-none">
                      {st.dateDay}
                    </p>
                    <p className="text-[9px] font-bold text-[#6E6D68] uppercase mt-0.5">
                      {st.dateMonth}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-[#171D1B] truncate">
                      {st.name} {st.absenNo}
                    </p>
                    <p className="text-[11px] text-[#6E6D68] leading-snug truncate">
                      {st.sessionNote}
                    </p>
                  </div>
                </div>
                <StatusBadge status={st.status} variantStyle="session" />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-[#6E6D68] pt-0.5">
            <RefreshCw className="w-3 h-3" />
            <span>Data langsung dari sesi kehadiran aktif</span>
          </div>
        </section>

        {/* Teacher Note Card */}
        <section className="bg-white rounded-2xl border border-[#E6E4DD] p-3.5 space-y-1">
          <label
            htmlFor="catatan-guru"
            className="block text-xs font-extrabold text-[#171D1B]"
          >
            Catatan guru
          </label>
          <textarea
            id="catatan-guru"
            rows={2}
            value={teacherNote}
            onChange={(e) => setTeacherNote(e.target.value)}
            className="w-full text-xs text-[#6E6D68] leading-relaxed bg-transparent resize-none focus:outline-none focus:text-[#171D1B]"
            placeholder="Tambahkan catatan sesi absensi..."
          />
        </section>

        {/* Primary Action Button */}
        <Button
          variant="primary"
          size="lg"
          disabled={isCompleting}
          onClick={handleSaveSession}
        >
          {isCompleting ? 'Menyimpan...' : 'Simpan hasil sesi'}
        </Button>
      </div>

      <BottomNavigation variant="default" />

      <ManualAttendanceModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        students={students}
        initialStudentId={editingStudentId}
        title="Ubah Status Kehadiran Siswa"
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
            sessionId: summary.sessionId,
            studentId,
            status,
            metode: 'MANUAL',
            catatan,
          })
          const refreshed = await attendanceApi.getLatestSessionForClass(
            summary.classId,
          )
          setSummary(refreshed.summary)
          setStudents(refreshed.students)
          setModalOpen(false)
        }}
      />
    </div>
  )
}
