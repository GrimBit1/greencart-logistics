import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  MapPinIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  CurrencyRupeeIcon
} from '@heroicons/react/24/outline'

export default function Routes() {
  const [routes, setRoutes] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [trafficFilter, setTrafficFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingRoute, setEditingRoute] = useState(null)
  const [formData, setFormData] = useState({
    routeId: '',
    name: '',
    distanceKm: 0,
    trafficLevel: 'Low',
    baseTimeMinutes: 0,
    startLocation: '',
    endLocation: ''
  })

  useEffect(() => {
    fetchRoutes()
  }, [searchTerm, trafficFilter])

  const fetchRoutes = async () => {
    try {
      const params = new URLSearchParams({
        limit: '50',
        ...(searchTerm && { search: searchTerm }),
        ...(trafficFilter && { trafficLevel: trafficFilter })
      })
      
      const response = await axios.get(`/api/routes?${params}`)
      setRoutes(response.data.routes)
    } catch (error) {
      console.error('Error fetching routes:', error)
      toast.error('Failed to load routes')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      if (editingRoute) {
        await axios.put(`/api/routes/${editingRoute._id}`, formData)
        toast.success('Route updated successfully')
      } else {
        await axios.post('/api/routes', formData)
        toast.success('Route created successfully')
      }
      
      setShowModal(false)
      setEditingRoute(null)
      resetForm()
      fetchRoutes()
    } catch (error) {
      const message = error.response?.data?.error || 'Operation failed'
      toast.error(message)
    }
  }

  const handleEdit = (route) => {
    setEditingRoute(route)
    setFormData({
      routeId: route.routeId,
      name: route.name,
      distanceKm: route.distanceKm,
      trafficLevel: route.trafficLevel,
      baseTimeMinutes: route.baseTimeMinutes,
      startLocation: route.startLocation || '',
      endLocation: route.endLocation || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (route) => {
    if (!confirm(`Are you sure you want to delete route ${route.name}?`)) {
      return
    }

    try {
      await axios.delete(`/api/routes/${route._id}`)
      toast.success('Route deleted successfully')
      fetchRoutes()
    } catch (error) {
      const message = error.response?.data?.error || 'Delete failed'
      toast.error(message)
    }
  }

  const resetForm = () => {
    setFormData({
      routeId: '',
      name: '',
      distanceKm: 0,
      trafficLevel: 'Low',
      baseTimeMinutes: 0,
      startLocation: '',
      endLocation: ''
    })
  }

  const openCreateModal = () => {
    setEditingRoute(null)
    resetForm()
    setShowModal(true)
  }

  const getTrafficBadge = (level) => {
    const colors = {
      Low: 'bg-green-100 text-green-700',
      Medium: 'bg-yellow-100 text-yellow-700',
      High: 'bg-red-100 text-red-700'
    }
    return <span className={`px-2 py-1 text-xs rounded-full ${colors[level]}`}>{level}</span>
  }

  const getDifficultyBadge = (trafficLevel) => {
    const difficulty = trafficLevel === 'High' ? 'Hard' : trafficLevel === 'Medium' ? 'Medium' : 'Easy'
    const colors = {
      Easy: 'bg-green-100 text-green-700',
      Medium: 'bg-yellow-100 text-yellow-700', 
      Hard: 'bg-red-100 text-red-700'
    }
    return <span className={`px-2 py-1 text-xs rounded-full ${colors[difficulty]}`}>{difficulty}</span>
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
          <h1 className="text-2xl font-bold text-secondary-900">Routes</h1>
          <p className="text-secondary-600">Manage delivery routes and their parameters</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary flex items-center">
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Route
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400" />
          <input
            type="text"
            placeholder="Search routes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 input-field"
          />
        </div>
        <select
          value={trafficFilter}
          onChange={(e) => setTrafficFilter(e.target.value)}
          className="input-field w-full sm:w-auto"
        >
          <option value="">All Traffic Levels</option>
          <option value="Low">Low Traffic</option>
          <option value="Medium">Medium Traffic</option>
          <option value="High">High Traffic</option>
        </select>
      </div>

      {/* Routes List */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Route
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Locations
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Distance & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Traffic & Difficulty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Fuel Cost
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-200">
              {routes.map((route) => (
                <tr key={route._id} className="hover:bg-secondary-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <MapPinIcon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-secondary-900">{route.name}</div>
                        <div className="text-sm text-secondary-500">ID: {route.routeId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-secondary-900">{route.startLocation || 'N/A'}</div>
                    <div className="text-sm text-secondary-500">to {route.endLocation || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-secondary-900">
                      <MapPinIcon className="w-4 h-4 mr-1 text-secondary-400" />
                      {route.distanceKm} km
                    </div>
                    <div className="flex items-center text-sm text-secondary-500">
                      <ClockIcon className="w-4 h-4 mr-1 text-secondary-400" />
                      {route.baseTimeMinutes} min
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      {getTrafficBadge(route.trafficLevel)}
                      {getDifficultyBadge(route.trafficLevel)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-secondary-900">
                      <CurrencyRupeeIcon className="w-4 h-4 mr-1 text-secondary-400" />
                      {route.fuelCost}
                    </div>
                    <div className="text-xs text-secondary-500">
                      ₹{route.trafficLevel === 'High' ? 7 : 5}/km
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(route)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(route)}
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
          
          {routes.length === 0 && (
            <div className="text-center py-12">
              <MapPinIcon className="w-12 h-12 mx-auto text-secondary-300 mb-4" />
              <p className="text-secondary-500">
                {searchTerm || trafficFilter 
                  ? 'No routes found matching your filters.' 
                  : 'No routes found. Add your first route!'}
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
                {editingRoute ? 'Edit Route' : 'Add New Route'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="routeId" className="label">Route ID *</label>
                  <input
                    type="text"
                    id="routeId"
                    value={formData.routeId}
                    onChange={(e) => setFormData({...formData, routeId: e.target.value})}
                    className="input-field"
                    placeholder="e.g., RT001"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="name" className="label">Route Name *</label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="input-field"
                    placeholder="e.g., Central Mumbai - Bandra"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="startLocation" className="label">Start Location</label>
                    <input
                      type="text"
                      id="startLocation"
                      value={formData.startLocation}
                      onChange={(e) => setFormData({...formData, startLocation: e.target.value})}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label htmlFor="endLocation" className="label">End Location</label>
                    <input
                      type="text"
                      id="endLocation"
                      value={formData.endLocation}
                      onChange={(e) => setFormData({...formData, endLocation: e.target.value})}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="distanceKm" className="label">Distance (km) *</label>
                    <input
                      type="number"
                      id="distanceKm"
                      min="0.1"
                      step="0.1"
                      value={formData.distanceKm}
                      onChange={(e) => setFormData({...formData, distanceKm: Number(e.target.value)})}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="baseTimeMinutes" className="label">Base Time (min) *</label>
                    <input
                      type="number"
                      id="baseTimeMinutes"
                      min="1"
                      value={formData.baseTimeMinutes}
                      onChange={(e) => setFormData({...formData, baseTimeMinutes: Number(e.target.value)})}
                      className="input-field"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="trafficLevel" className="label">Traffic Level *</label>
                  <select
                    id="trafficLevel"
                    value={formData.trafficLevel}
                    onChange={(e) => setFormData({...formData, trafficLevel: e.target.value})}
                    className="input-field"
                    required
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                  <p className="text-xs text-secondary-500 mt-1">
                    High traffic adds ₹2/km fuel surcharge
                  </p>
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
                    {editingRoute ? 'Update' : 'Create'}
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
