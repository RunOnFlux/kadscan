import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Filler,
  Tooltip,
  Legend
} from 'chart.js'
import gradient from 'chartjs-plugin-gradient';

export default defineNuxtPlugin(() => {
  Chart.register(
    gradient,
    CategoryScale,
    Filler,
    LinearScale,
    Title,
    Tooltip,
    Legend,
    PointElement,
    LineElement,
    ArcElement,
  )
})
