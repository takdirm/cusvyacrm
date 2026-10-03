import { notification } from 'antd';
import actions from './actions';
import { DataService } from '../../config/dataService/dataService';

const addNotificationSuccess = () => {
  notification.success({
    message: 'Your Record has been Submited',
  });
};

const addNotificationError = (err) => {
  // Handle different error response formats
  let errorMessage = 'An error occurred';

  if (err?.response?.data) {
    // If response.data is a string (e.g., BadRequest(string) from backend)
    if (typeof err.response.data === 'string') {
      errorMessage = err.response.data;
    }
    // If response.data has a message property
    else if (err.response.data.message) {
      errorMessage = err.response.data.message;
    }
    // If response.data is an object, try to stringify it
    else if (typeof err.response.data === 'object') {
      errorMessage = JSON.stringify(err.response.data);
    }
  } else if (err?.message) {
    errorMessage = err.message;
  }

  notification.error({
    message: 'Operation Failed',
    description: errorMessage,
  });
};

const deleteNotificationSuccess = () => {
  notification.success({
    message: 'Your Record has been Deleted',
  });
};

const deleteNotificationError = (err) => {
  // Handle different error response formats
  let errorMessage = 'An error occurred';

  if (err?.response?.data) {
    // If response.data is a string (e.g., BadRequest(string) from backend)
    if (typeof err.response.data === 'string') {
      errorMessage = err.response.data;
    }
    // If response.data has a message property
    else if (err.response.data.message) {
      errorMessage = err.response.data.message;
    }
    // If response.data is an object, try to stringify it
    else if (typeof err.response.data === 'object') {
      errorMessage = JSON.stringify(err.response.data);
    }
  } else if (err?.message) {
    errorMessage = err.message;
  }

  notification.error({
    message: 'Delete Failed',
    description: errorMessage,
  });
};

const updateNotificationSuccess = () => {
  notification.success({
    message: 'Your Record has been updated',
  });
};

const updateNotificationError = (err) => {
  // Handle different error response formats
  let errorMessage = 'An error occurred';

  if (err?.response?.data) {
    // If response.data is a string (e.g., BadRequest(string) from backend)
    if (typeof err.response.data === 'string') {
      errorMessage = err.response.data;
    }
    // If response.data has a message property
    else if (err.response.data.message) {
      errorMessage = err.response.data.message;
    }
    // If response.data is an object, try to stringify it
    else if (typeof err.response.data === 'object') {
      errorMessage = JSON.stringify(err.response.data);
    }
  } else if (err?.message) {
    errorMessage = err.message;
  }

  notification.error({
    message: 'Update Failed',
    description: errorMessage,
  });
};

const {
  axiosAddBegin,
  axiosAddSuccess,
  axiosAddErr,

  axiosReadBegin,
  axiosReadSuccess,
  axiosReadErr,

  axiosUpdateBegin,
  axiosUpdateSuccess,
  axiosUpdateErr,

  axiosDeleteBegin,
  axiosDeleteSuccess,
  axiosDeleteErr,

  axiosSingleDataBegin,
  axiosSingleDataSuccess,
  axiosSingleDataErr,

  axiosUploadBegin,
  axiosUploadSuccess,
  axiosUploadErr,
} = actions;

const axiosDataSubmit = (path, data) => {
  return async (dispatch) => {
    try {
      await dispatch(axiosAddBegin());
      const response = await DataService.post(path, data);
      await dispatch(axiosAddSuccess(response.data));
      await addNotificationSuccess();
    } catch (err) {
      await dispatch(axiosAddErr(err));
      await addNotificationError(err);
    }
  };
};

const axiosDataRead = (path = '') => {
  return async (dispatch) => {
    try {
      await dispatch(axiosReadBegin());
      const query = await DataService.get(path);
      await dispatch(axiosReadSuccess(query.data));
    } catch (err) {
      await dispatch(axiosReadErr(err));
    }
  };
};

