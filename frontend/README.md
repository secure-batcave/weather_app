# Weather App Frontend

A modern, responsive React application built with Next.js that provides a user-friendly interface for accessing current, historical, and forecast weather data. The application features a clean UI with Tailwind CSS styling and seamless integration with the backend API.

## Features

- City search with autocomplete suggestions using OpenWeather's Geocoding API
- Real-time weather data display
- Historical weather data retrieval (from 1979 to 5 days ago)
- 5-day weather forecast visualization
- Database management interface for weather records
- Data export functionality
- Responsive design for all screen sizes
- Client-side form validation
- Error handling and loading states

## Project Structure

### Core Components

#### 1. `pages/index.js`
The landing page and main entry point of the application.

**Key Features:**
- City search with autocomplete
- Date range selection for historical data
- Input validation
- Navigation to current and historical weather views

**Key Functions:**
- `validateCity`: Client-side city name validation
- `fetchSuggestions`: Debounced API call for city suggestions
- `handleGetCurrentWeather`: Navigation to current weather view
- `handleGetHistoricalWeather`: Navigation to historical weather view

#### 2. `pages/weather.js`
Displays weather information based on the selected view (current/historical).

**Key Features:**
- Current weather display
- 5-day forecast visualization
- Historical weather data presentation
- Past searches table
- Data export functionality

**Key Functions:**
- `fetchWeatherData`: Retrieves current weather and forecast
- `fetchHistoricalData`: Retrieves historical weather data
- `handleDelete`: Manages record deletion
- `handleExport`: Exports weather data as JSON

#### 3. `pages/database.js`
Database management interface for weather records.

**Key Features:**
- View all locations and weather records
- Edit weather records (temperature and description)
- Delete locations and records
- Responsive data tables
- Input validation for edits

**Key Functions:**
- `fetchData`: Retrieves all database records
- `handleEdit`: Manages record editing
- `handleDelete`: Handles record deletion
- `handleSave`: Validates and saves record changes

## Docker Integration

The frontend is containerized using Docker with the following configuration:

### Base Image
- Node 18 Alpine image for minimal container size
- Optimized for development and production use
- Alpine-based for security and smaller image size

### Container Configuration
- Working directory: `/app`
- Exposed port: 3000
- Development server with hot-reloading enabled
- Node modules cached in Docker layer

### Build Process
1. Copies package.json and package-lock.json first (layer caching optimization)
2. Installs npm dependencies
3. Copies application source code
4. Sets up development server

### Usage
```bash
# Build the image
docker build -t weather-app-frontend .

# Run the container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=http://localhost:8000 \
  -e NEXT_PUBLIC_OPENWEATHER_API_KEY=your_key \
  weather-app-frontend
```

### Development Features
- Hot reloading enabled for rapid development
- Volume mounting support for local development:
  ```bash
  docker run -p 3000:3000 \
    -v $(pwd):/app \
    -v /app/node_modules \
    weather-app-frontend
  ```
- Source maps enabled for debugging

### Docker Compose Integration
The frontend container is designed to work with Docker Compose, providing:
- Automatic environment variable injection from .env files
- Network connectivity with the backend service
- Volume mounting for development
- Hot reloading functionality
- Dependency management with other services

## API Integration

### API Routes (`next.config.js`)
Configured routes that map frontend requests to backend endpoints:

```javascript
{
  '/api/weather/current/:city': 'http://backend:8000/weather/current/:city',
  '/api/weather/forecast/:city': 'http://backend:8000/weather/forecast/:city',
  '/api/weather/historical/:city': 'http://backend:8000/weather/historical/:city',
  '/api/weather/past_searches/:city': 'http://backend:8000/weather/past_searches/:city',
  '/api/locations': 'http://backend:8000/locations',
  '/api/export/:city': 'http://backend:8000/export/:city'
}
```

### Data Flow
1. User interactions trigger API calls via axios
2. Next.js rewrites routes to backend endpoints
3. Response data is managed through React state
4. UI updates reflect the received data

## Styling and UI

### Tailwind CSS Configuration
- Custom color scheme with primary colors
- Responsive grid layouts
- Modern UI components
- Consistent spacing and typography

### Key UI Components
- Search bar with autocomplete dropdown
- Date pickers for historical data
- Weather cards
- Responsive data tables
- Loading spinners
- Error messages

## Error Handling

