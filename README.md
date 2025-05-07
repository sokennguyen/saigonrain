# Saigon Rain Forecast

A real-time rain forecasting application for Ho Chi Minh City (Saigon), Vietnam. The app provides district-specific weather information, including current rain status, intensity, and predictions for when rain will start or stop.

## Features

- Real-time rain status for specific districts in HCMC
- Current rain intensity (mm/h) with descriptive labels
- Rain predictions with probability percentages
- Expected rain end time (if currently raining)
- Next expected rain time (if not raining)
- Auto-refresh every 5 minutes
- District selection for localized forecasts

## Technology Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Axios
- Open-Meteo API

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository:
```bash
git clone [your-repo-url]
cd saigonrain
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## API Usage

This project uses the Open-Meteo API for weather data. The API is free to use and doesn't require an API key.

## Contributing

Feel free to submit issues and pull requests.

## License

MIT License