const axiosDataReadPaginated = (path = '', page, pageSize) => {
  return async (dispatch) => {
    try {
      await dispatch(axiosReadBegin());
      const hasPagingParams = typeof path === 'string' && /(^|[?&])page=|(^|[?&])pageSize=/i.test(path);
      const requestPath = hasPagingParams ? path : `${path}&page=${page}&pageSize=${pageSize}`;
      const query = await DataService.get(requestPath);
      await dispatch(axiosReadSuccess(query.data));
    } catch (err) {
      await dispatch(axiosReadErr(err));
    }
  };
};

const axiosCrudGetData = (path = '') => {
  return async (dispatch) => {
    try {
      await dispatch(axiosReadBegin());
      const query = await DataService.get(path);
      await dispatch(axiosReadSuccess(query.data));
    } catch (err) {
      await dispatch(axiosReadErr(err));
    }
  };
};

const axiosDataSearch = (searchItem, path) => {
  return async (dispatch) => {
    try {
      await dispatch(axiosReadBegin(path));
      if (searchItem !== '') {
        const query = await DataService.get(`${path}${searchItem}`);
        await dispatch(axiosReadSuccess(query.data));
      } else {
        try {
          const query = await DataService.get(path);
          await dispatch(axiosReadSuccess(query.data));
        } catch (err) {
          await dispatch(axiosReadErr(err));
        }
      }
    } catch (err) {
      await dispatch(axiosReadErr(err));
    }
  };
};

const axiosDataUpdate = (path, id, data) => {
  return async (dispatch) => {
    try {
      await dispatch(axiosUpdateBegin());
      await DataService.put(`${path}/${id}`, data);
      await dispatch(axiosUpdateSuccess());
      updateNotificationSuccess();
    } catch (err) {
      await dispatch(axiosUpdateErr(err));
      updateNotificationError(err);
    }
  };
};

const axiosDataUpdateNoId = (path, data) => {
  return async (dispatch) => {
    try {
      await dispatch(axiosUpdateBegin());
      await DataService.put(`${path}`, data);
      await dispatch(axiosUpdateSuccess());
      updateNotificationSuccess();
    } catch (err) {
      await dispatch(axiosUpdateErr(err));
      updateNotificationError(err);
    }
  };
};

const axiosDataDelete = ({ path, id, getData }) => {
  return async (dispatch) => {
    try {
      await dispatch(axiosDeleteBegin());
      const data = await DataService.delete(`${path}/${id}`);
      await dispatch(axiosDeleteSuccess(data));
      await getData();
      deleteNotificationSuccess();
    } catch (err) {
      await dispatch(axiosDeleteErr(err));
      deleteNotificationError(err);
    }
  };
};

const axiosDataSingle = (id, path) => {
  return async (dispatch) => {
    try {
      await dispatch(axiosSingleDataBegin());
      const query = await DataService.get(`${path}${id}`);
      await dispatch(axiosSingleDataSuccess(query.data.data));
    } catch (err) {
      await dispatch(axiosSingleDataErr(err));
    }
  };
};

const axiosFileUploder = (imageAsFile) => {
  const data = new FormData();
  data.append('image', imageAsFile);

  return async (dispatch) => {
    try {
      await dispatch(axiosUploadBegin());
      const query = await DataService.post('/image-upload', data, { 'Content-Type': 'multipart/form-data' });
      dispatch(axiosUploadSuccess(`img/basics/${query.data}`));
    } catch (err) {
      await dispatch(axiosUploadErr(err));
    }
  };
};

const axiosFileClear = () => {
  return async (dispatch) => {
    try {
      await dispatch(axiosUploadBegin());
      dispatch(axiosUploadSuccess(null));
    } catch (err) {
      await dispatch(axiosUploadErr(err));
    }
  };
};

export {
  axiosDataRead,
  axiosDataSearch,
  axiosDataSubmit,
  axiosFileUploder,
  axiosDataDelete,
  axiosCrudGetData,
  axiosDataSingle,
  axiosDataUpdate,
  axiosFileClear,
  axiosDataReadPaginated,
  axiosDataUpdateNoId,
};
