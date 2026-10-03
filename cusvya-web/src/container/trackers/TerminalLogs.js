import React from 'react';
import TrackerLogsScreen from './TrackerLogsScreen';

const terminalColumns = [
  {
    key: 'terminalId',
    title: 'TerminalId',
    currentField: 'terminalId',
    historyField: 'terminalId',
  },
  {
    key: 'infoType',
    title: 'InfoType',
    currentField: 'lastInfoType',
    historyField: 'infoType',
  },
  {
    key: 'summary',
    title: 'Summary',
    currentField: 'lastSummary',
    historyField: 'summary',
  },
  {
    key: 'latitude',
    title: 'Latitude',
    currentField: 'lastLatitude',
    historyField: 'latitude',
  },
  {
    key: 'longitude',
    title: 'Longitude',
    currentField: 'lastLongitude',
    historyField: 'longitude',
  },
  {
    key: 'receivedAt',
    title: 'ReceivedAt',
    currentField: 'lastReceivedAtUtc',
    historyField: 'receivedAtUtc',
  },
  {
    key: 'updatedAt',
    title: 'UpdatedAt',
    currentField: 'updatedAtUtc',
    historyField: 'createdAtUtc',
  },
];

function TerminalLogs() {
  return (
    <TrackerLogsScreen title="Terminal Logs" endpointSegment="terminals" columns={terminalColumns} enableAutoRefresh />
  );
}

export default TerminalLogs;
