import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  CurrencyRupeeIcon,
  ChartBarIcon,
  ClockIcon,
  TruckIcon,
  MapPinIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function Dashboard() {
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    drivers: 0,
    routes: 0,
    orders: 0,
    simulations: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [
        kpisResponse,
        driversResponse,
        routesResponse,
        ordersResponse,
        simulationsResponse,
      ] = await Promise.all([
        axios.get("/api/simulation/dashboard/kpis"),
        axios.get("/api/drivers?limit=1"),
        axios.get("/api/routes?limit=1"),
        axios.get("/api/orders?limit=1"),
        axios.get("/api/simulation/history?limit=1"),
      ]);

      setKpis(kpisResponse.data.kpis);
      setStats({
        drivers: driversResponse.data.pagination.total,
        routes: routesResponse.data.pagination.total,
        orders: ordersResponse.data.pagination.total,
        simulations: simulationsResponse.data.pagination.total,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const currentKpis = kpis?.latest_simulation || kpis?.overall_stats || {};
  const overallStats = kpis?.overall_stats || {};

  // Chart data
  const deliveryChartData = {
    labels: ["On-time Deliveries", "Late Deliveries"],
    datasets: [
      {
        data: [
          currentKpis.onTimeDeliveries || 0,
          currentKpis.lateDeliveries ||
            currentKpis.totalDeliveries - currentKpis.onTimeDeliveries ||
            0,
        ],
        backgroundColor: ["#22c55e", "#ef4444"],
        borderColor: ["#16a34a", "#dc2626"],
        borderWidth: 2,
      },
    ],
  };

  const fuelCostData = {
    labels: ["Fuel Costs", "Penalties", "Bonuses"],
    datasets: [
      {
        label: "Amount (₹)",
        data: [
          currentKpis.totalFuelCost || overallStats.totalFuelCost || 0,
          currentKpis.totalPenalties || overallStats.totalPenalties || 0,
          currentKpis.totalBonuses || overallStats.totalBonuses || 0,
        ],
        backgroundColor: ["#f59e0b", "#ef4444", "#22c55e"],
        borderColor: ["#d97706", "#dc2626", "#16a34a"],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom",
      },
    },

  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Dashboard</h1>
          <p className="text-secondary-600">
            Overview of your delivery operations
          </p>
        </div>
        <button onClick={fetchDashboardData} className="btn-secondary">
          Refresh Data
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <TruckIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">
                Active Drivers
              </p>
              <p className="text-2xl font-bold text-secondary-900">
                {stats.drivers}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <MapPinIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">
                Active Routes
              </p>
              <p className="text-2xl font-bold text-secondary-900">
                {stats.routes}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <DocumentTextIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">
                Total Orders
              </p>
              <p className="text-2xl font-bold text-secondary-900">
                {stats.orders}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <ChartBarIcon className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">
                Simulations Run
              </p>
              <p className="text-2xl font-bold text-secondary-900">
                {stats.simulations}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CurrencyRupeeIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">
                Total Profit
              </p>
              <p className="text-2xl font-bold text-green-600">
                ₹
                {(
                  currentKpis.totalProfit ||
                  overallStats.totalProfit ||
                  0
                ).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <ChartBarIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">
                Efficiency Score
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {currentKpis.efficiencyScore ||
                  overallStats.efficiencyScore ||
                  0}
                %
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <ClockIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-secondary-600">
                Avg Delivery Time
              </p>
              <p className="text-2xl font-bold text-purple-600">
                {currentKpis.averageDeliveryTime || 45} min
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* On-time vs Late Deliveries Chart */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            On-time vs Late Deliveries
          </h3>
          <div className="h-64 flex items-center justify-center">
            <Doughnut
              style={{ height: "100%", width: "100%" }}
              data={deliveryChartData}
              options={{...doughnutOptions,aspectRatio: 2}}
            />
          </div>
        </div>

        {/* Fuel Cost Breakdown Chart */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Cost Breakdown
          </h3>
          <div className="h-64 flex items-center justify-center">
            <Bar data={fuelCostData} options={{...chartOptions,aspectRatio: 2}} />
          </div>
        </div>
      </div>

      {/* Latest Simulation Info */}
      {kpis?.latest_simulation && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            Latest Simulation Results
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-secondary-600">Total Deliveries</p>
              <p className="text-xl font-bold text-secondary-900">
                {kpis.latest_simulation.totalDeliveries}
              </p>
            </div>
            <div>
              <p className="text-sm text-secondary-600">On-time Rate</p>
              <p className="text-xl font-bold text-green-600">
                {kpis.latest_simulation.efficiencyScore}%
              </p>
            </div>
            <div>
              <p className="text-sm text-secondary-600">Total Fuel Cost</p>
              <p className="text-xl font-bold text-orange-600">
                ₹{kpis.latest_simulation.totalFuelCost?.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-secondary-600">Date</p>
              <p className="text-sm text-secondary-900">
                {new Date(kpis.latest_simulation.date).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
