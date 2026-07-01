// ================================================================
// main.js - SAT & AP 완전 지원 렌더링 엔진 (v2.0)
// ================================================================

// ================================================================
// 1. 언어 설정 (LANG)
// ================================================================
var LANG = {
  enterNumber: "Enter Starting Number",
  enterSub: "Enter the question number to begin",
  rangeInfo: "Range: 1 ~ ",
  startBtn: "▶ START",
  freshHint: "Enter a number and click START to begin a new session or click Resume above to continue where you left off",
  resumeTitle: "Resume from where you left off",
  resumeDetail: "{answered}/{total} answered · {time}",
  resumeHint: "Click to continue your previous session",
  qPrefix: "Question",
  of: "/",
  originalPrefix: "(Original #",
  originalSuffix: ")",
  prevBtn: "◀ PREV",
  skipBtn: "SKIP",
  nextBtn: "NEXT ▶",
  submitBtn: "SUBMIT",
  quitBtn: "✕ QUIT",
  reviewModePrefix: "Review Mode: ",
  reviewModeSuffix: " questions (Wrong/Skipped/Unanswered)",
  exitReview: "EXIT REVIEW",
  resultTitle: "📊 RESULT",
  correctLabel: "✅ CORRECT",
  accuracyLabel: "🎯 ACCURACY",
  resultClickLabel: "Results (Click to move)",
  retryBtn: "🔄 RETRY",
  reviewBtn: "📝 REVIEW",
  closeBtn: "✕ CLOSE",
  reviewModalTitle: "📝 REVIEW",
  reviewModalSubtitle: "Wrong / Skipped / Unanswered",
  retryWrongOnlyBtn: "🔄 RETRY WRONG ONLY",
  reviewQuestions: "Review Questions:",
  wrongCount: "Wrong:",
  skippedCount: "Skipped:",
  unansweredCount: "Unanswered:",
  questionPrefix: "Question",
  originalPrefixShort: "(Original #)",
  statusWrong: "WRONG",
  statusSkipped: "SKIPPED",
  statusUnanswered: "UNANSWERED",
  statusNotAnswered: "Status: You did not answer this question.",
  correctAnswerLabel: "Correct Answer:",
  explanationLabel: "Explanation",
  yourAnswerLabel: "(YOUR ANSWER)",
  correctAnswer: "✅ CORRECT! Answer:",
  wrongAnswer: "❌ WRONG. Answer:",
  noExplanation: "No explanation available.",
  loadError: "Failed to load questions:",
  allCorrect: "🎉 Congratulations! All correct!",
  perfectReview: "✨ Perfect! No questions to review!",
  confirmExit: "Return to main menu. Progress will not be saved.",
  reviewModeQuestionPrefix: "Review Question",
  loading: "Loading...",
  loadingQuestions: "Loading questions from ",
  rangeText: "Range: 1 ~ "
};

// ================================================================
// 2. 상수 및 전역 변수
// ================================================================
var API_URL = "https://script.google.com/macros/s/AKfycbx-S88kC_Ii_MxbibHmmHQYK_ITc1U9jphAxJ-uV0NSBGMFUidA3ItBE0niKhUyW32oMA/exec";
var STORAGE_KEY = 'quiz_progress_main';
var TOTAL_CACHE_KEY = 'quiz_total_questions';
var QUESTIONS_PER_SET = 120;
var TOTAL_QUESTIONS = 0;
var masterQuestions = [];
var currentQuestions = [];
var userAnswers = [];
var currentIndex = 0;
var correctCount = 0;
var isReviewMode = false;
var originalQuestions = [];
var currentStartNumber = 1;
var autoSaveInterval = null;
var chartInstances = {};
var DOM = {};

// ================================================================
// 3. 유틸리티 함수
// ================================================================
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  if (typeof str !== 'string') str = String(str);
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

function getAnswerLetter(num) {
  var n = parseInt(num);
  if (isNaN(n)) return num;
  var letters = {1:'A',2:'B',3:'C',4:'D',5:'E',6:'F',7:'G',8:'H'};
  return letters[n] || num;
}

function getValidChoiceKeys(choices) {
  return Object.keys(choices).filter(function(key) {
    var val = choices[key];
    if (typeof val === 'string') return val && val.trim() !== "";
    return val !== null && val !== undefined && val !== "";
  }).sort(function(a, b) { return Number(a) - Number(b); });
}

function hasRealChoices(q) {
  if (!q || !q.choices) return false;
  return Object.values(q.choices).some(function(v) {
    if (!v || typeof v !== 'string') return false;
    var trimmed = v.trim();
    return trimmed !== "" && trimmed.toLowerCase() !== 'no options' && trimmed.toLowerCase() !== 'no options.' && trimmed !== 'No options';
  });
}

function isSubjectiveQuestion(q) {
  if (!q || !q.choices) return true;
  return !hasRealChoices(q);
}

// ================================================================
// 4. ★★★★★ 강화된 JSON 파서 (이중/삼중 escape 처리)
// ================================================================
function safeParseJSON(data) {
  if (data === null || data === undefined) return null;
  
  // 1. 이미 객체면 그대로 반환
  if (typeof data === 'object') return data;
  
  // 2. 문자열로 변환
  var str = String(data);
  if (str.trim() === '') return null;
  
  // 3. ★★★★★ 반복 파싱 (이중/삼중 escape 처리)
  var parsed = str;
  var maxIter = 5;
  
  for (var i = 0; i < maxIter; i++) {
    // 문자열이 JSON처럼 생겼는지 확인
    var trimmed = parsed.trim();
    if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') {
      return null;
    }
    
    // JSON 객체/배열로 시작하는지 확인
    if (!(trimmed.startsWith('{') || trimmed.startsWith('[') || trimmed.startsWith('"') || trimmed.startsWith("'"))) {
      break;
    }
    
    try {
      var result = JSON.parse(parsed);
      // 파싱 결과가 문자열이면 계속 파싱
      if (typeof result === 'string') {
        parsed = result;
        continue;
      }
      // 객체/배열이면 반환
      if (typeof result === 'object' && result !== null) {
        return result;
      }
      // 다른 타입이면 반환
      return result;
    } catch(e) {
      // 파싱 실패하면 break
      break;
    }
  }
  
  // 마지막 시도: 따옴표 제거 후 재시도
  try {
    var cleaned = parsed;
    // 이스케이프된 따옴표 제거
    cleaned = cleaned.replace(/\\"/g, '"');
    cleaned = cleaned.replace(/\\\\/g, '\\');
    // 앞뒤 따옴표 제거
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.slice(1, -1);
    }
    var result = JSON.parse(cleaned);
    if (typeof result === 'object' && result !== null) {
      return result;
    }
    return result;
  } catch(e) {
    // 최종 실패
    return null;
  }
}

