// Replace with your actual WeatherAPI.com key
const API_KEY = '6b3f945bdf9f40dab4e174635251504'; // Get from https://www.weatherapi.com/

// DOM Elements
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const cityName = document.getElementById('city-name');
const tempElement = document.getElementById('temp');
const weatherIcon = document.getElementById('weather-icon');
const weatherDesc = document.getElementById('weather-desc');
const feelsLike = document.getElementById('feels-like');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('wind-speed');
const pressure = document.getElementById('pressure');
const localTimeElement = document.createElement('div');
localTimeElement.className = 'local-time';
document.querySelector('.weather-info').prepend(localTimeElement);

// Time formatting options
const timeOptions = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
};

const dateOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
};

let timeInterval;

// Fetch weather data from WeatherAPI.com
async function fetchWeatherData(query) {
    try {
        const response = await fetch(
            `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${encodeURIComponent(query)}&aqi=no`
        );
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error.message || 'Location not found');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching weather data:', error);
        alert(error.message || 'Failed to fetch weather data. Please try again.');
        return null;
    }
}

// Update UI with weather data
function updateWeatherUI(data) {
    const location = data.location;
    const current = data.current;
    
    // Update city and country
    cityName.textContent = `${location.name}, ${location.country}`;
    
    // Update weather info
    tempElement.textContent = Math.round(current.temp_c);
    weatherDesc.textContent = current.condition.text;
    feelsLike.textContent = Math.round(current.feelslike_c);
    humidity.textContent = current.humidity;
    windSpeed.textContent = Math.round(current.wind_kph);
    pressure.textContent = current.pressure_mb;
    
    // Update weather icon
    weatherIcon.src = `https:${current.condition.icon}`;
    weatherIcon.alt = current.condition.text;
    
    // Update and start live time for the location
    updateLocalTime(location.localtime_epoch, location.tz_id);
}

// Update local time display and set up live updating
function updateLocalTime(epoch, timezone) {
    if (timeInterval) clearInterval(timeInterval);
    
    const updateTime = () => {
        const now = new Date();
        const localTimeStr = now.toLocaleString('en-US', { 
            ...timeOptions, 
            ...dateOptions,
            timeZone: timezone 
        });
        localTimeElement.textContent = localTimeStr;
    };
    
    updateTime();
    timeInterval = setInterval(updateTime, 1000);
}

// Get user's current location
function getLiveLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by your browser'));
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            position => resolve(`${position.coords.latitude},${position.coords.longitude}`),
            error => {
                console.error('Geolocation error:', error);
                // Fallback to default location if geolocation fails
                resolve('London');
            }
        );
    });
}

// Search by city name
async function searchByCity(city) {
    if (city) {
        const weatherData = await fetchWeatherData(city);
        if (weatherData) {
            cityInput.value = weatherData.location.name;
            updateWeatherUI(weatherData);
        }
    }
}

// Initialize the app
async function initApp() {
    try {
        // First try to get live location
        const locationQuery = await getLiveLocation();
        const weatherData = await fetchWeatherData(locationQuery);
        
        if (weatherData) {
            // If we got location data, update UI
            cityInput.value = weatherData.location.name;
            updateWeatherUI(weatherData);
        } else {
            // Fallback to default location
            await searchByCity('London');
        }
    } catch (error) {
        console.error('Initialization error:', error);
        // Fallback to default location
        await searchByCity('London');
    }
}

// Event listeners
searchBtn.addEventListener('click', () => searchByCity(cityInput.value.trim()));

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchByCity(cityInput.value.trim());
});

// Initialize when page loads
window.addEventListener('load', initApp);