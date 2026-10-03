// City boundaries configuration file
export const CITY_BOUNDARIES = {
  BANGALORE: {
    north: 13.1394,
    south: 12.7344,
    east: 77.7811,
    west: 77.4601,
    center: { lat: 12.972442, lng: 77.580643 },
    name: 'Bangalore',
    postalCodePattern: /^5[0-6][0-9]{4}$/,
    postalCodeExample: '560xxx',
  },

  MUMBAI: {
    north: 19.2695,
    south: 18.893,
    east: 72.9781,
    west: 72.7747,
    center: { lat: 19.076, lng: 72.8777 },
    name: 'Mumbai',
    postalCodePattern: /^4[0-9]{5}$/,
    postalCodeExample: '4xxxxx',
  },

  DELHI: {
    north: 28.8842,
    south: 28.4044,
    east: 77.3499,
    west: 76.8389,
    center: { lat: 28.6139, lng: 77.209 },
    name: 'Delhi',
    postalCodePattern: /^1[0-9]{5}$/,
    postalCodeExample: '1xxxxx',
  },

  CHENNAI: {
    north: 13.2347,
    south: 12.7745,
    east: 80.3292,
    west: 80.0878,
    center: { lat: 13.0827, lng: 80.2707 },
    name: 'Chennai',
    postalCodePattern: /^6[0-9]{5}$/,
    postalCodeExample: '6xxxxx',
  },

  HYDERABAD: {
    north: 17.5562,
    south: 17.2403,
    east: 78.6677,
    west: 78.2479,
    center: { lat: 17.385, lng: 78.4867 },
    name: 'Hyderabad',
    postalCodePattern: /^5[0-9]{5}$/,
    postalCodeExample: '5xxxxx',
  },

  PUNE: {
    north: 18.6298,
    south: 18.4088,
    east: 73.9897,
    west: 73.7004,
    center: { lat: 18.5204, lng: 73.8567 },
    name: 'Pune',
    postalCodePattern: /^4[0-9]{5}$/,
    postalCodeExample: '4xxxxx',
  },
};

// Helper function to get city configuration
export const getCityConfig = (cityName) => {
  return CITY_BOUNDARIES[cityName.toUpperCase()] || null;
};
