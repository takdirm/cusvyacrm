import React from 'react';
import MenueItems from './MenueItems';
import { TopMenuStyle } from './style';

const noop = () => {};

const topMenuEvents = {
  onRtlChange: noop,
  onLtrChange: noop,
  modeChangeDark: noop,
  modeChangeLight: noop,
  modeChangeTopNav: noop,
  modeChangeSideNav: noop,
};

function TopMenu() {
  return (
    <TopMenuStyle>
      <div className="strikingDash-top-menu">
        <MenueItems topMenu darkMode={false} toggleCollapsed={noop} events={topMenuEvents} />
      </div>
    </TopMenuStyle>
  );
}

export default TopMenu;
