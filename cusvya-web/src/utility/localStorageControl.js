const getItem = (key) => {
  const data = typeof window !== 'undefined' ? localStorage.getItem(key) : '';

  try {
    return JSON.parse(data);
  } catch (err) {
    return data;
  }
};

const setItem = (key, value) => {
  const stringify = typeof value !== 'string' ? JSON.stringify(value) : value;
  return localStorage.setItem(key, stringify);
};

const removeItem = (key) => {
  localStorage.removeItem(key);
};

const getSelectedRegion = () => {
  const region = getItem('scootr:selectedRegion');
  return region && typeof region === 'object' && region.code ? region : null;
};

const setSelectedRegion = (region) => {
  if (!region) {
    removeItem('scootr:selectedRegion');
    return null;
  }

  return setItem('scootr:selectedRegion', region);
};

export { getItem, setItem, removeItem, getSelectedRegion, setSelectedRegion };
