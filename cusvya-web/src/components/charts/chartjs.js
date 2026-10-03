import React from 'react';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import '../../config/chart'; // Import Chart.js registration
import PropTypes from 'prop-types';
import useChartData from '../../hooks/useChartData';
import { ChartContainer } from '../../container/dashboard/style';
import { getCustomTooltipConfig } from '../utilities/utilities';

const ChartjsBarChart = props => {
  const { labels, datasets, options, height } = props;
  const data = {
    datasets,
    labels,
  };
  return <Bar data={data} height={height} options={options} />;
};

ChartjsBarChart.defaultProps = {
  height: 200,
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],

  datasets: [
    {
      data: [20, 60, 50, 45, 50, 60, 70, 40, 45, 35, 25, 30],
      backgroundColor: '#001737',
      barPercentage: 0.6,
      categoryPercentage: 0.8,
      borderRadius: 0,
      borderSkipped: false,
    },
    {
      data: [10, 40, 30, 40, 60, 55, 45, 35, 30, 20, 15, 20],
      backgroundColor: '#1ce1ac',
      barPercentage: 0.6,
      categoryPercentage: 0.8,
      borderRadius: 0,
      borderSkipped: false,
    },
  ],

  options: {
    maintainAspectRatio: true,
    responsive: true,
    interaction: {
      intersect: false,
      mode: 'index',
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        usePointStyle: true,
        intersect: false,
        mode: 'index',
        position: 'nearest',
        animation: {
          duration: 200,
        },
        titleFont: {
          family: "'Jost', sans-serif",
          size: 14,
          weight: 600,
        },
        bodyFont: {
          family: "'Jost', sans-serif",
          size: 12,
          weight: 400,
        },
        padding: {
          top: 12,
          right: 16,
          bottom: 12,
          left: 16,
        },
        caretSize: 6,
        caretPadding: 6,
        multiKeyBackground: 'rgba(255, 255, 255, 0.1)',
        callbacks: {
          title(context) {
            return context[0].label;
          },
          label(context) {
            const { dataset } = context;
            const label = dataset.label || `Dataset ${context.datasetIndex + 1}`;
            const value = context.parsed.y || context.parsed;
            return `${label}: ${value}`;
          },
          labelColor(context) {
            const { dataset } = context;
            // Prioritize line colors: borderColor for lines, backgroundColor for bars
            const color = dataset.borderColor || dataset.backgroundColor || dataset.pointBackgroundColor || '#ffffff';
            return {
              borderColor: color,
              backgroundColor: color,
            };
          },
          afterBody() {
            // Ensure proper spacing for color indicators
            setTimeout(() => {
              const tooltipKeys = document.querySelectorAll('.chartjs-tooltip-key');
              tooltipKeys.forEach(key => {
                key.style.marginRight = '14px';
              });
            }, 0);
            return '';
          },
          labelTextColor() {
            return '#ffffff';
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#e5e9f2',
          borderDash: [3, 3],
          drawBorder: false,
          lineWidth: 1,
        },
        ticks: {
          beginAtZero: true,
          font: {
            size: 10,
            family: "'Jost', sans-serif",
          },
          color: '#182b49',
          max: 80,
          padding: 10,
        },
        border: {
          display: false,
        },
      },
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          font: {
            size: 11,
            family: "'Jost', sans-serif",
          },
          color: '#182b49',
          padding: 10,
        },
        border: {
          display: false,
        },
      },
    },
  },
};

ChartjsBarChart.propTypes = {
  labels: PropTypes.arrayOf(PropTypes.string),
  height: PropTypes.number,
  datasets: PropTypes.arrayOf(PropTypes.object),
  options: PropTypes.object,
};

const ChartjsHorizontalChart = props => {
  const { labels, datasets, options, height } = props;
  const data = {
    datasets,
    labels,
  };
  return <Bar data={data} height={height} options={{...options, indexAxis: 'y'}} />;
};

