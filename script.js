const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const geoBtn = document.getElementById('geo-btn');
const weatherDisplay = document.getElementById('weather-display');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('error-message');
const errorText = document.getElementById('error-text');

// Elements to update
const cityNameEl = document.getElementById('city-name');
const dateEl = document.getElementById('date');
const tempEl = document.getElementById('temperature');
const conditionEl = document.getElementById('condition');
const iconEl = document.getElementById('weather-icon');
const humidityEl = document.getElementById('humidity');
const windSpeedEl = document.getElementById('wind-speed');
const feelsLikeEl = document.getElementById('feels-like');
const visibilityEl = document.getElementById('visibility');

// WMO Weather Codes mapping
const weatherCodes = {
    0: { text: 'Clear Sky', icon: 'fa-sun' },
    1: { text: 'Mainly Clear', icon: 'fa-cloud-sun' },
    2: { text: 'Partly Cloudy', icon: 'fa-cloud-sun' },
    3: { text: 'Overcast', icon: 'fa-cloud' },
    45: { text: 'Fog', icon: 'fa-smog' },
    48: { text: 'Rime Fog', icon: 'fa-smog' },
    51: { text: 'Light Drizzle', icon: 'fa-cloud-rain' },
    53: { text: 'Moderate Drizzle', icon: 'fa-cloud-rain' },
    55: { text: 'Dense Drizzle', icon: 'fa-cloud-rain' },
    61: { text: 'Slight Rain', icon: 'fa-cloud-showers-heavy' },
    63: { text: 'Moderate Rain', icon: 'fa-cloud-showers-heavy' },
    65: { text: 'Heavy Rain', icon: 'fa-cloud-showers-heavy' },
    71: { text: 'Slight Snow', icon: 'fa-snowflake' },
    73: { text: 'Moderate Snow', icon: 'fa-snowflake' },
    75: { text: 'Heavy Snow', icon: 'fa-snowflake' },
    77: { text: 'Snow Grains', icon: 'fa-snowflake' },
    80: { text: 'Slight Showers', icon: 'fa-cloud-rain' },
    81: { text: 'Moderate Showers', icon: 'fa-cloud-rain' },
    82: { text: 'Violent Showers', icon: 'fa-cloud-showers-heavy' },
    95: { text: 'Thunderstorm', icon: 'fa-bolt' },
    96: { text: 'Thunderstorm & Hail', icon: 'fa-bolt' },
    99: { text: 'Heavy Thunderstorm', icon: 'fa-bolt' },
};

// State
let isError = false;

// Event Listeners
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) getWeatherByCity(city);
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) getWeatherByCity(city);
    }
});

geoBtn.addEventListener('click', () => {
    if (navigator.geolocation) {
        showLoading();
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                getWeather(latitude, longitude, 'Your Location');
            },
            (error) => {
                showError('Location access denied. Please search manually.');
            }
        );
    } else {
        showError('Geolocation is not supported by your browser.');
    }
});

// Load default city on startup (optional)
document.addEventListener('DOMContentLoaded', () => {
    // Optionally fetch a default city or ask for location
    // getWeatherByCity('London'); 
});

async function getWeatherByCity(city) {
    showLoading();
    try {
        // Geocoding API to get lat/lon
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
        const geoRes = await fetch(geoUrl);
        const geoData = await geoRes.json();

        if (!geoData.results) {
            throw new Error('City not found');
        }

        const { latitude, longitude, name, country } = geoData.results[0];
        getWeather(latitude, longitude, `${name}, ${country}`);

    } catch (error) {
        showError(error.message);
    }
}

async function getWeather(lat, lon, locationName) {
    try {
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,visibility&timezone=auto`;

        const res = await fetch(weatherUrl);
        const data = await res.json();

        updateUI(data.current, locationName);

    } catch (error) {
        showError('Failed to fetch weather data.');
    }
}

function updateUI(current, locationName) {
    // Hide loader/error
    loading.classList.add('hidden');
    errorMessage.classList.add('hidden');
    weatherDisplay.classList.remove('hidden');

    // Update Text
    cityNameEl.textContent = locationName;
    dateEl.textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    tempEl.textContent = Math.round(current.temperature_2m);
    humidityEl.textContent = `${current.relative_humidity_2m}%`;
    windSpeedEl.textContent = `${current.wind_speed_10m} km/h`;
    feelsLikeEl.textContent = `${Math.round(current.apparent_temperature)}°`;

    // Visibility is in meters, convert to km
    const visibilityKm = (current.visibility / 1000).toFixed(1);
    visibilityEl.textContent = `${visibilityKm} km`;

    // Weather Condition & Icon
    const code = current.weather_code;
    const weatherInfo = weatherCodes[code] || { text: 'Unknown', icon: 'fa-cloud' };

    conditionEl.textContent = weatherInfo.text;

    // Reset icon classes
    iconEl.className = 'fa-solid';
    iconEl.classList.add(weatherInfo.icon);

    // Optional: Add some animation class to trigger fade-in?
    weatherDisplay.style.opacity = '0';
    setTimeout(() => weatherDisplay.style.opacity = '1', 50);
}

function showLoading() {
    isError = false;
    weatherDisplay.classList.add('hidden');
    errorMessage.classList.add('hidden');
    loading.classList.remove('hidden');
}

function showError(message) {
    isError = true;
    loading.classList.add('hidden');
    weatherDisplay.classList.add('hidden');
    errorMessage.classList.remove('hidden');
    errorText.textContent = message;
}
