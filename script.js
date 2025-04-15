// Replace with your actual WeatherAPI.com key
const API_KEY = '6b3f945bdf9f40dab4e174635251504'; // Get from https://www.weatherapi.com/
let currentUnit = 'c'; // 'c' for Celsius, 'f' for Fahrenheit
let recentCities = JSON.parse(localStorage.getItem('recentCities')) || [];
let darkMode = localStorage.getItem('darkMode') === 'true';

// DOM Elements
const elements = {
    cityInput: document.getElementById('city-input'),
    searchBtn: document.getElementById('search-btn'),
    unitToggle: document.getElementById('unit-toggle'),
    themeToggle: document.getElementById('theme-toggle'),
    cityName: document.querySelector('.city-name'),
    localTime: document.querySelector('.local-time'),
    temperature: document.querySelector('.temperature'),
    weatherIcon: document.querySelector('.weather-icon'),
    weatherDesc: document.querySelector('.weather-desc'),
    feelsLike: document.getElementById('feels-like'),
    humidity: document.getElementById('humidity'),
    windSpeed: document.getElementById('wind-speed'),
    pressure: document.getElementById('pressure'),
    forecastDays: document.getElementById('forecast-days'),
    recentList: document.querySelector('.recent-list'),
    unitElements: document.querySelectorAll('.unit, .unit-small')
};

// Initialize theme
function initTheme() {
    if (darkMode) {
        document.body.classList.add('dark-mode');
        elements.themeToggle.innerHTML = '<i class="fas fa-sun"></i> Light Mode';
    } else {
        document.body.classList.remove('dark-mode');
        elements.themeToggle.innerHTML = '<i class="fas fa-moon"></i> Dark Mode';
    }
}

// Toggle dark/light theme
function toggleTheme() {
    darkMode = !darkMode;
    localStorage.setItem('darkMode', darkMode);
    initTheme();
}

// Time formatting options
const timeOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
};

const dateOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
};

let timeInterval;

// Initialize the app
window.addEventListener('load', () => {
    initTheme();
    updateRecentCities();
    detectLocation();
});

// Detect user's location
function detectLocation() {
    elements.cityName.textContent = "Detecting your location...";
    elements.weatherDesc.textContent = "Please allow location access";
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;
                fetchWeatherData(`${latitude},${longitude}`);
            },
            error => {
                console.error("Geolocation error:", error);
                fetchWeatherData('London'); // Fallback to default location
            }
        );
    } else {
        fetchWeatherData('London'); // Fallback if geolocation not supported
    }
}

// Fetch weather data from WeatherAPI.com
async function fetchWeatherData(query) {
    try {
        elements.cityName.textContent = "Loading...";
        elements.weatherDesc.textContent = "Fetching weather data...";
        
        const response = await fetch(
            `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${encodeURIComponent(query)}&days=5&aqi=no&alerts=no`
        );
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error.message || 'Location not found');
        }
        
        const data = await response.json();
        updateUI(data);
        addToRecentCities(data.location.name);
    } catch (error) {
        console.error('Error fetching weather data:', error);
        alert(error.message || 'Failed to fetch weather data. Please try again.');
        elements.cityName.textContent = "Error";
        elements.weatherDesc.textContent = "Failed to load data";
    }
}

// Update UI with weather data
function updateUI(data) {
    const { location, current, forecast } = data;
    
    // Update current weather
    elements.cityName.textContent = `${location.name}, ${location.country}`;
    elements.cityInput.value = location.name;
    updateTemperature(current.temp_c, current.temp_f);
    elements.weatherIcon.src = `https:${current.condition.icon.replace('64x64', '128x128')}`;
    elements.weatherIcon.alt = current.condition.text;
    elements.weatherDesc.textContent = current.condition.text;
    updateFeelsLike(current.feelslike_c, current.feelslike_f);
    elements.humidity.textContent = current.humidity;
    elements.windSpeed.textContent = current.wind_kph;
    elements.pressure.textContent = current.pressure_mb;
    
    // Update local time
    updateLocalTime(location.localtime_epoch, location.tz_id);
    
    // Update forecast
    updateForecast(forecast.forecastday);
}

// Update temperature display
function updateTemperature(celsius, fahrenheit) {
    const temp = currentUnit === 'c' ? Math.round(celsius) : Math.round(fahrenheit);
    elements.temperature.innerHTML = `${temp}<span class="unit">°${currentUnit.toUpperCase()}</span>`;
}