ChartjsHorizontalChart.defaultProps = {
  height: 200,
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  datasets: [
    {
      data: [20, 60, 50, 45, 50, 60, 70, 40, 45, 35, 25, 30],
      backgroundColor: '#001737',
      barPercentage: 0.6,
      categoryPercentage: 0.8,
      borderRadius: 0,
      borderSkipped: false,
    },
    {
      data: [10, 40, 30, 40, 60, 55, 45, 35, 30, 20, 15, 20],
      backgroundColor: '#1ce1ac',
      barPercentage: 0.6,
      categoryPercentage: 0.8,
      borderRadius: 0,
      borderSkipped: false,
    },
  ],

  options: {
    maintainAspectRatio: true,
    responsive: true,
    indexAxis: 'y',
    interaction: {
      intersect: false,
      mode: 'index',
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        usePointStyle: true,
        intersect: false,
        mode: 'index',
        position: 'nearest',
        animation: {
          duration: 200,
        },
        titleFont: {
          family: "'Jost', sans-serif",
          size: 14,
          weight: 600,
        },
        bodyFont: {
          family: "'Jost', sans-serif",
          size: 12,
          weight: 400,
        },
        padding: {
          top: 12,
          right: 16,
          bottom: 12,
          left: 16,
        },
        caretSize: 6,
        caretPadding: 6,
        multiKeyBackground: 'rgba(255, 255, 255, 0.1)',
        callbacks: {
          title(context) {
            return context[0].label;
          },
          label(context) {
            const { dataset } = context;
            const label = dataset.label || `Dataset ${context.datasetIndex + 1}`;
            const value = context.parsed.y || context.parsed;
            return `${label}: ${value}`;
          },
          labelColor(context) {
            const { dataset } = context;
            // Prioritize line colors: borderColor for lines, backgroundColor for bars
            const color = dataset.borderColor || dataset.backgroundColor || dataset.pointBackgroundColor || '#ffffff';
            return {
              borderColor: color,
              backgroundColor: color,
            };
          },
          afterBody() {
            // Ensure proper spacing for color indicators
            setTimeout(() => {
              const tooltipKeys = document.querySelectorAll('.chartjs-tooltip-key');
              tooltipKeys.forEach(key => {
                key.style.marginRight = '14px';
              });
            }, 0);
            return '';
          },
          labelTextColor() {
            return '#ffffff';
          },
        },
      },
    },
    scales: {
      y: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          font: {
            size: 10,
            family: "'Jost', sans-serif",
          },
          color: '#182b49',
          padding: 10,
        },
        border: {
          display: false,
        },
      },
      x: {
        beginAtZero: true,
        grid: {
          color: '#e5e9f2',
          borderDash: [3, 3],
          drawBorder: false,
          lineWidth: 1,
        },
        ticks: {
          beginAtZero: true,
          font: {
            size: 11,
            family: "'Jost', sans-serif",
          },
          color: '#182b49',
          max: 100,
          padding: 10,
        },
        border: {
          display: false,
        },
      },
    },
  },
};

ChartjsHorizontalChart.propTypes = {
  height: PropTypes.number,
  labels: PropTypes.arrayOf(PropTypes.string),
  datasets: PropTypes.arrayOf(PropTypes.object),
  options: PropTypes.object,
};

const ChartjsStackedChart = props => {
  const { labels, datasets, options, height } = props;
  const data = {
    datasets,
    labels,
  };
  return <Bar data={data} height={height} options={options} />;
};

