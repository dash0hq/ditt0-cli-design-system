// Every stories file, by level, in the gallery's order. A new component adds its stories file here:
// a mod imports only by literal path, so the gallery can't find them by itself
import * as colors from '../../foundations/tokens/tokens.stories.jsx'
import * as colorManager from '../../foundations/color-manager/color-manager.stories.jsx'
import * as units from '../../foundations/units/units.stories.jsx'
import * as text from '../../atoms/text/text.stories.jsx'
import * as badge from '../../atoms/badge/badge.stories.jsx'
import * as button from '../../atoms/button/button.stories.jsx'
import * as link from '../../atoms/link/link.stories.jsx'
import * as box from '../../atoms/box/box.stories.jsx'
import * as switchStories from '../../atoms/switch/switch.stories.jsx'
import * as logo from '../../atoms/logo/logo.stories.jsx'
import * as icon from '../../atoms/icon/icon.stories.jsx'
import * as heading from '../../atoms/heading/heading.stories.jsx'
import * as legend from '../../atoms/legend/legend.stories.jsx'
import * as tag from '../../atoms/tag/tag.stories.jsx'
import * as progress from '../../molecules/progress/progress.stories.jsx'
import * as loader from '../../atoms/loader/loader.stories.jsx'
import * as input from '../../atoms/input/input.stories.jsx'
import * as select from '../../atoms/select/select.stories.jsx'
import * as list from '../../molecules/list/list.stories.jsx'
import * as collapsible from '../../molecules/collapsible/collapsible.stories.jsx'
import * as banner from '../../molecules/banner/banner.stories.jsx'
import * as emptyState from '../../molecules/empty-state/empty-state.stories.jsx'
import * as tabs from '../../molecules/tabs/tabs.stories.jsx'
import * as chartControls from '../../molecules/chart-controls/chart-controls.stories.jsx'
import * as table from '../../molecules/table/table.stories.jsx'
import * as flowDiagram from '../../molecules/flow-diagram/flow-diagram.stories.jsx'
import * as copyButtons from '../../molecules/copy-buttons/copy-buttons.stories.jsx'
import * as barChart from '../../molecules/charts/bar-chart/bar-chart.stories.jsx'
import * as timeseries from '../../molecules/charts/timeseries/timeseries.stories.jsx'
import * as stat from '../../molecules/charts/stat/stat.stories.jsx'
import * as gauge from '../../molecules/charts/gauge/gauge.stories.jsx'
import * as squareChart from '../../molecules/charts/square-chart/square-chart.stories.jsx'
import * as pieChart from '../../molecules/charts/pie-chart/pie-chart.stories.jsx'
import * as heatmap from '../../molecules/charts/heatmap/heatmap.stories.jsx'
import * as ganttChart from '../../molecules/charts/gantt-chart/gantt-chart.stories.jsx'
import * as seriesTable from '../../organisms/series-table/series-table.stories.jsx'
import * as failedChecks from '../../organisms/failed-checks/failed-checks.stories.jsx'
import * as servicesView from '../../organisms/services/services.stories.jsx'
import * as chartCard from '../../organisms/chart-card/chart-card.stories.jsx'
import * as toolResult from '../../templates/tool-result/tool-result.stories.jsx'
import * as pane from '../../templates/pane/pane.stories.jsx'
import * as chartGrid from '../../templates/chart-grid/chart-grid.stories.jsx'
import * as queryResult from '../../pages/dash0-query-result/dash0-query-result.stories.jsx'
import * as overview from '../../pages/dash0-dashboard/dash0-dashboard.stories.jsx'
import * as tracing from '../../pages/dash0-tracing/dash0-tracing.stories.jsx'
import * as helloTabs from '../../pages/hello-tabs/hello-tabs.stories.jsx'
import * as specPage from '../../pages/spec-page/spec-page.stories.jsx'

// Brad Frost's levels. Dash0's Storybook doesn't sort by them yet, so titles stay Dash0's and the level lives here
export const LEVELS = [
    { id: 'foundations', name: 'Foundations', files: [['foundations/tokens', colors], ['foundations/color-manager', colorManager], ['foundations/units', units]] },
    { id: 'atoms', name: 'Atoms', files: [['atoms/text', text], ['atoms/heading', heading], ['atoms/logo', logo], ['atoms/icon', icon], ['atoms/badge', badge], ['atoms/button', button], ['atoms/link', link], ['atoms/switch', switchStories], ['atoms/legend', legend], ['atoms/tag', tag], ['atoms/loader', loader], ['atoms/input', input], ['atoms/select', select], ['atoms/box', box]] },
    // Charts sit together, in molecules/charts: bars and lines are the same kind of part
    { id: 'molecules', name: 'Molecules', files: [['molecules/tabs', tabs], ['molecules/chart-controls', chartControls], ['molecules/table', table], ['molecules/flow-diagram', flowDiagram], ['molecules/copy-buttons', copyButtons], ['molecules/list', list], ['molecules/collapsible', collapsible], ['molecules/banner', banner], ['molecules/empty-state', emptyState], ['molecules/progress', progress], ['molecules/charts/bar-chart', barChart], ['molecules/charts/timeseries', timeseries], ['molecules/charts/stat', stat], ['molecules/charts/gauge', gauge], ['molecules/charts/pie-chart', pieChart], ['molecules/charts/square-chart', squareChart], ['molecules/charts/heatmap', heatmap], ['molecules/charts/gantt-chart', ganttChart]] },
    { id: 'organisms', name: 'Organisms', files: [['organisms/chart-card', chartCard], ['organisms/series-table', seriesTable], ['organisms/failed-checks', failedChecks], ['organisms/services', servicesView]] },
    { id: 'templates', name: 'Templates', files: [['templates/tool-result', toolResult], ['templates/pane', pane], ['templates/chart-grid', chartGrid]] },
    { id: 'pages', name: 'Pages', files: [['pages/dash0-query-result', queryResult], ['pages/dash0-dashboard', overview], ['pages/dash0-tracing', tracing], ['pages/hello-tabs', helloTabs], ['pages/spec-page', specPage]] },
]

// Ids as Storybook makes them: the title lowercased with every run of other characters a dash, then
// two dashes and the export's name in kebab case. Components/Actions/Button's Default is
// components-actions-button--default, the same id the story has in Dash0's Storybook
const titleId = (title) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const kebab = (name) => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()

// One entry per component: its level, title, doc page, and its stories
export const COMPONENTS = LEVELS.flatMap(level => level.files.map(([folder, file]) => {
    const meta = file.default
    return {
        id: titleId(meta.title),
        level: level.id,
        title: meta.title,
        name: meta.title.split('/').pop(),
        meta,
        docs: `components/${folder}/${folder.split('/').pop()}.md`,
        // A module's exports come sorted by name, not in file order: Default first, then the rest by name
        stories: Object.entries(file)
            .filter(([key]) => key !== 'default')
            .sort(([a], [b]) => (b === 'Default') - (a === 'Default'))
            .map(([key, story]) => ({ id: `${titleId(meta.title)}--${kebab(key)}`, name: key, story })),
    }
}))

export const storyById = (id) => {
    for (const component of COMPONENTS) {
        const found = component.stories.find(s => s.id === id)
        if (found) return { component, ...found }
    }
    return null
}
