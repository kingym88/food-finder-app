# Food Finder App

A web application that helps users find restaurants near their location using Google Places API.

## Features

- 🍽️ Find restaurants by location
- 🔍 Search by food type (pizza, sushi, etc.)
- 📷 Upload food images for recognition
- 📍 GPS location detection or manual location entry
- 🎯 Filter by distance, price, rating, and open hours
- 🗺️ Get directions and contact information

## Setup Instructions

### 1. Get Google Places API Key (FREE)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable "Places API (New)" and "Geocoding API"
4. Create an API key from Credentials
5. Restrict the API key to your domain

### 2. Deploy to Vercel

1. Install Vercel CLI: `npm install -g vercel`
2. Login: `vercel login`
3. Deploy: `vercel` (in project folder)
4. Follow the prompts

### 3. Add Your API Key

1. Open your deployed app
2. Enter your Google Places API key in the input field
3. Click "Save Key"
4. Start finding restaurants!

## Project Structure

```
food-finder-app/
├── index.html          # Main HTML file
├── style.css           # Styling
├── app.js              # Frontend JavaScript
├── package.json        # Project configuration
├── vercel.json         # Vercel deployment config
└── api/                # Backend API functions
    ├── places-search.js
    ├── geocode.js
    └── reverse-geocode.js
```

## API Usage & Costs

- **Google Places API**: $17 per 1,000 requests
- **Geocoding API**: $5 per 1,000 requests
- **Photo API**: $7 per 1,000 requests
- **FREE TIER**: $200 credit monthly = ~11,000+ restaurant searches per month

## Local Development

1. Install dependencies: `npm install`
2. Run locally: `vercel dev`
3. Open http://localhost:3000

## Technologies Used

- HTML5, CSS3, JavaScript (ES6+)
- Google Places API
- Google Geocoding API
- Vercel (hosting and serverless functions)
- Responsive design

## Browser Support

- Chrome, Firefox, Safari, Edge
- Requires geolocation API support
- Mobile-friendly responsive design