ChartjsStackedChart.defaultProps = {
  height: 200,
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],

  datasets: [
    {
      data: [20, 60, 50, 45, 50, 60, 70, 40, 45, 35, 25, 30],
      backgroundColor: '#001737',
      barPercentage: 0.6,
    },
    {
      data: [10, 40, 30, 40, 60, 55, 45, 35, 30, 20, 15, 20],
      backgroundColor: '#1ce1ac',
      barPercentage: 0.6,
    },
  ],

  options: {
    maintainAspectRatio: true,
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        usePointStyle: true,
        intersect: false,
        mode: 'index',
        position: 'nearest',
        animation: {
          duration: 200,
        },
        titleFont: {
          family: "'Jost', sans-serif",
          size: 14,
          weight: 600,
        },
        bodyFont: {
          family: "'Jost', sans-serif",
          size: 12,
          weight: 400,
        },
        padding: {
          top: 12,
          right: 16,
          bottom: 12,
          left: 16,
        },
        caretSize: 6,
        caretPadding: 6,
        multiKeyBackground: 'rgba(255, 255, 255, 0.1)',
        callbacks: {
          title(context) {
            return context[0].label;
          },
          label(context) {
            const { dataset } = context;
            const label = dataset.label || `Dataset ${context.datasetIndex + 1}`;
            const value = context.parsed.y || context.parsed;
            return `${label}: ${value}`;
          },
          labelColor(context) {
            const { dataset } = context;
            // Prioritize line colors: borderColor for lines, backgroundColor for bars
            const color = dataset.borderColor || dataset.backgroundColor || dataset.pointBackgroundColor || '#ffffff';
            return {
              borderColor: color,
              backgroundColor: color,
            };
          },
          afterBody() {
            // Ensure proper spacing for color indicators
            setTimeout(() => {
              const tooltipKeys = document.querySelectorAll('.chartjs-tooltip-key');
              tooltipKeys.forEach(key => {
                key.style.marginRight = '14px';
              });
            }, 0);
            return '';
          },
          labelTextColor() {
            return '#ffffff';
          },
        },
      },
    },
    scales: {
      y: {
        stacked: true,
        grid: {
          color: '#e5e9f2',
        },
        ticks: {
          beginAtZero: true,
          font: {
            size: 10,
          },
          color: '#182b49',
        },
      },
      x: {
        stacked: true,
        grid: {
          display: false,
        },
        ticks: {
          beginAtZero: true,
          font: {
            size: 11,
          },
          color: '#182b49',
        },
      },
    },
  },
};

ChartjsStackedChart.propTypes = {
  height: PropTypes.number,
  labels: PropTypes.arrayOf(PropTypes.string),
  datasets: PropTypes.arrayOf(PropTypes.object),
  options: PropTypes.object,
};

const ChartjsLineChart = props => {
  const { labels, datasets, options, height, layout, width, id } = props;
  const data = {
    labels,
    datasets,
  };
  return (
    <ChartContainer className="parentContainer">
      <Line
        id={id && id}
        width={width}
        data={data}
        height={height}
        options={{
          ...options,
          ...layout,
        }}
      />
    </ChartContainer>
  );
};

ChartjsLineChart.defaultProps = {
  height: 479,
  width: null,
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  datasets: [
    {
      data: [20, 60, 50, 45, 50, 60, 70, 40, 45, 35, 25, 30],
      borderColor: '#001737',
      backgroundColor: 'rgba(0, 23, 55, 0.1)',
      borderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 5,
      pointBackgroundColor: '#001737',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      fill: false,
      tension: 0.4,
    },
    {
      data: [10, 40, 30, 40, 60, 55, 45, 35, 30, 20, 15, 20],
      borderColor: '#1ce1ac',
      backgroundColor: 'rgba(28, 225, 172, 0.1)',
      borderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 5,
      pointBackgroundColor: '#1ce1ac',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      fill: false,
      tension: 0.4,
    },
  ],

  options: {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index',
    },
    layout: {
      padding: {
        left: -10,
        right: 0,
        top: 0,
        bottom: -10,
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        usePointStyle: true,
        intersect: false,
        mode: 'index',
        position: 'nearest',
        animation: {
          duration: 200,
        },
        titleFont: {
          family: "'Jost', sans-serif",
          size: 14,
          weight: 600,
        },
        bodyFont: {
          family: "'Jost', sans-serif",
          size: 12,
          weight: 400,
        },
        padding: {
          top: 12,
          right: 16,
          bottom: 12,
          left: 16,
        },
        caretSize: 6,
        caretPadding: 6,
        multiKeyBackground: 'rgba(255, 255, 255, 0.1)',
        callbacks: {
          title(context) {
            return context[0].label;
          },
          label(context) {
            const { dataset } = context;
            const label = dataset.label || `Dataset ${context.datasetIndex + 1}`;
            const value = context.parsed.y || context.parsed;
            return `${label}: ${value}`;
          },
          labelColor(context) {
            const { dataset } = context;
            // Prioritize line colors: borderColor for lines, backgroundColor for bars
            const color = dataset.borderColor || dataset.backgroundColor || dataset.pointBackgroundColor || '#ffffff';
            return {
              borderColor: color,
              backgroundColor: color,
            };
          },
          afterBody() {
            // Ensure proper spacing for color indicators
            setTimeout(() => {
              const tooltipKeys = document.querySelectorAll('.chartjs-tooltip-key');
              tooltipKeys.forEach(key => {
                key.style.marginRight = '14px';
              });
            }, 0);
            return '';
          },
          labelTextColor() {
            return '#ffffff';
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#e5e9f2',
          borderDash: [3, 3],
          drawBorder: false,
          lineWidth: 1,
        },
        ticks: {
          font: {
            size: 10,
            family: "'Jost', sans-serif",
          },
          color: '#182b49',
          padding: 10,
        },
        border: {
          display: false,
        },
      },
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          font: {
            size: 11,
            family: "'Jost', sans-serif",
          },
          color: '#182b49',
          padding: 10,
        },
        border: {
          display: false,
        },
      },
    },
  },
};

