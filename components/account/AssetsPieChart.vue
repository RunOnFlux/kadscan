<script setup lang="ts">
import { Doughnut } from 'vue-chartjs'
import { useAccountBalances } from '~/composables/useAccountBalances'

const { balances } = useAccountBalances()

const totalBalance = computed(() => {
  return (balances.value || []).reduce((acc: number, b: any) => acc + Number(b.balance || 0), 0)
})

const labels = computed(() => (balances.value || []).map((b: any) => b.symbol || b.module || 'Unknown'))

const backgroundColors = computed(() => {
  const base = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f472b6', '#22c55e', '#eab308', '#a3e635'
  ]
  return (balances.value || []).map((_: any, i: number) => base[i % base.length])
})

const dataValues = computed(() => (balances.value || []).map((b: any) => Number(b.balance || 0)))

const chartData = computed(() => ({
  labels: labels.value,
  datasets: [
    {
      data: dataValues.value,
      backgroundColor: backgroundColors.value,
      borderColor: '#111111',
      borderWidth: 2,
      hoverOffset: 6,
    }
  ]
}))

const externalTooltipHandler = (context: any) => {
  const { chart, tooltip } = context
  let tooltipEl = chart.canvas.parentNode.querySelector('div.chart-tooltip') as HTMLElement | null

  if (!tooltipEl) {
    tooltipEl = document.createElement('div')
    tooltipEl.className = 'chart-tooltip'
    tooltipEl.style.opacity = '0'
    tooltipEl.style.position = 'absolute'
    tooltipEl.style.pointerEvents = 'none'
    tooltipEl.style.background = '#111111'
    tooltipEl.style.border = '1px solid #333333'
    tooltipEl.style.borderRadius = '8px'
    tooltipEl.style.padding = '8px 10px'
    tooltipEl.style.color = '#fafafa'
    tooltipEl.style.fontSize = '12px'
    tooltipEl.style.zIndex = '50'
    chart.canvas.parentNode.appendChild(tooltipEl)
  }

  if (tooltip.opacity === 0) {
    tooltipEl.style.opacity = '0'
    return
  }

  if (tooltip.body) {
    const index = tooltip.dataPoints[0].dataIndex
    const label = labels.value[index]
    const value = dataValues.value[index]
    const pct = totalBalance.value > 0 ? ((value / totalBalance.value) * 100).toFixed(2) : '0.00'
    tooltipEl.innerHTML = `<div class="flex items-center gap-2">
      <div class="w-2.5 h-2.5 rounded-full" style="background:${backgroundColors.value[index]}"></div>
      <div class="font-medium">${label}</div>
    </div>
    <div class="text-[#bbbbbb] mt-1">Quantity: ${value}</div>
    <div class="text-[#bbbbbb]">Share: ${pct}%</div>`
  }

  const { offsetLeft: positionX, offsetTop: positionY } = chart.canvas
  tooltipEl.style.opacity = '1'
  tooltipEl.style.left = positionX + tooltip.caretX + 10 + 'px'
  tooltipEl.style.top = positionY + tooltip.caretY + 10 + 'px'
}

const chartOptions = reactive({
  maintainAspectRatio: false,
  responsive: true,
  plugins: {
    legend: { display: false },
    tooltip: {
      enabled: false,
      external: externalTooltipHandler,
    },
  },
  cutout: '55%',
}) as any
</script>

<template>
  <div class="w-full h-72 md:h-[22rem] relative">
    <Doughnut :data="chartData" :options="chartOptions" />
    <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div class="text-center">
        <div class="text-[12px] text-[#bbbbbb]">Total</div>
        <div class="text-[16px] text-white font-semibold">{{ totalBalance.toLocaleString() }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chart-tooltip { box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
</style>


