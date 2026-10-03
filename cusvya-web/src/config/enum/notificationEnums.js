// Target Audience Enum
export const TargetAudience = {
  Customer: 1,
  Admin: 2,
};

export const TargetAudienceLabels = {
  1: 'Customer',
  2: 'Admin',
};

export const getTargetAudienceText = (audience) => {
  return TargetAudienceLabels[audience] || 'Unknown';
};

export const getTargetAudienceOptions = () => {
  return Object.keys(TargetAudienceLabels).map((key) => ({
    label: TargetAudienceLabels[key],
    value: parseInt(key),
  }));
};

// Notification Channel Enum
export const NotificationChannel = {
  WhatsApp: 1,
  App: 2,
  Email: 3,
  AppAndEmail: 4,
  AppAndWhatsApp: 5,
  ALL: 6,
};

export const NotificationChannelLabels = {
  1: 'WhatsApp',
  2: 'App',
  3: 'Email',
  4: 'App & Email',
  5: 'App & WhatsApp',
  6: 'All Channels',
};

export const getNotificationChannelText = (channel) => {
  return NotificationChannelLabels[channel] || 'Unknown';
};

export const getNotificationChannelOptions = () => {
  return Object.keys(NotificationChannelLabels).map((key) => ({
    label: NotificationChannelLabels[key],
    value: parseInt(key),
  }));
};