- Input validation with user feedback
- API error handling with descriptive messages
- Loading states during data fetching
- Graceful fallbacks for missing data

## Environment Variables

Required environment variables:
- `NEXT_PUBLIC_API_URL`: Backend API URL
- `NEXT_PUBLIC_OPENWEATHER_API_KEY`: OpenWeather API key

## Dependencies

Key dependencies (from package.json):
- Next.js 14.1.0
- React 18.2.0
- Axios 1.6.7
- Date-fns 3.3.1
- Tailwind CSS 3.4.1
- PostCSS 8.4.35
- Autoprefixer 10.4.17

## Development Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

# Additional UI/UX Notes

## The Process of Further Improving the UI:

1. **Core Technologies Used**:
   - Tailwind CSS: A utility-first CSS framework
   - PostCSS: A tool for transforming CSS with JavaScript
   - CSS Custom Properties (CSS Variables)

2. **Configuration Files Setup**:
   - `postcss.config.js`: Configures PostCSS to use Tailwind CSS and Autoprefixer
   - `tailwind.config.js`: Defines our custom color scheme using the `primary` color palette
   - `globals.css`: Global styles and Tailwind directives
   - `_app.js`: Next.js file that imports global styles

3. **Color System**:
   ```javascript
   colors: {
     primary: {
       50: '#f0f9ff',  // Lightest blue
       100: '#e0f2fe', // Very light blue
       ...
       900: '#0c4a6e', // Darkest blue
     },
   }
   ```
   - Created a consistent color palette using blue shades
   - Used in classes like `bg-primary-600`, `text-primary-900`, etc.

4. **UI Components Styling**:

   a) **Buttons**:
   ```javascript
   className="bg-primary-600 text-white px-6 py-3 rounded-xl hover:bg-primary-700 transition-colors duration-150 shadow-md text-lg font-semibold"
   ```
   - `bg-primary-600`: Background color
   - `hover:bg-primary-700`: Darker on hover
   - `transition-colors duration-150`: Smooth color transition
   - `shadow-md`: Medium shadow for depth
   - `rounded-xl`: Rounded corners
   - `text-lg font-semibold`: Larger, bold text

   b) **Cards/Containers**:
   ```javascript
   className="bg-white rounded-xl shadow-lg p-8"
   ```
   - `bg-white`: White background
   - `rounded-xl`: Large border radius
   - `shadow-lg`: Large shadow
   - `p-8`: Generous padding

   c) **Tables**:
   ```javascript
   className="min-w-full bg-white"
   ```
   - Table headers: `bg-primary-700 text-white`
   - Row hover: `hover:bg-primary-50`
   - Cell borders: `border-r border-gray-100`

5. **Custom Global Styles** (in `globals.css`):

   a) **Custom Scrollbar**:
   ```css
   ::-webkit-scrollbar {
     width: 8px;
     height: 8px;
   }
   ::-webkit-scrollbar-thumb {
     @apply bg-primary-300 rounded-full hover:bg-primary-400;
   }
   ```
   - Styled scrollbars to match the theme
   - Smooth hover effects

   b) **Focus States**:
   ```css
   *:focus {
     @apply outline-none ring-2 ring-primary-500 ring-opacity-50;
   }
   ```
   - Removed default focus outline
   - Added a custom ring effect for accessibility

   c) **Text Selection**:
   ```css
   ::selection {
     @apply bg-primary-200 text-primary-900;
   }
   ```
   - Custom styling when text is selected

6. **Layout Techniques**:
   - Used CSS Grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4`
   - Responsive design with breakpoints (`md:`, `lg:`)
   - Flexbox for alignment: `flex items-center justify-between`
   - Consistent spacing with margin/padding utilities

7. **Visual Hierarchy**:
   - Larger text for headings: `text-4xl`, `text-3xl`, etc.
   - Section dividers: `border-b-2 border-primary-200`
   - Subtle gradients: `bg-gradient-to-br from-primary-50 to-primary-100`
   - Different text sizes and weights for visual hierarchy

8. **Transitions and Animations**:
   - Hover effects: `transition-colors duration-150`
   - Loading spinner: `animate-spin`
   - Interactive elements have smooth transitions

Benefits of Tailwind CSS:
- Utility-first: Small, single-purpose classes
- Composable: Can be combined for complex styles
- Responsive: Built-in breakpoint system
- Performance optimized: Only includes used styles
- Consistent: Uses a predefined design system
