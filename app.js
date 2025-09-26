// App state
let userLocation = null;
let currentCity = "";
let apiKey = "";
let currentRestaurants = [];

// DOM elements
const apiKeyInput = document.getElementById('api-key-input');
const saveApiKeyBtn = document.getElementById('save-api-key');
const changeApiKeyBtn = document.getElementById('change-api-key');
const apiStatus = document.getElementById('api-status');
const getLocationBtn = document.getElementById('get-location-btn');
const locationStatus = document.getElementById('location-status');
const manualLocationInput = document.getElementById('manual-location-input');
const setLocationBtn = document.getElementById('set-location-btn');
const foodSearch = document.getElementById('food-search');
const searchBtn = document.getElementById('search-btn');
const imageUpload = document.getElementById('image-upload');
const uploadBtn = document.getElementById('upload-btn');
const imagePreview = document.getElementById('image-preview');
const recognitionResult = document.getElementById('recognition-result');
const distanceFilter = document.getElementById('distance-filter');
const priceFilter = document.getElementById('price-filter');
const ratingFilter = document.getElementById('rating-filter');
const openNowFilter = document.getElementById('open-now-filter');
const loading = document.getElementById('loading');
const resultsHeader = document.getElementById('results-header');
const restaurantsList = document.getElementById('restaurants-list');

// Event listeners
saveApiKeyBtn.addEventListener('click', saveApiKey);
changeApiKeyBtn.addEventListener('click', changeApiKey);
getLocationBtn.addEventListener('click', getUserLocation);
setLocationBtn.addEventListener('click', setManualLocation);
searchBtn.addEventListener('click', searchRestaurants);
foodSearch.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') searchRestaurants();
});
uploadBtn.addEventListener('click', () => imageUpload.click());
imageUpload.addEventListener('change', handleImageUpload);
distanceFilter.addEventListener('change', applyFilters);
priceFilter.addEventListener('change', applyFilters);
ratingFilter.addEventListener('change', applyFilters);
openNowFilter.addEventListener('change', applyFilters);

// Initialize
checkSavedApiKey();

// Check for saved API key
function checkSavedApiKey() {
  const savedKey = localStorage.getItem('googlePlacesApiKey');
  if (savedKey) {
    apiKey = savedKey;
    apiKeyInput.value = savedKey;
    showApiSuccess();
  }
}

// Save API key
function saveApiKey() {
  const key = apiKeyInput.value.trim();
  if (!key) {
    showApiError('Please enter your API key');
    return;
  }

  if (!key.startsWith('AIza')) {
    showApiError('Invalid API key format. Should start with "AIza"');
    return;
  }

  apiKey = key;
  localStorage.setItem('googlePlacesApiKey', key);
  showApiSuccess();
}

// Change API key
function changeApiKey() {
  apiKeyInput.style.display = 'block';
  saveApiKeyBtn.style.display = 'inline-block';
  changeApiKeyBtn.style.display = 'none';
  apiStatus.innerHTML = '';
}

// Show API success
function showApiSuccess() {
  apiKeyInput.style.display = 'none';
  saveApiKeyBtn.style.display = 'none';
  changeApiKeyBtn.style.display = 'inline-block';
  apiStatus.innerHTML = '<div class="api-status success">✅ API key saved successfully</div>';
}

// Show API error
function showApiError(message) {
  apiStatus.innerHTML = `<div class="api-status error">❌ ${message}</div>`;
}

// Get user's current location
function getUserLocation() {
  if (!navigator.geolocation) {
    locationStatus.textContent = "Geolocation not supported";
    return;
  }

  getLocationBtn.textContent = "Getting location...";
  locationStatus.textContent = "Locating you...";

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      userLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };

      try {
        currentCity = await getCityName(userLocation.latitude, userLocation.longitude);
        locationStatus.textContent = `📍 ${currentCity}`;
      } catch {
        locationStatus.textContent = `📍 Location found`;
        currentCity = "Your Location";
      }

      getLocationBtn.textContent = "📍 Get My Location";

      if (apiKey) {
        searchNearbyRestaurants();
      }
    },
    (error) => {
      getLocationBtn.textContent = "📍 Get My Location";
      locationStatus.textContent = "Location access denied";
      console.error("Location error:", error);
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

// Set location manually
async function setManualLocation() {
  const input = manualLocationInput.value.trim();
  if (!input) {
    alert("Please enter a location");
    return;
  }

  setLocationBtn.textContent = "Setting location...";

  try {
    const coordinates = await geocodeLocation(input);
    if (coordinates) {
      userLocation = coordinates;
      currentCity = input;
      locationStatus.textContent = `📍 ${input}`;

      if (apiKey) {
        searchNearbyRestaurants();
      }
    } else {
      throw new Error("Location not found");
    }
  } catch (error) {
    alert("Location not found. Please try a different address or city name.");
  }

  setLocationBtn.textContent = "Set Location";
}

// Geocode location using backend API
async function geocodeLocation(address) {
  if (!apiKey) return null;

  try {
    const response = await fetch('/api/geocode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ address, apiKey })
    });

    const data = await response.json();
    return data.coordinates || null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

// Get city name from coordinates
async function getCityName(lat, lng) {
  if (!apiKey) return "Your Location";

  try {
    const response = await fetch('/api/reverse-geocode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ lat, lng, apiKey })
    });

    const data = await response.json();
    return data.cityName || "Your Location";
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return "Your Location";
  }
}

// Search for restaurants
async function searchRestaurants() {
  if (!apiKey) {
    alert('Please enter your Google Places API key first');
    return;
  }

  if (!userLocation) {
    alert('Please set your location first');
    return;
  }

  const query = foodSearch.value.trim();
  if (!query) {
    searchNearbyRestaurants();
    return;
  }

  showLoading();

  try {
    const restaurants = await searchPlaces(query, userLocation);
    currentRestaurants = restaurants;
    displayResults(`"${query}" restaurants near ${currentCity}`);
    applyFilters();
  } catch (error) {
    console.error('Search error:', error);
    hideLoading();
    alert('Error searching for restaurants. Please try again.');
  }
}

// Search nearby restaurants
async function searchNearbyRestaurants() {
  if (!apiKey || !userLocation) return;

  showLoading();

  try {
    const restaurants = await searchPlaces('restaurant', userLocation);
    currentRestaurants = restaurants;
    displayResults(`Restaurants near ${currentCity}`);
    applyFilters();
  } catch (error) {
    console.error('Search error:', error);
    hideLoading();
    alert('Error finding nearby restaurants. Please try again.');
  }
}

// Search places using backend API
async function searchPlaces(query, location) {
  const radius = distanceFilter.value || 5000;

  try {
    const response = await fetch('/api/places-search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        location,
        radius,
        apiKey
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }

    return data.restaurants || [];
  } catch (error) {
    console.error('Places search error:', error);
    throw error;
  }
}

// Handle image upload
function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    imagePreview.innerHTML = `<img src="${e.target.result}" alt="Uploaded food">`;
    recognitionResult.textContent = "Analyzing image...";

    setTimeout(() => {
      const recognizedFood = simulateFoodRecognition(file.name);
      recognitionResult.textContent = `Recognized: ${recognizedFood}`;
      foodSearch.value = recognizedFood;
      searchRestaurants();
    }, 2000);
  };

  reader.readAsDataURL(file);
}

