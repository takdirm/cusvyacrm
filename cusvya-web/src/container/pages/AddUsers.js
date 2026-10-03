import React, { lazy, Suspense } from 'react';
import { Row, Col, Spin } from 'antd';
import { Routes, Route, NavLink } from 'react-router-dom';
import FeatherIcon from 'feather-icons-react';
import { AddUser } from './style';
import { PageHeader } from '../../components/page-headers/page-headers';
import { Cards } from '../../components/cards/frame/cards-frame';
import { Main } from '../styled';

const Info = lazy(() => import('./overview/info'));
const Work = lazy(() => import('./overview/work'));
const Social = lazy(() => import('./overview/Social'));

function AddNew() {
  return (
    <>
      <PageHeader ghost title="Add User" />
      <Main>
        <Row gutter={15}>
          <Col xs={24}>
            <AddUser>
              <Cards
                title={
                  <div className="card-nav">
                    <ul>
                      <li>
                        <NavLink to="/admin/users/add-user/info">
                          <FeatherIcon icon="user" size={14} />
                          Personal Info
                        </NavLink>
                      </li>
                      <li>
                        <NavLink to="/admin/users/add-user/work">
                          <FeatherIcon icon="briefcase" size={14} />
                          Work Info
                        </NavLink>
                      </li>
                      <li>
                        <NavLink to="/admin/users/add-user/social">
                          <FeatherIcon icon="share-2" size={14} />
                          Social
                        </NavLink>
                      </li>
                    </ul>
                  </div>
                }
              >
                <Routes>
                  <Route path="info" element={
                    <Suspense fallback={<div className="spin"><Spin /></div>}>
                      <Info />
                    </Suspense>
                  } />
                  <Route path="work" element={
                    <Suspense fallback={<div className="spin"><Spin /></div>}>
                      <Work />
                    </Suspense>
                  } />
                  <Route path="social" element={
                    <Suspense fallback={<div className="spin"><Spin /></div>}>
                      <Social />
                    </Suspense>
                  } />
                </Routes>
              </Cards>
            </AddUser>
          </Col>
        </Row>
      </Main>
    </>
  );
}

export default AddNew;
