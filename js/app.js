/**
 * app.js — RunwayCalc Core Calculator Logic (v2)
 * ================================================
 * Features: currency formatting, real-time runway calc,
 * SVG circular gauge, Chart.js depletion chart, scenario
 * analysis, fundraising planner, team cost calculator,
 * share link, CSV export, and reset.
 */
document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  // ── CURRENCY CONFIG ──
  var CURRENCIES = {
    USD: { symbol: '$', locale: 'en-US', code: 'USD' },
    EUR: { symbol: '€', locale: 'de-DE', code: 'EUR' },
    GBP: { symbol: '£', locale: 'en-GB', code: 'GBP' },
    INR: { symbol: '₹', locale: 'en-IN', code: 'INR' },
    JPY: { symbol: '¥', locale: 'ja-JP', code: 'JPY' },
    CAD: { symbol: 'C$', locale: 'en-CA', code: 'CAD' },
    AUD: { symbol: 'A$', locale: 'en-AU', code: 'AUD' },
  };
  var activeCurrency = CURRENCIES[document.getElementById('currencySelect').value] || CURRENCIES.INR;

  // ── DOM REFS ──
  var inputCash = document.getElementById('inputCash');
  var inputBurn = document.getElementById('inputBurn');
  var inputRevenue = document.getElementById('inputRevenue');
  var currencySelect = document.getElementById('currencySelect');
  var symbolCash = document.getElementById('symbolCash');
  var symbolBurn = document.getElementById('symbolBurn');
  var symbolRevenue = document.getElementById('symbolRevenue');
  var runwayHero = document.getElementById('runwayHero');
  var emptyHint = document.getElementById('emptyHint');
  var runwayDisplay = document.getElementById('runwayDisplay');
  var runwayStatus = document.getElementById('runwayStatus');
  var statusText = document.getElementById('statusText');
  var runwayNumber = document.getElementById('runwayNumber');
  var runwayUnit = document.getElementById('runwayUnit');
  var runwaySubtext = document.getElementById('runwaySubtext');
  var runwayProgressFill = document.getElementById('runwayProgressFill');
  var gaugeFill = document.getElementById('gaugeFill');
  var metricsGrid = document.getElementById('metricsGrid');
  var chartSection = document.getElementById('chartSection');
  var scenarioSection = document.getElementById('scenarioSection');
  var fundraiseSection = document.getElementById('fundraiseSection');
  var exportBar = document.getElementById('exportBar');
  var toast = document.getElementById('toast');
  var toastText = document.getElementById('toastText');
  var depletionChart = null;
  var GAUGE_CIRCUMFERENCE = 2 * Math.PI * 88; // ~553

  // ── UTILITY FUNCTIONS ──
  function formatCurrency(value, compact) {
    if (value === null || value === undefined || isNaN(value)) return '—';
    var options = { style: 'currency', currency: activeCurrency.code, minimumFractionDigits: 0, maximumFractionDigits: compact ? 1 : 0 };
    if (compact && Math.abs(value) >= 1000) { options.notation = 'compact'; options.compactDisplay = 'short'; }
    try { return new Intl.NumberFormat(activeCurrency.locale, options).format(value); }
    catch (e) { return activeCurrency.symbol + value.toLocaleString(); }
  }

  function formatInputDisplay(raw) {
    if (!raw) return '';
    var num = parseInt(raw, 10);
    return isNaN(num) ? '' : num.toLocaleString(activeCurrency.locale);
  }

  function stripNonDigits(str) { return str.replace(/[^\d]/g, ''); }
  function parseInputValue(str) { var d = stripNonDigits(str); return d ? parseInt(d, 10) : 0; }

  // ── CURRENCY INPUT FORMATTING ──
  function setupCurrencyInput(input) {
    input.addEventListener('input', function () {
      var raw = stripNonDigits(this.value);
      var cursorFromEnd = this.value.length - this.selectionStart;
      var formatted = formatInputDisplay(raw);
      this.value = formatted;
      var newPos = Math.max(0, formatted.length - cursorFromEnd);
      this.setSelectionRange(newPos, newPos);
      calculate();
    });
    input.addEventListener('focus', function () { var inp = this; setTimeout(function () { inp.select(); }, 0); });
  }
  setupCurrencyInput(inputCash);
  setupCurrencyInput(inputBurn);
  setupCurrencyInput(inputRevenue);

  // ── CURRENCY SELECTOR ──
  currencySelect.addEventListener('change', function () {
    activeCurrency = CURRENCIES[this.value] || CURRENCIES.INR;
    updateCurrencySymbols();
    calculate();
    updateTeamTotal();
  });

  function updateCurrencySymbols() {
    symbolCash.textContent = activeCurrency.symbol;
    symbolBurn.textContent = activeCurrency.symbol;
    symbolRevenue.textContent = activeCurrency.symbol;
  }

  // ── STATE CLASSIFICATION ──
  function classifyRunway(months, isInfinite) {
    if (isInfinite) return 'infinite';
    if (months >= 12) return 'safe';
    if (months >= 6) return 'caution';
    return 'danger';
  }

  function getStatusLabel(state) {
    return { safe: '✅ Safe Zone', caution: '⚠️ Caution', danger: '🚨 Danger Zone', infinite: '🚀 Sustainable' }[state] || '';
  }

  function getSubtext(state) {
    return { safe: 'You have a healthy runway. Keep building!', caution: 'Time to start planning your next fundraise.', danger: 'Urgent: act now to extend your runway!', infinite: "Your revenue covers your burn. You're sustainable! 🎉" }[state] || 'of runway remaining';
  }

  // ── MAIN CALCULATION ──
  function calculate() {
    var cash = parseInputValue(inputCash.value);
    var burn = parseInputValue(inputBurn.value);
    var revenue = parseInputValue(inputRevenue.value);
    if (cash === 0 && burn === 0) { showEmptyState(); return; }
    var netBurn = burn - revenue;
    var isInfinite = netBurn <= 0 && cash > 0;
    var months = isInfinite ? Infinity : (netBurn > 0 ? cash / netBurn : 0);
    var state = classifyRunway(months, isInfinite);
    showResults(months, state, cash, netBurn, burn, revenue, isInfinite);
  }

  // ── DISPLAY ──
  function showEmptyState() {
    emptyHint.style.display = '';
    runwayDisplay.style.display = 'none';
    runwayHero.setAttribute('data-state', 'empty');
    metricsGrid.style.display = 'none';
    chartSection.style.display = 'none';
    scenarioSection.style.display = 'none';
    fundraiseSection.style.display = 'none';
    exportBar.style.display = 'none';
    if (depletionChart) { depletionChart.destroy(); depletionChart = null; }
  }

  function showResults(months, state, cash, netBurn, grossBurn, revenue, isInfinite) {
    emptyHint.style.display = 'none';
    runwayDisplay.style.display = '';
    metricsGrid.style.display = '';
    chartSection.style.display = '';
    scenarioSection.style.display = '';
    fundraiseSection.style.display = '';
    exportBar.style.display = '';

    // Hero state
    runwayHero.setAttribute('data-state', state);
    runwayStatus.setAttribute('data-state', state);
    statusText.textContent = getStatusLabel(state);
    runwayNumber.setAttribute('data-state', state);
    runwaySubtext.textContent = getSubtext(state);

    if (isInfinite) {
      runwayNumber.textContent = '∞';
      runwayUnit.textContent = '';
    } else {
      var display = months >= 100 ? Math.round(months) : parseFloat(months.toFixed(1));
      animateNumber(runwayNumber, display);
      runwayUnit.textContent = display === 1 ? 'month' : 'months';
    }

    // SVG Circular Gauge
    updateGauge(months, state, isInfinite);

    // Progress bar
    var pct = isInfinite ? 100 : Math.min((months / 18) * 100, 100);
    runwayProgressFill.style.width = pct + '%';
    runwayProgressFill.setAttribute('data-state', state);

    updateMetrics(months, cash, netBurn, grossBurn, revenue, isInfinite);
    updateChart(cash, netBurn, months, isInfinite);
    updateScenarios(cash, grossBurn, revenue);
    updateFundraising(cash, netBurn);
  }

  // ── SVG GAUGE UPDATE ──
  function updateGauge(months, state, isInfinite) {
    if (!gaugeFill) return;
    var pct = isInfinite ? 1 : Math.min(months / 24, 1);
    var offset = GAUGE_CIRCUMFERENCE * (1 - pct);
    gaugeFill.style.strokeDashoffset = offset;
    var gradientId = { safe: 'gaugeSafe', caution: 'gaugeCaution', danger: 'gaugeDanger', infinite: 'gaugeInfinite' }[state] || 'gaugeSafe';
    gaugeFill.setAttribute('stroke', 'url(#' + gradientId + ')');
  }

  // ── ANIMATED NUMBER ──
  var animFrame = null;
  function animateNumber(el, target) {
    if (animFrame) cancelAnimationFrame(animFrame);
    var start = parseFloat(el.textContent.replace(/[^\d.]/g, '')) || 0;
    var dur = 600, t0 = performance.now();
    var decimal = target % 1 !== 0;
    function tick(now) {
      var p = Math.min((now - t0) / dur, 1);
      var e = 1 - Math.pow(1 - p, 3);
      var v = start + (target - start) * e;
      el.textContent = decimal ? v.toFixed(1) : Math.round(v);
      if (p < 1) animFrame = requestAnimationFrame(tick);
    }
    animFrame = requestAnimationFrame(tick);
  }

  // ── METRICS ──
  function updateMetrics(months, cash, netBurn, grossBurn, revenue, isInfinite) {
    var totalDays = isInfinite ? Infinity : months * 30.44;
    document.getElementById('metricDays').textContent = isInfinite ? '∞' : Math.round(totalDays).toLocaleString();
    document.getElementById('metricDaysSub').textContent = isInfinite ? 'Sustainable' : (totalDays < 30 ? '⚠️ Less than a month!' : '');
    document.getElementById('metricDailyBurn').textContent = formatCurrency(Math.round(netBurn / 30.44));
    document.getElementById('metricWeeklyBurn').textContent = formatCurrency(Math.round(netBurn / 4.33));
    if (isInfinite) {
      document.getElementById('metricEndDate').textContent = 'Never';
      document.getElementById('metricEndDateSub').textContent = 'Revenue sustains operations';
    } else {
      var end = new Date(); end.setDate(end.getDate() + Math.round(totalDays));
      document.getElementById('metricEndDate').textContent = end.toLocaleDateString(activeCurrency.locale, { month: 'short', year: 'numeric' });
      document.getElementById('metricEndDateSub').textContent = end.toLocaleDateString(activeCurrency.locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }
    document.getElementById('metricNetBurn').textContent = formatCurrency(netBurn);
  }

  // ── CHART ──
  function updateChart(cash, netBurn, months, isInfinite) {
    var canvas = document.getElementById('depletionChart');
    if (!canvas) return;
    var maxM = isInfinite ? 24 : Math.min(Math.ceil(months) + 3, 60);
    var labels = [], data = [], bal = cash;
    for (var i = 0; i <= maxM; i++) { labels.push('M' + i); data.push(Math.max(bal, 0)); bal -= netBurn; }
    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    var ctx = canvas.getContext('2d');
    var grad = ctx.createLinearGradient(0, 0, 0, 320);
    grad.addColorStop(0, 'rgba(99,102,241,0.25)'); grad.addColorStop(1, 'rgba(99,102,241,0.02)');
    var chartData = { labels: labels, datasets: [{ label: 'Cash Balance', data: data, fill: true, backgroundColor: grad, borderColor: '#6366f1', borderWidth: 2.5, pointRadius: 0, pointHoverRadius: 6, pointHoverBackgroundColor: '#6366f1', pointHoverBorderColor: '#fff', pointHoverBorderWidth: 2, tension: 0.3 }] };
    var gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    var txtColor = '#7c82a5';
    var opts = { responsive: true, maintainAspectRatio: false, interaction: { intersect: false, mode: 'index' },
      plugins: { legend: { display: false }, tooltip: { backgroundColor: isDark ? '#222639' : '#fff', titleColor: isDark ? '#eef0f6' : '#1a1d2e', bodyColor: isDark ? '#b0b5d0' : '#4b5072', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', borderWidth: 1, cornerRadius: 10, padding: 12, displayColors: false, callbacks: { title: function (i) { return 'Month ' + i[0].label.replace('M', ''); }, label: function (c) { return 'Balance: ' + formatCurrency(c.parsed.y); } } } },
      scales: { x: { grid: { color: gridColor, drawBorder: false }, ticks: { color: txtColor, font: { family: 'Inter', size: 11 }, maxTicksLimit: 12 } }, y: { grid: { color: gridColor, drawBorder: false }, ticks: { color: txtColor, font: { family: 'Inter', size: 11 }, callback: function (v) { return formatCurrency(v, true); } }, beginAtZero: true } } };
    if (depletionChart) { depletionChart.data = chartData; depletionChart.options = opts; depletionChart.update('none'); }
    else { depletionChart = new Chart(ctx, { type: 'line', data: chartData, options: opts }); }
  }

  // ── SCENARIOS ──
  function updateScenarios(cash, grossBurn, revenue) {
    var scenarios = [
      { factor: 0.8, el: document.getElementById('scenarioBestMonths'), detEl: document.getElementById('scenarioBestDetail') },
      { factor: 1.0, el: document.getElementById('scenarioBaseMonths'), detEl: document.getElementById('scenarioBaseDetail') },
      { factor: 1.2, el: document.getElementById('scenarioWorstMonths'), detEl: document.getElementById('scenarioWorstDetail') },
    ];
    scenarios.forEach(function (s) {
      var adj = grossBurn * s.factor, net = adj - revenue;
      var inf = net <= 0 && cash > 0, mo = inf ? Infinity : (net > 0 ? cash / net : 0);
      s.el.textContent = inf ? '∞' : (mo >= 100 ? Math.round(mo) : parseFloat(mo.toFixed(1)));
      s.detEl.innerHTML = 'Monthly burn: <span>' + formatCurrency(Math.round(adj)) + '</span><br/>Net burn: <span>' + formatCurrency(Math.round(net)) + '</span>';
    });
  }

  // ── FUNDRAISING PLANNER ──
  var targetSlider = document.getElementById('targetRunway');
  var targetValue = document.getElementById('targetRunwayValue');

  if (targetSlider) {
    targetSlider.addEventListener('input', function () {
      targetValue.textContent = this.value;
      var cash = parseInputValue(inputCash.value);
      var burn = parseInputValue(inputBurn.value);
      var revenue = parseInputValue(inputRevenue.value);
      var netBurn = burn - revenue;
      updateFundraising(cash, netBurn);
    });
  }

  function updateFundraising(cash, netBurn) {
    var target = parseInt(targetSlider.value, 10);
    document.getElementById('fbMonths').textContent = target;
    var cashNeeded = netBurn * target;
    var gap = Math.max(cashNeeded - cash, 0);
    document.getElementById('fundraiseAmount').textContent = netBurn <= 0 ? 'You\'re profitable! 🎉' : formatCurrency(gap);
    document.getElementById('fundraiseSub').textContent = netBurn <= 0 ? 'No fundraise needed' : 'to reach ' + target + ' months of runway';
    document.getElementById('fbCurrentCash').textContent = formatCurrency(cash);
    document.getElementById('fbCashNeeded').textContent = formatCurrency(cashNeeded);
    document.getElementById('fbGap').textContent = formatCurrency(gap);
  }

  // ── TEAM COST CALCULATOR ──
  var teamBody = document.getElementById('teamTableBody');
  var btnAdd = document.getElementById('btnAddMember');
  var btnApply = document.getElementById('btnApplyBurn');
  var teamTotalEl = document.getElementById('teamTotalCost');
  var teamRowId = 0;

  function addTeamRow(role, salary) {
    teamRowId++;
    var tr = document.createElement('tr');
    tr.setAttribute('data-row-id', teamRowId);
    tr.innerHTML = '<td><input type="text" placeholder="e.g. Developer" value="' + (role || '') + '" class="team-role-input" /></td>'
      + '<td><input type="text" placeholder="e.g. 50,000" inputmode="numeric" value="' + (salary || '') + '" class="team-salary-input" /></td>'
      + '<td><button class="btn-remove-member" title="Remove">✕</button></td>';
    teamBody.appendChild(tr);

    // Format salary input
    var salaryInput = tr.querySelector('.team-salary-input');
    salaryInput.addEventListener('input', function () {
      var raw = stripNonDigits(this.value);
      this.value = formatInputDisplay(raw);
      updateTeamTotal();
    });

    tr.querySelector('.btn-remove-member').addEventListener('click', function () {
      tr.remove();
      updateTeamTotal();
    });
  }

  function updateTeamTotal() {
    var total = 0;
    teamBody.querySelectorAll('.team-salary-input').forEach(function (inp) {
      total += parseInputValue(inp.value);
    });
    teamTotalEl.textContent = formatCurrency(total);
    btnApply.style.display = total > 0 ? '' : 'none';
  }

  btnAdd.addEventListener('click', function () { addTeamRow('', ''); });
  btnApply.addEventListener('click', function () {
    var total = 0;
    teamBody.querySelectorAll('.team-salary-input').forEach(function (inp) { total += parseInputValue(inp.value); });
    if (total > 0) {
      inputBurn.value = formatInputDisplay(String(total));
      calculate();
      showToast('🔥 Burn rate updated from team costs!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  // Add 2 default rows
  addTeamRow('Founder', '');
  addTeamRow('Developer', '');

  // ── SHARE URL ──
  function loadFromURL() {
    var params = new URLSearchParams(window.location.search);
    var cash = params.get('cash'), burn = params.get('burn'), rev = params.get('revenue'), cur = params.get('currency');
    if (cur && CURRENCIES[cur]) { currencySelect.value = cur; activeCurrency = CURRENCIES[cur]; updateCurrencySymbols(); }
    if (cash) inputCash.value = formatInputDisplay(cash);
    if (burn) inputBurn.value = formatInputDisplay(burn);
    if (rev) inputRevenue.value = formatInputDisplay(rev);
    if (cash || burn) calculate();
  }

  function generateShareURL() {
    var url = new URL(window.location.href.split('?')[0]);
    var c = parseInputValue(inputCash.value), b = parseInputValue(inputBurn.value), r = parseInputValue(inputRevenue.value);
    if (c) url.searchParams.set('cash', c);
    if (b) url.searchParams.set('burn', b);
    if (r) url.searchParams.set('revenue', r);
    url.searchParams.set('currency', currencySelect.value);
    return url.toString();
  }

  // ── EXPORT CSV ──
  function exportCSV() {
    var cash = parseInputValue(inputCash.value), burn = parseInputValue(inputBurn.value), rev = parseInputValue(inputRevenue.value);
    var net = burn - rev, mo = net > 0 ? cash / net : Infinity;
    var csv = 'Month,Cash Balance,Monthly Burn,Monthly Revenue,Net Burn\n';
    var maxM = mo === Infinity ? 24 : Math.ceil(mo) + 1, bal = cash;
    for (var i = 0; i <= maxM; i++) { csv += i + ',' + Math.max(bal, 0) + ',' + burn + ',' + rev + ',' + net + '\n'; bal -= net; }
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'runway-' + new Date().toISOString().slice(0, 10) + '.csv'; a.click();
    showToast('📄 CSV exported!');
  }

  // ── TOAST ──
  var toastTimer = null;
  function showToast(msg) {
    toastText.textContent = msg; toast.classList.add('visible');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('visible'); }, 3000);
  }

  // ── RESET ──
  function resetAll() {
    inputCash.value = ''; inputBurn.value = ''; inputRevenue.value = '';
    showEmptyState(); showToast('🗑️ All values cleared!');
    window.history.replaceState({}, '', window.location.href.split('?')[0]);
  }

  // ── EVENT BINDINGS ──
  document.getElementById('btnReset').addEventListener('click', resetAll);
  document.getElementById('btnCopyLink').addEventListener('click', function () {
    var url = generateShareURL();
    navigator.clipboard.writeText(url).then(function () { showToast('🔗 Link copied!'); }).catch(function () { prompt('Copy:', url); });
  });
  document.getElementById('btnExportCSV').addEventListener('click', exportCSV);
  document.getElementById('btnScreenshot').addEventListener('click', function () { showToast('📸 Use Ctrl+P to save as PDF!'); window.print(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') resetAll(); });

  // ── INIT ──
  updateCurrencySymbols();
  loadFromURL();
});
