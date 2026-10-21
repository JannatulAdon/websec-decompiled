import DefaultTheme from 'vitepress/theme'
import Layout from './Layout.vue'
import LabCheckbox from './components/LabCheckbox.vue'
import TopicComplete from './components/TopicComplete.vue'
import ProgressPill from './components/ProgressPill.vue'
import ProgressDashboard from './components/ProgressDashboard.vue'
import LabGroup from './components/LabGroup.vue'
import Term from './components/Term.vue'
import GlossaryExplorer from './components/GlossaryExplorer.vue'
import './styles/custom.css'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component('LabCheckbox', LabCheckbox)
    app.component('TopicComplete', TopicComplete)
    app.component('ProgressPill', ProgressPill)
    app.component('ProgressDashboard', ProgressDashboard)
    app.component('LabGroup', LabGroup)
    app.component('Term', Term)
    app.component('GlossaryExplorer', GlossaryExplorer)
  }
}
