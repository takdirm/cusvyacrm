import React from 'react';
import ForecastSettingsTable from './ForecastSettingsTable';
import { API } from '../../config/api/index';

function OdometerSettings() {
  return (
    <ForecastSettingsTable
      title="Odometer Settings"
      subTitle="Configure odometer-based forecast percentages"
      cardTitle="Odometer Percentage Configuration"
      infoText="Update forecast impact by kilometer range"
      endpoint={`${API.forecast.path}/${API.forecast.odometerPercent}`}
      valueField="odometerPercentValue"
      valueLabel="Odometer Percent"
      rangeStartField="minKilometers"
      rangeStartLabel="Minimum Kilometers"
      rangeEndField="maxKilometers"
      rangeEndLabel="Maximum Kilometers"
      rangeUnit="km"
    />
  );
}

export default OdometerSettings;
