import React from 'react';
import PropTypes, { object } from 'prop-types';
import { ModalStyled } from './styled';
import { Button } from '../buttons/buttons';

const Modal = ({
  onCancel,
  className = 'atbd-modal',
  onOk,
  visible,
  open,
  title,
  type,
  color,
  footer,
  width = 620,
  zIndex,
  children,
}) => {
  return (
    <ModalStyled
      title={title}
      open={open !== undefined ? open : visible}
      onOk={onOk}
      onCancel={onCancel}
      type={color ? type : false}
      width={width}
      className={className}
      zIndex={zIndex}
      footer={
        footer || footer === null
          ? footer
          : [
              <Button type="secondary" key="back" onClick={onCancel}>
                Cancel
              </Button>,
              <Button type={type} key="submit" onClick={onOk}>
                Save Change
              </Button>,
            ]
      }
    >
      {children}
    </ModalStyled>
  );
};

Modal.propTypes = {
  onCancel: PropTypes.func,
  onOk: PropTypes.func,
  visible: PropTypes.bool,
  open: PropTypes.bool,
  title: PropTypes.string,
  className: PropTypes.string,
  type: PropTypes.string,
  footer: PropTypes.arrayOf(object),
  width: PropTypes.number,
  zIndex: PropTypes.number,
  color: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
  children: PropTypes.oneOfType([PropTypes.object, PropTypes.string, PropTypes.node]),
};

const alertModal = ModalStyled;
export { Modal, alertModal };