ChartjsLineChart.propTypes = {
  height: PropTypes.number,
  labels: PropTypes.arrayOf(PropTypes.string),
  datasets: PropTypes.arrayOf(PropTypes.object),
  layout: PropTypes.object,
  width: PropTypes.number,
  options: PropTypes.object,
  id: PropTypes.string,
};

const ChartjsAreaChart = ({ 
  labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  datasets = [
    {
      data: [20, 60, 50, 45, 50, 60, 70, 40, 45, 35, 25, 30],
      borderColor: '#001737',
      borderWidth: 1,
      fill: true,
      backgroundColor: '#00173750',
      pointHoverBorderColor: 'transparent',
    },
    {
      data: [10, 40, 30, 40, 60, 55, 45, 35, 30, 20, 15, 20],
      borderColor: '#1ce1ac',
      borderWidth: 1,
      fill: true,
      backgroundColor: '#1ce1ac50',
      pointHoverBorderColor: 'transparent',
    },
  ],
  options = {},
  height = 250,
  layout,
  id
}) => {

  const data = {
    labels,
    datasets,
  };
  return (
    <div>
      <ChartContainer className="parentContainer">
        <Line
          id={id}
          data={data}
          height={height}
          options={{
            maintainAspectRatio: true,
    
    
            hover: {
              mode: 'nearest',
              intersect: false,
            },
        
            layout: {
              padding: {
                left: -10,
                right: 0,
                top: 2,
                bottom: -10,
              },
            },
            plugins: {
              legend: {
                display: false,
              },
              tooltip: getCustomTooltipConfig(),
            },
            
            scales: {
              x: {
                display: false,
              },
              y: {
                display: false,
                min: 0,
              },
            },
            elements: {
              point: {
                radius: 0,
              },
            },
            
            ...options,
            ...layout,
          }}
        />
      </ChartContainer>
    </div>
  );
};

ChartjsAreaChart.propTypes = {
  height: PropTypes.number,
  labels: PropTypes.arrayOf(PropTypes.string),
  datasets: PropTypes.arrayOf(PropTypes.object),
  layout: PropTypes.object,
  options: PropTypes.object,
  id: PropTypes.string,
};