// Update feels like temperature
function updateFeelsLike(celsius, fahrenheit) {
    const temp = currentUnit === 'c' ? Math.round(celsius) : Math.round(fahrenheit);
    elements.feelsLike.textContent = temp;
}

// Update local time display
function updateLocalTime(epoch, timezone) {
    if (timeInterval) clearInterval(timeInterval);
    
    const updateTime = () => {
        const now = new Date();
        const localTimeStr = now.toLocaleString('en-US', { 
            ...timeOptions, 
            ...dateOptions,
            timeZone: timezone 
        });
        elements.localTime.textContent = localTimeStr;
    };
    
    updateTime();
    timeInterval = setInterval(updateTime, 1000);
}

// Update 5-day forecast
function updateForecast(forecastDays) {
    elements.forecastDays.innerHTML = '';
    
    forecastDays.forEach(day => {
        const date = new Date(day.date);
        const dayElement = document.createElement('div');
        dayElement.className = 'forecast-day';
        
        dayElement.innerHTML = `
            <div class="day-name">${date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
            <img class="forecast-icon" src="https:${day.day.condition.icon}" alt="${day.day.condition.text}">
            <div class="forecast-temp">
                <span class="max-temp">${currentUnit === 'c' ? Math.round(day.day.maxtemp_c) : Math.round(day.day.maxtemp_f)}°</span>
                <span class="min-temp">${currentUnit === 'c' ? Math.round(day.day.mintemp_c) : Math.round(day.day.mintemp_f)}°</span>
            </div>
        `;
        
        elements.forecastDays.appendChild(dayElement);
    });
}

// Add city to recent cities list
function addToRecentCities(city) {
    if (!recentCities.includes(city)) {
        recentCities.unshift(city);
        if (recentCities.length > 5) {
            recentCities.pop();
        }
        localStorage.setItem('recentCities', JSON.stringify(recentCities));
        updateRecentCities();
    }
}

// Update recent cities list in UI
function updateRecentCities() {
    elements.recentList.innerHTML = '';
    
    recentCities.forEach(city => {
        const cityElement = document.createElement('div');
        cityElement.className = 'recent-city';
        cityElement.textContent = city;
        cityElement.addEventListener('click', () => {
            elements.cityInput.value = city;
            fetchWeatherData(city);
        });
        elements.recentList.appendChild(cityElement);
    });
}

// Toggle temperature unit
function toggleTemperatureUnit() {
    currentUnit = currentUnit === 'c' ? 'f' : 'c';
    elements.unitToggle.textContent = currentUnit === 'c' ? 'Switch to °F' : 'Switch to °C';
    
    document.querySelectorAll('.temperature, .max-temp, .min-temp, #feels-like').forEach(el => {
        if (el.classList.contains('temperature')) {
            const tempC = parseFloat(el.dataset.celsius) || parseFloat(el.textContent) || 0;
            const tempF = Math.round((tempC * 9/5) + 32);
            el.innerHTML = `${currentUnit === 'c' ? Math.round(tempC) : tempF}<span class="unit">°${currentUnit.toUpperCase()}</span>`;
            el.dataset.celsius = tempC;
            el.dataset.fahrenheit = tempF;
        } else if (el.id === 'feels-like') {
            const tempC = parseFloat(el.dataset.celsius) || parseFloat(el.textContent) || 0;
            const tempF = Math.round((tempC * 9/5) + 32);
            el.textContent = currentUnit === 'c' ? Math.round(tempC) : tempF;
            el.dataset.celsius = tempC;
            el.dataset.fahrenheit = tempF;
        } else {
            const tempC = parseFloat(el.dataset.celsius) || parseFloat(el.textContent) || 0;
            const tempF = Math.round((tempC * 9/5) + 32);
            el.textContent = currentUnit === 'c' ? Math.round(tempC) : tempF;
            el.dataset.celsius = tempC;
            el.dataset.fahrenheit = tempF;
        }
    });
}
    
    // Update unit labels
//     elements.unitElements.forEach(el => {
//         el.textContent = `°${currentUnit.toUpperCase()}`;
//     });
// }

// Event listeners
elements.searchBtn.addEventListener('click', () => {
    const city = elements.cityInput.value.trim();
    if (city) fetchWeatherData(city);
});

elements.cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = elements.cityInput.value.trim();
        if (city) fetchWeatherData(city);
    }
});

elements.unitToggle.addEventListener('click', toggleTemperatureUnit);
elements.themeToggle.addEventListener('click', toggleTheme);