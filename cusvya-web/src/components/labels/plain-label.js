import React from 'react';
import PropTypes from 'prop-types';

const COLOR_MAP = {
  success: { color: '#ffffff', backgroundColor: '#237804', borderColor: '#237804' },
  warning: { color: '#ffffff', backgroundColor: '#ad4e00', borderColor: '#ad4e00' },
  error: { color: '#ffffff', backgroundColor: '#cf1322', borderColor: '#cf1322' },
  processing: { color: '#ffffff', backgroundColor: '#0958d9', borderColor: '#0958d9' },
  blue: { color: '#ffffff', backgroundColor: '#0958d9', borderColor: '#0958d9' },
  geekblue: { color: '#ffffff', backgroundColor: '#1d39c4', borderColor: '#1d39c4' },
  red: { color: '#ffffff', backgroundColor: '#cf1322', borderColor: '#cf1322' },
  orange: { color: '#ffffff', backgroundColor: '#d46b08', borderColor: '#d46b08' },
  gold: { color: '#ffffff', backgroundColor: '#d48806', borderColor: '#d48806' },
  green: { color: '#ffffff', backgroundColor: '#237804', borderColor: '#237804' },
  cyan: { color: '#ffffff', backgroundColor: '#006d75', borderColor: '#006d75' },
  purple: { color: '#ffffff', backgroundColor: '#531dab', borderColor: '#531dab' },
  magenta: { color: '#ffffff', backgroundColor: '#9e1068', borderColor: '#9e1068' },
  default: { color: 'rgba(0, 0, 0, 0.88)', backgroundColor: '#fafafa', borderColor: '#d9d9d9' },
};

function PlainLabel({ color, children, style, ...rest }) {
  const key = (color || 'default').toLowerCase();
  const palette = COLOR_MAP[key] || COLOR_MAP.default;

  return (
    <span
      {...rest}
      style={{
        display: 'inline-block',
        padding: '0 7px',
        borderRadius: 6,
        border: `1px solid ${palette.borderColor}`,
        backgroundColor: palette.backgroundColor,
        color: palette.color,
        fontSize: 12,
        fontWeight: 600,
        lineHeight: '20px',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
    </span>
  );
}

PlainLabel.propTypes = {
  color: PropTypes.string,
  children: PropTypes.node,
  style: PropTypes.object,
};

PlainLabel.defaultProps = {
  color: 'default',
  children: null,
  style: {},
};

export default PlainLabel;