const ChartjsBarChartTransparent = ({
  labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  datasets = [
    {
      data: [20, 60, 50, 45, 50, 60, 70, 40, 45, 35, 25, 30],
      backgroundColor: 'rgba(0,23,55, .5)',
      label: 'Profit',
      barPercentage: 0.6,
    },
    {
      data: [10, 40, 30, 40, 60, 55, 45, 35, 30, 20, 15, 20],
      backgroundColor: 'rgba(28,225,172, .5)',
      label: 'Lose',
      barPercentage: 0.6,
    },
  ],
  options = {
    maintainAspectRatio: true,
    responsive: true,
    legend: {
      display: true,
      position: 'bottom',
      align: 'start',
      labels: {
        boxWidth: 6,
        display: true,
        usePointStyle: true,
      },
    },
    layout: {
      padding: {
        left: '0',
        right: 0,
        top: 0,
        bottom: '0',
      },
    },
    scales: {
      y: {
        grid: {
          color: '#e5e9f2',
        },
        ticks: {
          beginAtZero: true,
          font: {
            size: 13,
          },
          color: '#182b49',
          max: 80,
          stepSize: 20,
          callback(value) {
            return `${value}k`;
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          beginAtZero: true,
          font: {
            size: 13,
          },
          color: '#182b49',
        },
      },
    },
  },
  height = 176,
  layout
}) => {

  const data = {
    labels,
    datasets,
  };

  return (
    <ChartContainer className="parentContainer">
      <Bar
        data={data}
        height={window.innerWidth <= 575 ? 230 : height}
        options={{
          ...options,
          ...layout,
          plugins: {
            legend: {
              display: false,
            },
            tooltip: getCustomTooltipConfig(),
          },
        }}
      />
    </ChartContainer>
  );
};

ChartjsBarChartTransparent.propTypes = {
  height: PropTypes.number,
  labels: PropTypes.arrayOf(PropTypes.string),
  datasets: PropTypes.arrayOf(PropTypes.object),
  options: PropTypes.object,
  layout: PropTypes.object,
};

const ChartjsBarChartGrad = props => {
  const { labels, datasets, options, height, layout } = props;
  const data = {
    labels,
    datasets,
  };
  return <Bar data={data} height={height} options={{ ...options, ...layout }} />;
};

ChartjsBarChartGrad.defaultProps = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  datasets: [
    {
      data: [20, 60, 50, 45, 50, 60, 70, 40, 45, 35, 25, 30],
      backgroundColor: 'rgba(0,23,55, .5)',
      barPercentage: 0.6,
    },
    {
      data: [10, 40, 30, 40, 60, 55, 45, 35, 30, 20, 15, 20],
      backgroundColor: 'rgba(28,225,172, .5)',
      barPercentage: 0.6,
    },
  ],

  options: {
    maintainAspectRatio: true,
    responsive: true,
    layout: {
      padding: {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
      },
    },
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        grid: {
          color: '#e5e9f2',
        },
        ticks: {
          beginAtZero: true,
          font: {
            size: 10,
          },
          color: '#182b49',
          max: 80,
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          beginAtZero: true,
          font: {
            size: 11,
          },
          color: '#182b49',
        },
      },
    },
  },
};

ChartjsBarChartGrad.propTypes = {
  height: PropTypes.number,
  labels: PropTypes.arrayOf(PropTypes.string),
  datasets: PropTypes.arrayOf(PropTypes.object),
  options: PropTypes.object,
  layout: PropTypes.object,
};

const ChartjsPieChart = props => {
  const { labels, datasets, options, height } = props;
  const data = {
    labels,
    datasets,
  };
  return <Pie data={data} height={height} options={options} />;
};

ChartjsPieChart.defaultProps = {
  height: 200,
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
  datasets: [
    {
      data: [20, 20, 30, 5, 25],
      backgroundColor: ['#560bd0', '#007bff', '#00cccc', '#cbe0e3', '#74de00'],
    },
  ],

  options: {
    maintainAspectRatio: true,
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        usePointStyle: true,
        intersect: false,
        mode: 'index',
        position: 'nearest',
        animation: {
          duration: 200,
        },
        titleFont: {
          family: "'Jost', sans-serif",
          size: 14,
          weight: 600,
        },
        bodyFont: {
          family: "'Jost', sans-serif",
          size: 12,
          weight: 400,
        },
        padding: {
          top: 12,
          right: 16,
          bottom: 12,
          left: 16,
        },
        caretSize: 6,
        caretPadding: 6,
        multiKeyBackground: 'rgba(255, 255, 255, 0.1)',
        callbacks: {
          title(context) {
            return context[0].label;
          },
          label(context) {
            const { dataset } = context;
            const label = dataset.label || `Dataset ${context.datasetIndex + 1}`;
            const value = context.parsed.y || context.parsed;
            return `${label}: ${value}`;
          },
          labelColor(context) {
            const { dataset } = context;
            // Prioritize line colors: borderColor for lines, backgroundColor for bars
            const color = dataset.borderColor || dataset.backgroundColor || dataset.pointBackgroundColor || '#ffffff';
            return {
              borderColor: color,
              backgroundColor: color,
            };
          },
          afterBody() {
            // Ensure proper spacing for color indicators
            setTimeout(() => {
              const tooltipKeys = document.querySelectorAll('.chartjs-tooltip-key');
              tooltipKeys.forEach(key => {
                key.style.marginRight = '14px';
              });
            }, 0);
            return '';
          },
          labelTextColor() {
            return '#ffffff';
          },
        },
      },
    },
    animation: {
      animateScale: true,
      animateRotate: true,
    },
  },
};

