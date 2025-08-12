import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { TruckIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { user, login } = useAuth()

  // Demo credentials state
  const [showDemo, setShowDemo] = useState(false)

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    const result = await login(email, password)
    
    setLoading(false)
    
    if (!result.success) {
      // Error is already handled in the login function with toast
    }
  }

  const fillDemoCredentials = (role) => {
    if (role === 'manager') {
      setEmail('manager@greencart.com')
      setPassword('manager123')
    } else {
      setEmail('admin@greencart.com')
      setPassword('admin123')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center">
            <TruckIcon className="w-8 h-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-secondary-900">
            Welcome to GreenCart
          </h2>
          <p className="mt-2 text-sm text-secondary-600">
            Eco-friendly delivery management platform
          </p>
        </div>

        {/* Demo Credentials */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-blue-800">Demo Credentials</h3>
            <button
              onClick={() => setShowDemo(!showDemo)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              {showDemo ? 'Hide' : 'Show'}
            </button>
          </div>
          {showDemo && (
            <div className="space-y-2 text-xs text-blue-700">
              <div className="flex justify-between items-center">
                <span>Manager:</span>
                <button 
                  onClick={() => fillDemoCredentials('manager')}
                  className="bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded"
                >
                  Use Manager Login
                </button>
              </div>
              <div className="flex justify-between items-center">
                <span>Admin:</span>
                <button 
                  onClick={() => fillDemoCredentials('admin')}
                  className="bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded"
                >
                  Use Admin Login
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="label">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input-field"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="input-field pr-10"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-4 w-4 text-secondary-400" />
                  ) : (
                    <EyeIcon className="h-4 w-4 text-secondary-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-secondary-500">
            © 2024 GreenCart Logistics. Built for eco-friendly delivery management.
          </p>
        </div>
      </div>
    </div>
  )
}
