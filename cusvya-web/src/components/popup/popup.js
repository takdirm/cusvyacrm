import React from 'react';
import PropTypes from 'prop-types';
import './style.css';
// import { Link } from 'react-router-dom';
// import FeatherIcon from 'feather-icons-react';
import { Content, PopoverStyle, Title } from './style';

const Popover = ({
  content,
  placement = 'bottom',
  title,
  action = 'hover',
  children,
}) => {
  const content1 = <Content>{content}</Content>;

  return (
    <PopoverStyle placement={placement} title={title && <Title>{title}</Title>} content={content1} trigger={action}>
      {children}
    </PopoverStyle>
  );
};

// const content = (
//   <>
//     <Link to="#">
//       <FeatherIcon size={16} icon="check" />
//       <span>Btn Dropdown one</span>
//     </Link>
//     <Link to="#">
//       <FeatherIcon size={16} icon="check" />
//       <span>Btn Dropdown two</span>
//     </Link>
//     <Link to="#">
//       <FeatherIcon size={16} icon="check" />
//       <span>Btn Dropdown three</span>
//     </Link>
//   </>
// );


Popover.propTypes = {
  placement: PropTypes.string,
  title: PropTypes.string,
  action: PropTypes.string,
  content: PropTypes.node,
  children: PropTypes.node.isRequired,
};

export { Popover };
