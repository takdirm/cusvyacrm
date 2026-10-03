const primaryColor = '#C8102E';
const primaryHover = '#A20D26';
const secondaryColor = '#111111';
const secondaryHover = '#000000';
const linkColor = '#C8102E';
const linkHover = '#A20D26';
const headingColor = '#111111';
const successColor = '#C8102E';
const successHover = '#A20D26';
const warningColor = '#D62828';
const warningHover = '#B61F1F';
const errorColor = '#A20D26';
const errorHover = '#7F091D';
const infoColor = '#333333';
const infoHover = '#1F1F1F';
const darkColor = '#111111';
const darkHover = '#000000';
const grayColor = '#333333';
const grayHover = '#1F1F1F';
const lightColor = '#6B6B6B';
const lightHover = '#DCDCDC';
const whiteColor = '#ffffff';
const dashColor = '#E5E5E5';
const whiteHover = '#333333';
const extraLightColor = '#BFBFBF';
const dangerColor = '#A20D26';
const dangerHover = '#7F091D';
const borderColorLight = '#EEEEEE';
const borderColorNormal = '#D9D9D9';
const borderColorDeep = '#BDBDBD';
const bgGrayColorDeep = '#ECECEC';
const bgGrayColorLight = '#FAFAFA';
const bgGrayColorNormal = '#F4F4F4';
const lightGrayColor = '#7A7A7A';
const sliderRailColor = 'rgba(200,16,46,0.25)';
const graySolid = '#7A7A7A';
const pinkColor = '#C8102E';
const btnlg = '48px';
const btnsm = '36px';
const btnxs = '29px';

