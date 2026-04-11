import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
  LineController,
  BarController,
  DoughnutController,
  PieController
} from 'chart.js'

// Registrar TODOS os componentes necessários
ChartJS.register(
  // Controllers
  LineController,
  BarController,
  DoughnutController,
  PieController,
  
  // Scales
  CategoryScale,
  LinearScale,
  
  // Elements
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  
  // Plugins
  Title,
  Tooltip,
  Legend,
  Filler
)

// Configuração padrão
ChartJS.defaults.font.family = 'Inter, system-ui, sans-serif'
ChartJS.defaults.maintainAspectRatio = false
ChartJS.defaults.responsive = true

export default ChartJS