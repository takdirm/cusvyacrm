import React from 'react';
import TrackerLogsScreen from './TrackerLogsScreen';

const heartbeatColumns = [
  {
    key: 'terminalId',
    title: 'TerminalId',
    currentField: 'terminalId',
    historyField: 'terminalId',
  },
  {
    key: 'imei',
    title: 'IMEI',
    currentField: 'imei',
    historyField: 'imei',
  },
  {
    key: 'alarmStatus',
    title: 'Alarm',
    currentField: 'alarmStatus',
    historyField: 'alarmStatus',
  },
  {
    key: 'protocol',
    title: 'Protocol',
    currentField: 'protocol',
    historyField: 'protocol',
  },
  {
    key: 'oilElectricityStatus',
    title: 'Engine Status',
    currentField: 'oilElectricityStatus',
    historyField: 'oilElectricityStatus',
  },
  {
    key: 'gpsTrackingStatus',
    title: 'GPS Status',
    currentField: 'gpsTrackingStatus',
    historyField: 'gpsTrackingStatus',
  },
  {
    key: 'chargeStatus',
    title: 'Charge Status',
    currentField: 'chargeStatus',
    historyField: 'chargeStatus',
  },
  {
    key: 'accStatus',
    title: 'Ignition',
    currentField: 'accStatus',
    historyField: 'accStatus',
  },
  {
    key: 'alarmLanguage',
    title: 'Alarm Language',
    currentField: 'alarmLanguage',
    historyField: 'alarmLanguage',
  },
  {
    key: 'receivedAtUtc',
    title: 'receivedAtUtc',
    currentField: 'receivedAtUtc',
    historyField: 'receivedAtUtc',
  },
];

function HeartbeatLogs() {
  return (
    <TrackerLogsScreen
      title="Heartbeat Logs"
      endpointSegment="heartbeats"
      columns={heartbeatColumns}
      enableAutoRefresh
    />
  );
}

export default HeartbeatLogs;
