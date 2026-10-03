import React, { useState } from 'react';
import { Avatar, Form, List, Input, Card } from 'antd';
import moment from 'moment';
import PropTypes from 'prop-types';
import { Button } from '../buttons/buttons';

const { TextArea } = Input;

const CommentList = ({ comments }) => (
  <List
    dataSource={comments}
    header={`${comments.length} ${comments.length > 1 ? 'replies' : 'reply'}`}
    itemLayout="horizontal"
    renderItem={item => (
      <Card size="small" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          <Avatar src={item.avatar} alt={item.author} />
          <div style={{ marginLeft: 12, flex: 1 }}>
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontWeight: 'bold', marginRight: 8 }}>{item.author}</span>
              <span style={{ color: '#999', fontSize: '12px' }}>{moment(item.datetime).format('YYYY-MM-DD HH:mm')}</span>
            </div>
            <p style={{ margin: 0 }}>{item.content}</p>
          </div>
        </div>
      </Card>
    )}
  />
);

CommentList.propTypes = {
  comments: PropTypes.arrayOf(PropTypes.shape({
    avatar: PropTypes.string,
    author: PropTypes.string,
    datetime: PropTypes.string,
    content: PropTypes.string,
  })),
};

const Editor = ({ onChange, onSubmit, submitting, value }) => (
  <div>
    <Form.Item>
      <TextArea rows={4} onChange={onChange} value={value} />
    </Form.Item>
    <Form.Item>
      <Button htmlType="submit" loading={submitting} onClick={onSubmit} size="default" raised type="primary">
        Add Comment
      </Button>
    </Form.Item>
  </div>
);

Editor.propTypes = {
  onChange: PropTypes.func,
  onSubmit: PropTypes.func,
  submitting: PropTypes.bool,
  value: PropTypes.string,
};

const CommentEditor = () => {
  const [state, setState] = useState({
    comments: [],
    submitting: false,
    value: '',
  });

  const handleSubmit = () => {
    if (!state.value) {
      return;
    }

    setState({
      ...state,
      submitting: true,
    });

    setTimeout(() => {
      setState({
        ...state,
        submitting: false,
        value: '',
        comments: [
          {
            author: 'Han Solo',
            avatar: 'https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png',
            content: <p>{state.value}</p>,
            datetime: moment().fromNow(),
          },
          ...state.comments,
        ],
      });
    }, 1000);
  };

  const handleChange = e => {
    setState({
      ...state,
      value: e.target.value,
    });
  };

  const { comments, submitting, value } = state;

  return (
    <div>
      {comments.length > 0 && <CommentList comments={comments} />}
      <Card size="small" style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <Avatar src="https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png" alt="Han Solo" />
          <div style={{ flex: 1 }}>
            <Editor onChange={handleChange} onSubmit={handleSubmit} submitting={submitting} value={value} />
          </div>
        </div>
      </Card>
    </div>
  );
};
export default CommentEditor;
