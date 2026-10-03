import actions from './actions';
import { getSelectedRegion } from '../../utility/localStorageControl';

const initialState = {
  items: [],
  selected: getSelectedRegion() || null,
  loading: false,
  error: null,
};

const { LOAD_REGIONS_BEGIN, LOAD_REGIONS_SUCCESS, LOAD_REGIONS_ERR, SET_SELECTED_REGION } = actions;

const regionReducer = (state = initialState, action = {}) => {
  const { type, data, err } = action;

  switch (type) {
    case LOAD_REGIONS_BEGIN:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case LOAD_REGIONS_SUCCESS: {
      const items = Array.isArray(data) ? data : [];
      const currentSelected = state.selected;
      const nextSelected =
        currentSelected && items.some((region) => region.code === currentSelected.code)
          ? currentSelected
          : items[0] || null;

      return {
        ...state,
        items,
        selected: nextSelected,
        loading: false,
        error: null,
      };
    }
    case LOAD_REGIONS_ERR:
      return {
        ...state,
        loading: false,
        error: err,
      };
    case SET_SELECTED_REGION:
      return {
        ...state,
        selected: data || null,
      };
    default:
      return state;
  }
};

export default regionReducer;
