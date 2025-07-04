<script setup lang="ts">
import { format } from 'date-fns'
import { Line } from 'vue-chartjs'

const props = defineProps<{
  prices: [number[]]
}>()

const yValues = props.prices.map(([_, value]) => value);
const yMin = Math.min(...yValues);
const yMax = Math.max(...yValues);

const range = yMax - yMin;
const margin = range * 0.2;

const chartData = ref({
  labels: props.prices.map(([label]) => {
    return format(label, 'MMM dd')
  }),
  datasets: [{
    data: props.prices.map(([_, value]) => {
      return value
    }),
    fill: false,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    tension: 0.2,
    pointRadius: 0,
    hoverRadius: 5,
    hoverOffset: 4,
  }]
})
const chartOptions = ref({
  maintainAspectRatio: false,
  responsive: true,
  layout: {
    padding: {
      right: 20
    }
  },
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      mode: 'index',
      intersect: false,
      backgroundColor: '#292B2C',
      titleColor: '#fff',
      bodyColor: '#fff',
      borderColor: '#525454',
      borderWidth: 1,
      cornerRadius: 4,
      displayColors: false,
      callbacks: {
        label: function(context: any) {
          let label = context.dataset.label || '';

          if (label) {
            label += ': ';
          }
          if (context.parsed.y !== null) {
            label += context.parsed.y.toFixed(2);
          }

          return `$${label}`;
        }
      }
    }
  },
  scales: {
    x: {
      border: {
        display: false,
      },
      grid: {
        display: false,
      },
      ticks: {
        color: '#939393',
        font: {
          size: 11,
          family: 'Inter',
        },
        padding: 5,
        callback: function(value, index, ticks) {
          const totalTicks = ticks.length;
          // Show the first, middle, and last tick.
          if (index === 0 || index === Math.floor(totalTicks / 2) || index === totalTicks - 1) {
            return this.getLabelForValue(value);
          }
          return '';
        },
        minRotation: 0,
        maxRotation: 0,
        autoSkip: false,
      }
    },

    y: {
      min: yMin - margin,
      max: yMax + margin,
      border: {
        display: false,
      },
      grid: {
        display: false,
      },
      ticks: {
        color: '#939393',
        maxTicksLimit: 2,
        font: {
          size: 11,
          family: 'Inter',
        },
        padding: 5,
      }
    }
  }
}) as any
</script>

<template>
  <div
    class="w-full h-full cursor-pointer pt-2"
  >
    <Line
      :data="chartData"
      :options="chartOptions"
    />
  </div>
</template>
