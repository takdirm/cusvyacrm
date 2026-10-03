export const releaseType = {
  execution: 0,
  transfer: 1,
};

export const releaseStatus = {
  inqueue: 0,
  inprogress: 1,
  failed: 2,
  success: 3,
  errored: 4,
};

export const jobStatus = {
  initiated: 0,
  pending: 1,
  success: 2,
  errored: 3,
};

export const scriptType = {
  batchscript: 0,
  powershellscript: 1,
  vbscript: 2,
  ping: 3,
  shutdown: 4,
  restart: 5,
  poweron: 6,
  unknown: 7,
};

export const getScriptTypeText = (type) => {
  const scriptTypeLabels = {
    0: 'Batch Script',
    1: 'PowerShell Script',
    2: 'VBScript',
    3: 'Ping',
    4: 'Shutdown',
    5: 'Restart',
    6: 'PowerOn',
  };
  return scriptTypeLabels[type] || 'Unknown';
};

export const getReleaseTypeText = (type) => {
  const releaseTypeLabels = {
    0: 'Execution',
    1: 'Transfer',
  };
  return releaseTypeLabels[type] || 'Unknown';
};

export const getReleaseStatusColor = (statusCode) => {
  switch (statusCode) {
    case releaseStatus.inqueue: // 0
      return 'cyan';
    case releaseStatus.inprogress: // 1
      return 'green';
    case releaseStatus.failed: // 2
    case releaseStatus.errored: // 5
      return 'red';
    case releaseStatus.success: // 10
      return 'blue';
    default:
      return 'default';
  }
};

export const getReleaseStatusText = (statusCode) => {
  switch (statusCode) {
    case releaseStatus.inqueue: // 0
      return 'InQueue';
    case releaseStatus.inprogress: // 1
      return 'InProgress';
    case releaseStatus.failed: // 2
      return 'Failed';
    case releaseStatus.errored: // 5
      return 'Errored';
    case releaseStatus.success: // 10
      return 'Success';
    default:
      return 'default';
  }
};

export const getJobStatusText = (statusCode) => {
  switch (statusCode) {
    case jobStatus.initiated: // 0
      return 'Initiated';
    case jobStatus.pending: // 1
      return 'Pending';
    case jobStatus.errored: // 2
      return 'Errored';
    case jobStatus.success: // 3
      return 'Success';

    default:
      return 'Unknown';
  }
};

export const getJobStatusColor = (statusCode) => {
  switch (statusCode) {
    case jobStatus.initiated: // 0
      return 'orange';
    case jobStatus.pending: // 1
      return 'cyan';
    case jobStatus.errored: // 2
      return 'red';
    case jobStatus.success: // 3
      return 'blue';

    default:
      return 'default';
  }
};

export const FuelType = {
  Petrol: 0,
  Electric: 1,
  Hybrid: 2,
};

export const ChargingType = {
  Standard: 0,
  Fast: 1,
  Swap: 2,
};

// New Vehicle Enums
export const VehicleListingStatus = {
  Available: 1,
  Reserved: 2,
  Rented: 3,
  Sold: 4,
  UnderMaintenance: 5,
};

export const VehicleCategory = {
  TwoWheeler: 1,
  ThreeWheeler: 2,
  Bicycle: 3,
  FourWheeler: 4,
};

export const VehicleType = {
  ElectricScooter: 1,
  ElectricMotorcycle: 2,
  Scooter: 3,
  Motorcycle: 4,
  ElectricAuto: 10,
  AutoRickshaw: 11,
  ElectricBicycle: 20,
  Bicycle: 21,
  ElectricCar: 30,
  Car: 31,
};

export const OwnershipStatus = {
  CompanyOwned: 1,
  CustomerOwned: 2,
};

export const VehicleServiceType = {
  None: 0,
  Rental: 1,
  RentToOwn: 2,
  ForSale: 4,
  RentalAndRentToOwn: 3,
};

// Options arrays
export const FuelTypeOptions = [
  { label: 'Petrol', value: FuelType.Petrol },
  { label: 'Electric', value: FuelType.Electric },
  { label: 'Hybrid', value: FuelType.Hybrid },
];

