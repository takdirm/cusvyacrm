import Styled from 'styled-components';
import { Checkbox } from 'antd';

const CheckboxStyle = Styled(Checkbox)`
  .ant-checkbox {
    &-inner {
      width: 16px;
      height: 16px;
      border-radius: 4px;
    }
  }
  
  &.ant-checkbox-wrapper {
    font-size: 14px;
    
    .ant-checkbox {
      &-inner {
        width: 16px;
        height: 16px;
        border-radius: 4px;
      }
    }
  }
`;

export { CheckboxStyle };
