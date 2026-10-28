import React, { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  ScanQrCode,
  Info,
  ArrowRight,
  Search,
  X,
  Camera,
} from 'lucide-react'
import {
  attendanceApi,
  getActiveClassId,
  setActiveClassId,
  getValidActiveClassId,
} from '~/lib/apiClient'
import {
  formatIndonesianDate,
  type AttendanceStatus,
  type StudentAttendance,
} from '~/types/attendance'
import { StatCard } from '~/components/StatCard'
import { StatusBadge } from '~/components/StatusBadge'
import { BottomNavigation } from '~/components/BottomNavigation'
import { ManualAttendanceModal } from '~/components/ManualAttendanceModal'
import { StudentDetailModal } from '~/components/StudentDetailModal'
import { FaceEnrollmentModal } from '~/components/FaceEnrollmentModal'
import { CustomDropdown } from '~/components/CustomDropdown'

export const Route = createFileRoute('/absensi')({
  loader: async () => {
    const classId = await getValidActiveClassId()
    const [teacher, classes, sessionData] = await Promise.all([
      attendanceApi.getTeacherProfile(),
      attendanceApi.getActiveClasses(),
      attendanceApi.getLatestSessionForClass(classId),
    ])
    return {
      teacher,
      classes,
      initialClassId: classId,
      initialSummary: sessionData.summary,
      initialStudents: sessionData.students,
    }
  },
  component: AbsensiKelasHarianPage,
})

