import { combineReducers } from 'redux';
import { firebaseReducer } from 'react-redux-firebase';
import { firestoreReducer } from 'redux-firestore';
import themeUsersReducer from './themeUsers/reducers';
import { readMessageReducer } from './message/reducers';
import { readNotificationReducer } from './notification/reducers';
import ChangeLayoutMode from './themeLayout/reducers';
import firebaseAuthReducer from './firebase/auth/reducers';
import { teamReducer } from './team/reducers';
import { userReducer, userGroupReducer } from './users/reducers';
import { sellersReducer } from './sellers/reducers';
import { headerSearchReducer } from './headerSearch/reducers';
import orderReducer from './orders/reducers';
import galleryReducer from './gallary/reducers';
import chartContentReducer from './chartContent/reducers';
import { emailReducer, SingleEmailReducer } from './email/reducers';
import { productReducer, SingleProductReducer } from './product/reducers';
import { chatReducer, SingleChatReducer, groupChatReducer, SingleChatGroupReducer } from './chat/reducers';
import { projectReducer, SingleProjectReducer } from './project/reducers';
import cartData from './cart/reducers';
import Todo from './todo/reducers';
import Note from './note/reducers';
import Task from './task/reducers';
import Contact from './contact/reducers';
import Profile from './profile/reducers';
import Calender from './calendar/reducers';
import FileManager from './fileManager/reducers';
import { axiosCrudReducer, axiosSingleCrudReducer } from './crud/axios/reducers';
import { serviceReducer, serviceSingleCrudReducer } from './axiomservice/reducers';

import { fsCrudReducer, fsSingleCrudReducer } from './firebase/firestore/reducers';
import regionReducer from './region/reducers';

const rootReducers = combineReducers({
  fb: firebaseReducer,
  fs: firestoreReducer,
  themeUsers: themeUsersReducer,
  headerSearchData: headerSearchReducer,
  message: readMessageReducer,
  notification: readNotificationReducer,
  orders: orderReducer,
  sellers: sellersReducer,
  users: userReducer,
  userGroup: userGroupReducer,
  team: teamReducer,
  auth: firebaseAuthReducer,
  firebaseAuth: firebaseAuthReducer,
  region: regionReducer,
  gallery: galleryReducer,
  email: emailReducer,
  emailSingle: SingleEmailReducer,
  products: productReducer,
  product: SingleProductReducer,
  chatSingle: SingleChatReducer,
  chatSingleGroup: SingleChatGroupReducer,
  chat: chatReducer,
  groupChat: groupChatReducer,
  projects: projectReducer,
  project: SingleProjectReducer,
  ChangeLayoutMode,
  chartContent: chartContentReducer,
  crud: fsCrudReducer,
  singleCrud: fsSingleCrudReducer,
  cart: cartData,
  Todo,
  Note,
  Task,
  Contact,
  Profile,
  Calender,
  FileManager,
  AxiosCrud: axiosCrudReducer,
  SingleAxiosCrud: axiosSingleCrudReducer,
  Service: serviceReducer,
  SingleService: serviceSingleCrudReducer,
});

export default rootReducers;