// Simulate food recognition
function simulateFoodRecognition(filename) {
  const lowerName = filename.toLowerCase();
  const foodMap = {
    'pizza': 'pizza',
    'burger': 'burger',
    'sushi': 'sushi',
    'curry': 'curry',
    'noodle': 'noodles',
    'ramen': 'ramen',
    'pasta': 'pasta',
    'taco': 'tacos',
    'salad': 'salad'
  };

  for (const [keyword, food] of Object.entries(foodMap)) {
    if (lowerName.includes(keyword)) {
      return food;
    }
  }

  const randomFoods = ['pizza', 'burger', 'sushi', 'pasta', 'tacos'];
  return randomFoods[Math.floor(Math.random() * randomFoods.length)];
}

// Apply filters
function applyFilters() {
  if (!currentRestaurants.length) return;

  let filtered = [...currentRestaurants];

  const maxPrice = parseInt(priceFilter.value);
  if (maxPrice) {
    filtered = filtered.filter(r => r.priceLevel <= maxPrice);
  }

  const minRating = parseFloat(ratingFilter.value);
  if (minRating > 0) {
    filtered = filtered.filter(r => r.rating >= minRating);
  }

  if (openNowFilter.checked) {
    filtered = filtered.filter(r => r.openNow === true);
  }

  renderRestaurants(filtered);
}

// Display results
function displayResults(headerText) {
  resultsHeader.textContent = headerText;
  hideLoading();
}

// Show/hide loading
function showLoading() {
  loading.classList.remove('hidden');
  restaurantsList.innerHTML = '';
}

function hideLoading() {
  loading.classList.add('hidden');
}

// Render restaurants
function renderRestaurants(restaurants) {
  if (!restaurants.length) {
    restaurantsList.innerHTML = '<div class="no-results">No restaurants found matching your criteria.</div>';
    return;
  }

  restaurantsList.innerHTML = restaurants.map(restaurant => {
    const imageUrl = restaurant.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=250&fit=crop';
    const priceDisplay = '$'.repeat(restaurant.priceLevel || 1);
    const ratingDisplay = restaurant.rating ? `⭐ ${restaurant.rating}` : 'No rating';
    const openStatus = restaurant.openNow === true ? '🟢 Open' : 
                      restaurant.openNow === false ? '🔴 Closed' : '❓ Unknown';

    return `
      <div class="restaurant-card">
        <img src="${imageUrl}" alt="${restaurant.name}" class="restaurant-image">
        <div class="restaurant-info">
          <h3 class="restaurant-name">${restaurant.name}</h3>
          <div class="restaurant-address">${restaurant.address}</div>
          <div class="restaurant-details">
            <div class="detail-item rating">${ratingDisplay}</div>
            <div class="detail-item price-level">💰 ${priceDisplay}</div>
            <div class="detail-item ${restaurant.openNow === true ? 'status-open' : 'status-closed'}">${openStatus}</div>
            <div class="detail-item">📍 ${restaurant.distance || 'N/A'} km</div>
          </div>
          <div class="restaurant-actions">
            <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.name + ' ' + restaurant.address)}" 
               target="_blank" class="action-btn directions-btn">🗺️ Directions</a>
            <button class="action-btn phone-btn" onclick="searchPhoneNumber('${restaurant.name}', '${restaurant.address}')">📞 Contact</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Search for restaurant phone number
function searchPhoneNumber(name, address) {
  const query = encodeURIComponent(`${name} ${address} phone number`);
  window.open(`https://www.google.com/search?q=${query}`, '_blank');
}