ChartjsPieChart.propTypes = {
  height: PropTypes.number,
  labels: PropTypes.arrayOf(PropTypes.string),
  datasets: PropTypes.arrayOf(PropTypes.object),
  options: PropTypes.object,
};
/**
 *
 *  {const labels = chart.data.labels.reduce((prev, curent, i) => {
        return `${prev}<li><span class="doughnutLabelColor" style="background-color:${chart.data.datasets[0].backgroundColor[i]}"></span><span class="doughnutLabe">${curent}</span></li>`;
      }, '');
      const generatedLegend = `<ul class="${chart.id}-legend">${labels}</ul>`;

      return generatedLegend;} props
 */

const ChartjsDonutChart = ({ 
  labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May'], 
  datasets = [
    {
      data: [20, 20, 30, 5, 25],
      backgroundColor: ['#560bd0', '#007bff', '#00cccc', '#cbe0e3', '#74de00'],
    },
  ], 
  options = {
    cutout: '70%',
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: {
        display: false,
        position: 'bottom',
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        usePointStyle: true,
        intersect: false,
        mode: 'index',
        position: 'nearest',
        animation: {
          duration: 200,
        },
        titleFont: {
          family: "'Jost', sans-serif",
          size: 14,
          weight: 600,
        },
        bodyFont: {
          family: "'Jost', sans-serif",
          size: 12,
          weight: 400,
        },
        padding: {
          top: 12,
          right: 16,
          bottom: 12,
          left: 16,
        },
        caretSize: 6,
        caretPadding: 6,
        multiKeyBackground: 'rgba(255, 255, 255, 0.1)',
        callbacks: {
          title(context) {
            return context[0].label;
          },
          label(context) {
            const { dataset } = context;
            const label = dataset.label || `Dataset ${context.datasetIndex + 1}`;
            const value = context.parsed.y || context.parsed;
            return `${label}: ${value}`;
          },
          labelColor(context) {
            const { dataset } = context;
            // Prioritize line colors: borderColor for lines, backgroundColor for bars
            const color = dataset.borderColor || dataset.backgroundColor || dataset.pointBackgroundColor || '#ffffff';
            return {
              borderColor: color,
              backgroundColor: color,
            };
          },
          afterBody() {
            // Ensure proper spacing for color indicators
            setTimeout(() => {
              const tooltipKeys = document.querySelectorAll('.chartjs-tooltip-key');
              tooltipKeys.forEach(key => {
                key.style.marginRight = '14px';
              });
            }, 0);
            return '';
          },
          labelTextColor() {
            return '#ffffff';
          },
        },
      },
    },
    animation: {
      animateScale: true,
      animateRotate: true,
    },
  }, 
  height = 200 
}) => {
  const { ref } = useChartData();
  const data = {
    labels,
    datasets,
  };

  return (
    <div style={{ position: 'relative' }}>
      <p>
        <span>{datasets[0].data.reduce((a, b) => a + b, 0)}</span>
        Total visitors
      </p>
      <Doughnut ref={ref} data={data} height={height} options={options} />
    </div>
  );
};

ChartjsDonutChart.propTypes = {
  height: PropTypes.number,
  labels: PropTypes.arrayOf(PropTypes.string),
  datasets: PropTypes.arrayOf(PropTypes.object),
  options: PropTypes.object,
};

const ChartjsDonutChart2 = props => {
  const { labels, datasets, options, height } = props;
  const { ref } = useChartData();
  const dataInfo = {
    labels,
    datasets,
  };

  return (
    <div>
      <Doughnut ref={ref} data={dataInfo} height={height} options={options} width={200} />

      <div className="align-center-v justify-content-between rd-labels">
        <div className="revenue-chat-label">
          {labels.map((label, key) => {
            return (
              <div key={key + 1} className="chart-label">
                <span className={`label-dot dot-${label}`} />
                {label}
              </div>
            );
          })}
        </div>
        <div className="revenue-chart-data">
          {datasets.map((item, key) => {
            const { data } = item;
            return (
              <div key={key + 1}>
                {data.map(value => {
                  return (
                    <p key={value}>
                      <strong>${value}</strong>
                    </p>
                  );
                })}
              </div>
            );
          })}
        </div>
        <div className="revenue-chat-percentage">
          <span>45%</span>
          <span>45%</span>
          <span>45%</span>
        </div>
      </div>
    </div>
  );
};

