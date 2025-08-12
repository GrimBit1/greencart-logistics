import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { PlayIcon, ClockIcon, TruckIcon, DocumentTextIcon } from '@heroicons/react/24/outline'

export default function Simulation() {
  const [formData, setFormData] = useState({
    numberOfDrivers: 5,
    routeStartTime: '09:00',
    maxHoursPerDriver: 8
  })
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [history, setHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    fetchSimulationHistory()
  }, [])

  const fetchSimulationHistory = async () => {
    try {
      const response = await axios.get('/api/simulation/history?limit=5')
      setHistory(response.data.simulations)
    } catch (error) {
      console.error('Error fetching simulation history:', error)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'numberOfDrivers' || name === 'maxHoursPerDriver' ? Number(value) : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await axios.post('/api/simulation/run', formData)
      setResults(response.data)
      toast.success('Simulation completed successfully!')
      fetchSimulationHistory() // Refresh history
    } catch (error) {
      const message = error.response?.data?.error || 'Simulation failed'
      toast.error(message)
      console.error('Simulation error:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => `₹${amount?.toLocaleString() || 0}`

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Delivery Simulation</h1>
          <p className="text-secondary-600">
            Configure parameters and run simulations to optimize delivery operations
          </p>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="btn-secondary"
        >
          {showHistory ? 'Hide History' : 'View History'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Simulation Form */}
        <div className="lg:col-span-1">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">
              Simulation Parameters
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="numberOfDrivers" className="label">
                  Number of Drivers
                </label>
                <input
                  type="number"
                  id="numberOfDrivers"
                  name="numberOfDrivers"
                  min="1"
                  max="100"
                  value={formData.numberOfDrivers}
                  onChange={handleInputChange}
                  className="input-field"
                  required
                />
                <p className="text-xs text-secondary-500 mt-1">
                  Select active drivers (1-100)
                </p>
              </div>

              <div>
                <label htmlFor="routeStartTime" className="label">
                  Route Start Time
                </label>
                <input
                  type="time"
                  id="routeStartTime"
                  name="routeStartTime"
                  value={formData.routeStartTime}
                  onChange={handleInputChange}
                  className="input-field"
                  required
                />
                <p className="text-xs text-secondary-500 mt-1">
                  When deliveries should begin
                </p>
              </div>

              <div>
                <label htmlFor="maxHoursPerDriver" className="label">
                  Max Hours per Driver
                </label>
                <input
                  type="number"
                  id="maxHoursPerDriver"
                  name="maxHoursPerDriver"
                  min="1"
                  max="24"
                  step="0.5"
                  value={formData.maxHoursPerDriver}
                  onChange={handleInputChange}
                  className="input-field"
                  required
                />
                <p className="text-xs text-secondary-500 mt-1">
                  Maximum working hours per day
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary flex items-center justify-center disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Running Simulation...
                  </>
                ) : (
                  <>
                    <PlayIcon className="w-4 h-4 mr-2" />
                    Run Simulation
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2">
          {results ? (
            <div className="space-y-6">
              {/* KPI Summary */}
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-secondary-900 mb-4">
                  Simulation Results
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(results.results.totalProfit)}
                    </div>
                    <div className="text-sm text-secondary-600">Total Profit</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {results.results.efficiencyScore}%
                    </div>
                    <div className="text-sm text-secondary-600">Efficiency Score</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {results.results.totalDeliveries}
                    </div>
                    <div className="text-sm text-secondary-600">Total Deliveries</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {formatCurrency(results.results.totalFuelCost)}
                    </div>
                    <div className="text-sm text-secondary-600">Fuel Cost</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-lg font-semibold text-green-800">
                      {results.results.onTimeDeliveries}
                    </div>
                    <div className="text-sm text-green-600">On-time Deliveries</div>
                  </div>
                  
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="text-lg font-semibold text-red-800">
                      {results.results.lateDeliveries}
                    </div>
                    <div className="text-sm text-red-600">Late Deliveries</div>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-lg font-semibold text-blue-800">
                      {results.results.averageDeliveryTime} min
                    </div>
                    <div className="text-sm text-blue-600">Avg Delivery Time</div>
                  </div>
                </div>
              </div>

              {/* Driver Utilization */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                  Driver Utilization
                </h3>
                <div className="space-y-3">
                  {results.driverUtilization.map((driver) => (
                    <div key={driver.driverId} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                      <div className="flex items-center">
                        <TruckIcon className="w-5 h-5 text-secondary-400 mr-3" />
                        <div>
                          <div className="font-medium text-secondary-900">{driver.driverName}</div>
                          <div className="text-sm text-secondary-600">
                            {driver.hoursWorked}h worked • {driver.ordersDelivered} orders
                            {driver.isFatigued && (
                              <span className="ml-2 px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                                Fatigued
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-secondary-900">
                          {Math.round((driver.hoursWorked / formData.maxHoursPerDriver) * 100)}%
                        </div>
                        <div className="text-xs text-secondary-500">Utilization</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary Statistics */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                  Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-secondary-600">Orders Processed:</span>
                    <span className="ml-2 font-medium">{results.summary.ordersProcessed}</span>
                  </div>
                  <div>
                    <span className="text-secondary-600">Total Orders Available:</span>
                    <span className="ml-2 font-medium">{results.summary.totalOrdersAvailable}</span>
                  </div>
                  <div>
                    <span className="text-secondary-600">Drivers Used:</span>
                    <span className="ml-2 font-medium">{results.summary.driversUsed}</span>
                  </div>
                  <div>
                    <span className="text-secondary-600">Avg Orders per Driver:</span>
                    <span className="ml-2 font-medium">{results.summary.averageOrdersPerDriver}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card p-12">
              <div className="text-center text-secondary-500">
                <PlayIcon className="w-16 h-16 mx-auto mb-4 text-secondary-300" />
                <h3 className="text-lg font-medium mb-2">No Simulation Results</h3>
                <p>Configure the parameters and run a simulation to see results here.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Simulation History */}
      {showHistory && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Recent Simulations
          </h3>
          {history.length > 0 ? (
            <div className="space-y-3">
              {history.map((simulation) => (
                <div key={simulation._id} className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
                  <div className="flex items-center">
                    <ClockIcon className="w-5 h-5 text-secondary-400 mr-3" />
                    <div>
                      <div className="font-medium text-secondary-900">
                        {new Date(simulation.createdAt).toLocaleString()}
                      </div>
                      <div className="text-sm text-secondary-600">
                        {simulation.inputs.numberOfDrivers} drivers • 
                        {simulation.inputs.routeStartTime} start • 
                        {simulation.inputs.maxHoursPerDriver}h max
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-green-600">
                      {formatCurrency(simulation.results.totalProfit)}
                    </div>
                    <div className="text-sm text-secondary-600">
                      {simulation.results.efficiencyScore}% efficiency
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-secondary-500">
              <DocumentTextIcon className="w-12 h-12 mx-auto mb-2 text-secondary-300" />
              <p>No simulation history available</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
