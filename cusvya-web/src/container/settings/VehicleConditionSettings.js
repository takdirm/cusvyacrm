import React from 'react';
import ForecastSettingsTable from './ForecastSettingsTable';
import { API } from '../../config/api/index';

const BIKE_CONDITION_OPTIONS = [
  { label: 'New', value: 'New' },
  { label: 'Excellent', value: 'Excellent' },
  { label: 'Good', value: 'Good' },
  { label: 'Fair', value: 'Fair' },
  { label: 'Poor', value: 'Poor' },
  { label: 'Broken', value: 'Broken' },
];

const BIKE_CONDITION_ENUM = {
  New: 0,
  Excellent: 1,
  Good: 2,
  Fair: 3,
  Poor: 4,
  Broken: 5,
};

function VehicleConditionSettings() {
  return (
    <ForecastSettingsTable
      title="Vehicle Condition Settings"
      subTitle="Configure forecast percentages by bike condition"
      cardTitle="Bike Condition Percentage Configuration"
      infoText="Update forecast impact for each vehicle condition"
      endpoint={`${API.forecast.path}/${API.forecast.bikeConditionPercent}`}
      valueField="bikeConditionPercentValue"
      valueLabel="Bike Condition Percent"
      nameOptions={BIKE_CONDITION_OPTIONS}
      buildUpdatePayload={({ values }) => ({
        bikeCondition: BIKE_CONDITION_ENUM[values.name],
        bikeConditionPercentValue: values.bikeConditionPercentValue,
        isActive: values.isActive ?? true,
      })}
    />
  );
}

export default VehicleConditionSettings;