// ================================================================
// 5. 수식 파서 (Function Parser) - AP/SAT 함수 지원
// ================================================================
function parseFunction(equation) {
  if (!equation || typeof equation !== 'string') {
    return function(x) { return 0; };
  }
  
  var expr = equation
    .replace(/\^/g, '**')
    .replace(/sin\(/g, 'Math.sin(')
    .replace(/cos\(/g, 'Math.cos(')
    .replace(/tan\(/g, 'Math.tan(')
    .replace(/log10\(/g, 'Math.log10(')
    .replace(/log2\(/g, 'Math.log2(')
    .replace(/ln\(/g, 'Math.log(')
    .replace(/log\(/g, 'Math.log10(')
    .replace(/sqrt\(/g, 'Math.sqrt(')
    .replace(/cbrt\(/g, 'Math.cbrt(')
    .replace(/abs\(/g, 'Math.abs(')
    .replace(/exp\(/g, 'Math.exp(')
    .replace(/pi/g, 'Math.PI')
    .replace(/euler/g, 'Math.E');
  
  try {
    return new Function('x', 'return ' + expr + ';');
  } catch(e) {
    console.warn('⚠️ Function parse error:', e.message);
    return function(x) { return 0; };
  }
}

// ================================================================
// 6. 좌표 변환 헬퍼
// ================================================================
function toPixelX(x, xMin, xMax, canvasWidth, padding) {
  padding = padding || 50;
  var plotW = canvasWidth - 2 * padding;
  return padding + ((x - xMin) / (xMax - xMin)) * plotW;
}

function toPixelY(y, yMin, yMax, canvasHeight, padding) {
  padding = padding || 50;
  var plotH = canvasHeight - 2 * padding;
  return padding + plotH - ((y - yMin) / (yMax - yMin)) * plotH;
}

// ================================================================
// 7. ★★★★★ 메인 renderGraphic (강화된 버전)
// ================================================================
function renderGraphic(jsonData) {
  // ★★★★★ 1. null/undefined 체크
  if (jsonData === null || jsonData === undefined) return "";
  if (typeof jsonData === 'string' && jsonData.trim() === "") return "";
  
  // ★★★★★ 2. 객체를 문자열로 변환
  var dataStr = jsonData;
  if (typeof dataStr !== 'string') {
    try {
      dataStr = JSON.stringify(dataStr);
    } catch(e) {
      console.warn('⚠️ Could not stringify graphic:', e);
      return '';
    }
  }
  
  // ★★★★★ 3. 안전하게 파싱 (이중/삼중 escape 처리)
  var parsedData = safeParseJSON(dataStr);
  if (!parsedData || typeof parsedData !== 'object') {
    console.warn('⚠️ Failed to parse graphic JSON:', dataStr.substring(0, 100));
    return '<div style="padding:10px;color:#999;text-align:center;">📊 Invalid graphic data</div>';
  }
  
  var graphType = parsedData.type || '';
  if (!graphType) {
    return '<div style="padding:10px;color:#999;text-align:center;">📊 No type specified</div>';
  }
  
  // ★★★★★ 4. Chart.js가 로드되었는지 확인
  if (typeof Chart === 'undefined') {
    console.warn('⚠️ Chart.js not loaded. Retrying...');
    return '<div style="padding:10px;color:#999;text-align:center;">📊 Loading chart library...</div>';
  }
  
  var colors = ['#3498db', '#e74c3c', '#27ae60', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#2c3e50', '#7f8c8d', '#16a085', '#d35400', '#c0392b'];
  var chartId = 'chart_' + Math.random().toString(36).substr(2, 9);
  var html = '<div style="margin:15px 0;padding:15px;background:#f8f9fa;border-radius:8px;border:1px solid #e9ecef;"><canvas id="' + chartId + '" style="max-height:400px;width:100%;"></canvas></div>';
  
  // ================================================================
  // 7a. TABLE (표)
  // ================================================================
  if (graphType === 'table' || graphType === 'frequency-table') {
    if (!parsedData.headers || !parsedData.rows) {
      return '<div style="padding:10px;color:#999;">No data</div>';
    }
    
    var h = '<div style="margin:15px 0;overflow-x:auto;background:white;border-radius:8px;border:1px solid #ddd;"><table style="width:100%;border-collapse:collapse;text-align:center;font-size:14px;">';
    h += '<thead><tr style="background:#3498db;color:white;">';
    for (var hi = 0; hi < parsedData.headers.length; hi++) {
      h += '<th style="padding:10px 14px;border:1px solid #2980b9;font-weight:bold;">' + escapeHtml(parsedData.headers[hi]) + '</th>';
    }
    h += '</tr></thead><tbody>';
    for (var ri = 0; ri < parsedData.rows.length; ri++) {
      var row = parsedData.rows[ri];
      h += '<tr style="background:' + (ri%2===0?'#fff':'#f8f9fa') + ';">';
      for (var ci = 0; ci < row.length; ci++) {
        h += '<td style="padding:8px 14px;border:1px solid #ddd;">' + escapeHtml(row[ci]) + '</td>';
      }
      h += '</tr>';
    }
    h += '</tbody></table>';
    if (parsedData.title) {
      h += '<div style="text-align:center;padding:8px;font-weight:bold;color:#555;background:#f8f9fa;border-radius:0 0 8px 8px;">' + escapeHtml(parsedData.title) + '</div>';
    }
    h += '</div>';
    return h;
  }
  
  // ================================================================
  // 7b. BAR / STACKED-BAR / HISTOGRAM
  // ================================================================
  if (graphType === 'bar' || graphType === 'stacked-bar' || graphType === 'histogram') {
    var labels = [];
    var datasets = [];
    var chartTitle = parsedData.title || 'Bar Chart';
    var xLabel = (parsedData.xAxis && parsedData.xAxis.label) || '';
    var yLabel = (parsedData.yAxis && parsedData.yAxis.label) || '';
    var yMin = (parsedData.yAxis && parsedData.yAxis.min) || 0;
    var yMax = (parsedData.yAxis && parsedData.yAxis.max) || undefined;
    var isStacked = (graphType === 'stacked-bar');
    
    function normalizeArray(arr) {
      if (typeof arr === 'string') {
        try { return JSON.parse(arr); } catch(e) { return arr.split(',').map(function(v) { return v.trim(); }); }
      }
      if (!Array.isArray(arr)) return [];
      return arr;
    }
    
    if (parsedData.labels && parsedData.values) {
      labels = normalizeArray(parsedData.labels);
      var values = parsedData.values;
      if (typeof values === 'string') {
        try { values = JSON.parse(values); } catch(e) { values = values.split(',').map(function(v) { return parseFloat(v.trim()); }); }
      }
      if (!Array.isArray(values)) values = [];
      datasets = [{
        label: parsedData.label || 'Data',
        data: values,
        backgroundColor: parsedData.color || '#3498db80',
        borderColor: parsedData.stroke || '#3498db',
        borderWidth: 2
      }];
    } else if (parsedData.series) {
      var series = normalizeArray(parsedData.series);
      labels = normalizeArray(parsedData.categories || (parsedData.xAxis && parsedData.xAxis.ticks) || []);
      for (var si = 0; si < series.length; si++) {
        var s = series[si];
        var vals = s.values || [];
        if (typeof vals === 'string') {
          try { vals = JSON.parse(vals); } catch(e) { vals = vals.split(',').map(function(v) { return parseFloat(v.trim()); }); }
        }
        if (!Array.isArray(vals)) vals = [];
        datasets.push({
          label: s.name || 'Series ' + (si+1),
          data: vals,
          backgroundColor: colors[si % colors.length] + '80',
          borderColor: colors[si % colors.length],
          borderWidth: 2
        });
      }
    }
    
    if (datasets.length === 0) {
      return '<div style="padding:10px;color:#999;text-align:center;">📊 No data for bar chart</div>';
    }
    
    var renderFn = function() {
      var ctx = document.getElementById(chartId);
      if (!ctx) return;
      if (window._chartInstances && window._chartInstances[chartId]) {
        window._chartInstances[chartId].destroy();
      }
      if (!window._chartInstances) window._chartInstances = {};
      
      var cc = {
        type: 'bar',
        data: { labels: labels, datasets: datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: { display: true, text: chartTitle, font: { size: 16, weight: 'bold' } },
            legend: { position: 'bottom' }
          },
          scales: {
            x: { 
              title: { display: true, text: xLabel }, 
              grid: { color: '#e0e0e0' },
              stacked: isStacked
            },
            y: { 
              beginAtZero: true, 
              title: { display: true, text: yLabel }, 
              grid: { color: '#e0e0e0' }, 
              min: yMin, 
              max: yMax,
              stacked: isStacked
            }
          }
        }
      };
      
      var canvas = document.getElementById(chartId);
      if (canvas && cc) {
        canvas.parentElement.style.height = '400px';
        window._chartInstances[chartId] = new Chart(canvas, cc);
      }
    };
    
    setTimeout(renderFn, 150);
    return html;
  }
  
  // ================================================================
  // 7c. PIE / DOUGHNUT
  // ================================================================
  if ((graphType === 'pie' || graphType === 'doughnut') && parsedData.labels && parsedData.values) {
    var renderFn = function() {
      var ctx = document.getElementById(chartId);
      if (!ctx) return;
      if (window._chartInstances && window._chartInstances[chartId]) {
        window._chartInstances[chartId].destroy();
      }
      if (!window._chartInstances) window._chartInstances = {};
      
      var cc = {
        type: graphType,
        data: {
          labels: parsedData.labels,
          datasets: [{
            data: parsedData.values,
            backgroundColor: parsedData.colors || ['#3498db', '#e74c3c', '#27ae60', '#f39c12', '#9b59b6', '#1abc9c'],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: { display: true, text: parsedData.title || (graphType === 'pie' ? 'Pie Chart' : 'Doughnut Chart'), font: { size: 16, weight: 'bold' } },
            legend: { position: 'bottom' }
          },
          cutout: graphType === 'doughnut' ? (parsedData.cutout || '50%') : '0%'
        }
      };
      
      var canvas = document.getElementById(chartId);
      if (canvas && cc) {
        canvas.parentElement.style.height = '400px';
        window._chartInstances[chartId] = new Chart(canvas, cc);
      }
    };
    
    setTimeout(renderFn, 150);
    return html;
  }
  
  // ================================================================
  // 7d. LINE
  // ================================================================
  if (graphType === 'line' && parsedData.series) {
    var renderFn = function() {
      var ctx = document.getElementById(chartId);
      if (!ctx) return;
      if (window._chartInstances && window._chartInstances[chartId]) {
        window._chartInstances[chartId].destroy();
      }
      if (!window._chartInstances) window._chartInstances = {};
      
      var ds = [];
      for (var li = 0; li < parsedData.series.length; li++) {
        var s = parsedData.series[li];
        var points = [];
        if (Array.isArray(s.points)) {
          points = s.points;
        } else if (typeof s.points === 'string') {
          try { points = JSON.parse(s.points); } catch(e) { points = []; }
        } else if (Array.isArray(s.data) && parsedData.xAxis && Array.isArray(parsedData.xAxis.categories)) {
          for (var di = 0; di < s.data.length; di++) {
            points.push({ x: parsedData.xAxis.categories[di] || di, y: s.data[di] });
          }
        } else if (Array.isArray(s.data) && s.data.length && typeof s.data[0] === 'object') {
          points = s.data;
        } else if (Array.isArray(s.data)) {
          for (var di2 = 0; di2 < s.data.length; di2++) {
            points.push({ x: di2, y: s.data[di2] });
          }
        }
        ds.push({
          label: s.name || ('Series ' + (li + 1)),
          data: points,
          showLine: true,
          borderColor: s.color || colors[li % colors.length],
          backgroundColor: (s.color || colors[li % colors.length]) + '20',
          borderWidth: s.lineWidth || 2,
          pointRadius: s.pointSize || 4,
          tension: s.tension || 0.3,
          fill: s.fill || false
        });
      }
      
      var cc = {
        type: 'scatter',
        data: { datasets: ds },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: { display: true, text: parsedData.title || 'Line Chart', font: { size: 16, weight: 'bold' } },
            legend: { position: 'bottom' }
          },
          scales: {
            x: { type: 'linear', title: { display: true, text: (parsedData.xAxis && (parsedData.xAxis.title || parsedData.xAxis.label)) || 'X' }, grid: { color: '#e0e0e0' } },
            y: { title: { display: true, text: (parsedData.yAxis && (parsedData.yAxis.title || parsedData.yAxis.label)) || 'Y' }, grid: { color: '#e0e0e0' } }
          }
        }
      };
      
      var canvas = document.getElementById(chartId);
      if (canvas && cc) {
        canvas.parentElement.style.height = '400px';
        window._chartInstances[chartId] = new Chart(canvas, cc);
      }
    };
    
    setTimeout(renderFn, 150);
    return html;
  }
  
  // ================================================================
  // 7e. SCATTER / SCATTER-ONLY (★ SAT 단골)
  // ================================================================
  if ((graphType === 'scatter' || graphType === 'scatter-only') && parsedData.points) {
    var renderFn = function() {
      var ctx = document.getElementById(chartId);
      if (!ctx) return;
      if (window._chartInstances && window._chartInstances[chartId]) {
        window._chartInstances[chartId].destroy();
      }
      if (!window._chartInstances) window._chartInstances = {};
      
      var showLine = (graphType === 'scatter');
      
      // points 배열 정규화: [{x, y}] 또는 [[x, y]]
      var normalizedPoints = parsedData.points.map(function(p) {
        if (Array.isArray(p)) {
          return { x: p[0], y: p[1] };
        }
        return p;
      });
      
      var cc = {
        type: 'scatter',
        data: {
          datasets: [{
            label: parsedData.equation || parsedData.label || 'Data',
            data: normalizedPoints,
            showLine: showLine,
            borderColor: parsedData.color || '#3498db',
            backgroundColor: (parsedData.color || '#3498db') + '20',
            borderWidth: parsedData.lineWidth || 2,
            pointRadius: parsedData.pointSize || (showLine ? 4 : 6),
            pointBackgroundColor: parsedData.color || (showLine ? '#3498db' : '#e74c3c'),
            tension: parsedData.tension || 0.3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: { display: true, text: parsedData.equation || parsedData.title || parsedData.question || 'Scatter Plot', font: { size: 16, weight: 'bold' } }
          },
          scales: {
            x: { 
              type: 'linear', 
              title: { display: true, text: parsedData.xLabel || (parsedData.xAxis && parsedData.xAxis.label) || 'X' }, 
              grid: { color: '#e0e0e0' },
              min: parsedData.xAxis && parsedData.xAxis.min !== undefined ? parsedData.xAxis.min : undefined,
              max: parsedData.xAxis && parsedData.xAxis.max !== undefined ? parsedData.xAxis.max : undefined
            },
            y: { 
              type: 'linear', 
              title: { display: true, text: parsedData.yLabel || (parsedData.yAxis && parsedData.yAxis.label) || 'Y' }, 
              grid: { color: '#e0e0e0' },
              min: parsedData.yAxis && parsedData.yAxis.min !== undefined ? parsedData.yAxis.min : undefined,
              max: parsedData.yAxis && parsedData.yAxis.max !== undefined ? parsedData.yAxis.max : undefined
            }
          }
        }
      };
      
      var canvas = document.getElementById(chartId);
      if (canvas && cc) {
        canvas.parentElement.style.height = '400px';
        window._chartInstances[chartId] = new Chart(canvas, cc);
      }
    };
    
    setTimeout(renderFn, 150);
    return html;
  }
  
  // ================================================================
  // 7f. RADAR
  // ================================================================
  if (graphType === 'radar' && parsedData.labels && parsedData.datasets) {
    var renderFn = function() {
      var ctx = document.getElementById(chartId);
      if (!ctx) return;
      if (window._chartInstances && window._chartInstances[chartId]) {
        window._chartInstances[chartId].destroy();
      }
      if (!window._chartInstances) window._chartInstances = {};
      
      var ds = [];
      for (var rdi = 0; rdi < parsedData.datasets.length; rdi++) {
        var d = parsedData.datasets[rdi];
        var values = d.values || [];
        if (typeof values === 'string') {
          try { values = JSON.parse(values); } catch(e) { values = values.split(',').map(function(v) { return parseFloat(v.trim()); }); }
        }
        ds.push({
          label: d.label || 'Series ' + (rdi+1),
          data: values,
          borderColor: d.color || colors[rdi % colors.length],
          backgroundColor: (d.color || colors[rdi % colors.length]) + '20',
          borderWidth: 2,
          pointRadius: 4
        });
      }
      
      var cc = {
        type: 'radar',
        data: { labels: parsedData.labels, datasets: ds },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: { display: true, text: parsedData.title || 'Radar Chart', font: { size: 16, weight: 'bold' } }
          },
          scales: {
            r: { beginAtZero: true, grid: { color: '#e0e0e0' } }
          }
        }
      };
      
      var canvas = document.getElementById(chartId);
      if (canvas && cc) {
        canvas.parentElement.style.height = '400px';
        window._chartInstances[chartId] = new Chart(canvas, cc);
      }
    };
    
    setTimeout(renderFn, 150);
    return html;
  }
  
  // ================================================================
  // 7g. COORDINATE-PLANE (★ SAT/AP 단골)
  // ================================================================
  if (graphType === 'coordinate-plane') {
    var renderFn = function() {
      var ctx = document.getElementById(chartId);
      if (!ctx) return;
      if (window._chartInstances && window._chartInstances[chartId]) {
        window._chartInstances[chartId].destroy();
      }
      if (!window._chartInstances) window._chartInstances = {};
      
      var canvas = document.getElementById(chartId);
      var W = canvas.width;
      var H = canvas.height;
      var pad = 50;
      
      var xMin = -10, xMax = 10, yMin = -10, yMax = 10;
      if (parsedData.xAxis) {
        if (parsedData.xAxis.min !== undefined) xMin = parsedData.xAxis.min;
        if (parsedData.xAxis.max !== undefined) xMax = parsedData.xAxis.max;
      }
      if (parsedData.yAxis) {
        if (parsedData.yAxis.min !== undefined) yMin = parsedData.yAxis.min;
        if (parsedData.yAxis.max !== undefined) yMax = parsedData.yAxis.max;
      }
      
      var xLabel = (parsedData.xAxis && parsedData.xAxis.label) || 'x';
      var yLabel = (parsedData.yAxis && parsedData.yAxis.label) || 'y';
      
      function toPX(x) { return pad + ((x - xMin) / (xMax - xMin)) * (W - 2 * pad); }
      function toPY(y) { return pad + (H - 2 * pad) - ((y - yMin) / (yMax - yMin)) * (H - 2 * pad); }
      
      // 그리드
      ctx.save();
      ctx.strokeStyle = '#ddd';
      ctx.lineWidth = 0.5;
      
      var tickX = (parsedData.xAxis && parsedData.xAxis.tick) || 1;
      var tickY = (parsedData.yAxis && parsedData.yAxis.tick) || 1;
      
      for (var x = Math.ceil(xMin / tickX) * tickX; x <= xMax; x += tickX) {
        var px = toPX(x);
        ctx.beginPath();
        ctx.moveTo(px, pad);
        ctx.lineTo(px, H - pad);
        ctx.stroke();
        ctx.fillStyle = '#333';
        ctx.font = '11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(x, px, H - pad + 16);
      }
      
      for (var y = Math.ceil(yMin / tickY) * tickY; y <= yMax; y += tickY) {
        var py = toPY(y);
        ctx.beginPath();
        ctx.moveTo(pad, py);
        ctx.lineTo(W - pad, py);
        ctx.stroke();
        ctx.fillStyle = '#333';
        ctx.font = '11px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(y, pad - 8, py + 4);
      }
      
      ctx.fillStyle = '#333';
      ctx.font = '13px Arial bold';
      ctx.textAlign = 'center';
      ctx.fillText(xLabel, W / 2, H - 6);
      ctx.textAlign = 'center';
      ctx.fillText(yLabel, 20, pad - 10);
      ctx.restore();
      
      var datasets = [];
      
      // Points
      if (parsedData.points && parsedData.points.length > 0) {
        var pts = parsedData.points.map(function(p) {
          if (Array.isArray(p)) return { x: p[0], y: p[1] };
          return p;
        });
        datasets.push({
          label: 'Points',
          data: pts,
          showLine: false,
          backgroundColor: '#e74c3c',
          pointRadius: 6,
          pointBackgroundColor: '#e74c3c',
          pointBorderColor: 'white',
          pointBorderWidth: 2
        });
      }
      
      // Segments
      if (parsedData.segments && parsedData.segments.length > 0) {
        for (var si4 = 0; si4 < parsedData.segments.length; si4++) {
          var seg = parsedData.segments[si4];
          datasets.push({
            label: seg.label || 'Segment ' + (si4+1),
            data: [{ x: seg.from[0], y: seg.from[1] }, { x: seg.to[0], y: seg.to[1] }],
            showLine: true,
            borderColor: seg.color || '#2c3e50',
            borderWidth: seg.lineWidth || 2,
            pointRadius: 0,
            fill: false
          });
        }
      }
      
      // Lines (y = mx + b)
      if (parsedData.lines) {
        for (var li2 = 0; li2 < parsedData.lines.length; li2++) {
          var line = parsedData.lines[li2];
          var pts2 = [
            { x: xMin, y: line.slope * xMin + line.intercept },
            { x: xMax, y: line.slope * xMax + line.intercept }
          ];
          datasets.push({
            label: line.label || 'Line ' + (li2+1),
            data: pts2,
            showLine: true,
            borderColor: line.color || colors[li2 % colors.length],
            borderWidth: line.lineWidth || 2,
            pointRadius: 0,
            fill: false
          });
        }
      }
      
      // ★ FUNCTIONS (함수 그래프)
      if (parsedData.functions) {
        for (var fi = 0; fi < parsedData.functions.length; fi++) {
          var fn = parsedData.functions[fi];
          var fnPoints = [];
          var domain = fn.domain || [xMin, xMax];
          var step = (domain[1] - domain[0]) / 200;
          var eqFn = parseFunction(fn.equation);
          
          for (var x2 = domain[0]; x2 <= domain[1]; x2 += step) {
            try {
              var y2 = eqFn(x2);
              if (isFinite(y2) && Math.abs(y2) < 100) {
                fnPoints.push({ x: x2, y: y2 });
              }
            } catch(e) {}
          }
          
          if (fnPoints.length > 1) {
            datasets.push({
              label: fn.equation || 'f(x)',
              data: fnPoints,
              showLine: true,
              borderColor: fn.color || '#e74c3c',
              borderWidth: fn.lineWidth || 3,
              pointRadius: 0,
              tension: 0.3,
              fill: false
            });
          }
        }
      }
      
      // ★ POLYNOMIALS (다항식)
      if (parsedData.polynomials) {
        for (var pi2 = 0; pi2 < parsedData.polynomials.length; pi2++) {
          var poly = parsedData.polynomials[pi2];
          var coeffs = poly.coefficients;
          var terms = [];
          var degree = coeffs.length - 1;
          for (var ci = 0; ci < coeffs.length; ci++) {
            var c = coeffs[ci];
            if (c === 0) continue;
            var exp = degree - ci;
            if (exp === 0) terms.push(String(c));
            else if (exp === 1) terms.push(c + '*x');
            else terms.push(c + '*x^' + exp);
          }
          var eq = terms.join('+');
          
          var fnPoints2 = [];
          var domain2 = poly.domain || [xMin, xMax];
          var step2 = (domain2[1] - domain2[0]) / 200;
          var eqFn2 = parseFunction(eq);
          
          for (var x3 = domain2[0]; x3 <= domain2[1]; x3 += step2) {
            try {
              var y3 = eqFn2(x3);
              if (isFinite(y3) && Math.abs(y3) < 100) {
                fnPoints2.push({ x: x3, y: y3 });
              }
            } catch(e) {}
          }
          
          if (fnPoints2.length > 1) {
            datasets.push({
              label: poly.label || 'Polynomial',
              data: fnPoints2,
              showLine: true,
              borderColor: poly.color || '#9b59b6',
              borderWidth: poly.lineWidth || 3,
              pointRadius: 0,
              tension: 0.3,
              fill: false
            });
          }
        }
      }
      
      // ★ PIECEWISE (조각함수)
      if (parsedData.piecewise) {
        for (var pi3 = 0; pi3 < parsedData.piecewise.length; pi3++) {
          var piece = parsedData.piecewise[pi3];
          var fnPoints3 = [];
          var domain3 = piece.domain || [xMin, xMax];
          var step3 = (domain3[1] - domain3[0]) / 200;
          var eqFn3 = parseFunction(piece.equation);
          
          for (var x4 = domain3[0]; x4 <= domain3[1]; x4 += step3) {
            try {
              var y4 = eqFn3(x4);
              if (isFinite(y4) && Math.abs(y4) < 100) {
                fnPoints3.push({ x: x4, y: y4 });
              }
            } catch(e) {}
          }
          
          if (fnPoints3.length > 1) {
            datasets.push({
              label: piece.label || piece.equation || 'Piecewise',
              data: fnPoints3,
              showLine: true,
              borderColor: piece.color || '#27ae60',
              borderWidth: piece.lineWidth || 2.5,
              pointRadius: 0,
              tension: 0.1,
              fill: false
            });
          }
        }
      }
      
      // ★ ABSOLUTE (절대값)
      if (parsedData.absolute) {
        var absEq = 'Math.abs(' + parsedData.absolute.equation + ')';
        var fnPoints4 = [];
        var domain4 = parsedData.absolute.domain || [xMin, xMax];
        var step4 = (domain4[1] - domain4[0]) / 200;
        var eqFn4 = parseFunction(absEq);
        
        for (var x5 = domain4[0]; x5 <= domain4[1]; x5 += step4) {
          try {
            var y5 = eqFn4(x5);
            if (isFinite(y5) && Math.abs(y5) < 100) {
              fnPoints4.push({ x: x5, y: y5 });
            }
          } catch(e) {}
        }
        
        if (fnPoints4.length > 1) {
          datasets.push({
            label: '|' + parsedData.absolute.equation + '|',
            data: fnPoints4,
            showLine: true,
            borderColor: parsedData.absolute.color || '#f39c12',
            borderWidth: parsedData.absolute.lineWidth || 3,
            pointRadius: 0,
            tension: 0.3,
            fill: false
          });
        }
      }
      
      // ★ SYSTEM (연립방정식)
      if (parsedData.system && parsedData.system.equations) {
        for (var syi = 0; syi < parsedData.system.equations.length; syi++) {
          var sysEq = parsedData.system.equations[syi];
          var sysPoints = [];
          var sysDomain = parsedData.system.domain || [xMin, xMax];
          var sysStep = (sysDomain[1] - sysDomain[0]) / 200;
          var sysFn = parseFunction(sysEq.equation);
          
          for (var x6 = sysDomain[0]; x6 <= sysDomain[1]; x6 += sysStep) {
            try {
              var y6 = sysFn(x6);
              if (isFinite(y6) && Math.abs(y6) < 100) {
                sysPoints.push({ x: x6, y: y6 });
              }
            } catch(e) {}
          }
          
          if (sysPoints.length > 1) {
            datasets.push({
              label: sysEq.label || sysEq.equation,
              data: sysPoints,
              showLine: true,
              borderColor: sysEq.color || colors[syi % colors.length],
              borderWidth: sysEq.lineWidth || 2.5,
              pointRadius: 0,
              tension: 0.3,
              fill: false
            });
          }
        }
      }
      
      if (datasets.length === 0) return;
      
      var cc = {
        type: 'scatter',
        data: { datasets: datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: { display: true, text: parsedData.title || 'Coordinate Plane', font: { size: 16, weight: 'bold' } },
            legend: { position: 'bottom' }
          },
          scales: {
            x: { type: 'linear', title: { display: true, text: xLabel }, grid: { color: '#e0e0e0' }, min: xMin, max: xMax },
            y: { type: 'linear', title: { display: true, text: yLabel }, grid: { color: '#e0e0e0' }, min: yMin, max: yMax }
          }
        }
      };
      
      if (canvas && cc) {
        canvas.parentElement.style.height = '400px';
        window._chartInstances[chartId] = new Chart(canvas, cc);
      }
    };
    
    setTimeout(renderFn, 150);
    return html;
  }
  
  // ================================================================
  // 7h. SHAPE (도형)
  // ================================================================
  if (graphType === 'shape' && parsedData.points) {
    var renderFn = function() {
      var ctx = document.getElementById(chartId);
      if (!ctx) return;
      if (window._chartInstances && window._chartInstances[chartId]) {
        window._chartInstances[chartId].destroy();
      }
      if (!window._chartInstances) window._chartInstances = {};
      
      var pts = parsedData.points.slice();
      if (pts.length > 0) {
        pts.push({ x: parsedData.points[0].x, y: parsedData.points[0].y });
      }
      
      var datasets = [];
      datasets.push({
        label: parsedData.label || 'Shape',
        data: pts,
        showLine: true,
        borderColor: parsedData.stroke || '#2c3e50',
        backgroundColor: parsedData.fill || 'rgba(52,152,219,0.15)',
        borderWidth: parsedData.lineWidth || 2,
        pointRadius: parsedData.pointSize || 4,
        pointBackgroundColor: parsedData.stroke || '#2c3e50',
        fill: true,
        tension: 0
      });
      
      var cc = {
        type: 'scatter',
        data: { datasets: datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: { display: true, text: parsedData.question || parsedData.title || 'Shape', font: { size: 16, weight: 'bold' } },
            legend: { position: 'bottom' }
          },
          scales: {
            x: { type: 'linear', title: { display: true, text: 'X' }, grid: { color: '#e0e0e0' } },
            y: { type: 'linear', title: { display: true, text: 'Y' }, grid: { color: '#e0e0e0' } }
          }
        }
      };
      
      var canvas = document.getElementById(chartId);
      if (canvas && cc) {
        canvas.parentElement.style.height = '400px';
        window._chartInstances[chartId] = new Chart(canvas, cc);
      }
    };
    
    setTimeout(renderFn, 150);
    return html;
  }
  
  // ================================================================
  // 7i. DOT-PLOT
  // ================================================================
  if (graphType === 'dot-plot' && parsedData.series) {
    var renderFn = function() {
      var ctx = document.getElementById(chartId);
      if (!ctx) return;
      if (window._chartInstances && window._chartInstances[chartId]) {
        window._chartInstances[chartId].destroy();
      }
      if (!window._chartInstances) window._chartInstances = {};
      
      var ds = [];
      for (var dpi = 0; dpi < parsedData.series.length; dpi++) {
        var sp = parsedData.series[dpi];
        ds.push({
          label: sp.name || 'Series ' + (dpi+1),
          data: sp.data,
          showLine: false,
          backgroundColor: colors[dpi % colors.length],
          pointRadius: 8,
          pointBackgroundColor: colors[dpi % colors.length] + '80',
          pointBorderColor: colors[dpi % colors.length],
          pointBorderWidth: 2
        });
      }
      
      var cc = {
        type: 'scatter',
        data: { datasets: ds },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: { display: true, text: parsedData.title || 'Dot Plot', font: { size: 16, weight: 'bold' } },
            legend: { position: 'bottom' }
          },
          scales: {
            x: { type: 'linear', title: { display: true, text: (parsedData.xAxis && parsedData.xAxis.label) || 'Value' }, grid: { color: '#e0e0e0' } },
            y: { title: { display: true, text: 'Frequency' }, grid: { color: '#e0e0e0' }, min: 0, ticks: { stepSize: 1, precision: 0 } }
          }
        }
      };
      
      var canvas = document.getElementById(chartId);
      if (canvas && cc) {
        canvas.parentElement.style.height = '400px';
        window._chartInstances[chartId] = new Chart(canvas, cc);
      }
    };
    
    setTimeout(renderFn, 150);
    return html;
  }
  
  // ================================================================
  // 7j. BOX-PLOT (상자 수염 그림)
  // ================================================================
  if (graphType === 'box-plot' && parsedData.boxes) {
    var renderFn = function() {
      var ctx = document.getElementById(chartId);
      if (!ctx) return;
      if (window._chartInstances && window._chartInstances[chartId]) {
        window._chartInstances[chartId].destroy();
      }
      if (!window._chartInstances) window._chartInstances = {};
      
      var canvas = document.getElementById(chartId);
      var W = canvas.width;
      var H = canvas.height;
      var pad = 60;
      
      var yMin = (parsedData.yAxis && parsedData.yAxis.min) || 0;
      var yMax = (parsedData.yAxis && parsedData.yAxis.max) || 100;
      
      function toPX2(x) { return pad + ((x - 0.5) / (parsedData.boxes.length + 0.5)) * (W - 2 * pad); }
      function toPY2(y) { return pad + (H - 2 * pad) - ((y - yMin) / (yMax - yMin)) * (H - 2 * pad); }
      
      ctx.save();
      
      for (var bxi = 0; bxi < parsedData.boxes.length; bxi++) {
        var box = parsedData.boxes[bxi];
        var color = box.color || colors[bxi % colors.length];
        var x = bxi + 1;
        var px = toPX2(x);
        var pyMin = toPY2(box.min);
        var pyQ1 = toPY2(box.q1);
        var pyMedian = toPY2(box.median);
        var pyQ3 = toPY2(box.q3);
        var pyMax = toPY2(box.max);
        
        var boxWidth = 30;
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px, pyMin);
        ctx.lineTo(px, pyQ1);
        ctx.moveTo(px, pyQ3);
        ctx.lineTo(px, pyMax);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(px - 8, pyMin);
        ctx.lineTo(px + 8, pyMin);
        ctx.moveTo(px - 8, pyMax);
        ctx.lineTo(px + 8, pyMax);
        ctx.stroke();
        
        ctx.fillStyle = color + '30';
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.fillRect(px - boxWidth/2, pyQ3, boxWidth, pyQ1 - pyQ3);
        ctx.strokeRect(px - boxWidth/2, pyQ3, boxWidth, pyQ1 - pyQ3);
        
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(px - boxWidth/2, pyMedian);
        ctx.lineTo(px + boxWidth/2, pyMedian);
        ctx.stroke();
        
        ctx.fillStyle = '#2c3e50';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(box.label || 'Group ' + (bxi+1), px, toPY2(yMin) + 20);
        
        ctx.font = '10px Arial';
        ctx.fillStyle = '#666';
        ctx.textAlign = 'left';
        ctx.fillText('min:' + box.min, px + boxWidth/2 + 4, pyMin + 3);
        ctx.fillText('Q1:' + box.q1, px + boxWidth/2 + 4, pyQ1 + 3);
        ctx.fillText('med:' + box.median, px + boxWidth/2 + 4, pyMedian + 3);
        ctx.fillText('Q3:' + box.q3, px + boxWidth/2 + 4, pyQ3 + 3);
        ctx.fillText('max:' + box.max, px + boxWidth/2 + 4, pyMax + 3);
      }
      
      ctx.restore();
    };
    
    setTimeout(renderFn, 150);
    return html;
  }
  
  // ================================================================
  // 7k. RESIDUAL-PLOT (잔차 그래프)
  // ================================================================
  if (graphType === 'residual-plot' && parsedData.residuals) {
    var renderFn = function() {
      var ctx = document.getElementById(chartId);
      if (!ctx) return;
      if (window._chartInstances && window._chartInstances[chartId]) {
        window._chartInstances[chartId].destroy();
      }
      if (!window._chartInstances) window._chartInstances = {};
      
      var canvas = document.getElementById(chartId);
      var W = canvas.width;
      var H = canvas.height;
      var pad = 60;
      
      var residuals = parsedData.residuals;
      var xMin = Math.min.apply(null, residuals.map(function(r) { return r.x; })) - 1;
      var xMax = Math.max.apply(null, residuals.map(function(r) { return r.x; })) + 1;
      var yMin = Math.min.apply(null, residuals.map(function(r) { return r.residual; })) - 1;
      var yMax = Math.max.apply(null, residuals.map(function(r) { return r.residual; })) + 1;
      
      function toPX3(x) { return pad + ((x - xMin) / (xMax - xMin)) * (W - 2 * pad); }
      function toPY3(y) { return pad + (H - 2 * pad) - ((y - yMin) / (yMax - yMin)) * (H - 2 * pad); }
      
      ctx.save();
      
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = '#95a5a6';
      ctx.lineWidth = 1;
      ctx.beginPath();
      var py0 = toPY3(0);
      ctx.moveTo(pad, py0);
      ctx.lineTo(W - pad, py0);
      ctx.stroke();
      
      var color = parsedData.color || '#e74c3c';
      for (var ri3 = 0; ri3 < residuals.length; ri3++) {
        var px3 = toPX3(residuals[ri3].x);
        var py3 = toPY3(residuals[ri3].residual);
        ctx.beginPath();
        ctx.arc(px3, py3, 5, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        ctx.fillStyle = '#666';
        ctx.font = '10px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(residuals[ri3].residual.toFixed(2), px3 + 8, py3 + 3);
      }
      
      ctx.restore();
    };
    
    setTimeout(renderFn, 150);
    return html;
  }
  
  // ================================================================
  // 7l. NORMAL-DISTRIBUTION (정규분포)
  // ================================================================
  if (graphType === 'normal-distribution') {
    var renderFn = function() {
      var ctx = document.getElementById(chartId);
      if (!ctx) return;
      if (window._chartInstances && window._chartInstances[chartId]) {
        window._chartInstances[chartId].destroy();
      }
      if (!window._chartInstances) window._chartInstances = {};
      
      var mean = parsedData.mean || 0;
      var std = parsedData.std || 1;
      var domain = parsedData.domain || [mean - 4 * std, mean + 4 * std];
      var points = [];
      var step = (domain[1] - domain[0]) / 200;
      
      for (var x = domain[0]; x <= domain[1]; x += step) {
        var y = (1 / (std * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mean) / std, 2));
        points.push({ x: x, y: y });
      }
      
      var color = parsedData.color || '#3498db';
      
      var cc = {
        type: 'scatter',
        data: {
          datasets: [{
            label: 'N(' + mean + ', ' + std + '²)',
            data: points,
            showLine: true,
            borderColor: color,
            backgroundColor: color + '30',
            borderWidth: 3,
            pointRadius: 0,
            fill: true,
            tension: 0.3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: { display: true, text: parsedData.title || 'N(' + mean + ', ' + std + '²)', font: { size: 16, weight: 'bold' } }
          },
          scales: {
            x: { type: 'linear', title: { display: true, text: 'x' }, grid: { color: '#e0e0e0' } },
            y: { title: { display: true, text: 'f(x)' }, grid: { color: '#e0e0e0' }, min: 0 }
          }
        }
      };
      
      var canvas = document.getElementById(chartId);
      if (canvas && cc) {
        canvas.parentElement.style.height = '400px';
        window._chartInstances[chartId] = new Chart(canvas, cc);
      }
    };
    
    setTimeout(renderFn, 150);
    return html;
  }
  
  // ================================================================
  // 7m. GAUGE (게이지)
  // ================================================================
  if (graphType === 'gauge') {
    var renderFn = function() {
      var ctx = document.getElementById(chartId);
      if (!ctx) return;
      if (window._chartInstances && window._chartInstances[chartId]) {
        window._chartInstances[chartId].destroy();
      }
      if (!window._chartInstances) window._chartInstances = {};
      
      var value = parsedData.value || 50;
      var min = parsedData.min || 0;
      var max = parsedData.max || 100;
      var percentage = (value - min) / (max - min);
      var color = percentage > 0.7 ? '#2ecc71' : percentage > 0.4 ? '#f39c12' : '#e74c3c';
      
      var cc = {
        type: 'doughnut',
        data: {
          datasets: [{
            data: [percentage * 100, (1 - percentage) * 100],
            backgroundColor: [color, '#ecf0f1'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          circumference: 180,
          rotation: 270,
          plugins: {
            title: { display: true, text: parsedData.title || 'Gauge', font: { size: 16, weight: 'bold' } },
            legend: { display: false }
          },
          cutout: '70%'
        },
        plugins: [{
          id: 'gaugeText',
          afterDraw: function(chart) {
            var ctx2 = chart.ctx;
            var width = chart.width;
            var height = chart.height;
            ctx2.save();
            ctx2.font = 'bold 28px Arial';
            ctx2.fillStyle = '#2c3e50';
            ctx2.textAlign = 'center';
            ctx2.textBaseline = 'middle';
            ctx2.fillText(value + (parsedData.suffix || ''), width/2, height/2 + 10);
            ctx2.restore();
          }
        }]
      };
      
      var canvas = document.getElementById(chartId);
      if (canvas && cc) {
        canvas.parentElement.style.height = '400px';
        window._chartInstances[chartId] = new Chart(canvas, cc);
      }
    };
    
    setTimeout(renderFn, 150);
    return html;
  }
  
  // ================================================================
  // UNSUPPORTED
  // ================================================================
  return '<div style="padding:10px;text-align:center;color:#999;border:1px dashed #ddd;border-radius:8px;margin:15px 0;">' +
    '<span style="font-size:20px;">📊</span>' +
    '<p style="margin-top:8px;">Graph type "<strong>' + escapeHtml(graphType) + '</strong>" is not supported.</p>' +
    '</div>';
}

// ================================================================
// 8. 렌더링 함수
// ================================================================
function renderSubjectiveQuestion(q, answered, headerText, passageHtml) {
  var isAnswered = (answered !== null && answered !== undefined && answered !== -1);
  if (!isAnswered) {
    DOM.explanationBox.classList.remove('show');
    DOM.explanationText.innerHTML = '';
  }
  var correctAnswerText = '';
  if (q.A && q.A !== '') {
    correctAnswerText = String(q.A).trim();
  } else if (q.answer && q.answer !== '' && q.answer !== '0') {
    correctAnswerText = String(q.answer).trim();
  } else {
    correctAnswerText = 'Answer not available';
  }
  var html = '<div class="question-card">' +
    '<div class="q-num">' + headerText + '</div>' +
    passageHtml +
    renderGraphic(q.graphic) +
    '<div class="question-text">' + escapeHtml(q.question) + '</div>';
  if (isAnswered) {
    var userAns = String(answered).trim();
    var isCorrect = (userAns === correctAnswerText) || (parseFloat(userAns) === parseFloat(correctAnswerText));
    var statusColor = isCorrect ? '#27ae60' : '#e74c3c';
    html += '<div style="margin-top:15px;padding:15px;background:#f8f9fa;border-radius:8px;border-left:4px solid #666;">' +
      '<div style="font-size:14px;color:#666;">Your answer: <strong>' + escapeHtml(userAns) + '</strong></div>' +
      '</div>' +
      '<div class="subjective-result" style="background:' + statusColor + ';">' +
      'Answer: ' + escapeHtml(correctAnswerText) +
      '</div>' +
      '<div class="subjective-explanation">' +
      '<strong>Explanation</strong>' +
      '<p style="margin-top:8px;">' + escapeHtml(q.explanation || 'No explanation available.') + '</p>' +
      '</div>';
  } else {
    html += '<div class="subjective-input-group">' +
      '<input type="text" id="subjectiveInput" placeholder="Enter your answer" onkeypress="if(event.key===\'Enter\') submitSubjective()">' +
      '<button onclick="submitSubjective()">Submit</button>' +
      '</div>';
  }
  html += '</div></div>';
  DOM.questionContainer.innerHTML = html;
  var isLastQuestion = (currentIndex >= currentQuestions.length - 1);
  if (isLastQuestion) {
    DOM.nextBtn.style.display = 'none';
    DOM.submitBtn.style.display = 'inline-block';
    DOM.submitBtn.innerHTML = 'SUBMIT (Enter)';
    var isAnswered2 = (userAnswers[currentIndex] !== null && userAnswers[currentIndex] !== undefined && userAnswers[currentIndex] !== -1);
    DOM.submitBtn.disabled = !isAnswered2;
    DOM.submitBtn.style.background = isAnswered2 ? '#27ae60' : '#95a5a6';
    DOM.submitBtn.style.color = isAnswered2 ? 'white' : '#666';
  } else {
    DOM.nextBtn.style.display = 'inline-block';
    DOM.nextBtn.innerHTML = 'NEXT (N)';
    DOM.submitBtn.style.display = 'none';
  }
  DOM.prevBtn.disabled = (currentIndex === 0);
}

function renderCurrentQuestion() {
  console.log('🔴 renderCurrentQuestion START');
  
  if (!currentQuestions.length || currentIndex >= currentQuestions.length) {
    DOM.questionContainer.innerHTML = '<div style="padding:40px;text-align:center;color:red;">Error: Cannot load question</div>';
    return;
  }
  
  var q = currentQuestions[currentIndex];
  if (!q) {
    DOM.questionContainer.innerHTML = '<div style="padding:40px;text-align:center;color:red;">Error: Invalid question data</div>';
    return;
  }
  
  var answered = userAnswers[currentIndex];
  updateProgressDisplay();
  
  var actualNumber = q.originalNumber || (currentStartNumber + currentIndex);
  var headerText = LANG.qPrefix + ' ' + (currentIndex + 1) + ' ' + LANG.of + ' ' + currentQuestions.length + ' ' + LANG.originalPrefix + actualNumber + LANG.originalSuffix;
  if (isReviewMode) {
    headerText = LANG.reviewModeQuestionPrefix + ' ' + (currentIndex + 1) + ' ' + LANG.of + ' ' + currentQuestions.length + ' ' + LANG.originalPrefix + actualNumber + LANG.originalSuffix;
  }
  
  var hasChoices = hasRealChoices(q);
  var isSubjective = !hasChoices;
  var passageHtml = '';
  var displayPassage = q.passage || '';
  if (displayPassage && displayPassage.trim() !== '' && displayPassage.trim() !== 'No passage.') {
    passageHtml = '<div style="background:#f8f9fa;padding:15px;border-radius:8px;margin:10px 0;border:1px solid #dee2e6;">' +
      '<div style="white-space:pre-wrap;font-size:15px;line-height:1.7;">' +
      escapeHtml(displayPassage) + '</div>' +
      '</div>';
  }
  
  if (isSubjective) {
    renderSubjectiveQuestion(q, answered, headerText, passageHtml);
    return;
  }
  
  var validKeys = getValidChoiceKeys(q.choices);
  var originalAnswerKey = String(q.answer);
  var originalAnswerText = q.choices[originalAnswerKey] || '';
  var actualAnswerKey = null;
  for (var i = 0; i < validKeys.length; i++) {
    var key = validKeys[i];
    if (q.choices[key] === originalAnswerText) {
      actualAnswerKey = key;
      break;
    }
  }
  var displayAnswer = actualAnswerKey !== null ? validKeys.indexOf(actualAnswerKey) + 1 : parseInt(originalAnswerKey);
  
  var html = '<div class="question-card">' +
    '<div class="q-num">' + headerText + '</div>' +
    passageHtml +
    renderGraphic(q.graphic) +
    '<div class="question-text">' + escapeHtml(q.question || 'No question text') + '</div>' +
    '<div class="choices">';
  
  for (var idx = 0; idx < validKeys.length; idx++) {
    var key = validKeys[idx];
    var choiceNum = parseInt(key);
    var letter = getAnswerLetter(idx + 1);
    var choiceText = q.choices[key] || 'Option ' + letter;
    var isSelected = (answered === choiceNum);
    var isCorrectChoice = (choiceNum === displayAnswer);
    var showCorrect = (answered !== null && answered !== undefined && answered !== -1);
    var cls = 'choice';
    if (showCorrect) {
      cls += ' disabled';
      if (isCorrectChoice) cls += ' correct';
      if (isSelected && !isCorrectChoice) cls += ' incorrect';
    }
    html += '<div class="' + cls + '" data-choice="' + choiceNum + '">' +
      '<span class="choice-letter">' + letter + '</span>' +
      '<span>' + escapeHtml(choiceText) + '</span>' +
      '</div>';
  }
  html += '</div></div>';
  
  DOM.questionContainer.innerHTML = html;
  
  var choiceEls = DOM.questionContainer.querySelectorAll('.choice:not(.disabled)');
  choiceEls.forEach(function(el) {
    el.addEventListener('click', function() {
      var choice = parseInt(el.getAttribute('data-choice'));
      if (isNaN(choice)) return;
      userAnswers[currentIndex] = choice;
      if (choice === displayAnswer) correctCount++;
      saveProgress();
      renderCurrentQuestion();
      showExplanation();
    });
  });
  
  if (answered !== null && answered !== undefined && answered !== -1) {
    showExplanation();
  } else {
    DOM.explanationBox.classList.remove('show');
  }
  
  var isLastQuestion = (currentIndex >= currentQuestions.length - 1);
  if (isLastQuestion) {
    DOM.nextBtn.style.display = 'none';
    DOM.submitBtn.style.display = 'inline-block';
    DOM.submitBtn.innerHTML = 'SUBMIT (Enter)';
    var isAnswered = (answered !== null && answered !== undefined && answered !== -1);
    DOM.submitBtn.disabled = !isAnswered;
    DOM.submitBtn.style.background = isAnswered ? '#27ae60' : '#95a5a6';
    DOM.submitBtn.style.color = isAnswered ? 'white' : '#666';
  } else {
    DOM.nextBtn.style.display = 'inline-block';
    DOM.nextBtn.innerHTML = 'NEXT (N)';
    DOM.submitBtn.style.display = 'none';
  }
  DOM.prevBtn.disabled = (currentIndex === 0);
}

function showExplanation() {
  var q = currentQuestions[currentIndex];
  var ans = userAnswers[currentIndex];
  if (!q || ans === null || ans === undefined || ans === -1) {
    DOM.explanationBox.classList.remove('show');
    return;
  }
  var hasChoices = hasRealChoices(q);
  if (!hasChoices) {
    var correctAns = '';
    if (q.A && q.A !== '') {
      correctAns = String(q.A).trim();
    } else if (q.answer && q.answer !== '' && q.answer !== '0') {
      correctAns = String(q.answer).trim();
    } else {
      correctAns = 'Answer not available';
    }
    var userAns = String(ans).trim();
    var isCorrect = (userAns === correctAns) || (parseFloat(userAns) === parseFloat(correctAns));
    var statusColor = isCorrect ? '#27ae60' : '#e74c3c';
    DOM.explanationText.innerHTML =
      '<div style="background:' + statusColor + ';color:white;padding:8px 16px;border-radius:6px;display:inline-block;font-weight:700;margin-bottom:15px;">' +
      'Answer: ' + escapeHtml(correctAns) +
      '</div>' +
      '<div style="margin-top:8px;font-size:14px;color:#555;">' +
      'Your answer: <strong>' + escapeHtml(userAns) + '</strong>' +
      '</div>' +
      '<p style="margin-top:12px;">' + escapeHtml(q.explanation || LANG.noExplanation) + '</p>';
    DOM.explanationBox.classList.add('show');
    return;
  }
  var validKeys = getValidChoiceKeys(q.choices);
  var originalAnswerKey = String(q.answer);
  var originalAnswerText = q.choices[originalAnswerKey] || '';
  var actualAnswerKey = null;
  for (var i = 0; i < validKeys.length; i++) {
    var key = validKeys[i];
    if (q.choices[key] === originalAnswerText) {
      actualAnswerKey = key;
      break;
    }
  }
  var displayAnswerIndex = actualAnswerKey !== null ? validKeys.indexOf(actualAnswerKey) + 1 : parseInt(originalAnswerKey);
  var userAnswerLetter = getAnswerLetter(ans);
  var correctAnswerLetter = getAnswerLetter(displayAnswerIndex);
  var isCorrect = (ans === displayAnswerIndex);
  var statusColor = isCorrect ? '#27ae60' : '#e74c3c';
  DOM.explanationText.innerHTML =
    '<div style="background:' + statusColor + ';color:white;padding:8px 16px;border-radius:6px;display:inline-block;font-weight:700;margin-bottom:15px;">' +
    'Answer: ' + correctAnswerLetter +
    '</div>' +
    '<div style="margin-top:8px;font-size:14px;color:#555;">' +
    'Your answer: <strong>' + userAnswerLetter + '</strong>' +
    '</div>' +
    '<p style="margin-top:12px;">' + escapeHtml(q.explanation || LANG.noExplanation) + '</p>';
  DOM.explanationBox.classList.add('show');
}

// ================================================================
// 9. 타이머 및 내비게이션
// ================================================================
var timerSeconds = 134 * 60;
var timerInterval = null;
var timerRunning = false;
var timerPaused = false;

function formatTimer(seconds) {
  var hrs = Math.floor(seconds / 3600);
  var mins = Math.floor((seconds % 3600) / 60);
  var secs = seconds % 60;
  return String(hrs).padStart(2, '0') + ':' + 
         String(mins).padStart(2, '0') + ':' + 
         String(secs).padStart(2, '0');
}

function updateTimerDisplay() {
  var display = document.getElementById('timerDisplay');
  if (display) {
    display.textContent = formatTimer(timerSeconds);
    if (timerSeconds < 300) {
      display.classList.add('warning');
    } else {
      display.classList.remove('warning');
    }
  }
}

function startTimer() {
  if (timerInterval) return;
  timerRunning = true;
  timerPaused = false;
  var btn = document.getElementById('timerPauseBtn');
  if (btn) btn.textContent = '⏸ Pause';
  timerInterval = setInterval(function() {
    if (timerSeconds > 0) {
      timerSeconds--;
      updateTimerDisplay();
      if (timerSeconds === 0) {
        clearInterval(timerInterval);
        timerInterval = null;
        timerRunning = false;
        alert('⏰ Time is up!');
      }
    }
  }, 1000);
}

function pauseTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
    timerRunning = false;
    timerPaused = true;
    var btn = document.getElementById('timerPauseBtn');
    if (btn) btn.textContent = '▶ Resume';
  } else if (timerPaused) {
    startTimer();
  }
}

function resetTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  timerSeconds = 134 * 60;
  timerRunning = false;
  timerPaused = false;
  var btn = document.getElementById('timerPauseBtn');
  if (btn) btn.textContent = '⏸ Pause';
  updateTimerDisplay();
}

function goNext() {
  if (currentIndex < currentQuestions.length - 1) {
    currentIndex++;
    renderCurrentQuestion();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function goPrev() {
  if (currentIndex > 0) {
    currentIndex--;
    renderCurrentQuestion();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function skipQuestion() {
  if (userAnswers[currentIndex] === null || userAnswers[currentIndex] === undefined) {
    userAnswers[currentIndex] = -1;
    saveProgress();
  }
  if (currentIndex < currentQuestions.length - 1) {
    currentIndex++;
    renderCurrentQuestion();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function submitSubjective() {
  var input = document.getElementById('subjectiveInput');
  if (!input) return;
  var userAnswer = input.value.trim();
  if (userAnswer === "") {
    alert('Please enter your answer.');
    return;
  }
  var q = currentQuestions[currentIndex];
  var correctAnswer = '';
  if (q.A && q.A !== '') {
    correctAnswer = String(q.A).trim();
  } else if (q.answer && q.answer !== '' && q.answer !== '0') {
    correctAnswer = String(q.answer).trim();
  } else {
    correctAnswer = userAnswer;
  }
  var isCorrect = (userAnswer === correctAnswer) || (parseFloat(userAnswer) === parseFloat(correctAnswer));
  userAnswers[currentIndex] = userAnswer;
  if (isCorrect) correctCount++;
  saveProgress();
  renderCurrentQuestion();
}

// ================================================================
// 10. 결과 및 저장
// ================================================================
function saveProgress() {
  try {
    var data = {
      currentQuestions: currentQuestions,
      userAnswers: userAnswers,
      currentIndex: currentIndex,
      correctCount: correctCount,
      currentStartNumber: currentStartNumber,
      isReviewMode: isReviewMode,
      originalQuestions: originalQuestions,
      masterQuestions: masterQuestions,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch(e) {
    console.warn('Save failed:', e);
    return false;
  }
}

function loadProgress() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch(e) {
    console.warn('Load failed:', e);
    return null;
  }
}

function clearProgress() {
  localStorage.removeItem(STORAGE_KEY);
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval);
    autoSaveInterval = null;
  }
}

function startAutoSave() {
  if (autoSaveInterval) clearInterval(autoSaveInterval);
  autoSaveInterval = setInterval(function() {
    saveProgress();
  }, 5000);
}

// ================================================================
// 11. 메인 초기화
// ================================================================
function updateProgressDisplay() {
  var total = currentQuestions.length || 1;
  var percent = ((currentIndex + 1) / total) * 100;
  if (DOM.quizProgressBar) DOM.quizProgressBar.style.width = percent + '%';
  if (DOM.progressText) {
    DOM.progressText.style.display = 'inline-block';
    DOM.progressText.innerText = (currentIndex + 1) + ' / ' + total;
  }
}

function showLoadingOverlay(message) {
  var overlay = document.createElement('div');
  overlay.id = 'loadingOverlay';
  overlay.className = 'loading-overlay';
  overlay.innerHTML = '<div class="loading-spinner"></div><h3>' + message + '</h3>';
  document.body.appendChild(overlay);
  return overlay;
}

function hideLoadingOverlay() {
  var overlay = document.getElementById('loadingOverlay');
  if (overlay) overlay.remove();
}

// ================================================================
// 12. API 호출 함수 (강화된 graphic 처리)
// ================================================================
async function load50Questions(uiStartNumber) {
  if (TOTAL_QUESTIONS === 0) await detectTotalQuestions();
  try {
    var url = API_URL + '?start=' + uiStartNumber + '&limit=' + QUESTIONS_PER_SET;
    console.log('📡 Requesting questions:', url);
    
    var response = await fetch(url);
    if (!response.ok) throw new Error('HTTP ' + response.status);
    
    var text = await response.text();
    console.log('📡 Response length:', text.length);
    
    if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
      throw new Error('HTML response - check API URL');
    }
    
    var data = JSON.parse(text);
    console.log('📡 Data type:', typeof data);
    console.log('📡 Is array?', Array.isArray(data));
    
    var questionsData = [];
    if (Array.isArray(data)) {
      questionsData = data;
    } else if (data && typeof data === 'object') {
      if (Array.isArray(data.data)) questionsData = data.data;
      else if (Array.isArray(data.questions)) questionsData = data.questions;
      else if (Array.isArray(data.items)) questionsData = data.items;
      else {
        var keys = Object.keys(data);
        if (keys.length > 0) {
          questionsData = keys.map(function(key) {
            var item = data[key];
            if (typeof item === 'object' && item !== null) {
              item._key = key;
              return item;
            }
            return { question: String(item), answer: '1', _key: key };
          });
        }
      }
    }
    
    if (!Array.isArray(questionsData) || questionsData.length === 0) {
      throw new Error('No question data received');
    }
    
    console.log('✅ Processing ' + questionsData.length + ' questions');
    
    var processed = [];
    for (var idx = 0; idx < questionsData.length; idx++) {
      try {
        var item = questionsData[idx];
        var parsed = item;
        
        if (typeof item === 'string') {
          try { parsed = JSON.parse(item); } catch(e) { parsed = { question: item, answer: '1' }; }
        }
        
        if (!parsed || typeof parsed !== 'object') {
          parsed = { question: String(item), answer: '1' };
        }
        
        var questionText = parsed.Q || parsed.question || parsed.q || parsed.문제 || parsed.text || 'Question ' + (uiStartNumber + idx);
        var passageText = parsed.passage || parsed.P || parsed.p || parsed.지문 || '';
        
        var choices = {};
        choices['1'] = parsed['1'] || parsed.choice1 || 'Option A';
        choices['2'] = parsed['2'] || parsed.choice2 || 'Option B';
        choices['3'] = parsed['3'] || parsed.choice3 || 'Option C';
        choices['4'] = parsed['4'] || parsed.choice4 || 'Option D';
        choices['5'] = parsed['5'] || parsed.choice5 || 'Option E';
        choices['6'] = parsed['6'] || parsed.choice6 || 'Option F';
        
        var finalAnswer = '1';
        if (parsed.A !== undefined && parsed.A !== null && parsed.A !== "") {
          finalAnswer = String(parsed.A).trim();
        } else if (parsed.answer !== undefined && parsed.answer !== null && parsed.answer !== "") {
          finalAnswer = String(parsed.answer).trim();
        } else if (parsed.정답 !== undefined && parsed.정답 !== null && parsed.정답 !== "") {
          finalAnswer = String(parsed.정답).trim();
        } else if (parsed.a !== undefined && parsed.a !== null && parsed.a !== "") {
          finalAnswer = String(parsed.a).trim();
        }
        
        var originalNumber = parsed.N || parsed.originalNumber || parsed.n || (uiStartNumber + idx);
        
        // ★★★★★ GRAPHIC 필드 처리 (강화)
        var graphicField = parsed.graphic || parsed.G || parsed.g || parsed.그래픽 || parsed.P_graph || '';
        
        // graphic이 객체면 문자열로 변환
        if (typeof graphicField === 'object' && graphicField !== null) {
          try {
            graphicField = JSON.stringify(graphicField);
          } catch(e) {
            graphicField = '';
          }
        }
        
        // graphic이 문자열이면 정리
        if (typeof graphicField === 'string') {
          graphicField = graphicField.trim();
          // 이스케이프된 따옴표 정리
          graphicField = graphicField.replace(/\\"/g, '"');
          graphicField = graphicField.replace(/\\\\/g, '\\');
        }
        
        processed.push({
          N: originalNumber,
          question: questionText,
          passage: passageText,
          choices: choices,
          answer: finalAnswer,
          explanation: parsed.explanation || parsed.E || parsed.e || parsed.해설 || 'No explanation available.',
          graphic: graphicField,
          originalNumber: originalNumber,
          A: parsed.A || parsed.answer || parsed.정답 || ''
        });
        
        if (idx === 0) {
          console.log('📝 First question mapped:', processed[0]);
          console.log('📝 Graphic type:', typeof processed[0].graphic);
          console.log('📝 Graphic preview:', String(processed[0].graphic).substring(0, 100));
        }
      } catch(e) {
        console.warn('⚠️ Parse error for item', idx, ':', e);
      }
    }
    
    if (processed.length === 0) {
      throw new Error('No valid question data');
    }
    
    console.log('✅ Successfully parsed ' + processed.length + ' questions');
    return processed;
  } catch(err) {
    console.error('❌ Load failed:', err);
    return [];
  }
}

async function detectTotalQuestions() {
  localStorage.removeItem(TOTAL_CACHE_KEY);
  console.log('Cache cleared, fetching fresh data...');
  
  try {
    var url = API_URL + '?total=true&_=' + Date.now();
    console.log('📡 Requesting total:', url);
    
    var response = await fetch(url);
    if (!response.ok) throw new Error('HTTP ' + response.status);
    
    var text = await response.text();
    console.log('📡 Response text (first 200 chars):', text.substring(0, 200));
    
    if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
      throw new Error('HTML response - check API URL');
    }
    
    var data = JSON.parse(text);
    console.log('📡 Total API response:', data);
    
    var total = 0;
    if (data && typeof data === 'object') {
      if (typeof data.total === 'number') total = data.total;
      else if (typeof data.count === 'number') total = data.count;
      else if (typeof data.length === 'number') total = data.length;
    }
    
    if (total > 0) {
      TOTAL_QUESTIONS = total;
      localStorage.setItem(TOTAL_CACHE_KEY, String(TOTAL_QUESTIONS));
      console.log('✅ Total questions: ' + TOTAL_QUESTIONS);
      return TOTAL_QUESTIONS;
    }
    
    console.warn('⚠️ Could not detect total, using fallback: 360');
  } catch(e) {
    console.error('❌ Total API call failed:', e.message);
  }
  
  TOTAL_QUESTIONS = 360;
  localStorage.setItem(TOTAL_CACHE_KEY, String(TOTAL_QUESTIONS));
  return TOTAL_QUESTIONS;
}

function updateSetSelector() {
  var setSelector = document.getElementById('setSelector');
  if (!setSelector) return;
  
  while (setSelector.options.length > 0) {
    setSelector.remove(0);
  }
  
  var totalQuestions = TOTAL_QUESTIONS > 0 ? TOTAL_QUESTIONS : 360;
  var totalSets = Math.ceil(totalQuestions / QUESTIONS_PER_SET);
  console.log('📊 Total Sets: ' + totalSets + ' (Questions: ' + totalQuestions + ')');
  
  for (var i = 1; i <= totalSets; i++) {
    var start = (i - 1) * QUESTIONS_PER_SET + 1;
    var end = Math.min(i * QUESTIONS_PER_SET, totalQuestions);
    var option = document.createElement('option');
    option.value = i;
    option.textContent = 'Set ' + i + ' (Questions ' + start + '-' + end + ')';
    setSelector.appendChild(option);
  }
  
  var maxStartNumber = Math.max(1, totalQuestions - QUESTIONS_PER_SET + 1);
  if (DOM.maxNumberDisplay) {
    DOM.maxNumberDisplay.innerText = maxStartNumber.toLocaleString();
  }
  if (DOM.startNumberInput) {
    DOM.startNumberInput.placeholder = '1 ~ ' + maxStartNumber.toLocaleString();
    DOM.startNumberInput.max = maxStartNumber;
  }
  
  if (setSelector.options.length > 0) {
    setSelector.value = '1';
  }
  if (DOM.startNumberInput) {
    DOM.startNumberInput.value = '1';
  }
}

async function startQuizWithNumber(uiStartNumber) {
  if (isNaN(uiStartNumber) || uiStartNumber < 1) uiStartNumber = 1;
  
  if (uiStartNumber > TOTAL_QUESTIONS) {
    console.log('🔄 Number ' + uiStartNumber + ' exceeds total ' + TOTAL_QUESTIONS + '. Looping back to 1.');
    uiStartNumber = 1;
  }
  
  var setNumber = Math.ceil(uiStartNumber / QUESTIONS_PER_SET);
  var setStart = (setNumber - 1) * QUESTIONS_PER_SET + 1;
  
  var startNum = uiStartNumber;
  if (uiStartNumber < setStart || uiStartNumber > Math.min(setNumber * QUESTIONS_PER_SET, TOTAL_QUESTIONS)) {
    startNum = setStart;
  }
  
  currentStartNumber = startNum;
  
  var overlay = showLoadingOverlay('Loading ' + QUESTIONS_PER_SET + ' questions from ' + startNum + '...');
  try {
    var questions = await load50Questions(startNum);
    if (questions.length === 0) throw new Error('No question data received');
    masterQuestions = questions.slice();
    currentQuestions = masterQuestions.map(function(q) { 
      // graphic이 객체면 문자열로 변환
      if (q.graphic && typeof q.graphic === 'object') {
        try {
          q.graphic = JSON.stringify(q.graphic);
        } catch(e) {}
      }
      return q; 
    });
    userAnswers = new Array(currentQuestions.length).fill(null);
    correctCount = 0;
    currentIndex = 0;
    isReviewMode = false;
    startAutoSave();
    hideLoadingOverlay();
    DOM.setupSection.style.display = 'none';
    DOM.quizMain.style.display = 'block';
    
    if (DOM.quizContent) {
      DOM.quizContent.style.display = 'block';
    }
    if (DOM.progressArea) {
      DOM.progressArea.style.display = 'flex';
    }
    
    renderCurrentQuestion();
    
    resetTimer();
    startTimer();
    
  } catch(err) {
    hideLoadingOverlay();
    alert(LANG.loadError + ' ' + err.message);
    console.error(err);
  }
}

function initialize() {
  DOM.setupSection = document.getElementById('setupSection');
  DOM.quizMain = document.getElementById('quizMain');
  DOM.quizContent = document.getElementById('quizContent');
  DOM.startNumberInput = document.getElementById('startNumber');
  DOM.startQuizBtn = document.getElementById('startQuizBtn');
  DOM.maxNumberSpan = document.getElementById('maxNumber');
  DOM.progressText = document.getElementById('progressText');
  DOM.quizProgressBar = document.getElementById('quizProgressBar');
  DOM.questionContainer = document.getElementById('questionContainer');
  DOM.explanationBox = document.getElementById('explanationBox');
  DOM.explanationText = document.getElementById('explanationText');
  DOM.prevBtn = document.getElementById('prevBtn');
  DOM.nextBtn = document.getElementById('nextBtn');
  DOM.skipBtn = document.getElementById('skipBtn');
  DOM.submitBtn = document.getElementById('submitBtn');
  DOM.quitBtn = document.getElementById('quitBtn');
  DOM.resultModal = document.getElementById('resultModal');
  DOM.correctCountSpan = document.getElementById('correctCount');
  DOM.accuracyRateSpan = document.getElementById('accuracyRate');
  DOM.resultGrid = document.getElementById('resultGrid');
  DOM.retryAllBtn = document.getElementById('retryAllBtn');
  DOM.reviewWrongBtn = document.getElementById('reviewWrongBtn');
  DOM.closeModalBtn = document.getElementById('closeModalBtn');
  DOM.wrongModal = document.getElementById('wrongModal');
  DOM.wrongListDiv = document.getElementById('wrongList');
  DOM.closeWrongBtn = document.getElementById('closeWrongBtn');
  DOM.retryWrongFromReviewBtn = document.getElementById('retryWrongFromReviewBtn');
  DOM.reviewBanner = document.getElementById('reviewBanner');
  DOM.savedBadgeContainer = document.getElementById('savedBadgeContainer');
  DOM.loadNextContainer = document.getElementById('loadNextContainer');
  DOM.mainContainer = document.getElementById('mainContainer');
  DOM.maxNumberDisplay = document.getElementById('maxNumberDisplay');
  DOM.setSelector = document.getElementById('setSelector');
  DOM.progressArea = document.querySelector('.progress-area');
  if (!DOM.progressArea) {
    DOM.progressArea = document.getElementById('progressArea');
  }

  initTimer();

  setTimeout(async function() {
    try {
      await detectTotalQuestions();
      
      if (TOTAL_QUESTIONS === 0) {
        TOTAL_QUESTIONS = 720;
        localStorage.setItem(TOTAL_CACHE_KEY, String(TOTAL_QUESTIONS));
      }
      
      updateSetSelector();
      
      var maxStartNumber = TOTAL_QUESTIONS;
      console.log('📊 Total questions: ' + TOTAL_QUESTIONS);
      
      if (DOM.maxNumberSpan) DOM.maxNumberSpan.style.display = 'none';
      if (DOM.maxNumberDisplay) DOM.maxNumberDisplay.style.display = 'none';
      
      DOM.startNumberInput.placeholder = '1-' + TOTAL_QUESTIONS;
      DOM.startNumberInput.max = TOTAL_QUESTIONS;
      DOM.startNumberInput.min = 1;
      
      if (DOM.setSelector) {
        DOM.setSelector.addEventListener('change', function() {
          var setNum = parseInt(this.value);
          if (!isNaN(setNum) && setNum >= 1) {
            var startNum = (setNum - 1) * QUESTIONS_PER_SET + 1;
            DOM.startNumberInput.value = startNum;
            console.log('Set ' + setNum + ' selected, starting from question ' + startNum);
          }
        });
        if (DOM.setSelector.options.length > 0) {
          DOM.setSelector.value = '1';
          DOM.startNumberInput.value = '';
        }
      }
      
      var saved = loadProgress();
      if (saved && saved.currentQuestions && saved.currentQuestions.length > 0) {
        var answered = saved.userAnswers.filter(function(a) { return a !== null && a !== -1; }).length;
        var timeStr = new Date(saved.timestamp).toLocaleString();
        DOM.savedBadgeContainer.innerHTML =
          '<div class="resume-badge" id="resumeBadge">' +
          '<div class="count">' + answered + ' / ' + saved.currentQuestions.length + ' answered</div>' +
          '<div class="time">' + timeStr + '</div>' +
          '<div class="hint">Click to resume</div>' +
          '</div>';
        var resumeBadge = document.getElementById('resumeBadge');
        if (resumeBadge) {
          resumeBadge.addEventListener('click', function(e) {
            e.stopPropagation();
            var savedData = loadProgress();
            if (savedData) showProgressModal(savedData);
          });
        }
        var resumeCard = document.getElementById('resumeCard');
        if (resumeCard) {
          var newCard = resumeCard.cloneNode(true);
          resumeCard.parentNode.replaceChild(newCard, resumeCard);
          newCard.addEventListener('click', function() {
            var savedData = loadProgress();
            if (savedData) showProgressModal(savedData);
          });
        }
      } else {
        DOM.savedBadgeContainer.innerHTML = '<div class="no-session">' +
          'No saved session' +
          '<small>Start a new lesson</small>' +
          '</div>';
      }
      
      attachEvents();
      
      setTimeout(function() {
        DOM.startNumberInput.focus();
        DOM.startNumberInput.select();
        console.log('✅ Initialization complete: ' + TOTAL_QUESTIONS + ' total questions');
      }, 400);
    } catch(e) {
      console.error('Initialization error:', e);
    }
  }, 300);
}

function showProgressModal(saved) {
  var answered = saved.userAnswers.filter(function(a) { return a !== null && a !== -1; }).length;
  var total = saved.currentQuestions.length;
  var progress = saved.currentIndex + 1;
  var body = document.getElementById('progressModalBody');
  body.innerHTML = '<div style="padding:10px 0;">' +
    '<p style="font-size:22px;font-weight:700;color:#2c3e50;text-align:center;margin-bottom:10px;">📊 Resume Session</p>' +
    '<div style="background:#f8f9fa;border-radius:12px;padding:16px 20px;margin:15px 0;">' +
    '<div style="display:flex;justify-content:space-between;padding:4px 0;"><span>Progress</span><strong>' + progress + ' / ' + total + '</strong></div>' +
    '<div style="display:flex;justify-content:space-between;padding:4px 0;"><span>Answered</span><strong>' + answered + ' / ' + total + '</strong></div>' +
    '<div style="display:flex;justify-content:space-between;padding:4px 0;"><span>Correct</span><strong>' + (saved.correctCount || 0) + '</strong></div>' +
    '</div>' +
    '<p style="font-size:13px;color:#999;text-align:center;margin-top:10px;">' +
    'Click <strong>"Continue"</strong> to resume. Click <strong>"Start Fresh"</strong> to begin again.' +
    '</p>' +
    '</div>';
  document.getElementById('progressModal').setAttribute('data-saved', JSON.stringify(saved));
  document.getElementById('progressModal').style.display = 'flex';
}

function resumeProgress(saved) {
  currentQuestions = saved.currentQuestions;
  userAnswers = saved.userAnswers;
  currentIndex = saved.currentIndex || 0;
  correctCount = saved.correctCount || 0;
  currentStartNumber = saved.currentStartNumber || 1;
  isReviewMode = saved.isReviewMode || false;
  if (saved.masterQuestions) masterQuestions = saved.masterQuestions;
  if (saved.originalQuestions) originalQuestions = saved.originalQuestions;
  startAutoSave();
  DOM.setupSection.style.display = 'none';
  DOM.quizMain.style.display = 'block';
  if (DOM.quizContent) DOM.quizContent.style.display = 'block';
  if (DOM.progressArea) DOM.progressArea.style.display = 'flex';
  if (isReviewMode) {
    DOM.reviewBanner.style.display = 'block';
    DOM.reviewBanner.innerHTML = '<span>Review Mode: ' + currentQuestions.length + ' questions</span>' +
      '<button id="exitReviewBtn" class="exit-review-btn">EXIT REVIEW</button>';
    document.getElementById('exitReviewBtn').addEventListener('click', function() {
      clearProgress();
      window.location.reload();
    });
  }
  renderCurrentQuestion();
}

function attachEvents() {
  var continueBtn = document.getElementById('progressContinueBtn');
  if (continueBtn) {
    continueBtn.addEventListener('click', function() {
      var modal = document.getElementById('progressModal');
      var savedData = modal.getAttribute('data-saved');
      if (savedData) {
        var saved = JSON.parse(savedData);
        modal.style.display = 'none';
        resumeProgress(saved);
      }
    });
  }
  var cancelBtn = document.getElementById('progressCancelBtn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', function() {
      var modal = document.getElementById('progressModal');
      modal.style.display = 'none';
      clearProgress();
      var startNum = parseInt(document.getElementById('startNumber').value) || 1;
      startQuizWithNumber(startNum);
    });
  }
  DOM.startQuizBtn.addEventListener('click', function() {
    var startNum = parseInt(DOM.startNumberInput.value);
    if (isNaN(startNum) || DOM.startNumberInput.value === "") startNum = 1;
    if (startNum < 1) startNum = 1;
    if (startNum > TOTAL_QUESTIONS) startNum = TOTAL_QUESTIONS;
    clearProgress();
    startQuizWithNumber(startNum);
  });
  DOM.startNumberInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      DOM.startQuizBtn.click();
    }
  });
  DOM.prevBtn.addEventListener('click', goPrev);
  DOM.nextBtn.addEventListener('click', goNext);
  DOM.skipBtn.addEventListener('click', skipQuestion);
  DOM.submitBtn.addEventListener('click', showResults);
  DOM.quitBtn.addEventListener('click', function() {
    saveProgress();
    if (confirm(LANG.confirmExit)) window.location.reload();
  });
  DOM.retryAllBtn.addEventListener('click', function() {
    clearProgress();
    DOM.resultModal.style.display = 'none';
    startQuizWithNumber(currentStartNumber);
  });
  DOM.reviewWrongBtn.addEventListener('click', function() {
    DOM.resultModal.style.display = 'none';
    showWrongAnswersList();
  });
  DOM.closeModalBtn.addEventListener('click', function() {
    DOM.resultModal.style.display = 'none';
  });
  DOM.closeWrongBtn.addEventListener('click', function() {
    DOM.wrongModal.style.display = 'none';
  });
  DOM.retryWrongFromReviewBtn.addEventListener('click', startWrongOnlyReview);
  document.getElementById('splashRetry').addEventListener('click', function() {
    document.getElementById('splashError').style.display = 'none';
    document.getElementById('splashRetry').style.display = 'none';
    document.getElementById('splashStatus').textContent = 'Retrying...';
    initialize();
  });
  attachKeyboardEvents();
}

function attachKeyboardEvents() {
  document.addEventListener('keydown', function(event) {
    if (event.ctrlKey && (event.key === 'c' || event.key === 'v' || event.key === 'x' || event.key === 'a' ||
        event.key === 'C' || event.key === 'V' || event.key === 'X' || event.key === 'A')) {
      return;
    }
    if (!DOM.quizContent || DOM.quizContent.style.display === 'none' || DOM.quizContent.style.display === '') return;
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;
    var key = event.key;
    if (key === 'n' || key === 'N' || key === 'L') {
      event.preventDefault();
      if (currentIndex < currentQuestions.length - 1) goNext();
      return;
    }
    if (key === 'p' || key === 'P' || key === 'H') {
      event.preventDefault();
      if (currentIndex > 0) goPrev();
      return;
    }
    if (key === 's' || key === 'S' || key === 'A') {
      event.preventDefault();
      skipQuestion();
      return;
    }
    if (key === 'Enter') {
      if (currentIndex >= currentQuestions.length - 1 && DOM.submitBtn && DOM.submitBtn.style.display !== 'none') {
        var isAnswered = (userAnswers[currentIndex] !== null && userAnswers[currentIndex] !== undefined && userAnswers[currentIndex] !== -1);
        if (isAnswered) {
          event.preventDefault();
          showResults();
        }
      }
      return;
    }
    if (key === 'ArrowLeft') {
      event.preventDefault();
      if (currentIndex > 0) goPrev();
      return;
    }
    if (key === 'ArrowRight') {
      event.preventDefault();
      if (currentIndex < currentQuestions.length - 1) goNext();
      return;
    }
  });
}

function getWrongSkippedUnansweredIndices() {
  var result = [];
  for (var i = 0; i < currentQuestions.length; i++) {
    var q = currentQuestions[i];
    var ans = userAnswers[i];
    var isUnanswered = (ans === null || ans === undefined);
    var isSkipped = (ans === -1);
    var isSubjective = isSubjectiveQuestion(q);
    var isIncorrect = false;
    if (!isUnanswered && !isSkipped) {
      if (isSubjective) {
        var correctAns = q.A || q.answer || '';
        isIncorrect = !(String(ans).trim() === String(correctAns).trim());
      } else {
        isIncorrect = (ans !== parseInt(q.answer));
      }
    }
    if (isUnanswered || isSkipped || isIncorrect) result.push(i);
  }
  return result;
}

function showResults() {
  saveProgress();
  var answeredCount = userAnswers.filter(function(a) { return a !== null && a !== undefined && a !== -1; }).length;
  var accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
  DOM.correctCountSpan.innerHTML = correctCount + ' / ' + answeredCount;
  DOM.accuracyRateSpan.innerHTML = accuracy + '%';
  var gridHtml = '<div style="display:grid;grid-template-columns:repeat(10,1fr);gap:6px;">';
  for (var i = 0; i < currentQuestions.length; i++) {
    var ans = userAnswers[i];
    var isCorrect = (ans !== null && ans !== undefined && ans !== -1 && ans === parseInt(currentQuestions[i].answer));
    var isSkipped = (ans === -1);
    var isUnanswered = (ans === null || ans === undefined);
    var statusClass = isCorrect ? 'correct' : isSkipped ? 'skipped' : isUnanswered ? 'unanswered' : 'incorrect';
    gridHtml += '<div class="result-item ' + statusClass + '" data-qidx="' + i + '">' + (i + 1) + '</div>';
  }
  gridHtml += '</div>';
  DOM.resultGrid.innerHTML = gridHtml;
  DOM.resultGrid.querySelectorAll('.result-item[data-qidx]').forEach(function(el) {
    el.addEventListener('click', function() {
      var idx = parseInt(el.getAttribute('data-qidx'));
      currentIndex = idx;
      DOM.resultModal.style.display = 'none';
      renderCurrentQuestion();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
  DOM.resultModal.style.display = 'flex';
}

function showWrongAnswersList() {
  var wrongItems = [];
  for (var i = 0; i < currentQuestions.length; i++) {
    var q = currentQuestions[i];
    var ans = userAnswers[i];
    var isSkipped = (ans === -1);
    var isUnanswered = (ans === null || ans === undefined);
    var isSubjective = isSubjectiveQuestion(q);
    var isIncorrect = false;
    if (!isSkipped && !isUnanswered) {
      if (isSubjective) {
        var correctAns = q.A || q.answer || '';
        isIncorrect = !(String(ans).trim() === String(correctAns).trim());
      } else {
        isIncorrect = (ans !== parseInt(q.answer));
      }
    }
    if (isSkipped || isIncorrect || isUnanswered) {
      var actualNumber = q.originalNumber || (currentStartNumber + i);
      wrongItems.push({ idx: i, actualNumber: actualNumber, q: q, ans: ans, isSkipped: isSkipped, isUnanswered: isUnanswered, isSubjective: isSubjective });
    }
  }
  if (wrongItems.length === 0) {
    alert(LANG.allCorrect);
    return;
  }
  var html = '<p style="margin-bottom:15px;padding:10px;background:#f0f0f0;border-radius:8px;text-align:center;">' +
    LANG.reviewQuestions + ' <strong>' + wrongItems.length + '</strong><br>' +
    LANG.wrongCount + ' ' + wrongItems.filter(function(w) { return !w.isSkipped && !w.isUnanswered; }).length +
    ' | ' + LANG.skippedCount + ' ' + wrongItems.filter(function(w) { return w.isSkipped; }).length +
    ' | ' + LANG.unansweredCount + ' ' + wrongItems.filter(function(w) { return w.isUnanswered; }).length +
    '</p>';
  wrongItems.forEach(function(item) {
    var statusText = item.isSkipped ? LANG.statusSkipped : (item.isUnanswered ? LANG.statusUnanswered : LANG.statusWrong);
    var statusColor = item.isSkipped ? '#f39c12' : (item.isUnanswered ? '#6c757d' : '#e74c3c');
    var userAnswerDisplay = (item.ans === null || item.ans === undefined || item.ans === -1) ? '—' : String(item.ans);
    var correctAnswerDisplay = (item.isSubjective) ? (item.q.A || item.q.answer || '—') : getAnswerLetter(item.q.answer);
    if (!item.isSubjective && !item.isSkipped && !item.isUnanswered) {
      userAnswerDisplay = getAnswerLetter(item.ans);
      correctAnswerDisplay = getAnswerLetter(item.q.answer);
    }
    html += '<div class="wrong-item" style="border-left:5px solid ' + statusColor + '">' +
      '<div style="font-weight:bold;margin-bottom:10px;">' +
      'Question ' + (item.idx + 1) + ' (Original #' + item.actualNumber + ')' +
      '<span class="status-badge" style="background:' + statusColor + ';">' + statusText + '</span>' +
      (item.isSubjective ? ' Subjective' : '') +
      '</div>' +
      '<div style="margin-bottom:12px;"><strong>' + escapeHtml(item.q.question) + '</strong></div>' +
      '<div style="margin-top:12px;padding:10px;background:#f8f9fa;border-radius:8px;">' +
      '<strong>Your answer:</strong> ' + escapeHtml(String(userAnswerDisplay)) +
      '<br><strong>Correct answer:</strong> ' + escapeHtml(String(correctAnswerDisplay)) +
      '</div>' +
      '<div style="margin-top:12px;padding:10px;background:#e8f4fc;border-radius:8px;">' +
      '<strong>Explanation</strong><br>' + escapeHtml(item.q.explanation || LANG.noExplanation) +
      '</div>' +
      '</div>';
  });
  DOM.wrongListDiv.innerHTML = html;
  DOM.wrongModal.style.display = 'flex';
}

function startWrongOnlyReview() {
  var indices = getWrongSkippedUnansweredIndices();
  if (indices.length === 0) {
    alert(LANG.allCorrect);
    return;
  }
  var reviewQuestions = indices.map(function(idx) {
    return currentQuestions[idx];
  });
  currentQuestions = reviewQuestions.slice();
  userAnswers = new Array(currentQuestions.length).fill(null);
  correctCount = 0;
  currentIndex = 0;
  isReviewMode = true;
  DOM.reviewBanner.style.display = 'block';
  DOM.reviewBanner.innerHTML = '<span>Review Mode: ' + currentQuestions.length + ' questions</span>' +
    '<button id="exitReviewBtn" class="exit-review-btn">EXIT REVIEW</button>';
  document.getElementById('exitReviewBtn').addEventListener('click', function() {
    clearProgress();
    window.location.reload();
  });
  DOM.wrongModal.style.display = 'none';
  DOM.resultModal.style.display = 'none';
  renderCurrentQuestion();
  saveProgress();
}

function initTimer() {
  updateTimerDisplay();
  var pauseBtn = document.getElementById('timerPauseBtn');
  var resetBtn = document.getElementById('timerResetBtn');
  if (pauseBtn) pauseBtn.addEventListener('click', pauseTimer);
  if (resetBtn) resetBtn.addEventListener('click', function() {
    if (confirm('Reset timer?')) resetTimer();
  });
}

// ================================================================
// 13. 내보내기
// ================================================================
window.renderGraphic = renderGraphic;
window.renderCurrentQuestion = renderCurrentQuestion;
window.renderSubjectiveQuestion = renderSubjectiveQuestion;
window.showExplanation = showExplanation;
window.goNext = goNext;
window.goPrev = goPrev;
window.skipQuestion = skipQuestion;
window.submitSubjective = submitSubjective;
window.showResults = showResults;
window.showWrongAnswersList = showWrongAnswersList;
window.startWrongOnlyReview = startWrongOnlyReview;
window.saveProgress = saveProgress;
window.loadProgress = loadProgress;
window.clearProgress = clearProgress;
window.startQuizWithNumber = startQuizWithNumber;
window.initialize = initialize;

console.log('✅ main.js loaded successfully');
console.log('✅ renderGraphic function registered globally');
console.log('✅ Supported types: table, bar, stacked-bar, histogram, pie, doughnut, line, scatter, scatter-only, radar, coordinate-plane, shape, dot-plot, box-plot, residual-plot, normal-distribution, gauge');
console.log('✅ SAT/AP complete support ready');
