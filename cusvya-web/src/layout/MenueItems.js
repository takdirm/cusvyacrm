import React from 'react';
import { Menu } from 'antd';
import { NavLink, useLocation } from 'react-router-dom';
import { ReactSVG } from 'react-svg';
import FeatherIcon from 'feather-icons-react';
import propTypes from 'prop-types';
import { NavTitle } from './style';
import versions from '../demoData/changelog.json';

const { SubMenu } = Menu;

function MenuItems({ darkMode, toggleCollapsed, topMenu, events }) {
  const location = useLocation();
  const path = '/admin';
  const pathName = location.pathname;
  const pathArray = pathName.split(path);
  const mainPath = pathArray[1];
  const mainPathSplit = mainPath.split('/');
  const { onRtlChange, onLtrChange, modeChangeDark, modeChangeLight, modeChangeTopNav, modeChangeSideNav } = events;

  // Determine initial open submenu based on route
  const getInitialOpenKeys = () => {
    if (!mainPath || mainPath === '' || mainPath === '/') return ['dashboard-overview'];
    const firstSegment = mainPathSplit[1];
    const secondSegment = mainPathSplit[2];

    // Form routes
    if (firstSegment && firstSegment.startsWith('form-')) return ['forms'];

    // Chart routes
    if (firstSegment === 'charts') return ['charts'];

    // Email, profile, project, etc.
    if (firstSegment === 'email') return ['email'];
    if (firstSegment === 'profile') return ['profile'];
    if (firstSegment === 'project') return ['project'];
    if (firstSegment === 'dashboard') return ['dashboard-group'];
    if (firstSegment === 'customer') return ['customer'];
    if (firstSegment === 'booking') return ['booking'];
    if (firstSegment === 'station') return ['station'];
    if (firstSegment === 'vehicle') return ['vehicles-group'];
    if (firstSegment === 'catalogues') return ['catalogues-group'];
    if (firstSegment === 'trackers') {
      if (['terminal-logs', 'location-logs', 'heartbeat-logs'].includes(secondSegment)) {
        return ['trackers-group', 'trackers-logs-group'];
      }
      return ['trackers-group'];
    }
    if (firstSegment === 'plans') return ['plans-group'];
    if (firstSegment === 'documents') return ['documents-group'];
    if (firstSegment === 'price-estimation') {
      if (mainPathSplit[2] === 'ownership') {
        return ['price-estimation-group', 'price-estimation-ownership-group'];
      }
      return ['price-estimation-group'];
    }
    if (firstSegment === 'users') return ['users'];
    if (firstSegment === 'contact') return ['contact'];
    if (firstSegment === 'ecommerce') return ['ecommerce'];
    if (firstSegment === 'components') return ['components'];
    if (firstSegment === 'settings') {
      // Price parameters routes should open price-estimation menu
      const priceParametersRoutes = ['odometer', 'bike-condition', 'battery-life'];
      if (priceParametersRoutes.includes(secondSegment)) {
        return ['price-estimation-group', 'price-parameters-group'];
      }
      return ['appsettings'];
    }
    if (firstSegment === 'notifications') return ['notifications'];
    if (firstSegment === 'maps') return ['maps'];
    if (firstSegment === 'icons') return ['icons'];
    if (firstSegment === 'tables') return ['tables'];
    if (firstSegment === 'wizards') return ['wizards'];

    // Default based on path structure
    return [mainPathSplit.length > 2 ? mainPathSplit[1] : 'dashboard'];
  };

  const [openKeys, setOpenKeys] = React.useState(!topMenu ? getInitialOpenKeys() : []);

  const onOpenChange = (keys) => {
    if (keys.includes('price-estimation-ownership-group')) {
      setOpenKeys(['price-estimation-group', 'price-estimation-ownership-group']);
      return;
    }

    if (keys.includes('price-parameters-group')) {
      setOpenKeys(['price-estimation-group', 'price-parameters-group']);
      return;
    }

    if (keys.includes('trackers-logs-group')) {
      setOpenKeys(['trackers-group', 'trackers-logs-group']);
      return;
    }

    if (keys[keys.length - 1] !== 'recharts') {
      const latestKey = keys[keys.length - 1];
      setOpenKeys(latestKey ? [latestKey] : []);
      return;
    }

    setOpenKeys(Array.isArray(keys) ? keys : []);
  };

  const onClick = (item) => {
    if (item.keyPath.length === 1) setOpenKeys([]);
  };

  // Determine selected menu key based on current path
  const getSelectedKey = () => {
    // Handle root path
    if (!mainPath || mainPath === '' || mainPath === '/') return ['home'];

    // Get the first segment after /admin/
    const firstSegment = mainPathSplit[1];
    const secondSegment = mainPathSplit[2];
    const thirdSegment = mainPathSplit[3];

    // Map paths to menu keys
    const pathToKeyMap = {
      '': 'home',
      eco: 'home',
      business: 'business',
      performance: 'performance',
      eco: 'eco',
      crm: 'crm',
      sales: 'sales',
    };

    if (firstSegment === 'dashboard') {
      if (secondSegment === 'overview') return ['dashboard-overview'];
      if (secondSegment === 'bookings') return ['dashboard-bookings'];
      if (secondSegment === 'financial') return ['dashboard-financial'];
      if (secondSegment === 'wallet') return ['dashboard-wallet'];
      if (secondSegment === 'customers') return ['dashboard-customers'];
      if (secondSegment === 'fleet') return ['dashboard-fleet'];
      if (secondSegment === 'stations') return ['dashboard-stations'];
      if (secondSegment === 'plans') return ['dashboard-plans'];
      if (secondSegment === 'arrears') return ['dashboard-arrears'];
      return ['dashboard-overview'];
    }

    // Check if it's a dashboard route
    if (pathToKeyMap[firstSegment]) {
      return [pathToKeyMap[firstSegment]];
    }

    // Handle social app routes
    if (firstSegment === 'main' && secondSegment === 'chat') return ['chat'];

    // Handle email submenu routes
    if (firstSegment === 'email') {
      if (pathName.includes('/single/')) return ['single'];
      if (secondSegment === 'inbox') return ['inbox'];
      return ['inbox']; // Default to inbox
    }

    // Handle profile/social app submenu routes
    if (firstSegment === 'profile' && secondSegment === 'myProfile') {
      if (thirdSegment === 'timeline') return ['profileTimeline'];
      if (thirdSegment === 'activity') return ['profileActivity'];
      return ['myProfile']; // Default to myProfile for overview
    }

    // Handle project submenu routes
    if (firstSegment === 'project') {
      if (secondSegment === 'view') {
        if (thirdSegment === 'list') return ['views']; // Note: key is 'views' for list
        return ['view']; // For grid
      }
      if (secondSegment === 'create') return ['ProjectCreate'];
      if (secondSegment === 'projectDetails') return ['projectDetails'];
      return ['view']; // Default to view for project routes
    }

    // Handle project submenu routes
    if (firstSegment === 'service') {
      if (secondSegment === 'view') {
        if (thirdSegment === 'list') return ['views']; // Note: key is 'views' for list
        return ['view']; // For grid
      }
      if (secondSegment === 'create') return ['ProjectCreate'];
      if (secondSegment === 'projectDetails') return ['projectDetails'];
      return ['view']; // Default to view for project routes
    }

    // Handle customer routes
    if (firstSegment === 'customer') {
      if (secondSegment === 'list') return ['customer-list'];
      if (secondSegment === 'detail') return ['customer-list']; // Keep customer menu highlighted on detail page
      return ['customer-list']; // Default to list
    }

    // Handle booking routes
    if (firstSegment === 'booking') {
      if (secondSegment === 'list') return ['booking-list'];
      if (secondSegment === 'control') return ['booking-control'];
      if (secondSegment === 'handover' || secondSegment === 'assignment') return ['booking-handover'];
      if (secondSegment === 'vehicle-return') return ['booking-vehicle-return'];
      if (secondSegment === 'ownership-transfer') return ['booking-ownership-transfer'];
      return ['booking-list']; // Default to list
    }

    // Handle station routes
    if (firstSegment === 'station') {
      if (secondSegment === 'list') return ['station-list'];
      return ['station-list']; // Default to list
    }

    // Handle vehicle routes
    if (firstSegment === 'vehicle') {
      if (secondSegment === 'models') return ['vehicle-models-list'];
      if (secondSegment === 'list') return ['vehicle-list'];
      if (secondSegment === 'detail') return ['vehicle-list'];
      if (secondSegment === 'accessories') return ['vehicle-accessories-list'];
      return ['vehicle-list'];
    }

    // Handle catalogues routes
    if (firstSegment === 'catalogues') {
      if (secondSegment === 'manage-vehicles') return ['catalogues-manage-vehicles'];
      return ['catalogues-manage'];
    }

    // Handle trackers routes
    if (firstSegment === 'trackers') {
      if (secondSegment === 'tracker') return ['trackers-track-vehicle'];
      if (secondSegment === 'devices') return ['trackers-manage-devices'];
      if (secondSegment === 'terminal-logs') return ['trackers-terminal-logs'];
      if (secondSegment === 'location-logs') return ['trackers-location-logs'];
      if (secondSegment === 'heartbeat-logs') return ['trackers-heartbeat-logs'];
      return ['trackers-manage-devices'];
    }

    // Handle plans routes
    if (firstSegment === 'plans') {
      if (secondSegment === 'rental') return ['plans-rental'];
      if (secondSegment === 'ownership') return ['plans-ownership'];
      return ['plans-rental'];
    }

    // Handle price estimation routes
    if (firstSegment === 'price-estimation') {
      if (secondSegment === 'rental') return ['price-estimation-rental'];
      if (secondSegment === 'ownership') {
        if (thirdSegment === 'new-vehicle') return ['price-estimation-ownership-new'];
        return ['price-estimation-ownership-used'];
      }
      return ['price-estimation-ownership-used'];
    }

    // Handle notifications routes
    if (firstSegment === 'notifications') {
      if (secondSegment === 'types') return ['notification-types'];
      if (secondSegment === 'templates') return ['notification-templates'];
      if (secondSegment === 'logs') return ['notification-logs'];
      return ['notification-types'];
    }

    // Handle documents routes
    if (firstSegment === 'documents') {
      if (secondSegment === 'templates') return ['document-templates'];
      return ['document-templates'];
    }

    // Handle settings routes
    if (firstSegment === 'settings') {
      const priceParametersRoutes = ['odometer', 'bike-condition', 'battery-life'];
      if (priceParametersRoutes.includes(secondSegment)) {
        // Return the specific menu item key for selected state
        if (secondSegment === 'odometer') return ['odometer-settings'];
        if (secondSegment === 'bike-condition') return ['bike-condition-settings'];
        if (secondSegment === 'battery-life') return ['battery-life-settings'];
      }
      if (secondSegment === 'payment-schedule') return ['payment-schedule-settings'];
      if (secondSegment === 'security-deposits') return ['security-deposits-settings'];
      if (secondSegment === 'arrears') return ['arrears-settings'];
      if (secondSegment === 'grace-periods') return ['grace-period-settings'];
      if (secondSegment === 'alarms') return ['alarm-settings'];
      if (secondSegment === 'whatsapp') return ['whatsapp-settings'];
      if (secondSegment === 'gprs') return ['gprs-settings'];
      if (secondSegment === 'company') return ['company-settings'];
      if (secondSegment === 'region') return ['region-settings'];
      return ['appsettings'];
    }

    // Handle calendar - single menu item with key 'main-calendar'
    if (firstSegment === 'app' && secondSegment === 'calendar') return ['main-calendar'];

    // Handle other app routes
    if (firstSegment === 'app') {
      if (secondSegment === 'to-do') return ['to-do'];
      if (secondSegment === 'note') return ['note'];
      if (secondSegment === 'task') return ['task'];
      if (secondSegment === 'kanban') return ['kanban'];
    }

    // Handle contact routes
    if (firstSegment === 'contact') {
      if (secondSegment === 'grid') return ['contact-grid'];
      if (secondSegment === 'list') return ['contact-list'];
      if (secondSegment === 'addNew') return ['addNew'];
      return ['contact-grid'];
    }

    // Handle form routes
    if (firstSegment === 'form-layout') return ['form-layout'];
    if (firstSegment === 'form-elements') return ['form-elements'];
    if (firstSegment === 'form-components') return ['form-components'];
    if (firstSegment === 'form-validation') return ['form-validation'];

    // Handle charts routes
    if (firstSegment === 'charts') {
      if (secondSegment === 'chartjs') return ['chartjs'];
      if (secondSegment === 'apexcharts') return ['apexcharts'];
      if (secondSegment === 'google-chart') return ['google-chart'];
      if (secondSegment === 'recharts') return [thirdSegment]; // bar, area, composed, etc.
      return ['chartjs'];
    }

    // Handle wizard routes
    if (firstSegment === 'wizards') {
      if (secondSegment === 'one') return ['wizard-one'];
      if (secondSegment === 'two') return ['wizard-two'];
      if (secondSegment === 'three') return ['wizard-three'];
      if (secondSegment === 'four') return ['wizard-four'];
      if (secondSegment === 'five') return ['wizard-five'];
      if (secondSegment === 'six') return ['wizard-six'];
      return ['wizard-one'];
    }

    // Handle editor route
    if (firstSegment === 'editor') return ['editor'];

    // For other routes, use the segment directly or the second level
    if (mainPathSplit.length === 2) return [firstSegment];
    if (mainPathSplit.length > 2) return [secondSegment];

    return ['home'];
  };

  const templateSimpleMenu = true;
  if (templateSimpleMenu) {
    return (
      <Menu
        mode={!topMenu || window.innerWidth <= 991 ? 'inline' : 'horizontal'}
        theme={darkMode ? 'dark' : 'light'}
        selectedKeys={!topMenu ? getSelectedKey() : []}
        defaultOpenKeys={!topMenu ? ['dashboard-group'] : []}
        openKeys={openKeys}
        onOpenChange={onOpenChange}
        onClick={onClick}
      >
        <SubMenu key="dashboard-group" icon={!topMenu && <FeatherIcon icon="home" />} title="Dashboard">
          <Menu.Item key="dashboard-overview">
            <NavLink onClick={toggleCollapsed} to={`${path}/dashboard/overview`}>
              Overview
            </NavLink>
          </Menu.Item>
        </SubMenu>

        <Menu.Item
          icon={
            !topMenu && (
              <NavLink className="menuItem-iocn" to={`${path}/customer/list`}>
                <FeatherIcon icon="users" />
              </NavLink>
            )
          }
          key="customer-list"
        >
          <NavLink onClick={toggleCollapsed} to={`${path}/customer/list`}>
            Customer
          </NavLink>
        </Menu.Item>

        <SubMenu key="appsettings" icon={!topMenu && <FeatherIcon icon="settings" />} title="Settings">
          <Menu.Item key="settings-company">
            <NavLink onClick={toggleCollapsed} to={`${path}/settings/company`}>
              Application Settings
            </NavLink>
          </Menu.Item>
        </SubMenu>

        <SubMenu key="webuser" icon={!topMenu && <FeatherIcon icon="user" />} title="Users">
          <Menu.Item key="users-list">
            <NavLink onClick={toggleCollapsed} to={`${path}/users`}>
              Users
            </NavLink>
          </Menu.Item>
        </SubMenu>
      </Menu>
    );
  }

  return (
    <Menu
      onOpenChange={onOpenChange}
      onClick={onClick}
      mode={!topMenu || window.innerWidth <= 991 ? 'inline' : 'horizontal'}
      theme={darkMode ? 'dark' : 'light'}
      selectedKeys={!topMenu ? getSelectedKey() : []}
      defaultOpenKeys={!topMenu ? [`${mainPathSplit.length > 2 ? mainPathSplit[1] : 'dashboard-group'}`] : []}
      overflowedIndicator={<FeatherIcon icon="more-vertical" />}
      openKeys={openKeys}
    >
      <SubMenu key="dashboard-group" icon={!topMenu && <FeatherIcon icon="home" />} title="Dashboard">
        <Menu.Item key="dashboard-overview">
          <NavLink onClick={toggleCollapsed} to={`${path}/dashboard/overview`}>
            Overview
          </NavLink>
        </Menu.Item>
        <Menu.Item key="dashboard-bookings">
          <NavLink onClick={toggleCollapsed} to={`${path}/dashboard/bookings`}>
            Bookings
          </NavLink>
        </Menu.Item>
        <Menu.Item key="dashboard-financial">
          <NavLink onClick={toggleCollapsed} to={`${path}/dashboard/financial`}>
            Financial
          </NavLink>
        </Menu.Item>
        <Menu.Item key="dashboard-customers">
          <NavLink onClick={toggleCollapsed} to={`${path}/dashboard/customers`}>
            Customers
          </NavLink>
        </Menu.Item>
        <Menu.Item key="dashboard-fleet">
          <NavLink onClick={toggleCollapsed} to={`${path}/dashboard/fleet`}>
            Fleet
          </NavLink>
        </Menu.Item>
        <Menu.Item key="dashboard-stations">
          <NavLink onClick={toggleCollapsed} to={`${path}/dashboard/stations`}>
            Stations
          </NavLink>
        </Menu.Item>
        <Menu.Item key="dashboard-plans">
          <NavLink onClick={toggleCollapsed} to={`${path}/dashboard/plans`}>
            Plans
          </NavLink>
        </Menu.Item>
        <Menu.Item key="dashboard-arrears">
          <NavLink onClick={toggleCollapsed} to={`${path}/dashboard/arrears`}>
            Arrears
          </NavLink>
        </Menu.Item>
      </SubMenu>

      <Menu.Item
        icon={
          !topMenu && (
            <NavLink className="menuItem-iocn" to={`${path}/customer/list`}>
              <FeatherIcon icon="users" />
            </NavLink>
          )
        }
        key="customer-list"
      >
        <NavLink onClick={toggleCollapsed} to={`${path}/customer/list`}>
          Customers
        </NavLink>
      </Menu.Item>

      <SubMenu key="booking" icon={!topMenu && <FeatherIcon icon="calendar" />} title="Bookings">
        <Menu.Item key="booking-list">
          <NavLink onClick={toggleCollapsed} to={`${path}/booking/list`}>
            List Bookings
          </NavLink>
        </Menu.Item>
        <Menu.Item key="booking-control">
          <NavLink onClick={toggleCollapsed} to={`${path}/booking/control`}>
            Booking Control
          </NavLink>
        </Menu.Item>
        <Menu.Item key="booking-handover">
          <NavLink onClick={toggleCollapsed} to={`${path}/booking/handover`}>
            Vehicle Handover
          </NavLink>
        </Menu.Item>
        <Menu.Item key="booking-vehicle-return">
          <NavLink onClick={toggleCollapsed} to={`${path}/booking/vehicle-return`}>
            Vehicle Rental
          </NavLink>
        </Menu.Item>
        <Menu.Item key="booking-ownership-transfer">
          <NavLink onClick={toggleCollapsed} to={`${path}/booking/ownership-transfer`}>
            Ownership Transfer
          </NavLink>
        </Menu.Item>
      </SubMenu>

      <SubMenu key="order-fulfilment" icon={!topMenu && <FeatherIcon icon="clipboard" />} title="Order Fulfilment">
        <Menu.Item key="order-fulfilment-list">
          <NavLink onClick={toggleCollapsed} to={`${path}/order-fulfilment/list`}>
            Fulfilment Queue
          </NavLink>
        </Menu.Item>
      </SubMenu>

      <SubMenu key="vendors-group" icon={!topMenu && <FeatherIcon icon="briefcase" />} title="Vendors">
        <Menu.Item key="vendors-list">
          <NavLink onClick={toggleCollapsed} to={`${path}/vendors/list`}>
            Vendor Management
          </NavLink>
        </Menu.Item>
      </SubMenu>

      <SubMenu key="stations-group" icon={!topMenu && <FeatherIcon icon="map-pin" />} title="Stations">
        <Menu.Item key="station-manage">
          <NavLink onClick={toggleCollapsed} to={`${path}/station/list`}>
            Manage Stations
          </NavLink>
        </Menu.Item>
        <Menu.Item key="station-manage-vehicles">
          <NavLink onClick={toggleCollapsed} to={`${path}/station/manage-vehicles`}>
            Manage Vehicles
          </NavLink>
        </Menu.Item>
      </SubMenu>

      <SubMenu key="vehicles-group" icon={!topMenu && <FeatherIcon icon="zap" />} title="Vehicles">
        <Menu.Item key="vehicle-models-list">
          <NavLink onClick={toggleCollapsed} to={`${path}/vehicle/models`}>
            Vehicle Models
          </NavLink>
        </Menu.Item>
        <Menu.Item key="vehicle-list">
          <NavLink onClick={toggleCollapsed} to={`${path}/vehicle/list`}>
            Vehicles
          </NavLink>
        </Menu.Item>
        <Menu.Item key="vehicle-accessories-list">
          <NavLink onClick={toggleCollapsed} to={`${path}/vehicle/accessories`}>
            Accessories
          </NavLink>
        </Menu.Item>
      </SubMenu>

      <SubMenu key="catalogues-group" icon={!topMenu && <FeatherIcon icon="book-open" />} title="Catalogues">
        <Menu.Item key="catalogues-manage">
          <NavLink onClick={toggleCollapsed} to={`${path}/catalogues/list`}>
            Manage Catalogues
          </NavLink>
        </Menu.Item>
        <Menu.Item key="catalogues-manage-vehicles">
          <NavLink onClick={toggleCollapsed} to={`${path}/catalogues/manage-vehicles`}>
            Manage Vehicles
          </NavLink>
        </Menu.Item>
      </SubMenu>

      <SubMenu key="trackers-group" icon={!topMenu && <FeatherIcon icon="crosshair" />} title="Trackers">
        <Menu.Item key="trackers-manage-devices">
          <NavLink onClick={toggleCollapsed} to={`${path}/trackers/devices`}>
            Manage Devices
          </NavLink>
        </Menu.Item>
        <Menu.Item key="trackers-track-vehicle">
          <NavLink onClick={toggleCollapsed} to={`${path}/trackers/tracker`}>
            Track Vehicle
          </NavLink>
        </Menu.Item>
        <SubMenu key="trackers-logs-group" title="Logs">
          <Menu.Item key="trackers-terminal-logs">
            <NavLink onClick={toggleCollapsed} to={`${path}/trackers/terminal-logs`}>
              Terminal Logs
            </NavLink>
          </Menu.Item>
          <Menu.Item key="trackers-location-logs">
            <NavLink onClick={toggleCollapsed} to={`${path}/trackers/location-logs`}>
              Location Logs
            </NavLink>
          </Menu.Item>
          <Menu.Item key="trackers-heartbeat-logs">
            <NavLink onClick={toggleCollapsed} to={`${path}/trackers/heartbeat-logs`}>
              Heartbeat Logs
            </NavLink>
          </Menu.Item>
        </SubMenu>
      </SubMenu>

      <SubMenu key="plans-group" icon={!topMenu && <FeatherIcon icon="file-text" />} title="Plans">
        <Menu.Item key="plans-rental">
          <NavLink onClick={toggleCollapsed} to={`${path}/plans/rental`}>
            Rental Plans
          </NavLink>
        </Menu.Item>
        <Menu.Item key="plans-ownership">
          <NavLink onClick={toggleCollapsed} to={`${path}/plans/ownership`}>
            Ownership Plans
          </NavLink>
        </Menu.Item>
      </SubMenu>

      <SubMenu key="notifications" icon={!topMenu && <FeatherIcon icon="bell" />} title="Notifications">
        <Menu.Item key="notification-types">
          <NavLink onClick={toggleCollapsed} to={`${path}/notifications/types`}>
            Notification Types
          </NavLink>
        </Menu.Item>
        <Menu.Item key="notification-templates">
          <NavLink onClick={toggleCollapsed} to={`${path}/notifications/templates`}>
            Notification Templates
          </NavLink>
        </Menu.Item>
        <Menu.Item key="notification-logs">
          <NavLink onClick={toggleCollapsed} to={`${path}/notifications/logs`}>
            Notification Logs
          </NavLink>
        </Menu.Item>
      </SubMenu>

      <SubMenu key="documents-group" icon={!topMenu && <FeatherIcon icon="file" />} title="Documents">
        <Menu.Item key="document-templates">
          <NavLink onClick={toggleCollapsed} to={`${path}/documents/templates`}>
            Document Templates
          </NavLink>
        </Menu.Item>
      </SubMenu>

      <SubMenu
        key="price-estimation-group"
        icon={!topMenu && <FeatherIcon icon="dollar-sign" />}
        title="Price Estimation"
      >
        <SubMenu key="price-parameters-group" title="Price Parameters">
          <Menu.Item key="odometer-settings">
            <NavLink onClick={toggleCollapsed} to={`${path}/settings/odometer`}>
              Odometer
            </NavLink>
          </Menu.Item>
          <Menu.Item key="bike-condition-settings">
            <NavLink onClick={toggleCollapsed} to={`${path}/settings/bike-condition`}>
              Bike Condition
            </NavLink>
          </Menu.Item>
          <Menu.Item key="battery-life-settings">
            <NavLink onClick={toggleCollapsed} to={`${path}/settings/battery-life`}>
              Battery Life
            </NavLink>
          </Menu.Item>
        </SubMenu>
        <SubMenu key="price-estimation-ownership-group" title="Ownership">
          <Menu.Item key="price-estimation-ownership-used">
            <NavLink onClick={toggleCollapsed} to={`${path}/price-estimation/ownership/used-vehicle`}>
              Used Vehicle
            </NavLink>
          </Menu.Item>
          <Menu.Item key="price-estimation-ownership-new">
            <NavLink onClick={toggleCollapsed} to={`${path}/price-estimation/ownership/new-vehicle`}>
              New Vehicle
            </NavLink>
          </Menu.Item>
        </SubMenu>
        <Menu.Item key="price-estimation-rental">
          <NavLink onClick={toggleCollapsed} to={`${path}/price-estimation/rental`}>
            Rental
          </NavLink>
        </Menu.Item>
      </SubMenu>

      <SubMenu key="webuser" icon={!topMenu && <FeatherIcon icon="users" />} title="Users">
        <Menu.Item key="webusers">
          <NavLink onClick={toggleCollapsed} to={`${path}/users`}>
            Manage Users
          </NavLink>
        </Menu.Item>
      </SubMenu>

      <SubMenu key="appsettings" icon={!topMenu && <FeatherIcon icon="settings" />} title="Settings">
        <Menu.Item key="payment-schedule-settings">
          <NavLink onClick={toggleCollapsed} to={`${path}/settings/payment-schedule`}>
            Payment Schedule
          </NavLink>
        </Menu.Item>
        <Menu.Item key="security-deposits-settings">
          <NavLink onClick={toggleCollapsed} to={`${path}/settings/security-deposits`}>
            Security Deposits
          </NavLink>
        </Menu.Item>
        <Menu.Item key="arrears-settings">
          <NavLink onClick={toggleCollapsed} to={`${path}/settings/arrears`}>
            Arrears
          </NavLink>
        </Menu.Item>
        <Menu.Item key="grace-period-settings">
          <NavLink onClick={toggleCollapsed} to={`${path}/settings/grace-periods`}>
            Grace Periods
          </NavLink>
        </Menu.Item>
        <Menu.Item key="alarm-settings">
          <NavLink onClick={toggleCollapsed} to={`${path}/settings/alarms`}>
            Alarms
          </NavLink>
        </Menu.Item>
        <Menu.Item key="whatsapp-settings">
          <NavLink onClick={toggleCollapsed} to={`${path}/settings/whatsapp`}>
            WhatsApp
          </NavLink>
        </Menu.Item>
        <Menu.Item key="gprs-settings">
          <NavLink onClick={toggleCollapsed} to={`${path}/settings/gprs`}>
            GPRS Settings
          </NavLink>
        </Menu.Item>
        <Menu.Item key="company-settings">
          <NavLink onClick={toggleCollapsed} to={`${path}/settings/company`}>
            Company
          </NavLink>
        </Menu.Item>
        <Menu.Item key="region-settings">
          <NavLink onClick={toggleCollapsed} to={`${path}/settings/region`}>
            Regions
          </NavLink>
        </Menu.Item>
      </SubMenu>

      {/* <SubMenu key="layout" icon={!topMenu && <FeatherIcon icon="layout" />} title="Layouts">
        <Menu.Item key="light">
          <NavLink
            onClick={() => {
              toggleCollapsed();
              modeChangeLight();
            }}
            to="#"
          >
            Light Mode
          </NavLink>
        </Menu.Item>
        <Menu.Item key="dark">
          <NavLink
            onClick={() => {
              toggleCollapsed();
              modeChangeDark();
            }}
            to="#"
          >
            Dark Mode
          </NavLink>
        </Menu.Item>
        <Menu.Item key="topMenu">
          <NavLink
            onClick={() => {
              toggleCollapsed();
              modeChangeTopNav();
            }}
            to="#"
          >
            Top Menu
          </NavLink>
        </Menu.Item>
        <Menu.Item key="sideMenu">
          <NavLink
            onClick={() => {
              toggleCollapsed();
              modeChangeSideNav();
            }}
            to="#"
          >
            Side Menu
          </NavLink>
        </Menu.Item>
        <Menu.Item key="rtl">
          <NavLink
            onClick={() => {
              toggleCollapsed();
              onRtlChange();
            }}
            to="#"
          >
            RTL
          </NavLink>
        </Menu.Item>
        <Menu.Item key="ltr">
          <NavLink
            onClick={() => {
              toggleCollapsed();
              onLtrChange();
            }}
            to="#"
          >
            LTR
          </NavLink>
        </Menu.Item>
      </SubMenu> */}
      {/* <Menu.Item
        icon={
          !topMenu && (
            <NavLink className="menuItem-iocn" to={`${path}/changelog`}>
              <FeatherIcon icon="activity" />
            </NavLink>
          )
        }
        key="changelog"
      >
        <NavLink onClick={toggleCollapsed} to={`${path}/changelog`}>
          Changelog
          <span className="badge badge-primary menuItem">{versions[0].version}</span>
        </NavLink>
      </Menu.Item> */}

      {/* <SubMenu key="email" icon={!topMenu && <FeatherIcon icon="mail" />} title="Email">
        <Menu.Item key="inbox">
          <NavLink onClick={toggleCollapsed} to={`${path}/email/inbox`}>
            Inbox
          </NavLink>
        </Menu.Item>
        <Menu.Item key="single">
          <NavLink onClick={toggleCollapsed} to={`${path}/email/single/1585118055048`}>
            Read Email
          </NavLink>
        </Menu.Item>
      </SubMenu>
      <Menu.Item
        icon={
          !topMenu && (
            <NavLink className="menuItem-iocn" to={`${path}/main/chat/private/rofiq@gmail.com`}>
              <FeatherIcon icon="message-square" />
            </NavLink>
          )
        }
        key="chat"
      >
        <NavLink onClick={toggleCollapsed} to={`${path}/main/chat/private/rofiq@gmail.com`}>
          Chat
        </NavLink>
      </Menu.Item>
      <SubMenu key="ecommerce" icon={!topMenu && <FeatherIcon icon="shopping-cart" />} title="eCommerce">
        <Menu.Item key="products">
          <NavLink onClick={toggleCollapsed} to={`${path}/ecommerce/products`}>
            Products
          </NavLink>
        </Menu.Item>
        <Menu.Item key="productDetails">
          <NavLink onClick={toggleCollapsed} to={`${path}/ecommerce/productDetails/1`}>
            Product detail
          </NavLink>
        </Menu.Item>

        <Menu.Item key="add-product">
          <NavLink onClick={toggleCollapsed} to={`${path}/ecommerce/add-product`}>
            Product Add
          </NavLink>
        </Menu.Item>

        <Menu.Item key="edit-product">
          <NavLink onClick={toggleCollapsed} to={`${path}/ecommerce/edit-product`}>
            Product Edit
          </NavLink>
        </Menu.Item>
        <Menu.Item key="cart">
          <NavLink onClick={toggleCollapsed} to={`${path}/ecommerce/cart`}>
            Cart
          </NavLink>
        </Menu.Item>
        <Menu.Item key="orders">
          <NavLink onClick={toggleCollapsed} to={`${path}/ecommerce/orders`}>
            Orders
          </NavLink>
        </Menu.Item>
        <Menu.Item key="sellers">
          <NavLink onClick={toggleCollapsed} to={`${path}/ecommerce/sellers`}>
            Sellers
          </NavLink>
        </Menu.Item>
        <Menu.Item key="Invoice">
          <NavLink onClick={toggleCollapsed} to={`${path}/ecommerce/Invoice`}>
            Invoices
          </NavLink>
        </Menu.Item>
      </SubMenu>
      <SubMenu key="profile" icon={!topMenu && <FeatherIcon icon="aperture" />} title="Social App">
        <Menu.Item key="myProfile">
          <NavLink onClick={toggleCollapsed} to={`${path}/profile/myProfile/overview`}>
            My Profile
          </NavLink>
        </Menu.Item>
        <Menu.Item key="profileTimeline">
          <NavLink onClick={toggleCollapsed} to={`${path}/profile/myProfile/timeline`}>
            Timeline
          </NavLink>
        </Menu.Item>
        <Menu.Item key="profileActivity">
          <NavLink onClick={toggleCollapsed} to={`${path}/profile/myProfile/activity`}>
            Activity
          </NavLink>
        </Menu.Item>
      </SubMenu>
      <SubMenu key="project" icon={!topMenu && <FeatherIcon icon="target" />} title="Project">
        <Menu.Item key="view">
          <NavLink onClick={toggleCollapsed} to={`${path}/project/view/grid`}>
            Project Grid
          </NavLink>
        </Menu.Item>
        <Menu.Item key="views">
          <NavLink onClick={toggleCollapsed} to={`${path}/project/view/list`}>
            Project List
          </NavLink>
        </Menu.Item>
        <Menu.Item key="ProjectCreate">
          <NavLink onClick={toggleCollapsed} to={`${path}/project/create`}>
            Create Project
          </NavLink>
        </Menu.Item>
        <Menu.Item key="projectDetails">
          <NavLink onClick={toggleCollapsed} to={`${path}/project/projectDetails/1`}>
            Project Details
          </NavLink>
        </Menu.Item>
      </SubMenu> */}
    </Menu>
  );
}

MenuItems.propTypes = {
  darkMode: propTypes.bool,
  topMenu: propTypes.bool,
  toggleCollapsed: propTypes.func,
  events: propTypes.object,
};

export default MenuItems;
