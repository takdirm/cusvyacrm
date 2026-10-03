import React from 'react';
import ForecastSettingsTable from './ForecastSettingsTable';
import { API } from '../../config/api/index';

function BatteryLifeSettings() {
  return (
    <ForecastSettingsTable
      title="Battery Life Settings"
      subTitle="Configure battery-life forecast percentages"
      cardTitle="Battery Life Percentage Configuration"
      infoText="Update forecast impact by battery age range"
      endpoint={`${API.forecast.path}/${API.forecast.batteryLifePercent}`}
      valueField="batteryLifePercentValue"
      valueLabel="Battery Life Percent"
      rangeStartField="minYears"
      rangeStartLabel="Minimum Years"
      rangeEndField="maxYears"
      rangeEndLabel="Maximum Years"
      rangeUnit="years"
    />
  );
}

export default BatteryLifeSettings;
