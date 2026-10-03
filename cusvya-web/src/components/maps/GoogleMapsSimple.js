import React from 'react';
import PropTypes from 'prop-types';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { useGoogleMaps } from './GoogleMapsProvider';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

function GoogleMapsSimple({
  latitude,
  longitude,
  width = '100%',
  height = '250px',
  zoom = 15,
  showMarker = true,
  onClick = null,
  className = '',
  style = {},
}) {
  const { isLoaded, error } = useGoogleMaps();

  const center = {
    lat: parseFloat(latitude) || 12.972442,
    lng: parseFloat(longitude) || 77.580643,
  };

  const containerStyle = {
    width,
    height,
    borderRadius: '8px',
    border: '1px solid #d9d9d9',
    ...style,
  };

  if (!isLoaded) {
    return (
      <div
        style={{
          ...containerStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f5',
          color: '#999',
        }}
        className={className}
      >
        {error ? `Error: ${error}` : 'Loading Map...'}
      </div>
    );
  }

  return (
    <div style={containerStyle} className={className}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={zoom}
        onClick={onClick}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          zoomControl: true,
          disableDefaultUI: false,
        }}
      >
        {showMarker && <Marker position={center} />}
      </GoogleMap>
    </div>
  );
}

GoogleMapsSimple.propTypes = {
  latitude: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  longitude: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  width: PropTypes.string,
  height: PropTypes.string,
  zoom: PropTypes.number,
  showMarker: PropTypes.bool,
  onClick: PropTypes.func,
  className: PropTypes.string,
  style: PropTypes.object,
};

export default GoogleMapsSimple;
