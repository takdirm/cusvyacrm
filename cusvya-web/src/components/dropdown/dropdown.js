import React from 'react';
import PropTypes from 'prop-types';
  
import { DropdownStyle } from './dropdown-style';

const Dropdown = ({
  content,
  placement = 'bottomRight',
  title,
  action = ['hover'],
  children,
  style = {},
  className = 'strikingDash-dropdown',
}) => {
  // Convert content to menu items for Antd v5
  const menuItems = React.useMemo(() => {
    if (!content) return [];
    
    // If content is an array of links, convert to menu items
    if (Array.isArray(content.props?.children)) {
      return content.props.children.map((link, index) => ({
        key: index,
        label: link.props.children,
        onClick: () => {
          // Handle click if needed
          if (link.props.onClick) {
            link.props.onClick();
          }
        },
      }));
    }
    
    // Default fallback
    return [{
      key: 'default',
      label: content,
    }];
  }, [content]);

  return (
    <DropdownStyle
      overlayClassName={className}
      style={style}
      placement={placement}
      title={title}
      menu={{ items: menuItems }}
      trigger={action}
    >
      {children}
    </DropdownStyle>
  );
};



Dropdown.propTypes = {
  placement: PropTypes.string,
  title: PropTypes.string,
  action: PropTypes.array,
  content: PropTypes.node,
  children: PropTypes.node,
  style: PropTypes.object,
  className: PropTypes.string,
};

export { Dropdown };
