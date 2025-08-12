import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  DocumentTextIcon,
  MagnifyingGlassIcon,
  CurrencyRupeeIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline'

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [routes, setRoutes] = useState([])
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingOrder, setEditingOrder] = useState(null)
  const [formData, setFormData] = useState({
    orderId: '',
    valueRs: 0,
    assignedRoute: '',
    assignedDriver: '',
    customerName: '',
    customerAddress: '',
    priority: 'medium',
    status: 'pending',
    scheduledDeliveryTime: ''
  })

  useEffect(() => {
    fetchOrders()
    fetchRoutes()
    fetchDrivers()
  }, [searchTerm, statusFilter, priorityFilter])

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams({
        limit: '50',
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
        ...(priorityFilter && { priority: priorityFilter })
      })
      
      const response = await axios.get(`/api/orders?${params}`)
      setOrders(response.data.orders)
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const fetchRoutes = async () => {
    try {
      const response = await axios.get('/api/routes?limit=100')
      setRoutes(response.data.routes)
    } catch (error) {
      console.error('Error fetching routes:', error)
    }
  }

  const fetchDrivers = async () => {
    try {
      const response = await axios.get('/api/drivers?limit=100')
      setDrivers(response.data.drivers)
    } catch (error) {
      console.error('Error fetching drivers:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const submitData = {
        ...formData,
        valueRs: Number(formData.valueRs),
        scheduledDeliveryTime: formData.scheduledDeliveryTime || undefined
      }

      if (editingOrder) {
        await axios.put(`/api/orders/${editingOrder._id}`, submitData)
        toast.success('Order updated successfully')
      } else {
        await axios.post('/api/orders', submitData)
        toast.success('Order created successfully')
      }
      
      setShowModal(false)
      setEditingOrder(null)
      resetForm()
      fetchOrders()
    } catch (error) {
      const message = error.response?.data?.error || 'Operation failed'
      toast.error(message)
    }
  }

  const handleEdit = (order) => {
    setEditingOrder(order)
    setFormData({
      orderId: order.orderId,
      valueRs: order.valueRs,
      assignedRoute: order.assignedRoute?._id || '',
      assignedDriver: order.assignedDriver?._id || '',
      customerName: order.customerName || '',
      customerAddress: order.customerAddress || '',
      priority: order.priority,
      status: order.status,
      scheduledDeliveryTime: order.scheduledDeliveryTime 
        ? new Date(order.scheduledDeliveryTime).toISOString().slice(0, 16)
        : ''
    })
    setShowModal(true)
  }

  const handleDelete = async (order) => {
    if (!confirm(`Are you sure you want to delete order ${order.orderId}?`)) {
      return
    }

    try {
      await axios.delete(`/api/orders/${order._id}`)
      toast.success('Order deleted successfully')
      fetchOrders()
    } catch (error) {
      const message = error.response?.data?.error || 'Delete failed'
      toast.error(message)
    }
  }

  const handleCompleteOrder = async (order) => {
    try {
      await axios.patch(`/api/orders/${order._id}/complete`)
      toast.success('Order marked as completed')
      fetchOrders()
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to complete order'
      toast.error(message)
    }
  }

  const resetForm = () => {
    setFormData({
      orderId: '',
      valueRs: 0,
      assignedRoute: '',
      assignedDriver: '',
      customerName: '',
      customerAddress: '',
      priority: 'medium',
      status: 'pending',
      scheduledDeliveryTime: ''
    })
  }

  const openCreateModal = () => {
    setEditingOrder(null)
    resetForm()
    setShowModal(true)
  }

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700',
      assigned: 'bg-blue-100 text-blue-700',
      in_transit: 'bg-purple-100 text-purple-700',
      delivered: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700'
    }
    return <span className={`px-2 py-1 text-xs rounded-full ${colors[status]}`}>
      {status.replace('_', ' ').toUpperCase()}
    </span>
  }

  const getPriorityBadge = (priority) => {
    const colors = {
      low: 'bg-gray-100 text-gray-700',
      medium: 'bg-blue-100 text-blue-700',
      high: 'bg-red-100 text-red-700'
    }
    return <span className={`px-2 py-1 text-xs rounded-full ${colors[priority]}`}>
      {priority.toUpperCase()}
    </span>
  }

  const getOnTimeStatus = (order) => {
    if (order.isOnTime === null || order.status !== 'delivered') {
      return null
    }
    
    return order.isOnTime ? (
      <CheckCircleIcon className="w-4 h-4 text-green-500" title="On-time delivery" />
    ) : (
      <ExclamationCircleIcon className="w-4 h-4 text-red-500" title="Late delivery" />
    )
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
          <h1 className="text-2xl font-bold text-secondary-900">Orders</h1>
          <p className="text-secondary-600">Manage customer orders and deliveries</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary flex items-center">
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Order
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400" />
          <input
            type="text"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 input-field"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field w-full lg:w-auto"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="assigned">Assigned</option>
          <option value="in_transit">In Transit</option>
          <option value="delivered">Delivered</option>
          <option value="failed">Failed</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="input-field w-full lg:w-auto"
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      {/* Orders List */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Value & Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Route & Driver
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-secondary-200">
              {orders.map((order) => (
                <tr key={order._id} className="hover:bg-secondary-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <DocumentTextIcon className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-secondary-900">{order.orderId}</div>
                        <div className="text-sm text-secondary-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-secondary-900">{order.customerName || 'N/A'}</div>
                    <div className="text-sm text-secondary-500 max-w-xs truncate">
                      {order.customerAddress || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-secondary-900">
                      <CurrencyRupeeIcon className="w-4 h-4 mr-1 text-secondary-400" />
                      {order.valueRs.toLocaleString()}
                    </div>
                    <div className="mt-1">
                      {getPriorityBadge(order.priority)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-secondary-900">
                      {order.assignedRoute?.name || 'No route'}
                    </div>
                    <div className="text-sm text-secondary-500">
                      {order.assignedDriver?.name || 'No driver'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(order.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getOnTimeStatus(order)}
                      {order.profit !== undefined && (
                        <div className="text-sm">
                          <span className={`font-medium ${order.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ₹{order.profit.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                    {(order.penalty > 0 || order.bonus > 0) && (
                      <div className="text-xs text-secondary-500">
                        {order.penalty > 0 && `Penalty: ₹${order.penalty}`}
                        {order.bonus > 0 && `Bonus: ₹${order.bonus}`}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {order.status !== 'delivered' && order.status !== 'failed' && (
                        <button
                          onClick={() => handleCompleteOrder(order)}
                          className="text-green-600 hover:text-green-900"
                          title="Complete Order"
                        >
                          <CheckCircleIcon className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(order)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(order)}
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
          
          {orders.length === 0 && (
            <div className="text-center py-12">
              <DocumentTextIcon className="w-12 h-12 mx-auto text-secondary-300 mb-4" />
              <p className="text-secondary-500">
                {searchTerm || statusFilter || priorityFilter
                  ? 'No orders found matching your filters.' 
                  : 'No orders found. Add your first order!'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                {editingOrder ? 'Edit Order' : 'Add New Order'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="orderId" className="label">Order ID *</label>
                    <input
                      type="text"
                      id="orderId"
                      value={formData.orderId}
                      onChange={(e) => setFormData({...formData, orderId: e.target.value})}
                      className="input-field"
                      placeholder="e.g., ORD001"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="valueRs" className="label">Value (₹) *</label>
                    <input
                      type="number"
                      id="valueRs"
                      min="0"
                      value={formData.valueRs}
                      onChange={(e) => setFormData({...formData, valueRs: e.target.value})}
                      className="input-field"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="customerName" className="label">Customer Name</label>
                  <input
                    type="text"
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                    className="input-field"
                  />
                </div>

                <div>
                  <label htmlFor="customerAddress" className="label">Customer Address</label>
                  <textarea
                    id="customerAddress"
                    value={formData.customerAddress}
                    onChange={(e) => setFormData({...formData, customerAddress: e.target.value})}
                    className="input-field"
                    rows="2"
                  />
                </div>

                <div>
                  <label htmlFor="assignedRoute" className="label">Assigned Route *</label>
                  <select
                    id="assignedRoute"
                    value={formData.assignedRoute}
                    onChange={(e) => setFormData({...formData, assignedRoute: e.target.value})}
                    className="input-field"
                    required
                  >
                    <option value="">Select a route</option>
                    {routes.map((route) => (
                      <option key={route._id} value={route._id}>
                        {route.name} ({route.routeId})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="assignedDriver" className="label">Assigned Driver</label>
                  <select
                    id="assignedDriver"
                    value={formData.assignedDriver}
                    onChange={(e) => setFormData({...formData, assignedDriver: e.target.value})}
                    className="input-field"
                  >
                    <option value="">Select a driver (optional)</option>
                    {drivers.map((driver) => (
                      <option key={driver._id} value={driver._id}>
                        {driver.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="priority" className="label">Priority</label>
                    <select
                      id="priority"
                      value={formData.priority}
                      onChange={(e) => setFormData({...formData, priority: e.target.value})}
                      className="input-field"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="status" className="label">Status</label>
                    <select
                      id="status"
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="input-field"
                    >
                      <option value="pending">Pending</option>
                      <option value="assigned">Assigned</option>
                      <option value="in_transit">In Transit</option>
                      <option value="delivered">Delivered</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="scheduledDeliveryTime" className="label">Scheduled Delivery Time</label>
                  <input
                    type="datetime-local"
                    id="scheduledDeliveryTime"
                    value={formData.scheduledDeliveryTime}
                    onChange={(e) => setFormData({...formData, scheduledDeliveryTime: e.target.value})}
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
                    {editingOrder ? 'Update' : 'Create'}
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
