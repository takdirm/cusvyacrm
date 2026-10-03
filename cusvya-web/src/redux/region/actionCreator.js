import actions from './actions';
import { API } from '../../config/api';
import { DataService } from '../../config/dataService/dataService';
import { getSelectedRegion, setSelectedRegion as persistSelectedRegion } from '../../utility/localStorageControl';

const { loadRegionsBegin, loadRegionsSuccess, loadRegionsErr, setSelectedRegion } = actions;

const normalizeRegions = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  return [];
};

const loadRegions = () => {
  return async (dispatch) => {
    try {
      dispatch(loadRegionsBegin());
      const response = await DataService.get(API.region.path);
      const regions = normalizeRegions(response?.data ?? response);
      dispatch(loadRegionsSuccess(regions));

      const persistedRegion = getSelectedRegion();
      const nextSelectedRegion =
        persistedRegion && regions.some((region) => region.code === persistedRegion.code)
          ? persistedRegion
          : regions[0] || null;

      if (nextSelectedRegion) {
        persistSelectedRegion(nextSelectedRegion);
        dispatch(setSelectedRegion(nextSelectedRegion));
      } else {
        persistSelectedRegion(null);
        dispatch(setSelectedRegion(null));
      }

      return { success: true, data: regions };
    } catch (error) {
      dispatch(loadRegionsErr(error));
      return { success: false, error };
    }
  };
};

const selectRegion = (region) => {
  return async (dispatch) => {
    persistSelectedRegion(region);
    dispatch(setSelectedRegion(region || null));
    return region;
  };
};

export { loadRegions, selectRegion };
