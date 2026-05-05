# Full-Stack Web Application

A modern full-stack web application built with React frontend and FastAPI backend, featuring user authentication, MongoDB database, and a responsive UI with Tailwind CSS and Radix UI components.

## Features

- **Frontend**: React application with modern UI components
- **Backend**: FastAPI with JWT authentication
- **Database**: MongoDB with Motor async driver
- **Authentication**: Secure user registration and login
- **UI Components**: Radix UI primitives with Tailwind CSS styling
- **Routing**: React Router for client-side navigation

## Tech Stack

### Frontend
- React 18
- React Router DOM
- Tailwind CSS
- Radix UI Components
- Axios for API calls
- React Hook Form
- Lucide React icons

### Backend
- FastAPI
- MongoDB with Motor
- JWT authentication
- Pydantic models
- CORS middleware
- Password hashing with bcrypt

## Project Structure

```
├── backend/                 # FastAPI backend
│   ├── server.py           # Main FastAPI application
│   ├── requirements.txt    # Python dependencies
│   └── Screenshots/        # Backend screenshots
├── frontend/               # React frontend
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utility functions
│   └── package.json       # Node dependencies
├── tests/                  # Test files
├── memory/                 # Application memory/logs
└── test_reports/           # Test result reports
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Python (v3.8 or higher)
- MongoDB (local or cloud instance)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd app
   ```

2. **Backend Setup**
   ```bash
   cd backend
   # Create virtual environment
   python -m venv venv
   # Activate virtual environment
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate

   # Install dependencies
   pip install -r requirements.txt
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   # Install dependencies
   npm install
   ```

### Environment Configuration

1. **Backend Environment Variables**
   Create a `.env` file in the `backend/` directory:
   ```
   MONGO_URL=mongodb://localhost:27017
   DB_NAME=your_database_name
   JWT_SECRET=your-secret-key-change-in-production
   ```

2. **MongoDB Setup**
   - Install MongoDB locally or use a cloud service like MongoDB Atlas
   - Update the `MONGO_URL` in your `.env` file

### Running the Application

1. **Start the Backend**
   ```bash
   cd backend
   # Activate virtual environment if not already activated
   venv\Scripts\activate  # Windows
   # source venv/bin/activate  # macOS/Linux

   # Start the FastAPI server
   uvicorn server:app --reload
   ```
   The backend will be available at `http://localhost:8000`

2. **Start the Frontend**
   ```bash
   cd frontend
   npm start
   ```
   The frontend will be available at `http://localhost:3000`

## API Documentation

Once the backend is running, visit `http://localhost:8000/docs` to view the interactive API documentation provided by FastAPI.

## Available Scripts

### Frontend
- `npm start` - Start the development server
- `npm run build` - Build the app for production
- `npm test` - Run tests

### Backend
- `uvicorn server:app --reload` - Start the development server

## Testing

Run tests using pytest:
```bash
cd backend
python -m pytest
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

This project is licensed under the MIT License.
