import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  TruckIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

export default function Drivers() {
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingDriver, setEditingDriver] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    currentShiftHours: 0,
    past7DayWorkHours: 0
  })

  useEffect(() => {
    fetchDrivers()
  }, [searchTerm])

  const fetchDrivers = async () => {
    try {
      const params = new URLSearchParams({
        limit: '50',
        ...(searchTerm && { search: searchTerm })
      })
      
      const response = await axios.get(`/api/drivers?${params}`)
      setDrivers(response.data.drivers)
    } catch (error) {
      console.error('Error fetching drivers:', error)
      toast.error('Failed to load drivers')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      if (editingDriver) {
        await axios.put(`/api/drivers/${editingDriver._id}`, formData)
        toast.success('Driver updated successfully')
      } else {
        await axios.post('/api/drivers', formData)
        toast.success('Driver created successfully')
      }
      
      setShowModal(false)
      setEditingDriver(null)
      resetForm()
      fetchDrivers()
    } catch (error) {
      const message = error.response?.data?.error || 'Operation failed'
      toast.error(message)
    }
  }

  const handleEdit = (driver) => {
    setEditingDriver(driver)
    setFormData({
      name: driver.name,
      email: driver.email || '',
      phone: driver.phone || '',
      currentShiftHours: driver.currentShiftHours,
      past7DayWorkHours: driver.past7DayWorkHours
    })
    setShowModal(true)
  }

  const handleDelete = async (driver) => {
    if (!confirm(`Are you sure you want to delete ${driver.name}?`)) {
      return
    }

    try {
      await axios.delete(`/api/drivers/${driver._id}`)
      toast.success('Driver deleted successfully')
      fetchDrivers()
    } catch (error) {
      const message = error.response?.data?.error || 'Delete failed'
      toast.error(message)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      currentShiftHours: 0,
      past7DayWorkHours: 0
    })
  }

  const openCreateModal = () => {
    setEditingDriver(null)
    resetForm()
    setShowModal(true)
  }

  const getWorkloadBadge = (hours) => {
    if (hours > 40) {
      return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">High</span>
    } else if (hours > 20) {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">Medium</span>
    } else {
      return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Low</span>
    }
  }

  const isFatigued = (driver) => {
    // Simple fatigue check based on current shift hours
    return driver.currentShiftHours > 8
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Drivers</h1>
          <p className="text-secondary-600">Manage your delivery drivers</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary flex items-center">
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Driver
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400" />
        <input
          type="text"
          placeholder="Search drivers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 input-field max-w-md"
        />
      </div>

      {/* Drivers List */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Driver
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Current Shift
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Weekly Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-200">
              {drivers.map((driver) => (
                <tr key={driver._id} className="hover:bg-secondary-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <TruckIcon className="w-5 h-5 text-primary-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-secondary-900">
                          {driver.name}
                          {isFatigued(driver) && (
                            <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500 inline ml-2" title="Driver may be fatigued" />
                          )}
                        </div>
                        <div className="text-sm text-secondary-500">
                          ID: {driver._id.slice(-8)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-secondary-900">{driver.email || 'N/A'}</div>
                    <div className="text-sm text-secondary-500">{driver.phone || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-secondary-900">{driver.currentShiftHours}h</div>
                    <div className="text-xs text-secondary-500">
                      {driver.currentShiftHours > 8 ? 'Overtime' : 'Regular'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-secondary-900">{driver.past7DayWorkHours}h</div>
                    <div className="text-xs">
                      {getWorkloadBadge(driver.past7DayWorkHours)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      driver.isActive 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {driver.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(driver)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(driver)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {drivers.length === 0 && (
            <div className="text-center py-12">
              <TruckIcon className="w-12 h-12 mx-auto text-secondary-300 mb-4" />
              <p className="text-secondary-500">
                {searchTerm ? 'No drivers found matching your search.' : 'No drivers found. Add your first driver!'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                {editingDriver ? 'Edit Driver' : 'Add New Driver'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="label">Name *</label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="label">Email</label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="input-field"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="label">Phone</label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="input-field"
                  />
                </div>

                <div>
                  <label htmlFor="currentShiftHours" className="label">Current Shift Hours</label>
                  <input
                    type="number"
                    id="currentShiftHours"
                    min="0"
                    max="24"
                    step="0.5"
                    value={formData.currentShiftHours}
                    onChange={(e) => setFormData({...formData, currentShiftHours: Number(e.target.value)})}
                    className="input-field"
                  />
                </div>

                <div>
                  <label htmlFor="past7DayWorkHours" className="label">Past 7-Day Work Hours</label>
                  <input
                    type="number"
                    id="past7DayWorkHours"
                    min="0"
                    step="0.5"
                    value={formData.past7DayWorkHours}
                    onChange={(e) => setFormData({...formData, past7DayWorkHours: Number(e.target.value)})}
                    className="input-field"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingDriver ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
