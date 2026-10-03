import React from 'react';
import PropTypes from 'prop-types';
import { PageHeaderStyle } from './style';

const PageHeader = props => {
  const { title, subTitle, routes, buttons, ghost, bgColor, className } = props;
  
  // Convert routes array to items format for Ant Design v5
  const breadcrumbItems = routes ? routes.map(route => ({
    title: route.breadcrumbName,
    path: route.path,
  })) : undefined;
  
  return (
    <>
      <div
        style={{
          backgroundColor: bgColor || '#F4F5F7',
        }}
      >
        <PageHeaderStyle
          style={{
            backgroundColor: 'rgb(244, 245, 247)',
          }}
          // onBack={() => window.history.back()}
          className={className}
          title={title}
          subTitle={subTitle}
          breadcrumb={breadcrumbItems && { items: breadcrumbItems }}
          extra={buttons}
          ghost={ghost}
        />
      </div>
    </>
  );
};

PageHeader.propTypes = {
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  subTitle: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  bgColor: PropTypes.string,
  className: PropTypes.string,
  routes: PropTypes.arrayOf(PropTypes.object),
  // eslint-disable-next-line react/forbid-prop-types
  buttons: PropTypes.array,
  ghost: PropTypes.bool,
};

export { PageHeader };