const theme = {
  'primary-color': primaryColor, // primary color for all components
  'primary-hover': primaryHover, // primary color for all components
  'secondary-color': secondaryColor, // secondary color for all components
  'secondary-hover': secondaryHover, // secondary color for all components
  'link-color': linkColor, // link color
  'link-hover': linkHover, // link color
  'success-color': successColor, // success state color
  'success-hover': successHover, // success state color
  'warning-color': warningColor, // warning state color
  'warning-hover': warningHover, // warning state color
  'error-color': errorColor, // error state color
  'error-hover': errorHover, // error state color
  'info-color': infoColor, // info state color
  'info-hover': infoHover, // info state color
  'dark-color': darkColor, // info state color
  'dark-hover': darkHover, // info state color
  'gray-color': grayColor, // info state color
  'gray-hover': grayHover, // info state color
  'light-color': lightColor, // info state color
  'light-hover': lightHover, // info state color
  'white-color': whiteColor, // info state color
  'white-hover': whiteHover, // info state color
  white: whiteColor,
  black: '#000',
  pink: pinkColor,
  'dash-color': dashColor, // info state color
  'extra-light-color': extraLightColor, // info state color
  'danger-color': dangerColor,
  'danger-hover': dangerHover,
  'font-family': "'Inter', sans-serif",
  'font-size-base': '14px', // major text font size
  'heading-color': headingColor, // heading text color
  'text-color': darkColor, // major text color
  'text-color-secondary': grayColor, // secondary text color
  'disabled-color': 'rgba(0, 0, 0, 0.25)', // disable state color
  'border-radius-base': '4px', // major border radius
  'border-color-base': '#d9d9d9', // major border color
  'box-shadow-base': '0 2px 8px rgba(0, 0, 0, 0.15)', // major shadow for layers
  'border-color-light': borderColorLight,
  'border-color-normal': borderColorNormal,
  'border-color-deep': borderColorDeep,
  'bg-color-light': bgGrayColorLight,
  'bg-color-normal': bgGrayColorNormal,
  'bg-color-deep': bgGrayColorDeep,
  'light-gray-color': lightGrayColor,
  'gray-solid': graySolid,
  'btn-height-large': btnlg,
  'btn-height-small': btnsm,
  'btn-height-extra-small': btnxs,
  'btn-default-color': darkColor,

  // cards
  'card-head-background': '#ffffff',
  'card-head-color': darkColor,
  'card-background': '#ffffff',
  'card-head-padding': '16px',
  'card-padding-base': '12px',
  'card-radius': '10px',
  'card-shadow': '0 5px 20px rgba(0,0,0,0.06)',

  // Layout
  'layout-body-background': '#F7F7F7',
  'layout-header-background': '#ffffff',
  'layout-footer-background': '#ffffff',
  'layout-header-height': '64px',
  'layout-header-padding': '0 15px',
  'layout-footer-padding': '24px 15px',
  'layout-sider-background': '#ffffff',
  'layout-trigger-height': '48px',
  'layout-trigger-background': '#002140',
  'layout-trigger-color': '#fff',
  'layout-zero-trigger-width': '36px',
  'layout-zero-trigger-height': '42px',
  // Layout light theme
  'layout-sider-background-light': '#fff',
  'layout-trigger-background-light': '#fff',
  'layout-trigger-color-light': 'rgba(0, 0, 0, 0.65)',

  // PageHeader
  // ---
  'page-header-padding': '24px',
  'page-header-padding-vertical': '16px',
  'page-header-padding-breadcrumb': '12px',
  'page-header-back-color': '#000',
  'page-header-ghost-bg': 'inherit',

  // Popover body background color
  'popover-color': darkColor,

  // alert
  'alert-success-border-color': successColor,
  'alert-success-bg-color': successColor + 15,
  'alert-error-bg-color': errorColor + 15,
  'alert-warning-bg-color': warningColor + 15,
  'alert-info-bg-color': infoColor + 15,

  // radio btn
  'radio-button-checked-bg': primaryColor,

  // gutter width
  'grid-gutter-width': 25,

  // skeleton
  'skeleton-color': borderColorLight,

  // slider
  'slider-rail-background-color': sliderRailColor,
  'slider-rail-background-color-hover': sliderRailColor,
  'slider-track-background-color': primaryColor,
  'slider-track-background-color-hover': primaryColor,
  'slider-handle-color': primaryColor,
  'slider-handle-size': '16px',

  // input
  'input-height-base': '48px',
  'input-border-color': borderColorNormal,
  'input-height-sm': '30px',
  'input-height-lg': '50px',

  // rate
  'rate-star-color': warningColor,
  'rate-star-size': '13px',

  // Switch
  'switch-min-width': '35px',
  'switch-sm-min-width': '30px',
  'switch-height': '18px',
  'switch-sm-height': '15px',

  // result
  'result-title-font-size': '20px',
  'result-subtitle-font-size': '12px',
  'result-icon-font-size': '50px',

  // tabs
  'tabs-horizontal-padding': '12px 15px',
  'tabs-horizontal-margin': '0',

  // list
  'list-item-padding': '10px 24px',

  // Tags
  'tag-default-bg': '#EFF0F3',
  'tag-default-color': darkColor,
  'tag-font-size': '11px',
};

const darkTheme = {
  ...theme,
  'primary-color': '#C8102E',
  'primary-hover': '#A20D26',
  'secondary-color': '#ffffff',
  'secondary-hover': '#f4f4f4',
  'text-color': '#ffffff',
  'text-color-secondary': '#d9d9d9',
  'heading-color': '#ffffff',
  'layout-body-background': '#000000',
  'layout-header-background': '#111111',
  'layout-sider-background': '#111111',
  'layout-footer-background': '#111111',
  'card-background': '#151515',
  'card-head-background': '#111111',
  'card-head-color': '#ffffff',
  'border-color-light': '#2A2A2A',
  'border-color-normal': '#3A3A3A',
  'bg-color-light': '#1A1A1A',
  'bg-color-normal': '#101010',
  'bg-color-deep': '#080808',
  'tag-default-bg': '#222222',
  'tag-default-color': '#ffffff',
  backgroundColor: '#000000',
};

export { theme, darkTheme };
