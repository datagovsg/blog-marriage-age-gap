const {
  DatagovsgGroupedBar,
  DatagovsgHorizontalBar,
  DatagovsgLine,
  plugins: chartPlugins,
  helpers: chartHelpers
} = DatagovsgCharts
const {highlightOnHover} = chartPlugins
const {getScale, getColorScale} = chartHelpers
const {filterItems, filterGroups, groupItems, aggregate} = PivotTable

const ageDifference = {
  'Groom Younger By 4 Years': -4,
  'Groom Younger By 3 Years': -3,
  'Groom Younger By 2 Years': -2,
  'Groom Younger By 1 Year': -1,
  'Same Age': 0,
  'Groom Older By 1 Year': 1,
  'Groom Older By 2 Years': 2,
  'Groom Older By 3 Years': 3,
  'Groom Older By 4 Years': 4,
  'Groom Older By 5 Years': 5,
  'Groom Older By 6 Years': 6,
  'Groom Older By 7 Years': 7,
  'Groom Older By 8 Years': 8,
  'Groom Older By 9 Years': 9,
  'Groom Older By 10 Years': 10,
  'Groom Older By 11 Years': 11,
  'Groom Older By 12 Years': 12
}

Papa.parse('data.csv', {
  download: true,
  header: true,
  complete (results) {
    results.data.forEach(d => {
      d.ageDifference = ageDifference[d.level_2]
    })
    plotAgeDifference(results.data)
  }
})

const incomeData = [
  {gender: 'Male', age: '15 - 19', median_income: 800},
  {gender: 'Male', age: '20 - 24', median_income: 2000},
  {gender: 'Male', age: '25 - 29', median_income: 3250},
  {gender: 'Male', age: '30 - 34', median_income: 4333},
  {gender: 'Male', age: '35 - 39', median_income: 5377},
  {gender: 'Male', age: '40 - 44', median_income: 5417},
  {gender: 'Male', age: '45 - 49', median_income: 5000},
  {gender: 'Male', age: '50 - 54', median_income: 3500},
  {gender: 'Male', age: '55 - 59', median_income: 3000},
  {gender: 'Male', age: '60 & above', median_income: 2167},
  {gender: 'Female', age: '15 - 19', median_income: 1200},
  {gender: 'Female', age: '20 - 24', median_income: 2167},
  {gender: 'Female', age: '25 - 29', median_income: 3375},
  {gender: 'Female', age: '30 - 34', median_income: 4236},
  {gender: 'Female', age: '35 - 39', median_income: 4375},
  {gender: 'Female', age: '40 - 44', median_income: 4286},
  {gender: 'Female', age: '45 - 49', median_income: 3500},
  {gender: 'Female', age: '50 - 54', median_income: 3033},
  {gender: 'Female', age: '55 - 59', median_income: 2383},
  {gender: 'Female', age: '60 & above', median_income: 1640}
]

plotIncome(incomeData)

window.fetch('data.json').then(res => res.json()).then(plotAgeGroup)

function plotAgeDifference (data) {
  const pivotTable = new PivotTable(data)
  pivotTable.push(
    groupItems('year'),
    groupItems('level_1'),
    filterGroups('level_1', {type: 'exclude', values: ['Total']}),
    aggregate('year', 'value'),
    filterItems(d => !isNaN(d.ageDifference)),
    aggregate('ageDifference', 'value')
  )

  const processed = pivotTable.transform()

  processed.forEach(g => {
    g._summaries[1].series.sort((a, b) => a.label - b.label)
    g._summaries[1].series.forEach(d => {
      d.value = d.value / g._summaries[0].series[0].value * 100
    })
  })

  const scale = getScale().domain([0, 18])
  const chart = new DatagovsgGroupedBar({
    scale: scale,
    xLabel: 'Age Gap (Years)',
    yLabel: '% Marriages',
    isPercentage: true,
    legendPosition: 'b',
    animated: false
  })
  chart.mount(document.querySelector('#age-difference .chart'))

  function updateChart (year, type) {
    const matches = processed.filter(g => g._group.year === year)
    if (matches) {
      const data = matches.map(g => ({
        label: g._group.level_1,
        series: g._summaries[1].series
      }))
      chart.update({data})
    }
  }

  // const typeControl = document.querySelector('input[name="type"]')
  const yearControl = document.querySelector('input[name="year"]')
  const yearText = document.querySelector('.year-text')

  yearControl.addEventListener('change', event => {
    updateChart(yearControl.value)
    yearText.textContent = yearControl.value
  })

  const playControl = document.querySelector('input[name="play"]')

  let timeoutId, intervalId

  playControl.addEventListener('click', event => {
    if (playControl.value === 'Play') {
      playControl.value = 'Pause'
      initializeTimeLapse()
    } else {
      playControl.value = 'Play'
      clearTimeout(timeoutId)
      clearInterval(intervalId)
    }
  })

  function initializeTimeLapse () {
    yearControl.value = '1994'
    updateChart(yearControl.value)
    yearText.textContent = yearControl.value
    intervalId = setInterval(() => {
      const current = +yearControl.value
      if (current < 2015) {
        yearControl.value = (current + 1).toString()
        updateChart(yearControl.value)
        yearText.textContent = yearControl.value
      } else {
        clearInterval(intervalId)
        timeoutId = setTimeout(initializeTimeLapse, 2000)
      }
    }, 700)
  }

  initializeTimeLapse()
}

function plotIncome (data) {
  const pivotTable = new PivotTable(data)
  pivotTable.push(groupItems('gender'))
  pivotTable.push(aggregate('age', 'median_income'))

  const processed = pivotTable.transform()

  processed.forEach(g => {
    g.label = g._group.gender
    g.series = g._summaries[0].series
  })

  const chart = new DatagovsgLine({
    data: processed,
    xLabel: 'Age',
    yLabel: 'Median income',
    colorScale: getColorScale().range(d3.scale.category10().range()),
    markerSize: 6,
    legendPosition: 'b'
  })
  highlightOnHover(chart)
  chart.yAxis.formatter(Plottable.Formatters.currency(0, '$'))
  chart.mount(document.querySelector('#income .chart'))
}

function plotAgeGroup (data) {
  const pivotTable = new PivotTable(data)
  pivotTable.push(
    groupItems('year'),
    groupItems('bride'),
    aggregate('groom', 'count')
  )

  const processed = pivotTable.transform()

  const colorRange = ['#FF7733', '#C64D26', '#FF7733', '#FF7733']

  processed.filter(g => g._group.year === '2015').forEach((g, i) => {
    const data = g._summaries[0].series
    const yLabel = g._group.bride
    const data1998 = processed.filter(
      g => g._group.year === '1998' && g._group.bride === yLabel
    )[0]._summaries[0].series

    const chart = new DatagovsgHorizontalBar({
      data,
      yLabel,
      xLabel: '2015',
      colorScale: getColorScale().range(colorRange),
      sorted: false
    })

    const chart1998 = new DatagovsgHorizontalBar({
      data: data1998,
      yLabel,
      xLabel: '1998',
      colorScale: getColorScale().range(colorRange),
      sorted: false
    })

    chart.xAxis.showEndTickLabels(false)
    chart1998.xAxis.showEndTickLabels(false)
    chart.layout.add(chart1998.layout.componentAt(0, 2), 0, 3)
    chart.layout.add(chart1998.layout.componentAt(1, 2), 1, 3)
    chart.layout.add(chart1998.layout.componentAt(2, 2), 2, 3)
    chart.layout.columnPadding(15)

    chart.mount(document.querySelector('#age-group .chart.panel-' + i))
  })
}
