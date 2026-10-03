import React from 'react';
import TrackerLogsScreen from './TrackerLogsScreen';

const locationColumns = [
  {
    key: 'terminalId',
    title: 'TerminalId',
    currentField: 'terminalId',
    historyField: 'terminalId',
  },
  {
    key: 'imei',
    title: 'InfoType',
    currentField: 'imei',
    historyField: 'imei',
  },
  {
    key: 'protocol',
    title: 'Protocol',
    currentField: 'protocol',
    historyField: 'protocol',
  },
  {
    key: 'latitude',
    title: 'Latitude',
    currentField: 'latitude',
    historyField: 'latitude',
  },
  {
    key: 'longitude',
    title: 'Longitude',
    currentField: 'longitude',
    historyField: 'longitude',
  },
  {
    key: 'speedKmh',
    title: 'Speed (kmh)',
    currentField: 'speedKmh',
    historyField: 'speedKmh',
  },
  {
    key: 'locationTimeUtc',
    title: 'locationTimeUtc',
    currentField: 'locationTimeUtc',
    historyField: 'locationTimeUtc',
  },
  {
    key: 'receivedAtUtc',
    title: 'receivedAtUtc',
    currentField: 'receivedAtUtc',
    historyField: 'receivedAtUtc',
  },
];

function LocationLogs() {
  return (
    <TrackerLogsScreen title="Location Logs" endpointSegment="locations" columns={locationColumns} enableAutoRefresh />
  );
}

export default LocationLogs;
