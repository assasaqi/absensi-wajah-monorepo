import React, { useState } from 'react'
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { Calendar } from 'lucide-react'
import {
  attendanceApi,
  getActiveClassId,
  setActiveClassId,
  getValidActiveClassId,
} from '~/lib/apiClient'
import { BottomNavigation } from '~/components/BottomNavigation'

export const Route = createFileRoute('/beranda')({
  loader: async () => {
    const classId = await getValidActiveClassId()
    const [teacher, classes] = await Promise.all([
      attendanceApi.getTeacherProfile(),
      attendanceApi.getActiveClasses(),
    ])
    const initialSelectedClassId =
      classes.find((c) => c.id === classId)?.id ?? classes[0]?.id ?? 1
    setActiveClassId(initialSelectedClassId)

    return {
      teacher,
      classes,
      initialSelectedClassId,
    }
  },
  component: BerandaPage,
})

function BerandaPage() {
  const { teacher, classes, initialSelectedClassId } = Route.useLoaderData()
  const navigate = useNavigate()
  const [selectedClassId, setSelectedClassId] = useState<number>(
    initialSelectedClassId,
  )

  const activeClass =
    classes.find((c) => c.id === selectedClassId) ?? classes[0]

  const isAdmin =
    teacher.name.toLowerCase().includes('admin') ||
    teacher.nip === '198001012005011003' ||
    (teacher as { role?: string }).role === 'ADMIN'

  return (
    <div className="flex-1 flex flex-col justify-between bg-white">
      <div className="px-5 pt-6 pb-6 space-y-4">
        {/* Header: Avatar on Left, Greeting and Name to its right */}
        <header className="flex items-center gap-3.5 pt-1">
          <Link
            to="/profil"
            aria-label="Lihat profil"
            className="w-12 h-12 rounded-full bg-[#E2F2EC] text-[#146350] font-extrabold text-base flex items-center justify-center border border-[#CBE7DC] hover:scale-105 transition-transform cursor-pointer shadow-2xs shrink-0"
          >
            {teacher.initials}
          </Link>
          <div>
            <p className="text-[11px] text-[#6E6D68] font-medium leading-none mb-1">
              {isAdmin ? 'Selamat datang,' : 'Selamat pagi,'}
            </p>
            <h1 className="text-base font-extrabold tracking-tight text-[#171D1B] leading-tight">
              {teacher.name}
            </h1>
          </div>
        </header>

        {/* Active Class Card */}
        {activeClass && (
          <section className="bg-[#146350] text-white rounded-3xl p-4.5 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-white/80">
              <span className="text-[11px] font-bold tracking-wider uppercase">
                {teacher.currentDateUpper}
              </span>
              <Calendar className="w-4 h-4 stroke-[2]" />
            </div>

            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs text-white/80 font-medium">Kelas aktif</p>
                <h3 className="text-2xl font-extrabold tracking-tight mt-0.5">
                  {activeClass.name}
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#FBF0D9] text-[#8C5411] text-xs font-bold">
                {activeClass.studentCount} siswa
              </span>
            </div>
          </section>
        )}
      </div>

      <BottomNavigation variant="default" />
    </div>
  )
}