export const ChargingTypeOptions = [
  { label: 'Standard', value: ChargingType.Standard },
  { label: 'Fast', value: ChargingType.Fast },
  { label: 'Swap', value: ChargingType.Swap },
];

export const VehicleTypeOptions = [
  { label: 'Electric Scooter', value: VehicleType.ElectricScooter },
  { label: 'Electric Motorcycle', value: VehicleType.ElectricMotorcycle },
  { label: 'Scooter', value: VehicleType.Scooter },
  { label: 'Motorcycle', value: VehicleType.Motorcycle },
  { label: 'Electric Auto', value: VehicleType.ElectricAuto },
  { label: 'Auto Rickshaw', value: VehicleType.AutoRickshaw },
  { label: 'Electric Bicycle', value: VehicleType.ElectricBicycle },
  { label: 'Bicycle', value: VehicleType.Bicycle },
  { label: 'Electric Car', value: VehicleType.ElectricCar },
  { label: 'Car', value: VehicleType.Car },
];

export const VehicleCategoryOptions = [
  { label: 'Two Wheeler', value: VehicleCategory.TwoWheeler },
  { label: 'Three Wheeler', value: VehicleCategory.ThreeWheeler },
  { label: 'Bicycle', value: VehicleCategory.Bicycle },
  { label: 'Four Wheeler', value: VehicleCategory.FourWheeler },
];

export const VehicleListingStatusOptions = [
  { label: 'Available', value: VehicleListingStatus.Available },
  { label: 'Reserved', value: VehicleListingStatus.Reserved },
  { label: 'Rented', value: VehicleListingStatus.Rented },
  { label: 'Sold', value: VehicleListingStatus.Sold },
  { label: 'UnderMaintenance', value: VehicleListingStatus.UnderMaintenance },
];

export const OwnershipStatusOptions = [
  { label: 'Company Owned', value: OwnershipStatus.CompanyOwned },
  { label: 'Customer Owned', value: OwnershipStatus.CustomerOwned },
];

export const VehicleServiceTypeOptions = [
  { label: 'None', value: VehicleServiceType.None },
  { label: 'Rental', value: VehicleServiceType.Rental },
  { label: 'Rent To Own', value: VehicleServiceType.RentToOwn },
  { label: 'For Sale', value: VehicleServiceType.ForSale },
  { label: 'Rental + Rent To Own', value: VehicleServiceType.RentalAndRentToOwn },
];

// Helper functions
export const getFuelTypeText = (value) => FuelTypeOptions.find((item) => item.value === Number(value))?.label || '-';

export const getChargingTypeText = (value) =>
  ChargingTypeOptions.find((item) => item.value === Number(value))?.label || '-';

export const getVehicleTypeText = (value) =>
  VehicleTypeOptions.find((item) => item.value === Number(value))?.label || '-';

export const getVehicleCategoryText = (value) =>
  VehicleCategoryOptions.find((item) => item.value === Number(value))?.label || '-';

export const getVehicleListingStatusText = (value) =>
  VehicleListingStatusOptions.find((item) => item.value === Number(value))?.label || '-';

export const getOwnershipStatusText = (value) =>
  OwnershipStatusOptions.find((item) => item.value === Number(value))?.label || '-';

export const getVehicleServiceTypeText = (value) =>
  VehicleServiceTypeOptions.find((item) => item.value === Number(value))?.label || '-';

// Generic helper function to get enum options by name
export const getEnumOptions = (enumName) => {
  const optionsMap = {
    VehicleCategory: VehicleCategoryOptions,
    VehicleType: VehicleTypeOptions,
    VehicleServiceType: VehicleServiceTypeOptions,
    VehicleListingStatus: VehicleListingStatusOptions,
    OwnershipStatus: OwnershipStatusOptions,
    FuelType: FuelTypeOptions,
    ChargingType: ChargingTypeOptions,
  };
  return optionsMap[enumName] || [];
};

// Generic helper function to get enum label by name and value
export const getEnumLabel = (enumName, value) => {
  const options = getEnumOptions(enumName);
  return options.find((item) => item.value === Number(value))?.label || '-';
};
