# GreenCart Logistics - Delivery Simulation & KPI Dashboard

A comprehensive full-stack web application for eco-friendly delivery management and operations simulation. This platform helps managers experiment with staffing, delivery schedules, and route allocations to optimize profits and efficiency.

## 🚀 Live Demo

- **Frontend**: [Deployed on Vercel/Netlify](https://greencart-logistics-1-315k.onrender.com)
- **Backend API**: [Deployed on Render/Railway](https://greencart-logistics-ajfc.onrender.com)

## 📋 Project Overview

GreenCart Logistics is a fictional eco-friendly delivery company operating in urban areas. This internal tool simulates delivery operations and calculates KPIs based on custom company rules, helping managers make data-driven decisions about:

- Driver scheduling and workload optimization
- Route efficiency and fuel cost management
- Delivery performance tracking and analysis
- Real-time KPI monitoring and reporting

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based authentication
- **Security**: Helmet, CORS, Rate limiting
- **Testing**: Jest with MongoDB Memory Server
- **Validation**: Express Validator

### Frontend
- **Framework**: React 18 with Hooks
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Charts**: Chart.js with React Chart.js 2
- **UI Components**: Headless UI, Heroicons
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast
- **Routing**: React Router DOM

### DevOps & Deployment
- **Backend Hosting**: Render/Railway/Heroku
- **Frontend Hosting**: Vercel/Netlify
- **Database**: MongoDB Atlas
- **Version Control**: Git with GitHub
- **Environment**: Docker-ready configuration

## ⚡ Quick Start

### Prerequisites
- Node.js (v14+ recommended)
- MongoDB (local or Atlas)
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/grimbit1/greencart-logistics.git
cd greencart-logistics
```

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
# MONGODB_URI=your_mongodb_connection_string
# JWT_SECRET=your_secret_key
# FRONTEND_URL=http://localhost:3000

# Seed database with sample data
npm run seed

# Start development server
npm run dev
```

The backend will run on `http://localhost:5000`

### 3. Frontend Setup
```bash
# Navigate to frontend directory (in a new terminal)
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will run on `http://localhost:3000`

### 4. Access the Application
- Open `http://localhost:3000` in your browser
- Use demo credentials:
  - **Manager**: `manager@greencart.com` / `manager123`
  - **Admin**: `admin@greencart.com` / `admin123`

## 🏗️ Project Structure

```
greencart-logistics/
├── backend/
│   ├── data/                 # Sample data and seeders
│   ├── middleware/           # Auth and validation middleware
│   ├── models/              # MongoDB models
│   ├── routes/              # API routes
│   ├── tests/               # Unit and integration tests
│   ├── server.js            # Express server entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable React components
│   │   ├── context/         # React context providers
│   │   ├── pages/          # Page components
│   │   ├── App.jsx         # Main app component
│   │   └── main.jsx        # React entry point
│   ├── public/             # Static assets
│   └── package.json
├── README.md               # This file
└── explain.md             # Detailed project explanation
```

## 🔐 Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/greencart-logistics
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=30d
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)
```env
VITE_API_URL=http://localhost:5000
```

## 📊 Business Rules & KPI Calculations

### Custom Company Rules
1. **Late Delivery Penalty**: ₹50 penalty if delivery time > (base route time + 10 minutes)
2. **Driver Fatigue Rule**: 30% speed decrease if driver worked >8 hours previous day
3. **High-Value Bonus**: 10% bonus for orders >₹1000 delivered on-time
4. **Fuel Cost Calculation**: 
   - Base: ₹5/km
   - High traffic surcharge: +₹2/km
5. **Overall Profit**: Sum of (order value + bonus - penalties - fuel cost)
6. **Efficiency Score**: (On-time deliveries / Total deliveries) × 100

### Key Features
- **Real-time Simulation**: Configure drivers, start times, and max hours
- **Interactive Dashboard**: Live KPIs with Chart.js visualizations
- **CRUD Operations**: Manage drivers, routes, and orders
- **Performance Tracking**: Monitor delivery efficiency and profitability
- **Mobile Responsive**: Works seamlessly on desktop and mobile devices

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test                 # Run all tests
npm run test:watch      # Watch mode for development
```

### Test Coverage
- Unit tests for business logic and models
- Integration tests for API endpoints
- Business rules validation tests
- Error handling and edge cases

## 🚀 Deployment

### Backend Deployment (Render/Railway)
1. Create new web service
2. Connect GitHub repository
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add environment variables
6. Deploy

### Frontend Deployment (Vercel/Netlify)
1. Connect GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables
5. Deploy

### Database Setup (MongoDB Atlas)
1. Create MongoDB Atlas account
2. Set up cluster and database
3. Configure network access and database user
4. Get connection string for environment variables

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile
- `GET /api/auth/verify` - Verify JWT token

### Drivers Endpoints
- `GET /api/drivers` - List all drivers
- `POST /api/drivers` - Create new driver
- `GET /api/drivers/:id` - Get driver by ID
- `PUT /api/drivers/:id` - Update driver
- `DELETE /api/drivers/:id` - Delete driver

### Routes Endpoints
- `GET /api/routes` - List all routes
- `POST /api/routes` - Create new route
- `GET /api/routes/:id` - Get route by ID
- `PUT /api/routes/:id` - Update route
- `DELETE /api/routes/:id` - Delete route

### Orders Endpoints
- `GET /api/orders` - List all orders
- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get order by ID
- `PUT /api/orders/:id` - Update order
- `DELETE /api/orders/:id` - Delete order
- `PATCH /api/orders/:id/complete` - Mark order as completed

### Simulation Endpoints
- `POST /api/simulation/run` - Run delivery simulation
- `GET /api/simulation/history` - Get simulation history
- `GET /api/simulation/:simulationId` - Get specific simulation
- `GET /api/simulation/dashboard/kpis` - Get dashboard KPIs

### Request/Response Examples

#### Run Simulation
```bash
POST /api/simulation/run
Content-Type: application/json
Authorization: Bearer <token>

{
  "numberOfDrivers": 5,
  "routeStartTime": "09:00",
  "maxHoursPerDriver": 8
}
```

#### Response
```json
{
  "message": "Simulation completed successfully",
  "simulationId": "sim_1699123456789_abc123def",
  "results": {
    "totalProfit": 12450.50,
    "efficiencyScore": 85,
    "onTimeDeliveries": 17,
    "lateDeliveries": 3,
    "totalDeliveries": 20,
    "totalFuelCost": 2340.00,
    "totalPenalties": 150,
    "totalBonuses": 890.50,
    "averageDeliveryTime": 42
  }
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact: [adityanandwana19@gmail.com](mailto:adityanandwana19@gmail.com)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built for Purple Merit Technologies assessment
- Uses Chart.js for beautiful data visualizations
- Styled with Tailwind CSS for modern UI/UX
- Icons by Heroicons

---

**GreenCart Logistics** - Making eco-friendly delivery management efficient and profitable! 🌱🚚

