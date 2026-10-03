const actions = {
  LOAD_REGIONS_BEGIN: 'LOAD_REGIONS_BEGIN',
  LOAD_REGIONS_SUCCESS: 'LOAD_REGIONS_SUCCESS',
  LOAD_REGIONS_ERR: 'LOAD_REGIONS_ERR',
  SET_SELECTED_REGION: 'SET_SELECTED_REGION',

  loadRegionsBegin: () => ({ type: actions.LOAD_REGIONS_BEGIN }),
  loadRegionsSuccess: (data) => ({ type: actions.LOAD_REGIONS_SUCCESS, data }),
  loadRegionsErr: (err) => ({ type: actions.LOAD_REGIONS_ERR, err }),
  setSelectedRegion: (data) => ({ type: actions.SET_SELECTED_REGION, data }),
};

export default actions;
