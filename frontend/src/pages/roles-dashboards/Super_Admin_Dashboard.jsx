import { useNavigate } from 'react-router-dom'
import Header from '../../components/layout/Header'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { useAuth } from '../../context/AuthContext'
import WelcomeVerset from '../../components/ui/WelcomeVerset'
import { sanctionService } from '../../services/sanctionService'
import { cotisationService } from '../../services/cotisationService'
import { caisseService } from '../../services/caisseService'
import { MOIS_FR } from '../../utils/constants'
import { formatDate } from '../../utils/dateUtils'
import ChapeletPage from '../chapelet/ChapeletPage'
<button
  onClick={() => navigate('/rapport')}
  className="w-full py-3.5 px-4 bg-slate-700 text-white text-sm font-bold rounded-2xl shadow-sm hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
>
   Consulter le rapport global
</button>