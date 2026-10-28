import React, { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
  CalendarCheck,
  BarChart3,
  ScanFace,
  LogOut,
  Camera,
} from 'lucide-react'
import { attendanceApi, getValidActiveClassId } from '~/lib/apiClient'
import { BottomNavigation } from '~/components/BottomNavigation'
import { Button } from '~/components/Button'
import { FaceEnrollmentModal } from '~/components/FaceEnrollmentModal'
import { FaceEnrollmentListModal } from '~/components/FaceEnrollmentListModal'
import { ConfirmModal } from '~/components/ConfirmModal'
import type { StudentAttendance } from '~/types/attendance'

export const Route = createFileRoute('/profil')({
  loader: async () => {
    const classId = await getValidActiveClassId()
    const [teacher, sessionData] = await Promise.all([
      attendanceApi.getTeacherProfile(),
      attendanceApi.getLatestSessionForClass(classId),
    ])
    return {
      teacher,
      students: sessionData.students,
    }
  },
  component: ProfilGuruPage,
})

function ProfilGuruPage() {
  const { teacher, students } = Route.useLoaderData()
  const navigate = useNavigate()
  const [studentList, setStudentList] = useState(students)
  const [selectedEnrollmentStudent, setSelectedEnrollmentStudent] = useState<
    StudentAttendance | undefined
  >(undefined)
  const [showEnrollmentList, setShowEnrollmentList] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const isAdmin =
    teacher.name.toLowerCase().includes('admin') ||
    teacher.nip === '198001012005011003' ||
    (teacher as { role?: string }).role === 'ADMIN'

  const handleLogout = () => {
    setShowLogoutConfirm(true)
  }

  const executeLogout = () => {
    setShowLogoutConfirm(false)
    attendanceApi.logout()
  }

  return (
    <div className="flex-1 flex flex-col justify-between bg-white">
      <div className="px-5 pt-6 pb-5 space-y-4">
        {/* Top Profile Header */}
        <header className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-full bg-[#E2F2EC] text-[#146350] font-extrabold text-base flex items-center justify-center border border-[#CBE7DC] shrink-0">
              {teacher.initials}
            </div>
            <div className="space-y-0.5">
              <h1 className="text-base font-extrabold text-[#171D1B] leading-tight">
                {teacher.name}
              </h1>
              <p className="text-[11px] text-[#6E6D68] font-medium leading-tight">
                NIP {teacher.nip}
              </p>
            </div>
          </div>
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase shrink-0 ${
              isAdmin
                ? 'bg-[#E9ECF8] text-[#283593]'
                : 'bg-[#E2F2EC] text-[#146350]'
            }`}
          >
            {isAdmin ? 'ADMIN' : teacher.subject}
          </span>
        </header>

        {/* Pendaftaran Wajah Siswa (Tombol Langsung) */}
        <Button
          variant="secondary"
          size="md"
          icon={<Camera className="w-4 h-4 text-[#146350]" />}
          onClick={() => setShowEnrollmentList(true)}
          className="border border-[#E6E4DD] bg-white hover:bg-[#FAF9F6] text-[#171D1B] text-xs font-bold shadow-2xs py-3"
        >
          Pendaftaran Wajah Siswa
        </Button>

        {/* Horizontal Navigation Cards with Short Titles */}
        <section className="grid grid-cols-2 gap-2.5">
          <Link
            to="/pindai"
            className="bg-white rounded-2xl border border-[#E6E4DD] p-3 flex items-center gap-2.5 hover:border-[#146350] hover:bg-[#F9FAF8] shadow-2xs transition-all cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-[#E3F1EC] text-[#146350] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <ScanFace className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#171D1B] truncate group-hover:text-[#146350] transition-colors">
                Pindai Wajah
              </p>
              <p className="text-[10px] text-[#6E6D68] font-medium">Kamera Presensi</p>
            </div>
          </Link>

          <Link
            to="/sesi/tinjau"
            className="bg-white rounded-2xl border border-[#E6E4DD] p-3 flex items-center gap-2.5 hover:border-[#146350] hover:bg-[#F9FAF8] shadow-2xs transition-all cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-[#E3F1EC] text-[#146350] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <CalendarCheck className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#171D1B] truncate group-hover:text-[#146350] transition-colors">
                Tinjau Sesi
              </p>
              <p className="text-[10px] text-[#6E6D68] font-medium">Hasil Absensi</p>
            </div>
          </Link>

          <Link
            to="/absensi"
            className="bg-white rounded-2xl border border-[#E6E4DD] p-3 flex items-center gap-2.5 hover:border-[#146350] hover:bg-[#F9FAF8] shadow-2xs transition-all cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-[#E9ECF8] text-[#283593] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <CalendarCheck className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#171D1B] truncate group-hover:text-[#283593] transition-colors">
                Absensi Kelas
              </p>
              <p className="text-[10px] text-[#6E6D68] font-medium">Status Harian</p>
            </div>
          </Link>

          <Link
            to="/rekap"
            className="bg-white rounded-2xl border border-[#E6E4DD] p-3 flex items-center gap-2.5 hover:border-[#146350] hover:bg-[#F9FAF8] shadow-2xs transition-all cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-[#FBF0D9] text-[#8C5411] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <BarChart3 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#171D1B] truncate group-hover:text-[#8C5411] transition-colors">
                Rekap Absensi
              </p>
              <p className="text-[10px] text-[#6E6D68] font-medium">Laporan Bulanan</p>
            </div>
          </Link>
        </section>

        {/* Logout Action (Paling Bawah Sebelah Kiri) */}
        <div className="pt-3 flex justify-start">
          <Button
            variant="ghost"
            size="sm"
            fullWidth={false}
            className="text-[#B42318] hover:bg-[#FBE6E5] border border-[#FBE6E5] px-4 py-2 text-xs font-bold"
            icon={<LogOut className="w-4 h-4" />}
            onClick={handleLogout}
          >
            Keluar
          </Button>
        </div>
      </div>

      <BottomNavigation />

      {/* Face Enrollment Students List Modal */}
      <FaceEnrollmentListModal
        isOpen={showEnrollmentList}
        onClose={() => setShowEnrollmentList(false)}
        students={studentList}
        onSelectStudent={(st) => {
          setSelectedEnrollmentStudent(st)
        }}
      />

      {/* Face Enrollment Capture Modal */}
      <FaceEnrollmentModal
        isOpen={!!selectedEnrollmentStudent}
        onClose={() => setSelectedEnrollmentStudent(undefined)}
        student={selectedEnrollmentStudent}
        onSuccess={() => {
          if (selectedEnrollmentStudent) {
            setStudentList((prev) =>
              prev.map((s) =>
                s.id === selectedEnrollmentStudent.id
                  ? { ...s, method: 'WAJAH' }
                  : s,
              ),
            )
          }
        }}
      />

      {/* Custom Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={executeLogout}
        title="Keluar?"
        description="Apakah Anda yakin ingin keluar? Sesi Anda akan berakhir dan Anda perlu masuk kembali menggunakan NIP dan kata sandi."
        confirmText="Ya, Keluar"
        cancelText="Batal"
        isDestructive
      />
    </div>
  )
}
