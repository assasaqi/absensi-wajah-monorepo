import React from 'react'
import {
  createRootRoute,
  Outlet,
  useRouter,
  useRouterState,
} from '@tanstack/react-router'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { ToastContainer } from '~/components/ToastContainer'

export const Route = createRootRoute({
  component: RootLayout,
  errorComponent: RootErrorBoundary,
})

function RootLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isDarkScreen = pathname === '/pindai'

  return (
    <div
      className={`min-h-screen w-full transition-colors duration-200 ${
        isDarkScreen
          ? 'bg-[#0E261F] text-white'
          : 'bg-[#E9E9EB] text-[#171D1B]'
      }`}
    >
      <ToastContainer />
      <div
        className={`w-full max-w-md min-h-screen mx-auto flex flex-col transition-all ${
          isDarkScreen
            ? 'bg-[#0E261F] text-white shadow-2xl'
            : 'bg-white text-[#171D1B] shadow-xl sm:border-x sm:border-[#DFDFE4]'
        }`}
      >
        <Outlet />
      </div>
    </div>
  )
}

function RootErrorBoundary({ error }: { error: Error }) {
  const router = useRouter()

  return (
    <div className="min-h-screen w-full bg-[#F8F7F3] text-[#171D1B] flex items-center justify-center p-5">
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#E6E4DD] p-6 shadow-xs text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-[#FBE6E5] text-[#B42318] flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-lg font-extrabold text-[#171D1B]">
            Koneksi Database MySQL Diperlukan
          </h1>
          <p className="text-xs text-[#6E6D68] leading-relaxed">
            {error.message ||
              'Tidak dapat mengambil data dari server MySQL. Pastikan layanan MySQL aktif dan skema sudah di-push.'}
          </p>
        </div>

        <div className="bg-[#F8F7F3] rounded-2xl p-3.5 text-left text-[11px] font-mono text-[#4A4945] space-y-1 border border-[#E6E4DD]">
          <p className="font-sans font-bold text-[#171D1B] mb-1">
            Langkah persiapan MySQL:
          </p>
          <p>1. Pastikan MySQL berjalan & cek DATABASE_URL di .env</p>
          <p>2. npm run db:push</p>
          <p>3. npm run db:seed</p>
        </div>

        <button
          type="button"
          onClick={() => router.invalidate()}
          className="w-full py-3 px-4 rounded-2xl bg-[#146350] text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#0F5242] transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Coba Muat Ulang</span>
        </button>
      </div>
    </div>
  )
}
