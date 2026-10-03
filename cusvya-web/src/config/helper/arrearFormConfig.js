// Arrear form field configurations based on swagger.json schemas
export const arrearFormFields = {
  0: {
    // LatePaymentFee
    name: 'Late Payment Fee',
    endpoint: 'createLatePaymentFee',
    fields: [{ name: 'reason', label: 'Reason', type: 'textarea', required: false, maxLength: 1000 }],
  },
  3: {
    // ScooterReturnDelayFee
    name: 'Scooter Return Delay Fee',
    endpoint: 'createScooterReturnDelayFee',
    fields: [],
  },
  6: {
    // LostHelmetAccessoryFee
    name: 'Lost Helmet/Accessory Fee',
    endpoint: 'createLostHelmetAccessoryFee',
    fields: [
      { name: 'itemName', label: 'Item Name', type: 'text', required: true, maxLength: 200, minLength: 1 },
      { name: 'replacementCost', label: 'Replacement Cost (Optional)', type: 'number', required: false },
    ],
  },
};

// Get API endpoint name for a given arrear type
export const getArrearEndpoint = (arrearsType) => {
  const config = arrearFormFields[arrearsType];
  return config ? config.endpoint : null;
};

// Get form fields for a given arrear type
export const getArrearFormFields = (arrearsType) => {
  const config = arrearFormFields[arrearsType];
  return config ? config.fields : [];
};

// Get arrear type name
export const getArrearTypeName = (arrearsType) => {
  const config = arrearFormFields[arrearsType];
  return config ? config.name : 'Unknown Type';
};
