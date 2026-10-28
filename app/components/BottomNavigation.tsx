import React from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { Home, Scan, CalendarCheck2, User } from 'lucide-react'

export interface BottomNavigationProps {
  variant?: 'default' | 'absensi' | 'rekap'
}

export function BottomNavigation({ variant = 'default' }: BottomNavigationProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  const tabs = [
    {
      label: 'Beranda',
      to: '/beranda',
      icon: Home,
      isActive:
        pathname === '/' ||
        pathname === '/beranda' ||
        pathname.startsWith('/pindai/konfirmasi'),
    },
    {
      label: 'Pindai',
      to: '/pindai',
      icon: Scan,
      isActive: pathname === '/pindai',
    },
    {
      label: 'Absensi',
      to: '/absensi',
      icon: CalendarCheck2,
      isActive:
        pathname.startsWith('/sesi') ||
        pathname.startsWith('/absensi') ||
        pathname.startsWith('/rekap'),
    },
    {
      label: 'Profil',
      to: '/profil',
      icon: User,
      isActive: pathname === '/profil',
    },
  ]

  return (
    <nav
      aria-label="Navigasi bawah"
      className="sticky bottom-0 z-30 bg-white border-t border-[#E6E4DD] px-3 py-2.5 select-none"
    >
      <div className="grid grid-cols-4 items-center max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <Link
              key={tab.label}
              to={tab.to}
              className={`flex flex-col items-center gap-1 py-0.5 text-[11px] transition-colors ${
                tab.isActive
                  ? 'text-[#146350] font-bold'
                  : 'text-[#6E6D68] font-medium hover:text-[#146350]'
              }`}
            >
              <div
                className={`px-4 py-1 rounded-full flex items-center justify-center transition-colors ${
                  tab.isActive ? 'bg-[#E2F2EC] text-[#146350]' : ''
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${
                    tab.isActive ? 'stroke-[2.2]' : 'stroke-[1.8]'
                  }`}
                />
              </div>
              <span>{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
