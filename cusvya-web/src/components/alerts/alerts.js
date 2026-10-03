import React from 'react';
import PropTypes from 'prop-types';
import { Style } from './styled';

function Alert({
  type = 'success',
  icon,
  message = 'Hello there! A simple success alert—check it out!',
  description,
  showIcon,
  outlined,
  closable,
  closeText,
  closeIcon,
}) {
  // Support both old closeText and new closeIcon for backward compatibility
  const closeConfig = closeIcon !== undefined 
    ? { closeIcon } 
    : closeText 
      ? { closeIcon: closeText }
      : closable 
        ? true 
        : undefined;

  return (
    <Style
      message={message}
      type={type}
      description={description}
      closable={closeConfig}
      showIcon={showIcon && showIcon}
      outlined={outlined}
      icon={icon && icon}
    />
  );
}


Alert.propTypes = {
  type: PropTypes.oneOf(['success', 'info', 'warning', 'error']),
  message: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  description: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  showIcon: PropTypes.bool,
  outlined: PropTypes.bool,
  closable: PropTypes.oneOfType([PropTypes.bool, PropTypes.object]),
  closeText: PropTypes.oneOfType([PropTypes.string, PropTypes.node]), // Deprecated but kept for backward compatibility
  closeIcon: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  icon: PropTypes.node,
};

export default Alert;
