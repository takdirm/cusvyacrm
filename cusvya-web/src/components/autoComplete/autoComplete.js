import React from 'react';
import { Input, Button } from 'antd';
import PropTypes from 'prop-types';
import { SearchOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { AutoCompleteStyled } from './style';

const onSelect = () => {
  // console.log('onSelect', value);
};

const renderItem = (title, count) => {
  return {
    value: title,
    label: (
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        {title}
        {count}
      </div>
    ),
  };
};

const AutoComplete = ({
  customComponent,
  patterns,
  patternButtons,
  width = '350px',
  onSearch,
  dataSource,
  placeholder = 'Input here',
}) => {
  const { rtl } = useSelector(state => {
    return {
      rtl: state.ChangeLayoutMode.rtlData,
    };
  });

  const content =
    dataSource?.length > 0 &&
    dataSource.map(group => {
      const { title, count } = group;
      return {
        label: title,
        options: [renderItem(title, <span className="certain-search-item-count">{count} people</span>)],
      };
    });

  // Convert dataSource array to options format for Ant Design v5
  const simpleOptions = dataSource?.length > 0 
    ? dataSource.map(item => ({
        value: item.title || item.value || item,
        label: item.title || item.label || item,
      }))
    : [];

  const onSearching = searchText => {
    onSearch(searchText);
  };

  return customComponent ? (
    <AutoCompleteStyled options={simpleOptions} style={{ width }} onSelect={onSelect} onSearch={onSearching}>
      {customComponent}
    </AutoCompleteStyled>
  ) : patterns ? (
    <AutoCompleteStyled
      className="certain-category-search"
      classNames={{ popup: { root: 'certain-category-search-dropdown' } }}
      popupMatchSelectWidth={false}
      styles={{ popup: { root: { width: 300 } } }}
      style={{ width }}
      options={content}
      placeholder={placeholder}
      onSearch={onSearching}
    >
      <Input
        suffix={
          patternButtons ? (
            <Button className="search-btn" style={{ [rtl ? 'marginLeft' : 'marginRight']: -20 }} type="primary">
              <SearchOutlined />
            </Button>
          ) : (
            <SearchOutlined />
          )
        }
      />
    </AutoCompleteStyled>
  ) : (
    <AutoCompleteStyled
      options={simpleOptions}
      style={{ width }}
      onSelect={onSelect}
      onSearch={onSearching}
      placeholder={placeholder}
    />
  );
};

// migrate deprecated components  dataSource 
AutoComplete.propTypes = {
  customComponent: PropTypes.node,
  patterns: PropTypes.bool,
  patternButtons: PropTypes.bool,
  width: PropTypes.string,
  onSearch: PropTypes.func,
  dataSource: PropTypes.arrayOf(PropTypes.object),
  placeholder: PropTypes.string,
};

export { AutoComplete };
