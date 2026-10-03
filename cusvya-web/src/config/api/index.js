/**
 * It's suggested to configure the RESTful endpoints in this file
 * so that there is only one source of truth, future update of endpoints
 * could be done from here without refactoring on multiple places throughout the app
 */
const API = {
  auth: {
    path: '/auth',
    login: 'auth/signin',
    signUp: 'auth/signup',
    me: '/Auth/me',
  },
  region: {
    path: '/Region',
    paged: '/Region/paged',
    resolve: '/Region/resolve',
  },
  metrics: {
    devices: '/metrics/device-summary',
    jobs: '/metrics/job-summary',
  },
  user: {
    path: '/Users',
  },
  device: {
    path: '/device',
  },
  release: {
    path: '/release',
  },
  queue: {
    path: '/job',
  },
  Planner: {
    path: 'planner',
  },
  setting: {
    path: '/settings',
    job: 'jobsettings',
    remote: 'remotesettings',
    credential: 'credentialsettings',
    application: 'applicationsettings',
    paymentScheduleGet: '/Settings/GetPaymentScheduleSettings',
    paymentScheduleUpdate: '/Settings/UpdatePaymentScheduleSettings',
    securityAmountGet: '/Settings/GetSecurityAmountSettings',
    securityAmountUpdate: '/Settings/UpdateSecurityAmountSettings',
    gracePeriodGet: '/Settings/GetVehicleGracePeriodSettings',
    gracePeriodUpdate: '/Settings/UpdateVehicleGracePeriodSettings',
    alarmSettingsGet: '/Settings/GetAlarmSettings',
    alarmSettingsUpdate: '/Settings/UpdateAlarmSettings',
    gprsSettingsGet: '/Settings/GetGPRSSettings',
    gprsSettingsUpdate: '/Settings/UpdateGPRSSettings',
  },
  company: {
    settingsGet: '/Settings/GetCompanySettings',
    settingsUpdate: '/Settings/UpdateCompanySettings',
  },
  forecast: {
    path: '/Forecast',
    odometerPercent: 'odometer-percent',
    bikeConditionPercent: 'bike-condition-percent',
    batteryLifePercent: 'battery-life-percent',
  },
  tools: {
    path: '/tools',
    ping: 'ping',
    shutdown: 'shutdown',
    restart: 'restart',
  },
  modelCategory: {
    path: '/Model/categories',
  },
  model: {
    path: '/Model',
  },
  productCategory: {
    path: '/Product/categories',
  },
  product: {
    path: '/Product',
  },
  pattern: {
    path: '/Product/patterns',
  },
  customer: {
    path: '/Customer',
    kyc: '/Customer/{customerId}/kyc',
    kycSubmit: '/Customer/{customerId}/kyc/submit',
    kycApprove: '/Customer/{customerId}/kyc/approve',
    dl: '/Customer/{customerId}/dl',
    dlSubmit: '/Customer/{customerId}/dl/submit',
    dlApprove: '/Customer/{customerId}/dl/approve',
  },
  document: {
    path: '/Document',
  },
  artist: {
    path: '/Artist',
  },
  booking: {
    path: '/Booking',
    activeBookings: '/Booking/customer',
  },
  bookingControl: {
    path: '/BookingControl',
  },
  ownershipFulfilment: {
    path: '/OwnershipFulfilment',
  },
  vendor: {
    path: '/Vendor',
  },
  payment: {
    path: '/Payment',
  },
  order: {
    path: '/Order',
  },
  station: {
    path: '/Station',
  },
  vehicle: {
    path: '/Vehicle',
    searchAll: '/Vehicle/search/all',
    engineStatus: '/Vehicle/{vehicleId}/engine-status',
    engineOverride: '/Vehicle/engine-override',
    assignStation: '/Vehicle/{vehicleId}/assign-station/{stationId}',
    removeFromStation: '/Vehicle/{vehicleId}/remove-from-station',
    notes: '/Vehicle/{vehicleId}/notes',
  },
  accessorie: {
    path: '/Accessorie',
  },
  vehicleModel: {
    path: '/Vehicle/models',
    filter: '/Vehicle/models/filter',
    byCategory: '/Vehicle/models/by-category/{vehicleCategory}',
  },
  trackerDevice: {
    path: '/Vehicle/trackers',
  },
  scooterTracker: {
    path: '/Gprs/scooters/tracking',
  },
  rentalPlan: {
    path: '/Plan/rental',
  },
  ownershipPlan: {
    path: '/Plan/ownership',
  },
  catalogue: {
    path: '/Catalogue',
  },
  arrears: {
    path: '/Arrears',
    settingsGet: '/Arrears/settings',
    settingsUpdate: '/Arrears/settings',
    customerSummary: '/Arrears/customer',
    customerArrears: '/Arrears/customer',
    confirm: '/Arrears',
    cancel: '/Arrears',
    waive: '/Arrears',
    delete: '/Arrears',
    updateStatus: '/Arrears',
    createLatePaymentFee: '/Arrears/late-payment-fee',
    createDailyOverdueInterest: '/Arrears/daily-overdue-interest',
    createMissedEMIPenalty: '/Arrears/missed-emi-penalty',
    createVehicleReturnDelayFee: '/Arrears/vehicle-return-delay-fee',
    createExcessKilometerCharges: '/Arrears/excess-kilometer-charges',
    createDamageMisusePenalty: '/Arrears/damage-misuse-penalty',
    createLostHelmetAccessoryFee: '/Arrears/lost-helmet-accessory-fee',
    createBounceFailedTransactionFee: '/Arrears/bounce-failed-transaction-fee',
    createEarlyTerminationFee: '/Arrears/early-termination-fee',
    createRepossessionFee: '/Arrears/repossession-fee',
    createInsuranceLapsePenalty: '/Arrears/insurance-lapse-penalty',
  },
  dashboard: {
    bookings: '/Dashboard/bookings',
    payments: '/Dashboard/payments',
    wallet: '/Dashboard/wallet',
    customers: '/Dashboard/customers',
    fleet: '/Dashboard/fleet',
    plans: '/Dashboard/plans',
    arrears: '/Dashboard/arrears',
  },
  whatsapp: {
    settingsGet: '/Settings/GetWhatsAppSettings',
    settingsUpdate: '/Settings/UpdateWhatsAppSettings',
  },
  notificationTest: {
    path: '/NotificationTest',
    testSimpleMessage: '/NotificationTest/test-simple-message',
    testTemplate: '/NotificationTest/test-template',
  },
  notificationType: {
    path: '/notification-types',
  },
  notificationTemplate: {
    path: '/Notification/templates',
    paginated: '/Notification/templates/paginated',
    upsert: '/Notification/templates/upsert',
  },
  notification: {
    path: '/Notification',
    templates: '/Notification/templates/paginated',
    template: '/Notification/template',
    placeholderProperties: '/Notification/placeholder-properties',
  },
  documentTemplate: {
    path: '/Document/templates',
    paginated: '/Document/templates/paginated',
    placeholderProperties: '/Document/templates/placeholder-properties',
    preview: '/Document/templates',
    previewBookingDocumentPdf: '/Document/templates/preview-booking-document-pdf',
    generateBookingDocument: '/Document/templates/generate-booking-document',
  },
  whatsappTemplate: {
    path: '/WhatsAppTemplate',
    paginated: '/Notification/whatsapp-template-mappings',
  },
};

export { API };
