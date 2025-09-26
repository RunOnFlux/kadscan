<script setup lang="ts">
import { Doughnut } from 'vue-chartjs'
import { useAccountBalances } from '~/composables/useAccountBalances'
import { useAssetUsdPrices } from '~/composables/useAssetUsdPrices'
import { staticTokens } from '~/constants/tokens'
import AssetsPieChartSkeleton from '~/components/skeleton/AssetsPieChart.vue'

const { balances, loading, hasFetched } = useAccountBalances()
const { getUsdPerUnit } = useAssetUsdPrices()

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
const PALETTE = ['#ff6b6b', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6']
const OTHERS_COLOR = '#4b5563'

// When a specific chain is selected, only include that chain's balances; otherwise include all.
const filteredBalances = computed(() => {
  const chain = chainFromQuery.value
  const arr = balances.value || []
  return chain === null ? arr : arr.filter((b: any) => `${b.chainId}` === chain)
})

// Group balances by USD value; when All Chains selected, aggregate by module across chains.
const groupedByAsset = computed(() => {
  const map = new Map<string, { module: string; label: string; usd: number }>()
  for (const b of (filteredBalances.value || [])) {
    const amount = Number(b?.balance || 0)
    if (!amount || amount <= 0) continue
    const baseModule = b.module || 'unknown'
    const unitUsd = getUsdPerUnit(baseModule)
    const usd = Number.isFinite(unitUsd) ? unitUsd * amount : 0
    const key = isAllChains.value ? baseModule : `${baseModule}|${b.chainId}`
    const label = isAllChains.value ? nameForModule(baseModule) : `${nameForModule(baseModule)} (c${b.chainId})`
    const prev = map.get(key)
    if (prev) {
      prev.usd += usd
    } else {
      map.set(key, { module: key, label, usd })
    }
  }
  return Array.from(map.values()).sort((a, b) => b.usd - a.usd)
})

// Total USD
const totalBalance = computed(() => groupedByAsset.value.reduce((acc, i) => acc + Number(i.usd || 0), 0))

// Visibility guard: show chart only when total >= $0.01 and there is data
const shouldShowChart = computed(() => groupedByAsset.value.length > 0 && totalBalance.value >= 0.01)

// Top 8 slices + aggregate others
const slices = computed(() => {
  const SLICE_CAP = 8
  const top = groupedByAsset.value.slice(0, SLICE_CAP)
  if (groupedByAsset.value.length <= SLICE_CAP) return top
  const othersAmount = groupedByAsset.value.slice(SLICE_CAP).reduce((a, i) => a + i.usd, 0)
  return [...top, { module: 'others', label: 'OTHERS', usd: othersAmount }]
})

const labels = computed(() => slices.value.map(s => s.label))
const dataValues = computed(() => slices.value.map(s => s.usd))
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

// Detect when the legend's label text overflows its container so we can
// move the numeric amount to the next row on narrow widths.
const labelRefs = ref<Array<HTMLElement | null>>([])
const shouldWrapAmount = ref<boolean[]>([])

const setLabelRef = (el: HTMLElement | null, index: number) => {
  labelRefs.value[index] = el
}

const measureWraps = () => {
  shouldWrapAmount.value = labelRefs.value.map((el) => {
    if (!el) return false
    return el.scrollWidth > el.clientWidth
  })
}

onMounted(() => {
  nextTick(() => measureWraps())
  window.addEventListener('resize', measureWraps)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', measureWraps)
})

watch(slices, async () => {
  await nextTick()
  measureWraps()
})

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
    tooltipEl.style.color = '#f5f5f5'
    tooltipEl.style.fontSize = '12px'
    tooltipEl.style.whiteSpace = 'normal'
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
    tooltipEl.innerHTML = `<div class=\"flex items-center gap-2\" style=\"white-space:nowrap\">\n      <div class=\"w-2.5 h-2.5 rounded-full\" style=\"background:${backgroundColors.value[index]}\"></div>\n      <div class=\"font-medium uppercase\">${label}</div>\n    </div>\n    <div class=\"text-font-secondary mt-1\" style=\"white-space:nowrap\">USD: $${Number(value).toFixed(2)}</div>\n    <div class=\"text-font-secondary\" style=\"white-space:nowrap\">Share: ${pct}%</div>`
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
    <template v-if="!hasFetched || loading">
      <AssetsPieChartSkeleton />
    </template>
    <template v-else-if="shouldShowChart">
      <div class="grid grid-cols-1 md:flex md:items-center">
        <!-- Left: Chart (60%) -->
        <div class="md:basis-6/12 md:shrink-0 flex justify-center md:justify-start">
          <div class="relative overflow-visible" :style="{ width: chartSizePx, height: chartSizePx }">
            <Doughnut
              :data="chartData"
              :options="chartOptions"
              :width="chartSize"
              :height="chartSize"
              :style="{ width: chartSizePx, height: chartSizePx }"
            />
            <div class="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
              <div class="text-center">
                <div class="text-[12px] text-font-secondary">Total</div>
                <div class="text-[16px] text-white font-semibold">${{ Number(totalBalance).toFixed(2) }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Legend (30-40%), vertically centered, closer to chart -->
        <div class="md:basis-6/12 flex flex-col justify-center md:pt-0 pt-6">
          <div class="space-y-3 max-h-72 overflow-auto pl-4">
            <div v-for="(s, idx) in slices" :key="idx" class="flex items-center justify-between flex-wrap">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-3 h-3 rounded-full" :style="{ background: (s.module === 'others' ? '#4b5563' : backgroundColors[idx]) }"></div>
                <div class="truncate text-font-primary text-[12px]" :ref="el => setLabelRef(el as HTMLElement | null, idx)">
                  <span class="text-font-secondary mr-1">{{ ((s.usd / (totalBalance || 1)) * 100).toFixed(2) }}%</span>
                  <span class="uppercase">{{ s.label }}</span>
                </div>
              </div>
              <div class="text-font-primary text-[12px] font-medium" :class="{ 'basis-full mt-1 text-right': shouldWrapAmount[idx] }">${{ Number(s.usd).toFixed(2) }}</div>
            </div>
          </div>
        </div>
      </div>
    </template>
    <div v-else class="py-12 text-center text-font-secondary text-sm">No tokens breakdown to be displayed.</div>
  </div>
</template>

<style scoped>
.chart-tooltip { box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
</style>


