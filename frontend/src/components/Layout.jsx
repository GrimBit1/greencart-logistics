import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { 
  HomeIcon, 
  PlayIcon, 
  TruckIcon, 
  MapIcon, 
  ClipboardDocumentListIcon,
  ArrowRightOnRectangleIcon,
  UserIcon
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Simulation', href: '/simulation', icon: PlayIcon },
  { name: 'Drivers', href: '/drivers', icon: TruckIcon },
  { name: 'Routes', href: '/routes', icon: MapIcon },
  { name: 'Orders', href: '/orders', icon: ClipboardDocumentListIcon },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const location = useLocation()

  const isActive = (href) => location.pathname === href

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className="flex flex-col w-64 bg-white shadow-lg">
        {/* Logo */}
        <div className="flex items-center h-16 px-6 border-b border-secondary-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <TruckIcon className="w-5 h-5 text-white" />
            </div>
            <div className="ml-3">
              <h1 className="text-lg font-semibold text-secondary-900">GreenCart</h1>
              <p className="text-xs text-secondary-500">Logistics</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200
                  ${isActive(item.href)
                    ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                    : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
                  }
                `}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* User section */}
        <div className="px-4 py-4 border-t border-secondary-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-secondary-200 rounded-full flex items-center justify-center">
                <UserIcon className="w-4 h-4 text-secondary-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-secondary-900">{user?.name}</p>
                <p className="text-xs text-secondary-500 capitalize">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-1 text-secondary-400 hover:text-secondary-600 transition-colors duration-200"
              title="Logout"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-secondary-200">
          <div className="px-6 py-4">
            <h2 className="text-xl font-semibold text-secondary-900 capitalize">
              {location.pathname.replace('/', '') || 'Dashboard'}
            </h2>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
