<script setup lang="ts">
import { Doughnut } from 'vue-chartjs'
import { useAccountBalances } from '~/composables/useAccountBalances'
import { staticTokens } from '~/constants/tokens'

const { balances } = useAccountBalances()

// Fixed chart size (same on desktop and mobile) to keep the donut perfectly round
// Slightly reduced to give more space to the legend
const chartSize = 260
const chartSizePx = `${chartSize}px`

// Chain context from URL: null => All chains, otherwise specific chain id
const route = useRoute()
const chainFromQuery = computed(() => {
  const q = route.query.chain as string | undefined
  const n = q !== undefined ? parseInt(q, 10) : undefined
  return n !== undefined && !Number.isNaN(n) && n >= 0 && n <= 19 ? `${n}` : null
})
const isAllChains = computed(() => chainFromQuery.value === null)

// Map module -> human readable token name (prefer staticTokens)
const nameForModule = (module: string) => {
  const token = staticTokens.find(t => t.module === module)
  const parts = (module || '').split('.')
  const fallback = (parts[1] || parts[0] || 'UNKNOWN')
  const label = token?.name || fallback
  return label.toUpperCase()
}

// Palette: 8 harmonious colors tuned for dark backgrounds
// Order follows the color wheel for smooth visual balance
const PALETTE = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6']
const OTHERS_COLOR = '#4b5563'

// Group balances by module (specific chain when viewing All chains), sort by amount desc
const groupedByAsset = computed(() => {
  const map = new Map<string, { module: string; label: string; amount: number }>()
  for (const b of (balances.value || [])) {
    const amount = Number(b?.balance || 0)
    if (!amount || amount <= 0) continue
    const baseModule = b.module || 'unknown'
    const key = isAllChains.value ? `${baseModule}|${b.chainId}` : baseModule
    const label = isAllChains.value ? `${nameForModule(baseModule)} (c${b.chainId})` : nameForModule(baseModule)
    const prev = map.get(key)
    if (prev) {
      prev.amount += amount
    } else {
      map.set(key, { module: key, label, amount })
    }
  }
  return Array.from(map.values()).sort((a, b) => b.amount - a.amount)
})

// Total based on amounts for now
// NOTE: In the future, switch to USD value once pricing is available
const totalBalance = computed(() => groupedByAsset.value.reduce((acc, i) => acc + Number(i.amount || 0), 0))

// Top 8 slices + aggregate others
const slices = computed(() => {
  const SLICE_CAP = 8
  const top = groupedByAsset.value.slice(0, SLICE_CAP)
  if (groupedByAsset.value.length <= SLICE_CAP) return top
  const othersAmount = groupedByAsset.value.slice(SLICE_CAP).reduce((a, i) => a + i.amount, 0)
  return [...top, { module: 'others', label: 'OTHERS', amount: othersAmount }]
})

const labels = computed(() => slices.value.map(s => s.label))
const dataValues = computed(() => slices.value.map(s => s.amount))
const backgroundColors = computed(() => slices.value.map((s, i) => (s.module === 'others' ? OTHERS_COLOR : PALETTE[i % PALETTE.length])))

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
    // Percentage based on amount for now. Change to USD later when prices are available.
    const pct = totalBalance.value > 0 ? ((value / totalBalance.value) * 100).toFixed(4) : '0.0000'
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
  // Keep a fixed width/height for a perfect circle regardless of container size
  responsive: false,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      enabled: false,
      external: externalTooltipHandler,
    },
  },
  layout: { padding: 0 },
  cutout: '55%',
}) as any
</script>

<template>
  <div class="w-full">
    <template v-if="totalBalance > 0">
      <div class="grid grid-cols-1 md:flex md:items-center">
        <!-- Left: Chart (60%) -->
        <div class="md:basis-6/12 md:shrink-0 flex justify-center md:justify-start">
          <div class="relative overflow-hidden" :style="{ width: chartSizePx, height: chartSizePx }">
            <Doughnut
              :data="chartData"
              :options="chartOptions"
              :width="chartSize"
              :height="chartSize"
              :style="{ width: chartSizePx, height: chartSizePx }"
            />
            <div class="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
              <div class="text-center">
                <div class="text-[12px] text-[#bbbbbb]">Total</div>
                <div class="text-[16px] text-white font-semibold">{{ totalBalance.toLocaleString() }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Legend (30-40%), vertically centered, closer to chart -->
        <div class="md:basis-6/12 flex flex-col justify-center">
          <div class="space-y-3 max-h-72 overflow-auto pl-4">
            <div v-for="(s, idx) in slices" :key="idx" class="flex items-center justify-between">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-3 h-3 rounded-full" :style="{ background: (s.module === 'others' ? '#4b5563' : backgroundColors[idx]) }"></div>
                <div class="truncate text-[#fafafa] text-[12px]">
                  <span class="text-[#bbbbbb] mr-1">{{ ((s.amount / (totalBalance || 1)) * 100).toFixed(4) }}%</span>
                  <span class="uppercase">{{ s.label }}</span>
                </div>
              </div>
              <div class="text-[#fafafa] text-[12px] font-medium">{{ new Intl.NumberFormat('en-US', { maximumFractionDigits: 12 }).format(s.amount) }}</div>
            </div>
          </div>
        </div>
      </div>
    </template>
    <div v-else class="py-12 text-center text-[#fafafa] text-lg font-medium">No assets to be displayed.</div>
  </div>
</template>

<style scoped>
.chart-tooltip { box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
</style>