ChartjsDonutChart2.defaultProps = {
  height: 220,
  // width: 220,
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
  datasets: [
    {
      data: [20, 20, 30, 5, 25],
      backgroundColor: ['#560bd0', '#007bff', '#00cccc', '#cbe0e3', '#74de00'],
    },
  ],

  options: {
    cutout: '60%',
    maintainAspectRatio: false,
    responsive: false,
    plugins: {
      legend: {
        display: false,
        position: 'bottom',
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        usePointStyle: true,
        intersect: false,
        mode: 'index',
        position: 'nearest',
        animation: {
          duration: 200,
        },
        titleFont: {
          family: "'Jost', sans-serif",
          size: 14,
          weight: 600,
        },
        bodyFont: {
          family: "'Jost', sans-serif",
          size: 12,
          weight: 400,
        },
        padding: {
          top: 12,
          right: 16,
          bottom: 12,
          left: 16,
        },
        caretSize: 6,
        caretPadding: 6,
        multiKeyBackground: 'rgba(255, 255, 255, 0.1)',
        callbacks: {
          title(context) {
            return context[0].label;
          },
          label(context) {
            const { dataset } = context;
            const label = dataset.label || `Dataset ${context.datasetIndex + 1}`;
            const value = context.parsed.y || context.parsed;
            return `${label}: ${value}`;
          },
          labelColor(context) {
            const { dataset } = context;
            // Prioritize line colors: borderColor for lines, backgroundColor for bars
            const color = dataset.borderColor || dataset.backgroundColor || dataset.pointBackgroundColor || '#ffffff';
            return {
              borderColor: color,
              backgroundColor: color,
            };
          },
          afterBody() {
            // Ensure proper spacing for color indicators
            setTimeout(() => {
              const tooltipKeys = document.querySelectorAll('.chartjs-tooltip-key');
              tooltipKeys.forEach(key => {
                key.style.marginRight = '14px';
              });
            }, 0);
            return '';
          },
          labelTextColor() {
            return '#ffffff';
          },
        },
      },
    },
    animation: {
      animateScale: true,
      animateRotate: true,
    },
  },
};

ChartjsDonutChart2.propTypes = {
  height: PropTypes.number,
  labels: PropTypes.arrayOf(PropTypes.string),
  datasets: PropTypes.arrayOf(PropTypes.object),
  options: PropTypes.object,
};

const ChartjsDonut = props => {
  const { labels, datasets, options, height } = props;
  const { ref } = useChartData();
  const dataInfo = {
    labels,
    datasets,
  };

  return <Doughnut ref={ref} data={dataInfo} height={height} options={options} width={200} />;
};

ChartjsDonut.defaultProps = {
  height: 220,
  // width: 220,
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
  datasets: [
    {
      data: [20, 20, 30, 5, 25],
      backgroundColor: ['#560bd0', '#007bff', '#00cccc', '#cbe0e3', '#74de00'],
    },
  ],

  options: {
    cutoutPercentage: 60,
    maintainAspectRatio: false,
    responsive: false,
    legend: {
      display: false,
      position: 'bottom',
    },
    animation: {
      animateScale: true,
      animateRotate: true,
    },
  },
};

ChartjsDonut.propTypes = {
  height: PropTypes.number,
  labels: PropTypes.array,
  datasets: PropTypes.arrayOf(PropTypes.object),
  options: PropTypes.object,
};

export {
  ChartjsDonutChart,
  ChartjsDonutChart2,
  ChartjsPieChart,
  ChartjsBarChartGrad,
  ChartjsBarChartTransparent,
  ChartjsAreaChart,
  ChartjsLineChart,
  ChartjsStackedChart,
  ChartjsHorizontalChart,
  ChartjsBarChart,
  ChartjsDonut,
};