function AbsensiKelasHarianPage() {
  const {
    teacher,
    classes,
    initialClassId,
    initialSummary,
    initialStudents,
  } = Route.useLoaderData()
  const navigate = useNavigate()
  const [selectedClassId, setSelectedClassId] = useState<number>(initialClassId)
  const [summary, setSummary] = useState(initialSummary)
  const [students, setStudents] = useState(initialStudents)
  const [statusFilter, setStatusFilter] = useState<'all' | AttendanceStatus>(
    'all',
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [showAllStudents, setShowAllStudents] = useState(false)

  // Modals state
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<
    StudentAttendance | undefined
  >(undefined)
  const [editingStudentId, setEditingStudentId] = useState<number | undefined>(
    undefined,
  )
  const [modalOpen, setModalOpen] = useState(false)
  const [faceEnrollmentStudent, setFaceEnrollmentStudent] = useState<
    StudentAttendance | undefined
  >(undefined)

  const activeClass =
    classes.find((c) => c.id === selectedClassId) ?? classes[0]
  const dateInfo = formatIndonesianDate(summary.tanggal)

  const isAdmin =
    teacher.name.toLowerCase().includes('admin') ||
    teacher.nip === '198001012005011003' ||
    (teacher as { role?: string }).role === 'ADMIN'

  const handleClassChange = async (newClassId: number) => {
    setSelectedClassId(newClassId)
    setActiveClassId(newClassId)
    const refreshed = await attendanceApi.getLatestSessionForClass(newClassId)
    setSummary(refreshed.summary)
    setStudents(refreshed.students)
  }

  // Filter based on status and search query
  const filteredStudents = students.filter((s) => {
    const matchStatus = statusFilter === 'all' || s.status === statusFilter
    const q = searchQuery.toLowerCase().trim()
    const matchSearch =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.nis.toLowerCase().includes(q) ||
      s.absenNo.includes(q)
    return matchStatus && matchSearch
  })

  const visibleStudents =
    showAllStudents || searchQuery.trim().length > 0
      ? filteredStudents
      : filteredStudents.slice(0, 5)

  return (
    <div className="flex-1 flex flex-col justify-between bg-white">
      <div className="px-5 pt-5 pb-5 space-y-4">
        {/* Header */}
        <header className="flex items-start justify-between">
          <div>
            <h1 className="text-[22px] font-extrabold tracking-tight text-[#171D1B] leading-tight">
              Absensi kelas
            </h1>
            <p className="text-xs text-[#6E6D68] font-medium mt-0.5">
              {teacher.name} • {isAdmin ? `Kelas ${activeClass?.name}` : `Wali kelas ${activeClass?.name}`}
            </p>
          </div>
        </header>

        {/* Date and Time Header */}
        <div className="flex items-center justify-between pt-0.5">
          <h2 className="text-sm font-extrabold text-[#171D1B]">
            {dateInfo.full}
          </h2>
          <span className="text-xs text-[#6E6D68] font-medium">07.30 WIB</span>
        </div>

        {/* Class Filter Dropdown & Quick Action Button */}
        <div className="flex items-center gap-2.5">
          <div className="flex-1">
            <CustomDropdown
              value={selectedClassId}
              onChange={(val) => handleClassChange(Number(val))}
              options={classes.map((cls) => ({
                value: cls.id,
                label: cls.name,
              }))}
              ariaLabel="Pilih kelas"
            />
          </div>

          <button
            type="button"
            onClick={() => navigate({ to: '/pindai' })}
            className="px-3.5 py-2.5 rounded-xl bg-[#146350] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-[#0F5242] transition-colors shrink-0 cursor-pointer shadow-2xs"
          >
            <ScanQrCode className="w-4 h-4" />
            <span>Pindai wajah</span>
          </button>
        </div>

        {/* 4 Numeric Stat Cards */}
        <section className="grid grid-cols-4 gap-2">
          <StatCard
            value={summary.totalHadir}
            label="Hadir"
            variant="hadir"
            active={statusFilter === 'hadir'}
            onClick={() =>
              setStatusFilter((prev) => (prev === 'hadir' ? 'all' : 'hadir'))
            }
          />
          <StatCard
            value={summary.totalIzin}
            label="Izin"
            variant="izin"
            active={statusFilter === 'izin'}
            onClick={() =>
              setStatusFilter((prev) => (prev === 'izin' ? 'all' : 'izin'))
            }
          />
          <StatCard
            value={summary.totalSakit}
            label="Sakit"
            variant="sakit"
            active={statusFilter === 'sakit'}
            onClick={() =>
              setStatusFilter((prev) => (prev === 'sakit' ? 'all' : 'sakit'))
            }
          />
          <StatCard
            value={summary.totalAlpa}
            label="Alpa"
            variant="alpa"
            active={statusFilter === 'alpa'}
            onClick={() =>
              setStatusFilter((prev) => (prev === 'alpa' ? 'all' : 'alpa'))
            }
          />
        </section>

        {/* Search Bar Feature */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#6E6D68] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama atau nomor absen siswa..."
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-white border border-[#E6E4DD] text-xs font-medium text-[#171D1B] placeholder:text-[#6E6D68] focus:outline-none focus:border-[#146350] transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#6E6D68] hover:text-[#171D1B]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Student Status List */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-[#171D1B]">
              Status siswa
            </h3>
            {(statusFilter !== 'all' || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('all')
                  setSearchQuery('')
                }}
                className="text-xs font-bold text-[#146350] hover:underline cursor-pointer"
              >
                Reset filter
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-[#E6E4DD] divide-y divide-[#EFECE6] overflow-hidden">
            {visibleStudents.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#6E6D68]">
                Tidak ada siswa yang sesuai dengan kriteria pencarian
              </div>
            ) : (
              visibleStudents.map((st) => {
                const avatarColors = {
                  mint: 'bg-[#E5F3EC] text-[#146350]',
                  indigo: 'bg-[#E9ECF8] text-[#283593]',
                  amber: 'bg-[#FBF0D9] text-[#8C5411]',
                  stone: 'bg-[#EFECE6] text-[#4A4945]',
                }
                return (
                  <div
                    key={st.id}
                    onClick={() => setSelectedStudentForDetail(st)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setSelectedStudentForDetail(st)
                      }
                    }}
                    className="px-3.5 py-3 flex items-center justify-between gap-3 hover:bg-[#FAF9F6] transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 ${
                          avatarColors[st.avatarColor]
                        }`}
                      >
                        {st.initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-[#171D1B] truncate group-hover:text-[#146350] transition-colors">
                          {st.name}
                        </p>
                        <p className="text-[11px] text-[#6E6D68] font-medium truncate mt-0.5">
                          {st.note}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={st.status} variantStyle="daily" />
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {!searchQuery && (
            <div className="flex items-center justify-between pt-1 text-[11px]">
              <span className="text-[#6E6D68] font-medium">
                Menampilkan {visibleStudents.length} dari {summary.totalSiswa}{' '}
                siswa
              </span>
              <button
                type="button"
                onClick={() => setShowAllStudents((prev) => !prev)}
                className="inline-flex items-center gap-1 font-bold text-[#146350] hover:underline cursor-pointer"
              >
                <span>
                  {showAllStudents ? 'Tampilkan ringkas' : 'Lihat semua siswa'}
                </span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </section>

        {/* Saved Review Notification Banner */}
        <div className="bg-[#EEF0FA] border border-[#DCE1F6] rounded-2xl p-3.5 flex items-start gap-2.5 text-[#283593]">
          <Info className="w-4 h-4 shrink-0 mt-0.5 stroke-[2.2]" />
          <div className="space-y-1">
            <p className="text-[11px] font-medium leading-relaxed">
              Ketuk baris siswa untuk melihat detail kehadiran atau mengubah
              status kehadiran secara manual.
            </p>
            <Link
              to="/rekap"
              className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#146350] hover:underline"
            >
              <span>Buka Rekap Absensi Bulanan</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      <BottomNavigation />

      {/* Student Detail Modal */}
      <StudentDetailModal
        isOpen={!!selectedStudentForDetail}
        onClose={() => setSelectedStudentForDetail(undefined)}
        student={selectedStudentForDetail}
        onOpenManualStatus={(studentId) => {
          setEditingStudentId(studentId)
          setModalOpen(true)
        }}
        onOpenFaceEnrollment={(student) => {
          setFaceEnrollmentStudent(student)
        }}
      />

      {/* Manual Status Attendance Modal */}
      <ManualAttendanceModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        students={students}
        initialStudentId={editingStudentId}
        title="Ubah Status Kehadiran Manual"
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
            selectedClassId,
          )
          setSummary(refreshed.summary)
          setStudents(refreshed.students)
          setModalOpen(false)
        }}
      />

      {/* Face Enrollment Modal */}
      <FaceEnrollmentModal
        isOpen={!!faceEnrollmentStudent}
        onClose={() => setFaceEnrollmentStudent(undefined)}
        student={faceEnrollmentStudent}
        onSuccess={async () => {
          const refreshed = await attendanceApi.getLatestSessionForClass(
            selectedClassId,
          )
          setStudents(refreshed.students)
        }}
      />
    </div>
  )
}
