import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { GmapWraper } from './map-style';

const apiKey = process.env.REACT_APP_GOOGLE_MAP_KEY;

const containerStyle = {
  width: '100%',
  height: '100%',
};

function GoogleMapsSimple({
  latitude = '50.797897',
  longitude = '-1.077641',
  width = '100%',
  height = '600px',
  zoom = 13,
  mapStyles,
}) {
  const center = {
    lat: parseFloat(latitude),
    lng: parseFloat(longitude),
  };

  const mapOptions = {
    styles: mapStyles,
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: true,
    streetViewControl: true,
    fullscreenControl: true,
    gestureHandling: 'greedy',
    mapTypeId: 'roadmap',
    clickableIcons: true,
  };

  const handleLoad = useCallback(
    (map) => {
      map.setCenter(center);
      map.setZoom(zoom);
    },
    [center, zoom],
  );

  if (!apiKey) {
    return (
      <GmapWraper width={width} height={height}>
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f5f5f5',
            color: '#999',
          }}
        >
          Map unavailable
        </div>
      </GmapWraper>
    );
  }

  return (
    <GmapWraper width={width} height={height}>
      <LoadScript googleMapsApiKey={apiKey}>
        <GoogleMap
          key={`${latitude}-${longitude}-${zoom}`}
          mapContainerStyle={containerStyle}
          center={center}
          zoom={zoom}
          options={mapOptions}
          onLoad={handleLoad}
        >
          <Marker position={center} />
        </GoogleMap>
      </LoadScript>
    </GmapWraper>
  );
}

GoogleMapsSimple.propTypes = {
  latitude: PropTypes.string,
  longitude: PropTypes.string,
  width: PropTypes.string,
  height: PropTypes.string,
  zoom: PropTypes.number,
  mapStyles: PropTypes.array,
};

export { GoogleMapsSimple as GoogleMaps };
