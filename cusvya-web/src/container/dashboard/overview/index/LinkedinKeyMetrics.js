import React, { useState, useEffect } from 'react';
import "../../../../config/chart"; // Import Chart.js registration
import { Row, Col, Spin } from 'antd';
import FeatherIcon from 'feather-icons-react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Cards } from '../../../../components/cards/frame/cards-frame';
import Heading from '../../../../components/heading/heading';
import { ChartjsLineChart } from '../../../../components/charts/chartjs';
import { linkdinOverviewGetData, linkdinOverviewFilterData } from '../../../../redux/chartContent/actionCreator';
// import { getCustomTooltipConfig } from '../../../../components/utilities/utilities';
// import { customTooltips } from '../../../../components/utilities/utilities';
import { ChartContainer, LineChartWrapper } from '../../style';

function LinkedinKeyMetrics() {
  const dispatch = useDispatch();
  const { linkdinOverviewState, liIsLoading } = useSelector(state => {
    return {
      linkdinOverviewState: state.chartContent.linkdinOverviewData,
      liIsLoading: state.chartContent.liLoading,
    };
  });

  useEffect(() => {
    if (linkdinOverviewGetData) {
      dispatch(linkdinOverviewGetData());
    }
  }, [dispatch]);

  const [state, setState] = useState({
    linkdinOverviewTabActive: 'month',
  });

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
    legend: {
      display: false,
      labels: {
        display: false,
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

  const handleActiveChangeLinkdin = value => {
    setState({
      ...state,
      linkdinOverviewTabActive: value,
    });
    dispatch(linkdinOverviewFilterData(value));
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
      {linkdinOverviewState !== null && (
        <Cards
          isbutton={
            <div className="card-nav">
              <ul>
                <li className={state.linkdinOverviewTabActive === 'week' ? 'active' : 'deactivate'}>
                  <Link onClick={() => handleActiveChangeLinkdin('week')} to="#">
                    Week
                  </Link>
                </li>
                <li className={state.linkdinOverviewTabActive === 'month' ? 'active' : 'deactivate'}>
                  <Link onClick={() => handleActiveChangeLinkdin('month')} to="#">
                    Month
                  </Link>
                </li>
                <li className={state.linkdinOverviewTabActive === 'year' ? 'active' : 'deactivate'}>
                  <Link onClick={() => handleActiveChangeLinkdin('year')} to="#">
                    Year
                  </Link>
                </li>
              </ul>
            </div>
          }
          title="Linkedin Key Metrics"
          size="large"
        >
          {liIsLoading ? (
            <div className="sd-spin">
              <Spin />
            </div>
          ) : (
            <div className="linkedin-chart-wrap">
              <Row className="line-chart-row">
                <Col xxl={10} xs={24}>
                  <div className="growth-upward">
                    <p>Clicks</p>
                    <Heading as="h4">
                      {linkdinOverviewState.post.data}
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
                            label: 'Clicks',
                            data: linkdinOverviewState.post.chartValue,
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
                      {linkdinOverviewState.like.data}
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
                            data: linkdinOverviewState.like.chartValue,
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
                      {linkdinOverviewState.comments.data}
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
                            data: linkdinOverviewState.comments.chartValue,
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
                      {linkdinOverviewState.rate.data}
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
                            data: linkdinOverviewState.rate.chartValue,
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
                      {linkdinOverviewState.followers.data}
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
                            data: linkdinOverviewState.followers.chartValue,
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

export default LinkedinKeyMetrics;
