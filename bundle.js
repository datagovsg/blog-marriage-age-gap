const {
  DatagovsgGroupedBar,
  DatagovsgHorizontalBar,
  DatagovsgLine,
  helpers: chartHelpers
} = DatagovsgCharts
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

const ageGroupData = [{
  bride: 'Brides Aged 20-24 Years',
  groom: 'Grooms Aged Under 20 Years',
  count: 11
}, {
  bride: 'Brides Aged 20-24 Years',
  groom: 'Grooms Aged 20-24 Years',
  count: 545
}, {
  bride: 'Brides Aged 20-24 Years',
  groom: 'Grooms Aged 25-29 Years',
  count: 1095
}, {
  bride: 'Brides Aged 20-24 Years',
  groom: 'Grooms Aged 30-34 Years',
  count: 414
}, {
  bride: 'Brides Aged 25-29 Years',
  groom: 'Grooms Aged 20-24 Years',
  count: 274
}, {
  bride: 'Brides Aged 25-29 Years',
  groom: 'Grooms Aged 25-29 Years',
  count: 5232
}, {
  bride: 'Brides Aged 25-29 Years',
  groom: 'Grooms Aged 30-34 Years',
  count: 3494
}, {
  bride: 'Brides Aged 25-29 Years',
  groom: 'Grooms Aged 35-39 Years',
  count: 764
}, {
  bride: 'Brides Aged 30-34 Years',
  groom: 'Grooms Aged 25-29 Years',
  count: 701
}, {
  bride: 'Brides Aged 30-34 Years',
  groom: 'Grooms Aged 30-34 Years',
  count: 2854
}, {
  bride: 'Brides Aged 30-34 Years',
  groom: 'Grooms Aged 35-39 Years',
  count: 1350
}, {
  bride: 'Brides Aged 30-34 Years',
  groom: 'Grooms Aged 40-44 Years',
  count: 544
}]

plotAgeGroup(ageGroupData)

function plotAgeDifference (data) {
  const pivotTable = new PivotTable(data)
  pivotTable.push(groupItems('year'))
  pivotTable.push(groupItems('level_1'))
  pivotTable.push(filterGroups('level_1', {type: 'exclude', values: ['Total']}))
  pivotTable.push(aggregate('year', 'value'))
  pivotTable.push(filterItems(d => !isNaN(d.ageDifference)))
  pivotTable.push(aggregate('ageDifference', 'value'))

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
  chart.mount(document.querySelector('#age-difference #chart'))

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
    legendPosition: 'b'
  })
  chart.yAxis.formatter(Plottable.Formatters.currency(0, '$'))
  chart.mount(document.querySelector('#income #chart'))
}

function plotAgeGroup (data) {
  const pivotTable = new PivotTable(data)
  pivotTable.push(groupItems('bride'))
  pivotTable.push(aggregate('groom', 'count'))

  const processed = pivotTable.transform()

  const colorRange = ['lightgrey', 'grey', 'lightgrey', 'lightgrey']

  processed.forEach((g, i) => {
    const yLabel = g._group.bride
    const data = g._summaries[0].series

    const chart = new DatagovsgHorizontalBar({
      data,
      yLabel,
      colorScale: getColorScale().range(colorRange),
      sorted: false
    })
    chart.yAxis.margin(30)
    chart.mount(document.querySelector('#age-group #chart.panel-' + i))
  })
}
