document.addEventListener("DOMContentLoaded", () => {
  // ELEMENT REFERENCES
  const apiKeyInput = document.getElementById("api-key-input");
  const saveApiKeyBtn = document.getElementById("save-api-key");
  const changeApiKeyBtn = document.getElementById("change-api-key");
  const apiStatus = document.getElementById("api-status");
  const getLocationBtn = document.getElementById("get-location-btn");
  const locationStatus = document.getElementById("location-status");
  const manualLocationInput = document.getElementById("manual-location-input");
  const setLocationBtn = document.getElementById("set-location-btn");
  const foodSearch = document.getElementById("food-search");
  const searchBtn = document.getElementById("search-btn");
  const uploadBtn = document.getElementById("upload-btn");
  const imageInput = document.getElementById("image-upload");
  const imagePreview = document.getElementById("image-preview");
  const recognitionResult = document.getElementById("recognition-result");
  const loading = document.getElementById("loading");
  const resultsHeader = document.getElementById("results-header");
  const restaurantsList = document.getElementById("restaurants-list");
  
  const distanceFilter = document.getElementById("distance-filter");
  const priceFilter = document.getElementById("price-filter");
  const ratingFilter = document.getElementById("rating-filter");
  const openNowFilter = document.getElementById("open-now-filter");

  // APP STATE
  let apiKey = localStorage.getItem("googlePlacesApiKey") || "";
  let userLocation = null;
  let currentRestaurants = [];

  // INITIAL UI SETUP
  if (apiKey) {
    apiKeyInput.value = apiKey;
    apiKeyInput.style.display = "none";
    saveApiKeyBtn.style.display = "none";
    changeApiKeyBtn.style.display = "inline-block";
    apiStatus.textContent = "API key saved ✔️";
  } else {
    changeApiKeyBtn.style.display = "none";
    apiStatus.textContent = "Enter your API key";
  }

  // EVENT LISTENERS

  saveApiKeyBtn.addEventListener("click", () => {
    const val = apiKeyInput.value.trim();
    if (!val) {
      alert("Please enter a valid API key");
      return;
    }
    localStorage.setItem("googlePlacesApiKey", val);
    apiKey = val;
    apiKeyInput.style.display = "none";
    saveApiKeyBtn.style.display = "none";
    changeApiKeyBtn.style.display = "inline-block";
    apiStatus.textContent = "API key saved ✔️";
  });

  changeApiKeyBtn.addEventListener("click", () => {
    apiKeyInput.style.display = "inline-block";
    saveApiKeyBtn.style.display = "inline-block";
    changeApiKeyBtn.style.display = "none";
    apiStatus.textContent = "Enter your API key";
    localStorage.removeItem("googlePlacesApiKey");
    apiKey = "";
  });

  getLocationBtn.addEventListener("click", () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    getLocationBtn.textContent = "Locating...";
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        userLocation = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        locationStatus.textContent = `Location set: (${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)})`;
        getLocationBtn.textContent = "Get My Location";
      },
      () => {
        alert("Unable to retrieve your location");
        getLocationBtn.textContent = "Get My Location";
      }
    );
  });

  setLocationBtn.addEventListener("click", async () => {
    const input = manualLocationInput.value.trim();
    if (!input) {
      alert("Enter a location");
      return;
    }
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(input)}&limit=1`);
      if (!response.ok) throw new Error("Geocoding error");
      const data = await response.json();
      if (data.length === 0) throw new Error("Location not found");
      userLocation = { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) };
      locationStatus.textContent = `Location set: (${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)})`;
    } catch (e) {
      alert("Location not found, try a different input");
    }
  });

  searchBtn.addEventListener("click", () => {
    const query = foodSearch.value.trim();
    if (!query) {
      alert("Please enter a food to search for");
      return;
    }
    if (!userLocation) {
      alert("Please set your location first");
      return;
    }
    searchRestaurants(query);
  });

  uploadBtn.addEventListener("click", () => imageInput.click());
  imageInput.addEventListener("change", () => {
    const file = imageInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      imagePreview.innerHTML = `<img src="${reader.result}" style="max-width:300px; border-radius:10px; margin:10px 0" alt="Food Image">`;
      recognitionResult.textContent = "Recognizing...";
      setTimeout(() => {
        const name = file.name.toLowerCase();
        let food = "food";
        if (name.includes("pizza")) food = "pizza";
        else if (name.includes("burger")) food = "burger";
        else if (name.includes("sushi")) food = "sushi";
        recognitionResult.textContent = `Recognized: ${food}`;
        foodSearch.value = food;
        if (userLocation) searchRestaurants(food);
      }, 2000);
    };
    reader.readAsDataURL(file);
  });

  distanceFilter.addEventListener("change", () => {
    if (currentRestaurants.length) applyFilters();
  });
  priceFilter.addEventListener("change", () => {
    if (currentRestaurants.length) applyFilters();
  });
  ratingFilter.addEventListener("change", () => {
    if (currentRestaurants.length) applyFilters();
  });
  openNowFilter.addEventListener("change", () => {
    if (currentRestaurants.length) applyFilters();
  });

  // FUNCTIONS

  async function searchRestaurants(food) {
    showLoading();
    try {
      const url = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json");
      url.search = new URLSearchParams({
        key: apiKey,
        location: `${userLocation.latitude},${userLocation.longitude}`,
        radius: distanceFilter.value || "5000",
        keyword: food,
        type: "restaurant",
      });

      // Use CORS proxy for local dev/testing only
      const proxyUrl = "https://cors-anywhere.herokuapp.com/";
      const response = await fetch(proxyUrl + url.toString());
      const data = await response.json();
      if (data.status !== "OK") throw new Error(data.status);
      
      currentRestaurants = data.results;
      displayRestaurants(currentRestaurants);
    } catch (e) {
      alert("Error loading restaurants. " + e.message);
    } finally {
      hideLoading();
    }
  }

  function displayRestaurants(restaurants) {
    resultsHeader.textContent = `Found ${restaurants.length} restaurants`;
    restaurantsList.innerHTML = restaurants.map(r => `
      <div style="margin:10px;padding:10px;border:1px solid #ccc;border-radius:8px;">
        <h3>${r.name}</h3>
        <p>${r.vicinity || r.formatted_address || ''}</p>
        <p>Rating: ${r.rating || 'N/A'}</p>
      </div>
    `).join("");
  }

  function showLoading() {
    loading.style.display = "block";
    resultsHeader.textContent = "";
    restaurantsList.innerHTML = "";
  }

  function hideLoading() {
    loading.style.display = "none";
  }
});
