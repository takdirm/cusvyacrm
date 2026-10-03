import React, { useEffect } from 'react';
import { Row, Col, Table } from 'antd';
import FeatherIcon from 'feather-icons-react';
import { NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ProductOverviewTable } from './style';
import { Cards } from '../../../../components/cards/frame/cards-frame';
import Heading from '../../../../components/heading/heading';
import { CardBarChart2, EChartCard, PerformanceChartWrapper } from '../../../dashboard/style';
import { ChartjsBarChartTransparent, ChartjsAreaChart } from '../../../../components/charts/chartjs';
import { performanceGetData } from '../../../../redux/chartContent/actionCreator';
import { chartLinearGradient } from '../../../../components/utilities/utilities';
import '../../../../config/chart'; // Import Chart.js registration

const chartOptions = {
  legend: {
    display: false,
    labels: {
      display: false,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      border: {
        display: false,
      },
      stacked: true,
      grid: {
        display: false,
      },
      ticks: {
        display: false,
      },
    },
    x: {
      beginAtZero: true,
      border: {
        display: false,
      },
      stacked: true,
      grid: {
        display: false,
      },
      ticks: {
        display: false,
      },
    },
  },
};

const moreContent = (
  <>
    <NavLink to="#">
      <FeatherIcon size={16} icon="printer" />
      <span>Printer</span>
    </NavLink>
    <NavLink to="#">
      <FeatherIcon size={16} icon="book-open" />
      <span>PDF</span>
    </NavLink>
    <NavLink to="#">
      <FeatherIcon size={16} icon="file-text" />
      <span>Google Sheets</span>
    </NavLink>
    <NavLink to="#">
      <FeatherIcon size={16} icon="x" />
      <span>Excel (XLSX)</span>
    </NavLink>
    <NavLink to="#">
      <FeatherIcon size={16} icon="file" />
      <span>CSV</span>
    </NavLink>
  </>
);

