import React, { useState } from 'react';
import { Avatar, Popover, message, Dropdown } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import FeatherIcon from 'feather-icons-react';
import { InfoWraper, NavAuth, UserDropDwon } from './auth-info-style';
import { logOut } from '../../../redux/firebase/auth/actionCreator';

const AuthInfo = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Get user from Redux state
  const { user } = useSelector((state) => ({
    user: state.auth.user,
    //  isLoggedIn: state.auth.login,
  }));

  const handleLogout = async () => {
    try {
      const result = await dispatch(logOut());
      if (result.success) {
        navigate('/login');
      }
    } catch (error) {
      console.error('Logout error:', error);
      message.error('Logout failed');
    }
  };

  const userContent = (
    <UserDropDwon>
      <div className="user-dropdwon">
        <figure className="user-dropdwon__info">
          <img src={require('../../../static/img/avatar/profileImage.png')} alt="user" />
          <figcaption>
            <div className="user-dropdwon__name">{user?.displayName || user?.username || 'User'}</div>
            <div className="user-dropdwon__designation">{user?.username || 'Administrator'}</div>
          </figcaption>
        </figure>
        <ul className="user-dropdwon__links">
          <li>
            <Link to="/admin/profile/myProfile">
              <FeatherIcon icon="user" /> Profile
            </Link>
          </li>
          <li>
            <Link to="/admin/profile/settings">
              <FeatherIcon icon="settings" /> Settings
            </Link>
          </li>
        </ul>
        <button type="button" className="user-dropdwon__logout" onClick={handleLogout}>
          <FeatherIcon icon="log-out" /> Sign Out
        </button>
      </div>
    </UserDropDwon>
  );

  const [state, setState] = useState({
    flag: 'english',
  });
  const { flag } = state;

  const onFlagChangeHandle = (value) => {
    setState({
      ...state,
      flag: value,
    });
  };

  const country = (
    <NavAuth>
      <Link onClick={() => onFlagChangeHandle('english')} to="#">
        <img src={require('../../../static/img/flag/english.png')} alt="" />
        <span>English</span>
      </Link>
      <Link onClick={() => onFlagChangeHandle('germany')} to="#">
        <img src={require('../../../static/img/flag/germany.png')} alt="" />
        <span>Germany</span>
      </Link>
      <Link onClick={() => onFlagChangeHandle('spain')} to="#">
        <img src={require('../../../static/img/flag/spain.png')} alt="" />
        <span>Spain</span>
      </Link>
      <Link onClick={() => onFlagChangeHandle('turky')} to="#">
        <img src={require('../../../static/img/flag/turky.png')} alt="" />
        <span>Turky</span>
      </Link>
    </NavAuth>
  );

  return (
    <InfoWraper>
      <div className="nav-author">
        <Dropdown placement="bottomRight" content={country} trigger="click">
          <Link to="#" className="head-example">
            <img src={require(`../../../static/img/flag/${flag}.png`)} alt="" />
          </Link>
        </Dropdown>
      </div>

      <div className="nav-author">
        <Popover placement="bottomRight" content={userContent} trigger="click">
          <Link to="#" className="head-example" onClick={(e) => e.preventDefault()}>
            <Avatar src={require('../../../static/img/avatar/profileImage.png')} size="default" />
          </Link>
        </Popover>
      </div>
    </InfoWraper>
  );
};

export default AuthInfo;
