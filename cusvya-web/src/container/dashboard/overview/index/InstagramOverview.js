import React, { useState, useEffect } from 'react';
import "../../../../config/chart"; // Import Chart.js registration
import { Row, Col, Spin } from 'antd';
import FeatherIcon from 'feather-icons-react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Cards } from '../../../../components/cards/frame/cards-frame';
import Heading from '../../../../components/heading/heading';
import { ChartjsLineChart } from '../../../../components/charts/chartjs';
import { instagramOverviewGetData, instagramOverviewFilterData } from '../../../../redux/chartContent/actionCreator';
// import { getCustomTooltipConfig } from '../../../../components/utilities/utilities';
// import { customTooltips } from '../../../../components/utilities/utilities';
import { ChartContainer, LineChartWrapper } from '../../style';

function InstagramOverview() {
  const dispatch = useDispatch();
  const { instagramOverviewState, inIsLoading } = useSelector(state => {
    return {
      instagramOverviewState: state.chartContent.instagramOverviewData,
      inIsLoading: state.chartContent.inLoading,
    };
  });

  const [state, setState] = useState({
    instagramOverviewTabActive: 'month',
  });

  useEffect(() => {
    if (instagramOverviewGetData) {
      dispatch(instagramOverviewGetData());
    }
  }, [dispatch]);

  const chartOptions = {
    hover: {
      mode: 'nearest',
      intersect: false,
    },
    layout: {
      padding: {
        left: '0',
        right: 8,
        top: 15,
        bottom: -10,
      },
    },
    maintainAspectRatio: true,
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    elements: {
      line: {
        tension: 0,
      },
    },
    scales: {
      y: {
        border: {
          display: false,
        },
        stacked: true,
        grid: {
          display: false,
          color: '#e5e9f2',
          borderDash: [8, 4],
        },
        ticks: {
          display: false,
        },
      },
      x: {
        border: {
          display: false,
        },
        stacked: true,
        grid: {
          display: false,
          color: '#e5e9f2',
          borderDash: [8, 4],
        },
        ticks: {
          display: false,
        },
      },
    },
  };

  const handleActiveChangeInstagram = value => {
    setState({
      ...state,
      instagramOverviewTabActive: value,
    });
    return dispatch(instagramOverviewFilterData(value));
  };

  const lineChartPointStyle = {
    borderColor: '#C6D0DC',
    borderWidth: 2,
    fill: false,
    pointRadius: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6],
    pointBackgroundColor: [
      'transparent',
      'transparent',
      'transparent',
      'transparent',
      'transparent',
      'transparent',
      'transparent',
      'transparent',
      'transparent',
      'transparent',
      'transparent',
      '#20C997',
    ],
    pointHoverBackgroundColor: '#20C997',
    pointHoverRadius: 6,
    pointBorderColor: 'transparent',
  };

  return (
    <LineChartWrapper>
      {instagramOverviewState !== null && (
        <Cards
          isbutton={
            <div className="card-nav">
              <ul>
                <li className={state.instagramOverviewTabActive === 'week' ? 'active' : 'deactivate'}>
                  <Link onClick={() => handleActiveChangeInstagram('week')} to="#">
                    Week
                  </Link>
                </li>
                <li className={state.instagramOverviewTabActive === 'month' ? 'active' : 'deactivate'}>
                  <Link onClick={() => handleActiveChangeInstagram('month')} to="#">
                    Month
                  </Link>
                </li>
                <li className={state.instagramOverviewTabActive === 'year' ? 'active' : 'deactivate'}>
                  <Link onClick={() => handleActiveChangeInstagram('year')} to="#">
                    Year
                  </Link>
                </li>
              </ul>
            </div>
          }
          title="Instagram Overview"
          size="large"
        >
          {inIsLoading ? (
            <div className="sd-spin">
              <Spin />
            </div>
          ) : (
            <div className="overview-container">
              <Row className="line-chart-row">
                <Col xxl={10} xs={24}>
                  <div className="growth-upward">
                    <p>Post</p>
                    <Heading as="h4">
                      {instagramOverviewState.post.data}
                      <sub>
                        <FeatherIcon icon="arrow-up" size={14} />
                        25%
                      </sub>
                    </Heading>
                  </div>
                </Col>
                <Col xxl={14} xs={24}>
                  <div className="border-linechart">
                    <ChartContainer className="parentContainer">
                      <ChartjsLineChart
                        height={55}
                        datasets={[
                          {
                            label: 'Post',
                            data: instagramOverviewState.post.chartValue,
                            ...lineChartPointStyle,
                          },
                        ]}
                        options={chartOptions}
                      />
                    </ChartContainer>
                  </div>
                </Col>
              </Row>
              <Row className="line-chart-row">
                <Col xxl={10} xs={24}>
                  <div className="growth-upward">
                    <p>Like</p>
                    <Heading as="h4">
                      {instagramOverviewState.like.data}
                      <sub>
                        <FeatherIcon icon="arrow-up" size={14} />
                        108%
                      </sub>
                    </Heading>
                  </div>
                </Col>
                <Col xxl={14} xs={24}>
                  <div className="border-linechart">
                    <ChartContainer className="parentContainer">
                      <ChartjsLineChart
                        height={55}
                        datasets={[
                          {
                            label: 'Like',
                            data: instagramOverviewState.like.chartValue,
                            ...lineChartPointStyle,
                          },
                        ]}
                        options={chartOptions}
                      />
                    </ChartContainer>
                  </div>
                </Col>
              </Row>
              <Row className="line-chart-row">
                <Col xxl={10} xs={24}>
                  <div className="growth-downward">
                    <p>Comments</p>
                    <Heading as="h4">
                      {instagramOverviewState.comments.data}
                      <sub>
                        <FeatherIcon icon="arrow-down" size={14} />
                        30%
                      </sub>
                    </Heading>
                  </div>
                </Col>
                <Col xxl={14} xs={24}>
                  <div className="border-linechart">
                    <ChartContainer className="parentContainer">
                      <ChartjsLineChart
                        height={55}
                        datasets={[
                          {
                            label: 'Comments',
                            data: instagramOverviewState.comments.chartValue,
                            ...lineChartPointStyle,
                          },
                        ]}
                        options={chartOptions}
                      />
                    </ChartContainer>
                  </div>
                </Col>
              </Row>
              <Row className="line-chart-row">
                <Col xxl={10} xs={24}>
                  <div className="growth-upward">
                    <p>New Followers</p>
                    <Heading as="h4">
                      {instagramOverviewState.rate.data}
                      <sub>
                        <FeatherIcon icon="arrow-up" size={14} />
                        34%
                      </sub>
                    </Heading>
                  </div>
                </Col>
                <Col xxl={14} xs={24}>
                  <div className="border-linechart">
                    <ChartContainer className="parentContainer">
                      <ChartjsLineChart
                        height={55}
                        datasets={[
                          {
                            label: 'New Followers',
                            data: instagramOverviewState.rate.chartValue,
                            ...lineChartPointStyle,
                          },
                        ]}
                        options={chartOptions}
                      />
                    </ChartContainer>
                  </div>
                </Col>
              </Row>
              <Row className="line-chart-row">
                <Col xxl={10} xs={24}>
                  <div className="growth-downward">
                    <p>Following</p>
                    <Heading as="h4">
                      {instagramOverviewState.followers.data}
                      <sub>
                        <FeatherIcon icon="arrow-down" size={14} />
                        27%
                      </sub>
                    </Heading>
                  </div>
                </Col>
                <Col xxl={14} xs={24}>
                  <div className="border-linechart">
                    <ChartContainer className="parentContainer">
                      <ChartjsLineChart
                        height={55}
                        datasets={[
                          {
                            label: 'Following',
                            data: instagramOverviewState.followers.chartValue,
                            ...lineChartPointStyle,
                          },
                        ]}
                        options={chartOptions}
                      />
                    </ChartContainer>
                  </div>
                </Col>
              </Row>
            </div>
          )}
        </Cards>
      )}
    </LineChartWrapper>
  );
}

export default InstagramOverview;