function Overview() {
  const dispatch = useDispatch();
  const { performanceState } = useSelector((state) => {
    return {
      performanceState: state.chartContent.performanceData,
    };
  });

  useEffect(() => {
    if (performanceGetData) {
      dispatch(performanceGetData());
    }
  }, [dispatch]);

  const dataSource = [
    {
      key: '1',
      name: 'Samsung Galaxy S8 256GB',
      price: '$280',
      sold: 126,
      revenue: '$38,536',
    },
    {
      key: '2',
      name: 'Half Sleeve Shirt',
      price: '$25',
      sold: 80,
      revenue: '$38,536',
    },
    {
      key: '3',
      name: 'Marco Shoes',
      price: '$32',
      sold: 58,
      revenue: '$38,536',
    },
    {
      key: '4',
      name: '15" Mackbook Pro        ',
      price: '$950',
      sold: 36,
      revenue: '$38,536',
    },
    {
      key: '5',
      name: 'Apple iPhone X',
      price: '$985',
      sold: 24,
      revenue: '$38,536',
    },
  ];

  const columns = [
    {
      title: 'Products Name',
      dataIndex: 'name',
      key: 'name',
      className: 'p_name',
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      className: 'p_price',
    },
    {
      title: 'Sold',
      dataIndex: 'sold',
      key: 'sold',
    },
    {
      title: 'Revenue',
      dataIndex: 'revenue',
      key: 'revenue',
    },
  ];

  const performanceDatasets = performanceState !== null && [
    {
      data: performanceState.users[1],
      borderColor: '#5F63F2',
      borderWidth: 4,
      fill: true,
      tension: 0.4,
      backgroundColor: () =>
        chartLinearGradient(document.getElementById('performance'), 300, {
          start: '#5F63F230',
          end: '#ffffff05',
        }),
      label: 'Revenue',
      pointStyle: 'circle',
      pointRadius: '0',
      hoverRadius: '9',
      pointBorderColor: '#fff',
      pointBackgroundColor: '#5F63F2',
      hoverBorderWidth: 5,
    },
  ];

  return (
    <Row gutter={25}>
      <Col xxl={8} lg={12} md={24} sm={12} xs={24}>
        <Cards headless>
          <EChartCard>
            <div className="card-chunk">
              <CardBarChart2>
                <Heading as="h1">7,461</Heading>
                <span>Orders</span>
                <p>
                  <span className="growth-upward">
                    <FeatherIcon icon="arrow-up" /> 25%
                  </span>
                  <span>Since last week</span>
                </p>
              </CardBarChart2>
            </div>
            <div className="card-chunk">
              <ChartjsBarChartTransparent
                labels={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']}
                datasets={[
                  {
                    data: [20, 60, 50, 45, 50, 60, 70],
                    backgroundColor: '#EFEFFE',
                    hoverBackgroundColor: '#5F63F2',
                    label: 'Orders',
                    barPercentage: 1,
                  },
                ]}
                options={chartOptions}
              />
            </div>
          </EChartCard>
        </Cards>
      </Col>
      <Col xxl={8} lg={12} md={24} sm={12} xs={24}>
        <Cards headless>
          <EChartCard>
            <div className="card-chunk">
              <CardBarChart2>
                <Heading as="h1">$28,947</Heading>
                <span>Revenue</span>
                <p>
                  <span className="growth-downward">
                    <FeatherIcon icon="arrow-down" /> 25%
                  </span>
                  <span>Since last week</span>
                </p>
              </CardBarChart2>
            </div>
            <div className="card-chunk">
              <ChartjsBarChartTransparent
                labels={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']}
                datasets={[
                  {
                    data: [20, 60, 50, 45, 50, 60, 70],
                    backgroundColor: '#FFF0F6',
                    hoverBackgroundColor: '#FF69A5',
                    label: 'Revenue',
                    barPercentage: 1,
                  },
                ]}
                options={chartOptions}
              />
            </div>
          </EChartCard>
        </Cards>
      </Col>
      <Col xxl={8} lg={12} md={24} sm={12} xs={24}>
        <Cards headless>
          <EChartCard>
            <div className="card-chunk">
              <CardBarChart2>
                <Heading as="h1">$3,241</Heading>
                <span>Avg. order value</span>
                <p>
                  <span className="growth-upward">
                    <FeatherIcon icon="arrow-up" /> 25%
                  </span>
                  <span>Since last week</span>
                </p>
              </CardBarChart2>
            </div>
            <div className="card-chunk">
              <ChartjsBarChartTransparent
                labels={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']}
                datasets={[
                  {
                    data: [20, 60, 50, 45, 50, 60, 70],
                    backgroundColor: '#E8FAF4',
                    hoverBackgroundColor: '#20C997',
                    label: 'Avg Orders',
                    barPercentage: 1,
                  },
                ]}
                options={chartOptions}
              />
            </div>
          </EChartCard>
        </Cards>
      </Col>
      <Col xs={24}>
        <PerformanceChartWrapper>
          {performanceState !== null && (
            <Cards more={moreContent} title="General Statistics" size="default">
              <div className="performance-lineChart">
                <ChartjsAreaChart
                  id="performance"
                  labels={performanceState.labels}
                  datasets={performanceDatasets}
                  options={{
                    maintainAspectRatio: true,
                    elements: {
                      z: 9999,
                    },
                    legend: {
                      display: false,
                    },
                    hover: {
                      mode: 'index',
                      intersect: false,
                    },
                    scales: {
                      y: {
                        border: {
                          display: false,
                        },
                        grid: {
                          color: '#e5e9f2',
                          borderDash: [3, 3],
                          lineWidth: 1,
                        },
                        ticks: {
                          font: {
                            size: 13,
                          },
                          color: '#182b49',
                          suggestedMax: 80,
                          stepSize: 20,
                          callback(label) {
                            return `${label}k`;
                          },
                        },
                      },
                      x: {
                        beginAtZero: true,
                        border: {
                          display: false,
                        },
                        grid: {
                          display: true,
                          lineWidth: 2,
                          color: 'transparent',
                        },
                        ticks: {
                          padding: 10,
                        },
                      },
                    },
                  }}
                  height={window.innerWidth <= 575 ? 200 : 86}
                />
              </div>
            </Cards>
          )}
        </PerformanceChartWrapper>
      </Col>
      <Col xs={24}>
        <ProductOverviewTable>
          <Cards more={moreContent} title="My Products" size="default">
            <Table className="table-responsive" pagination={false} dataSource={dataSource} columns={columns} />
          </Cards>
        </ProductOverviewTable>
      </Col>
    </Row>
  );
}

export default Overview;
