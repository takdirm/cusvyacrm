import React, { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Input, message } from 'antd';
import { GoogleMap, Marker, Autocomplete } from '@react-google-maps/api';
import { useGoogleMaps } from './GoogleMapsProvider';

const defaultMapContainerStyle = {
  width: '100%',
  height: '300px',
  borderRadius: '8px',
  border: '1px solid #d9d9d9',
};

function SearchableMap({
  onLocationSelect,
  initialLocation = null,
  placeholder = 'Search for businesses, landmarks, or addresses...',
  height = '300px',
  zoom = 13,
  boundaries = null, // { north, south, east, west, center: { lat, lng }, name }
  restrictToArea = false,
  maxDistanceKm = 50,
  countryCode = 'IN',
  showSearchHints = true,
  searchHints = [],
  mapStyle = {},
  enableMapRestriction = false,
  minZoom = 8,
  maxZoom = 18,
  onError = null,
}) {
  const { isLoaded, error: mapsError } = useGoogleMaps();
  const [map, setMap] = useState(null);
  const [autocomplete, setAutocomplete] = useState(null);
  const [markerPosition, setMarkerPosition] = useState(
    initialLocation || boundaries?.center || { lat: 12.972442, lng: 77.580643 },
  );
  const [selectedAddress, setSelectedAddress] = useState('');

  // Update marker position when initialLocation changes
  useEffect(() => {
    if (initialLocation) {
      setMarkerPosition(initialLocation);
    }
  }, [initialLocation]);

  useEffect(() => {
    const styleId = 'google-places-pac-container-zindex-fix';
    if (document.getElementById(styleId)) return;

    const styleTag = document.createElement('style');
    styleTag.id = styleId;
    styleTag.innerHTML = '.pac-container{z-index:2147483647 !important;}';
    document.head.appendChild(styleTag);
  }, []);

  const onLoad = useCallback(
    (map) => {
      setMap(map);

      if (enableMapRestriction && boundaries) {
        // Restrict map to specified bounds
        const bounds = new window.google.maps.LatLngBounds(
          new window.google.maps.LatLng(boundaries.south, boundaries.west), // SW
          new window.google.maps.LatLng(boundaries.north, boundaries.east), // NE
        );

        // Set map bounds
        map.setOptions({
          restriction: {
            latLngBounds: bounds,
            strictBounds: false,
          },
          minZoom,
          maxZoom,
        });
      }
    },
    [boundaries, enableMapRestriction, minZoom, maxZoom],
  );

  const onUnmount = useCallback((map) => {
    setMap(null);
  }, []);

  const onAutocompleteLoad = (autocomplete) => {
    if (boundaries && restrictToArea) {
      // Create bounds for autocomplete
      const bounds = new window.google.maps.LatLngBounds(
        new window.google.maps.LatLng(boundaries.south, boundaries.west),
        new window.google.maps.LatLng(boundaries.north, boundaries.east),
      );

      autocomplete.setBounds(bounds);
    }

    autocomplete.setComponentRestrictions({
      country: countryCode,
    });

    setAutocomplete(autocomplete);
  };

  const isInBoundaries = (lat, lng) => {
    if (!boundaries) return true;

    return lat >= boundaries.south && lat <= boundaries.north && lng >= boundaries.west && lng <= boundaries.east;
  };

  const isWithinDistance = (lat, lng) => {
    if (!boundaries || !boundaries.center || !maxDistanceKm) return true;

    if (window.google && window.google.maps && window.google.maps.geometry) {
      const centerLatLng = new window.google.maps.LatLng(boundaries.center.lat, boundaries.center.lng);
      const placeLatLng = new window.google.maps.LatLng(lat, lng);
      const distance = window.google.maps.geometry.spherical.computeDistanceBetween(centerLatLng, placeLatLng);

      return distance <= maxDistanceKm * 1000; // Convert km to meters
    }

    return true; // Fallback if geometry library not available
  };

  const extractAddressData = (place) => {
    const addressComponents = place.address_components || [];
    const getComponent = (type) => {
      const component = addressComponents.find((comp) => comp.types.includes(type));
      return component ? component.long_name : '';
    };

    // Enhanced address line 1 - include business name if it's an establishment
    let addressLine1 = `${getComponent('street_number')} ${getComponent('route')}`.trim();

    // If it's a business establishment and has a name, use it
    if (
      place.name &&
      place.types &&
      (place.types.includes('establishment') || place.types.includes('point_of_interest'))
    ) {
      addressLine1 = place.name;
    }

    return {
      address: place.formatted_address || '',
      businessName: place.name || '',
      addressLine1: addressLine1 || place.name || '',
      addressLine2:
        place.name && addressLine1 !== place.name
          ? `${getComponent('street_number')} ${getComponent('route')}`.trim()
          : '',
      city:
        getComponent('locality') || getComponent('sublocality_level_1') || getComponent('administrative_area_level_2'),
      state: getComponent('administrative_area_level_1'),
      postalCode: getComponent('postal_code'),
      country: getComponent('country'),
      placeId: place.place_id,
      types: place.types || [],
    };
  };

  const handleLocationSelection = (lat, lng, place) => {
    const locationData = {
      latitude: lat,
      longitude: lng,
      address: place ? place.formatted_address : '',
      placeId: place ? place.place_id : null,
      ...extractAddressData(place || {}),
    };

    setMarkerPosition({ lat, lng });

    if (onLocationSelect) {
      onLocationSelect(locationData);
    }
  };

  const validateLocation = (lat, lng) => {
    if (restrictToArea && boundaries) {
      const inBounds = isInBoundaries(lat, lng);
      const withinDistance = isWithinDistance(lat, lng);

      if (!inBounds && !withinDistance) {
        const areaName = boundaries.name || 'the specified area';
        const errorMsg = `Please select a location within ${areaName}.`;
        message.warning(errorMsg);

        if (onError) {
          onError({ type: 'OUT_OF_BOUNDS', message: errorMsg, lat, lng });
        }

        return false;
      }
    }

    return true;
  };

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      console.log('Selected place:', place); // Debug log

      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        if (!validateLocation(lat, lng)) {
          setSelectedAddress('');
          return;
        }

        // Use business name if available, otherwise formatted address
        const displayAddress = place.name
          ? `${place.name} - ${place.formatted_address}`
          : place.formatted_address || '';
        setSelectedAddress(displayAddress);

        handleLocationSelection(lat, lng, place);

        // Center map on selected location
        if (map) {
          map.panTo({ lat, lng });
          map.setZoom(17); // Higher zoom for businesses
        }
      } else {
        console.log('No geometry found for place:', place);
        if (onError) {
          onError({ type: 'NO_GEOMETRY', message: 'No location found for this place', place });
        }
      }
    }
  };

  const onMapClick = (event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();

    if (!validateLocation(lat, lng)) {
      return;
    }

    // Reverse geocoding to get address
    if (window.google && window.google.maps) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const place = results[0];
          setSelectedAddress(place.formatted_address);
          handleLocationSelection(lat, lng, place);
        } else {
          // If geocoding fails, just pass coordinates
          handleLocationSelection(lat, lng, null);
          if (onError) {
            onError({ type: 'GEOCODING_FAILED', message: 'Could not get address for this location', lat, lng });
          }
        }
      });
    } else {
      // If geocoding not available, just pass coordinates
      handleLocationSelection(lat, lng, null);
    }
  };

  const geocodeByText = () => {
    const query = selectedAddress?.trim();
    if (!query) return;

    if (!window.google || !window.google.maps) {
      message.warning('Google Maps is not ready yet.');
      return;
    }

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: query }, (results, status) => {
      if (status !== 'OK' || !results || !results.length) {
        message.warning('Could not find this location. Try selecting from suggestions.');
        return;
      }

      const place = results[0];
      const location = place.geometry?.location;
      if (!location) {
        message.warning('Location geometry is unavailable for this address.');
        return;
      }

      const lat = location.lat();
      const lng = location.lng();

      if (!validateLocation(lat, lng)) {
        return;
      }

      setSelectedAddress(place.formatted_address || query);
      handleLocationSelection(lat, lng, place);

      if (map) {
        map.panTo({ lat, lng });
        map.setZoom(17);
      }
    });
  };

  // Show loading or error states
  if (!isLoaded) {
    return (
      <div
        style={{
          padding: '20px',
          textAlign: 'center',
          color: '#999',
          border: '1px solid #d9d9d9',
          borderRadius: '8px',
        }}
      >
        {mapsError ? `Error: ${mapsError}` : 'Loading Google Maps...'}
      </div>
    );
  }

  const mapContainerStyle = {
    ...defaultMapContainerStyle,
    ...mapStyle,
    height,
  };

  const areaName = boundaries?.name || 'area';
  const defaultHints = boundaries
    ? [`Search in ${areaName}`, `Try "${areaName} landmarks"`, `Look for businesses in ${areaName}`]
    : ['Search for any location', 'Try business names', 'Use landmarks or addresses'];

  return (
    <div>
      {/* Search Box */}
      <div style={{ marginBottom: '16px' }}>
        <Autocomplete onLoad={onAutocompleteLoad} onPlaceChanged={onPlaceChanged}>
          <Input
            placeholder={placeholder}
            size="large"
            style={{ width: '100%' }}
            value={selectedAddress}
            onChange={(e) => setSelectedAddress(e.target.value)}
            onPressEnter={geocodeByText}
            suffix={<div style={{ color: '#999', fontSize: '12px' }}>🔍</div>}
          />
        </Autocomplete>
        {showSearchHints && (
          <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
            {searchHints.length > 0 ? `Try: ${searchHints.join(', ')}` : `Try: ${defaultHints.join(', ')}`}
          </div>
        )}
      </div>

      {/* Google Map */}
      <div style={{ marginBottom: '8px' }}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={markerPosition}
          zoom={zoom}
          onLoad={onLoad}
          onUnmount={onUnmount}
          onClick={onMapClick}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
          }}
        >
          <Marker position={markerPosition} draggable={false} title="Selected Location" />
        </GoogleMap>
        <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
          {restrictToArea && boundaries
            ? `Search or click on the map to select a location within ${areaName}`
            : 'Search or click on the map to select a location'}
        </div>
      </div>
    </div>
  );
}

SearchableMap.propTypes = {
  onLocationSelect: PropTypes.func.isRequired,
  initialLocation: PropTypes.shape({
    lat: PropTypes.number,
    lng: PropTypes.number,
  }),
  placeholder: PropTypes.string,
  height: PropTypes.string,
  zoom: PropTypes.number,
  boundaries: PropTypes.shape({
    north: PropTypes.number.isRequired,
    south: PropTypes.number.isRequired,
    east: PropTypes.number.isRequired,
    west: PropTypes.number.isRequired,
    center: PropTypes.shape({
      lat: PropTypes.number.isRequired,
      lng: PropTypes.number.isRequired,
    }),
    name: PropTypes.string,
  }),
  restrictToArea: PropTypes.bool,
  maxDistanceKm: PropTypes.number,
  countryCode: PropTypes.string,
  showSearchHints: PropTypes.bool,
  searchHints: PropTypes.arrayOf(PropTypes.string),
  mapStyle: PropTypes.object,
  enableMapRestriction: PropTypes.bool,
  minZoom: PropTypes.number,
  maxZoom: PropTypes.number,
  onError: PropTypes.func,
};

export default SearchableMap;
