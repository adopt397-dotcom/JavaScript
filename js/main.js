// ================================================================
// GRAPHICS ENGINE v3.0 - main.js (순수 JavaScript)
// ================================================================

var CONFIG = {
    COLORS: ['#3498db', '#e74c3c', '#27ae60', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#2c3e50', '#7f8c8d', '#16a085', '#d35400', '#c0392b'],
    CHART: { responsive: true, maintainAspectRatio: false, height: '400px' },
    GRID: { color: '#e0e0e0', lineWidth: 0.5 },
    PADDING: 50,
    VERSION: '3.0.0'
};

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

function safeParseJSON(data) {
    if (data === null || data === undefined) return null;
    if (typeof data === 'object') return data;
    var str = String(data);
    if (str.trim() === '') return null;
    if (str === 'null' || str === 'undefined') return null;
    try { return JSON.parse(str); } catch(e) {}
    var cleaned = str;
    for (var i = 0; i < 5; i++) {
        try {
            cleaned = cleaned.replace(/\\"/g, '"');
            cleaned = cleaned.replace(/\\\\/g, '\\');
            if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
                cleaned = cleaned.slice(1, -1);
            }
            if (cleaned.startsWith("'") && cleaned.endsWith("'")) {
                cleaned = cleaned.slice(1, -1);
            }
            var result = JSON.parse(cleaned);
            if (typeof result === 'string') { cleaned = result; continue; }
            return result;
        } catch(e) {}
    }
    try {
        var fixed = str;
        fixed = fixed.replace(/\\\//g, '/');
        fixed = fixed.replace(/\\\\/g, '\\');
        fixed = fixed.replace(/\\"/g, '"');
        if (fixed.startsWith('"') && fixed.endsWith('"')) {
            fixed = fixed.slice(1, -1);
        }
        if (fixed.startsWith("'") && fixed.endsWith("'")) {
            fixed = fixed.slice(1, -1);
        }
        return JSON.parse(fixed);
    } catch(e) {}
    try {
        var manual = str;
        manual = manual.replace(/'/g, '"');
        manual = manual.replace(/\\/g, '');
        manual = manual.replace(/""/g, '"');
        if (manual.startsWith('"') && manual.endsWith('"')) {
            manual = manual.slice(1, -1);
        }
        return JSON.parse(manual);
    } catch(e) {
        console.warn('⚠️ safeParseJSON: All parsing attempts failed');
        return null;
    }
}

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
        .replace(/euler/g, 'Math.E')
        .replace(/\[S\]/g, 'S')
        .replace(/\[s\]/g, 'S');
    try {
        return new Function('x', 'return ' + expr + ';');
    } catch(e) {
        console.warn('⚠️ parseFunction error:', e.message);
        return function(x) { return 0; };
    }
}

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

var chartInstances = {};

function createChart(chartId, config) {
    var canvas = document.getElementById(chartId);
    if (!canvas) { console.warn('⚠️ Canvas not found:', chartId); return null; }
    if (typeof Chart === 'undefined') { console.warn('⚠️ Chart.js not loaded'); return null; }
    if (chartInstances[chartId]) {
        chartInstances[chartId].destroy();
        delete chartInstances[chartId];
    }
    try {
        var instance = new Chart(canvas, config);
        chartInstances[chartId] = instance;
        return instance;
    } catch(e) {
        console.warn('⚠️ Chart creation failed:', e.message);
        return null;
    }
}

function renderWithDelay(chartId, renderFn, delay) {
    delay = delay || 150;
    setTimeout(function() {
        try { renderFn(); } catch(e) { console.warn('⚠️ Render failed:', e.message); }
    }, delay);
}

var GRAPHIC_REGISTRY = {};

function registerRenderer(type, renderFn) {
    GRAPHIC_REGISTRY[type] = renderFn;
}

function getRenderer(type) { return GRAPHIC_REGISTRY[type] || null; }

function getSupportedTypes() { return Object.keys(GRAPHIC_REGISTRY); }

// ================================================================
// SCATTER-ONLY (SAT 단골)
// ================================================================
function renderScatterOnly(parsed) {
    if (!parsed.points || parsed.points.length === 0) {
        return '<div style="padding:10px;color:#999;">No points data</div>';
    }
    var chartId = 'chart_' + Math.random().toString(36).substr(2, 9);
    var html = '<div style="margin:15px 0;padding:15px;background:#f8f9fa;border-radius:8px;border:1px solid #e9ecef;"><canvas id="' + chartId + '" style="max-height:400px;width:100%;"></canvas></div>';
    
    function renderFn() {
        var normalizedPoints = parsed.points.map(function(p) {
            if (Array.isArray(p)) return { x: p[0], y: p[1] };
            return p;
        });
        var config = {
            type: 'scatter',
            data: {
                datasets: [{
                    label: parsed.label || 'Data',
                    data: normalizedPoints,
                    showLine: false,
                    backgroundColor: parsed.color || '#e74c3c',
                    pointRadius: parsed.pointSize || 6,
                    pointBackgroundColor: parsed.color || '#e74c3c'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: parsed.title || parsed.question || 'Scatter Plot', font: { size: 16, weight: 'bold' } }
                },
                scales: {
                    x: { type: 'linear', title: { display: true, text: parsed.xLabel || (parsed.xAxis && parsed.xAxis.label) || 'X' }, grid: { color: '#e0e0e0' },
                        min: parsed.xAxis && parsed.xAxis.min !== undefined ? parsed.xAxis.min : undefined,
                        max: parsed.xAxis && parsed.xAxis.max !== undefined ? parsed.xAxis.max : undefined },
                    y: { type: 'linear', title: { display: true, text: parsed.yLabel || (parsed.yAxis && parsed.yAxis.label) || 'Y' }, grid: { color: '#e0e0e0' },
                        min: parsed.yAxis && parsed.yAxis.min !== undefined ? parsed.yAxis.min : undefined,
                        max: parsed.yAxis && parsed.yAxis.max !== undefined ? parsed.yAxis.max : undefined }
                }
            }
        };
        createChart(chartId, config);
    }
    renderWithDelay(chartId, renderFn, 150);
    return html;
}
registerRenderer('scatter-only', renderScatterOnly);
registerRenderer('scatter', renderScatterOnly);

// ================================================================
// COORDINATE-PLANE (함수 그래프)
// ================================================================
function renderCoordinatePlane(parsed) {
    var chartId = 'chart_' + Math.random().toString(36).substr(2, 9);
    var html = '<div style="margin:15px 0;padding:15px;background:#f8f9fa;border-radius:8px;border:1px solid #e9ecef;"><canvas id="' + chartId + '" style="max-height:400px;width:100%;"></canvas></div>';
    
    function renderFn() {
        var canvas = document.getElementById(chartId);
        if (!canvas) return;
        var W = canvas.width, H = canvas.height, pad = 50;
        var ctx = canvas.getContext('2d');
        
        var xMin = (parsed.xAxis && parsed.xAxis.min !== undefined) ? parsed.xAxis.min : -10;
        var xMax = (parsed.xAxis && parsed.xAxis.max !== undefined) ? parsed.xAxis.max : 10;
        var yMin = (parsed.yAxis && parsed.yAxis.min !== undefined) ? parsed.yAxis.min : -10;
        var yMax = (parsed.yAxis && parsed.yAxis.max !== undefined) ? parsed.yAxis.max : 10;
        var xLabel = (parsed.xAxis && parsed.xAxis.label) || 'x';
        var yLabel = (parsed.yAxis && parsed.yAxis.label) || 'y';
        
        // 그리드
        ctx.save();
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 0.5;
        var tickX = (parsed.xAxis && parsed.xAxis.tick) || 1;
        var tickY = (parsed.yAxis && parsed.yAxis.tick) || 1;
        
        for (var x = Math.ceil(xMin / tickX) * tickX; x <= xMax; x += tickX) {
            var px = toPixelX(x, xMin, xMax, W, pad);
            ctx.beginPath(); ctx.moveTo(px, pad); ctx.lineTo(px, H - pad); ctx.stroke();
            ctx.fillStyle = '#333'; ctx.font = '11px Arial'; ctx.textAlign = 'center';
            ctx.fillText(x, px, H - pad + 16);
        }
        for (var y = Math.ceil(yMin / tickY) * tickY; y <= yMax; y += tickY) {
            var py = toPixelY(y, yMin, yMax, H, pad);
            ctx.beginPath(); ctx.moveTo(pad, py); ctx.lineTo(W - pad, py); ctx.stroke();
            ctx.fillStyle = '#333'; ctx.font = '11px Arial'; ctx.textAlign = 'right';
            ctx.fillText(y, pad - 8, py + 4);
        }
        ctx.fillStyle = '#333'; ctx.font = '13px Arial bold'; ctx.textAlign = 'center';
        ctx.fillText(xLabel, W / 2, H - 6);
        ctx.textAlign = 'center'; ctx.fillText(yLabel, 20, pad - 10);
        ctx.restore();
        
        var datasets = [];
        
        if (parsed.points && parsed.points.length > 0) {
            var pts = parsed.points.map(function(p) { if (Array.isArray(p)) return { x: p[0], y: p[1] }; return p; });
            datasets.push({ label: 'Points', data: pts, showLine: false, backgroundColor: '#e74c3c', pointRadius: 6, pointBackgroundColor: '#e74c3c', pointBorderColor: 'white', pointBorderWidth: 2 });
        }
        
        if (parsed.segments && parsed.segments.length > 0) {
            for (var si = 0; si < parsed.segments.length; si++) {
                var seg = parsed.segments[si];
                datasets.push({ label: seg.label || 'Segment ' + (si+1), data: [{ x: seg.from[0], y: seg.from[1] }, { x: seg.to[0], y: seg.to[1] }], showLine: true, borderColor: seg.color || '#2c3e50', borderWidth: seg.lineWidth || 2, pointRadius: 0, fill: false });
            }
        }
        
        if (parsed.lines) {
            for (var li = 0; li < parsed.lines.length; li++) {
                var line = parsed.lines[li];
                var pts2 = [
                    { x: xMin, y: line.slope * xMin + line.intercept },
                    { x: xMax, y: line.slope * xMax + line.intercept }
                ];
                datasets.push({ label: line.label || 'Line ' + (li+1), data: pts2, showLine: true, borderColor: line.color || CONFIG.COLORS[li % CONFIG.COLORS.length], borderWidth: line.lineWidth || 2, pointRadius: 0, fill: false });
            }
        }
        
        if (parsed.functions) {
            for (var fi = 0; fi < parsed.functions.length; fi++) {
                var fn = parsed.functions[fi];
                var fnPoints = [];
                var domain = fn.domain || [xMin, xMax];
                var step = (domain[1] - domain[0]) / 200;
                var eqFn = parseFunction(fn.equation);
                for (var x2 = domain[0]; x2 <= domain[1]; x2 += step) {
                    try { var y2 = eqFn(x2); if (isFinite(y2) && Math.abs(y2) < 100) fnPoints.push({ x: x2, y: y2 }); } catch(e) {}
                }
                if (fnPoints.length > 1) {
                    datasets.push({ label: fn.equation || 'f(x)', data: fnPoints, showLine: true, borderColor: fn.color || '#e74c3c', borderWidth: fn.lineWidth || 3, pointRadius: 0, tension: 0.3, fill: false });
                }
            }
        }
        
        if (parsed.polynomials) {
            for (var pi = 0; pi < parsed.polynomials.length; pi++) {
                var poly = parsed.polynomials[pi];
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
                    try { var y3 = eqFn2(x3); if (isFinite(y3) && Math.abs(y3) < 100) fnPoints2.push({ x: x3, y: y3 }); } catch(e) {}
                }
                if (fnPoints2.length > 1) {
                    datasets.push({ label: poly.label || 'Polynomial', data: fnPoints2, showLine: true, borderColor: poly.color || '#9b59b6', borderWidth: poly.lineWidth || 3, pointRadius: 0, tension: 0.3, fill: false });
                }
            }
        }
        
        if (parsed.piecewise) {
            for (var pwi = 0; pwi < parsed.piecewise.length; pwi++) {
                var piece = parsed.piecewise[pwi];
                var fnPoints3 = [];
                var domain3 = piece.domain || [xMin, xMax];
                var step3 = (domain3[1] - domain3[0]) / 200;
                var eqFn3 = parseFunction(piece.equation);
                for (var x4 = domain3[0]; x4 <= domain3[1]; x4 += step3) {
                    try { var y4 = eqFn3(x4); if (isFinite(y4) && Math.abs(y4) < 100) fnPoints3.push({ x: x4, y: y4 }); } catch(e) {}
                }
                if (fnPoints3.length > 1) {
                    datasets.push({ label: piece.label || piece.equation || 'Piecewise', data: fnPoints3, showLine: true, borderColor: piece.color || '#27ae60', borderWidth: piece.lineWidth || 2.5, pointRadius: 0, tension: 0.1, fill: false });
                }
            }
        }
        
        if (parsed.absolute) {
            var absEq = 'Math.abs(' + parsed.absolute.equation + ')';
            var fnPoints4 = [];
            var domain4 = parsed.absolute.domain || [xMin, xMax];
            var step4 = (domain4[1] - domain4[0]) / 200;
            var eqFn4 = parseFunction(absEq);
            for (var x5 = domain4[0]; x5 <= domain4[1]; x5 += step4) {
                try { var y5 = eqFn4(x5); if (isFinite(y5) && Math.abs(y5) < 100) fnPoints4.push({ x: x5, y: y5 }); } catch(e) {}
            }
            if (fnPoints4.length > 1) {
                datasets.push({ label: '|' + parsed.absolute.equation + '|', data: fnPoints4, showLine: true, borderColor: parsed.absolute.color || '#f39c12', borderWidth: parsed.absolute.lineWidth || 3, pointRadius: 0, tension: 0.3, fill: false });
            }
        }
        
        if (datasets.length === 0) return;
        
        var config = {
            type: 'scatter',
            data: { datasets: datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: parsed.title || 'Coordinate Plane', font: { size: 16, weight: 'bold' } },
                    legend: { position: 'bottom' }
                },
                scales: {
                    x: { type: 'linear', title: { display: true, text: xLabel }, grid: { color: '#e0e0e0' }, min: xMin, max: xMax },
                    y: { type: 'linear', title: { display: true, text: yLabel }, grid: { color: '#e0e0e0' }, min: yMin, max: yMax }
                }
            }
        };
        createChart(chartId, config);
    }
    renderWithDelay(chartId, renderFn, 150);
    return html;
}
registerRenderer('coordinate-plane', renderCoordinatePlane);

// ================================================================
// TABLE
// ================================================================
function renderTable(parsed) {
    if (!parsed.headers || !parsed.rows) return '<div style="padding:10px;color:#999;">No data</div>';
    var h = '<div style="margin:15px 0;overflow-x:auto;background:white;border-radius:8px;border:1px solid #ddd;"><table style="width:100%;border-collapse:collapse;text-align:center;font-size:14px;">';
    h += '<thead><tr style="background:#3498db;color:white;">';
    for (var hi = 0; hi < parsed.headers.length; hi++) {
        h += '<th style="padding:10px 14px;border:1px solid #2980b9;font-weight:bold;">' + escapeHtml(parsed.headers[hi]) + '</th>';
    }
    h += '</tr></thead><tbody>';
    for (var ri = 0; ri < parsed.rows.length; ri++) {
        var row = parsed.rows[ri];
        h += '<tr style="background:' + (ri%2===0?'#fff':'#f8f9fa') + ';">';
        for (var ci = 0; ci < row.length; ci++) {
            h += '<td style="padding:8px 14px;border:1px solid #ddd;">' + escapeHtml(row[ci]) + '</td>';
        }
        h += '</tr>';
    }
    h += '</tbody></table>';
    if (parsed.title) h += '<div style="text-align:center;padding:8px;font-weight:bold;color:#555;background:#f8f9fa;border-radius:0 0 8px 8px;">' + escapeHtml(parsed.title) + '</div>';
    h += '</div>';
    return h;
}
registerRenderer('table', renderTable);
registerRenderer('frequency-table', renderTable);

// ================================================================
// BAR
// ================================================================
function renderBar(parsed) {
    var labels = [], datasets = [];
    if (parsed.labels && parsed.values) {
        labels = parsed.labels;
        var values = parsed.values;
        if (typeof values === 'string') {
            try { values = JSON.parse(values); } catch(e) { values = values.split(',').map(function(v) { return parseFloat(v.trim()); }); }
        }
        if (!Array.isArray(values)) values = [];
        datasets = [{ label: parsed.label || 'Data', data: values, backgroundColor: parsed.color || '#3498db80', borderColor: parsed.stroke || '#3498db', borderWidth: 2 }];
    } else if (parsed.series) {
        labels = parsed.categories || [];
        for (var si = 0; si < parsed.series.length; si++) {
            var s = parsed.series[si];
            var vals = s.values || [];
            if (typeof vals === 'string') {
                try { vals = JSON.parse(vals); } catch(e) { vals = vals.split(',').map(function(v) { return parseFloat(v.trim()); }); }
            }
            if (!Array.isArray(vals)) vals = [];
            datasets.push({ label: s.name || 'Series ' + (si+1), data: vals, backgroundColor: CONFIG.COLORS[si % CONFIG.COLORS.length] + '80', borderColor: CONFIG.COLORS[si % CONFIG.COLORS.length], borderWidth: 2 });
        }
    }
    if (datasets.length === 0) return '<div style="padding:10px;color:#999;">No data</div>';
    
    var chartId = 'chart_' + Math.random().toString(36).substr(2, 9);
    var html = '<div style="margin:15px 0;padding:15px;background:#f8f9fa;border-radius:8px;border:1px solid #e9ecef;"><canvas id="' + chartId + '" style="max-height:400px;width:100%;"></canvas></div>';
    
    function renderFn() {
        var config = {
            type: 'bar',
            data: { labels: labels, datasets: datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: parsed.title || 'Bar Chart', font: { size: 16, weight: 'bold' } },
                    legend: { position: 'bottom' }
                },
                scales: {
                    x: { title: { display: true, text: (parsed.xAxis && parsed.xAxis.label) || '' }, grid: { color: '#e0e0e0' } },
                    y: { beginAtZero: true, title: { display: true, text: (parsed.yAxis && parsed.yAxis.label) || '' }, grid: { color: '#e0e0e0' } }
                }
            }
        };
        createChart(chartId, config);
    }
    renderWithDelay(chartId, renderFn, 150);
    return html;
}
registerRenderer('bar', renderBar);
registerRenderer('stacked-bar', renderBar);
registerRenderer('histogram', renderBar);

// ================================================================
// PIE / DOUGHNUT
// ================================================================
function renderPie(parsed) {
    if (!parsed.labels || !parsed.values) return '<div style="padding:10px;color:#999;">No data</div>';
    var isDoughnut = (parsed.type === 'doughnut');
    var chartId = 'chart_' + Math.random().toString(36).substr(2, 9);
    var html = '<div style="margin:15px 0;padding:15px;background:#f8f9fa;border-radius:8px;border:1px solid #e9ecef;"><canvas id="' + chartId + '" style="max-height:400px;width:100%;"></canvas></div>';
    
    function renderFn() {
        var config = {
            type: isDoughnut ? 'doughnut' : 'pie',
            data: {
                labels: parsed.labels,
                datasets: [{ data: parsed.values, backgroundColor: parsed.colors || CONFIG.COLORS, borderWidth: 2 }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: parsed.title || (isDoughnut ? 'Doughnut Chart' : 'Pie Chart'), font: { size: 16, weight: 'bold' } },
                    legend: { position: 'bottom' }
                },
                cutout: isDoughnut ? (parsed.cutout || '50%') : '0%'
            }
        };
        createChart(chartId, config);
    }
    renderWithDelay(chartId, renderFn, 150);
    return html;
}
registerRenderer('pie', renderPie);
registerRenderer('doughnut', renderPie);
registerRenderer('gauge', renderPie);

// ================================================================
// LINE
// ================================================================
function renderLine(parsed) {
    if (!parsed.series) return '<div style="padding:10px;color:#999;">No series data</div>';
    var chartId = 'chart_' + Math.random().toString(36).substr(2, 9);
    var html = '<div style="margin:15px 0;padding:15px;background:#f8f9fa;border-radius:8px;border:1px solid #e9ecef;"><canvas id="' + chartId + '" style="max-height:400px;width:100%;"></canvas></div>';
    
    function renderFn() {
        var ds = [];
        for (var li = 0; li < parsed.series.length; li++) {
            var s = parsed.series[li];
            var points = [];
            if (Array.isArray(s.points)) {
                points = s.points;
            } else if (typeof s.points === 'string') {
                try { points = JSON.parse(s.points); } catch(e) { points = []; }
            } else if (Array.isArray(s.data)) {
                for (var di = 0; di < s.data.length; di++) {
                    points.push({ x: (parsed.xAxis && parsed.xAxis.categories && parsed.xAxis.categories[di]) || di, y: s.data[di] });
                }
            }
            ds.push({
                label: s.name || ('Series ' + (li + 1)),
                data: points,
                showLine: true,
                borderColor: s.color || CONFIG.COLORS[li % CONFIG.COLORS.length],
                backgroundColor: (s.color || CONFIG.COLORS[li % CONFIG.COLORS.length]) + '20',
                borderWidth: s.lineWidth || 2,
                pointRadius: s.pointSize || 4,
                tension: s.tension || 0.3,
                fill: s.fill || false
            });
        }
        var config = {
            type: 'scatter',
            data: { datasets: ds },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: parsed.title || 'Line Chart', font: { size: 16, weight: 'bold' } },
                    legend: { position: 'bottom' }
                },
                scales: {
                    x: { type: 'linear', title: { display: true, text: (parsed.xAxis && (parsed.xAxis.title || parsed.xAxis.label)) || 'X' }, grid: { color: '#e0e0e0' } },
                    y: { title: { display: true, text: (parsed.yAxis && (parsed.yAxis.title || parsed.yAxis.label)) || 'Y' }, grid: { color: '#e0e0e0' } }
                }
            }
        };
        createChart(chartId, config);
    }
    renderWithDelay(chartId, renderFn, 150);
    return html;
}
registerRenderer('line', renderLine);

// ================================================================
// RADAR
// ================================================================
function renderRadar(parsed) {
    if (!parsed.labels || !parsed.datasets) return '<div style="padding:10px;color:#999;">No data</div>';
    var chartId = 'chart_' + Math.random().toString(36).substr(2, 9);
    var html = '<div style="margin:15px 0;padding:15px;background:#f8f9fa;border-radius:8px;border:1px solid #e9ecef;"><canvas id="' + chartId + '" style="max-height:400px;width:100%;"></canvas></div>';
    
    function renderFn() {
        var ds = [];
        for (var rdi = 0; rdi < parsed.datasets.length; rdi++) {
            var d = parsed.datasets[rdi];
            var values = d.values || [];
            if (typeof values === 'string') {
                try { values = JSON.parse(values); } catch(e) { values = values.split(',').map(function(v) { return parseFloat(v.trim()); }); }
            }
            ds.push({ label: d.label || 'Series ' + (rdi+1), data: values, borderColor: d.color || CONFIG.COLORS[rdi % CONFIG.COLORS.length], backgroundColor: (d.color || CONFIG.COLORS[rdi % CONFIG.COLORS.length]) + '20', borderWidth: 2, pointRadius: 4 });
        }
        var config = {
            type: 'radar',
            data: { labels: parsed.labels, datasets: ds },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: parsed.title || 'Radar Chart', font: { size: 16, weight: 'bold' } }
                },
                scales: { r: { beginAtZero: true, grid: { color: '#e0e0e0' } } }
            }
        };
        createChart(chartId, config);
    }
    renderWithDelay(chartId, renderFn, 150);
    return html;
}
registerRenderer('radar', renderRadar);

// ================================================================
// SHAPE
// ================================================================
function renderShape(parsed) {
    if (!parsed.points || parsed.points.length === 0) {
        return '<div style="padding:10px;color:#999;">No points data</div>';
    }
    var chartId = 'chart_' + Math.random().toString(36).substr(2, 9);
    var html = '<div style="margin:15px 0;padding:15px;background:#f8f9fa;border-radius:8px;border:1px solid #e9ecef;"><canvas id="' + chartId + '" style="max-height:400px;width:100%;"></canvas></div>';
    
    function renderFn() {
        var pts = parsed.points.slice();
        if (pts.length > 0) { pts.push({ x: parsed.points[0].x, y: parsed.points[0].y }); }
        var config = {
            type: 'scatter',
            data: {
                datasets: [{
                    label: parsed.label || 'Shape',
                    data: pts,
                    showLine: true,
                    borderColor: parsed.stroke || '#2c3e50',
                    backgroundColor: parsed.fill || 'rgba(52,152,219,0.15)',
                    borderWidth: parsed.lineWidth || 2,
                    pointRadius: parsed.pointSize || 4,
                    pointBackgroundColor: parsed.stroke || '#2c3e50',
                    fill: true,
                    tension: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: parsed.question || parsed.title || 'Shape', font: { size: 16, weight: 'bold' } },
                    legend: { position: 'bottom' }
                },
                scales: {
                    x: { type: 'linear', title: { display: true, text: 'X' }, grid: { color: '#e0e0e0' } },
                    y: { type: 'linear', title: { display: true, text: 'Y' }, grid: { color: '#e0e0e0' } }
                }
            }
        };
        createChart(chartId, config);
    }
    renderWithDelay(chartId, renderFn, 150);
    return html;
}
registerRenderer('shape', renderShape);
registerRenderer('shape-polygon', renderShape);
registerRenderer('shape-circle', renderShape);
registerRenderer('shape-ellipse', renderShape);
registerRenderer('shape-triangle', renderShape);

// ================================================================
// DOT-PLOT
// ================================================================
function renderDotPlot(parsed) {
    if (!parsed.series) return '<div style="padding:10px;color:#999;">No series data</div>';
    var chartId = 'chart_' + Math.random().toString(36).substr(2, 9);
    var html = '<div style="margin:15px 0;padding:15px;background:#f8f9fa;border-radius:8px;border:1px solid #e9ecef;"><canvas id="' + chartId + '" style="max-height:400px;width:100%;"></canvas></div>';
    
    function renderFn() {
        var ds = [];
        for (var dpi = 0; dpi < parsed.series.length; dpi++) {
            var sp = parsed.series[dpi];
            ds.push({ label: sp.name || 'Series ' + (dpi+1), data: sp.data, showLine: false, backgroundColor: CONFIG.COLORS[dpi % CONFIG.COLORS.length], pointRadius: 8, pointBackgroundColor: CONFIG.COLORS[dpi % CONFIG.COLORS.length] + '80', pointBorderColor: CONFIG.COLORS[dpi % CONFIG.COLORS.length], pointBorderWidth: 2 });
        }
        var config = {
            type: 'scatter',
            data: { datasets: ds },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: parsed.title || 'Dot Plot', font: { size: 16, weight: 'bold' } },
                    legend: { position: 'bottom' }
                },
                scales: {
                    x: { type: 'linear', title: { display: true, text: (parsed.xAxis && parsed.xAxis.label) || 'Value' }, grid: { color: '#e0e0e0' } },
                    y: { title: { display: true, text: 'Frequency' }, grid: { color: '#e0e0e0' }, min: 0, ticks: { stepSize: 1, precision: 0 } }
                }
            }
        };
        createChart(chartId, config);
    }
    renderWithDelay(chartId, renderFn, 150);
    return html;
}
registerRenderer('dot-plot', renderDotPlot);

// ================================================================
// NORMAL-DISTRIBUTION
// ================================================================
function renderNormalDistribution(parsed) {
    var mean = parsed.mean || 0, std = parsed.std || 1;
    var domain = parsed.domain || [mean - 4 * std, mean + 4 * std];
    var points = [];
    var step = (domain[1] - domain[0]) / 200;
    for (var x = domain[0]; x <= domain[1]; x += step) {
        var y = (1 / (std * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mean) / std, 2));
        points.push({ x: x, y: y });
    }
    var chartId = 'chart_' + Math.random().toString(36).substr(2, 9);
    var html = '<div style="margin:15px 0;padding:15px;background:#f8f9fa;border-radius:8px;border:1px solid #e9ecef;"><canvas id="' + chartId + '" style="max-height:400px;width:100%;"></canvas></div>';
    
    function renderFn() {
        var color = parsed.color || '#3498db';
        var config = {
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
                    title: { display: true, text: parsed.title || 'N(' + mean + ', ' + std + '²)', font: { size: 16, weight: 'bold' } }
                },
                scales: {
                    x: { type: 'linear', title: { display: true, text: 'x' }, grid: { color: '#e0e0e0' } },
                    y: { title: { display: true, text: 'f(x)' }, grid: { color: '#e0e0e0' }, min: 0 }
                }
            }
        };
        createChart(chartId, config);
    }
    renderWithDelay(chartId, renderFn, 150);
    return html;
}
registerRenderer('normal-distribution', renderNormalDistribution);

// ================================================================
// BOX-PLOT
// ================================================================
function renderBoxPlot(parsed) {
    if (!parsed.boxes) return '<div style="padding:10px;color:#999;">No boxes data</div>';
    var chartId = 'chart_' + Math.random().toString(36).substr(2, 9);
    var html = '<div style="margin:15px 0;padding:15px;background:#f8f9fa;border-radius:8px;border:1px solid #e9ecef;"><canvas id="' + chartId + '" style="max-height:400px;width:100%;"></canvas></div>';
    
    function renderFn() {
        var canvas = document.getElementById(chartId);
        if (!canvas) return;
        var W = canvas.width, H = canvas.height, pad = 60;
        var ctx = canvas.getContext('2d');
        var yMin = (parsed.yAxis && parsed.yAxis.min !== undefined) ? parsed.yAxis.min : 0;
        var yMax = (parsed.yAxis && parsed.yAxis.max !== undefined) ? parsed.yAxis.max : 100;
        
        function toPX2(x) { return pad + ((x - 0.5) / (parsed.boxes.length + 0.5)) * (W - 2 * pad); }
        function toPY2(y) { return pad + (H - 2 * pad) - ((y - yMin) / (yMax - yMin)) * (H - 2 * pad); }
        
        ctx.save();
        for (var bxi = 0; bxi < parsed.boxes.length; bxi++) {
            var box = parsed.boxes[bxi];
            var color = box.color || CONFIG.COLORS[bxi % CONFIG.COLORS.length];
            var x = bxi + 1;
            var px = toPX2(x);
            var pyMin = toPY2(box.min), pyQ1 = toPY2(box.q1), pyMedian = toPY2(box.median), pyQ3 = toPY2(box.q3), pyMax = toPY2(box.max);
            var boxWidth = 30;
            
            ctx.strokeStyle = color; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(px, pyMin); ctx.lineTo(px, pyQ1); ctx.moveTo(px, pyQ3); ctx.lineTo(px, pyMax); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(px - 8, pyMin); ctx.lineTo(px + 8, pyMin); ctx.moveTo(px - 8, pyMax); ctx.lineTo(px + 8, pyMax); ctx.stroke();
            ctx.fillStyle = color + '30'; ctx.strokeStyle = color; ctx.lineWidth = 2;
            ctx.fillRect(px - boxWidth/2, pyQ3, boxWidth, pyQ1 - pyQ3);
            ctx.strokeRect(px - boxWidth/2, pyQ3, boxWidth, pyQ1 - pyQ3);
            ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 2.5;
            ctx.beginPath(); ctx.moveTo(px - boxWidth/2, pyMedian); ctx.lineTo(px + boxWidth/2, pyMedian); ctx.stroke();
            ctx.fillStyle = '#2c3e50'; ctx.font = '12px Arial'; ctx.textAlign = 'center';
            ctx.fillText(box.label || 'Group ' + (bxi+1), px, toPY2(yMin) + 20);
            ctx.font = '10px Arial'; ctx.fillStyle = '#666'; ctx.textAlign = 'left';
            ctx.fillText('min:' + box.min, px + boxWidth/2 + 4, pyMin + 3);
            ctx.fillText('Q1:' + box.q1, px + boxWidth/2 + 4, pyQ1 + 3);
            ctx.fillText('med:' + box.median, px + boxWidth/2 + 4, pyMedian + 3);
            ctx.fillText('Q3:' + box.q3, px + boxWidth/2 + 4, pyQ3 + 3);
            ctx.fillText('max:' + box.max, px + boxWidth/2 + 4, pyMax + 3);
        }
        ctx.restore();
    }
    renderWithDelay(chartId, renderFn, 150);
    return html;
}
registerRenderer('box-plot', renderBoxPlot);

// ================================================================
// RESIDUAL-PLOT
// ================================================================
function renderResidualPlot(parsed) {
    if (!parsed.residuals) return '<div style="padding:10px;color:#999;">No residuals data</div>';
    var chartId = 'chart_' + Math.random().toString(36).substr(2, 9);
    var html = '<div style="margin:15px 0;padding:15px;background:#f8f9fa;border-radius:8px;border:1px solid #e9ecef;"><canvas id="' + chartId + '" style="max-height:400px;width:100%;"></canvas></div>';
    
    function renderFn() {
        var canvas = document.getElementById(chartId);
        if (!canvas) return;
        var W = canvas.width, H = canvas.height, pad = 60;
        var ctx = canvas.getContext('2d');
        var residuals = parsed.residuals;
        var xMin = Math.min.apply(null, residuals.map(function(r) { return r.x; })) - 1;
        var xMax = Math.max.apply(null, residuals.map(function(r) { return r.x; })) + 1;
        var yMin = Math.min.apply(null, residuals.map(function(r) { return r.residual; })) - 1;
        var yMax = Math.max.apply(null, residuals.map(function(r) { return r.residual; })) + 1;
        
        function toPX3(x) { return pad + ((x - xMin) / (xMax - xMin)) * (W - 2 * pad); }
        function toPY3(y) { return pad + (H - 2 * pad) - ((y - yMin) / (yMax - yMin)) * (H - 2 * pad); }
        
        ctx.save();
        ctx.setLineDash([5, 5]); ctx.strokeStyle = '#95a5a6'; ctx.lineWidth = 1;
        ctx.beginPath(); var py0 = toPY3(0); ctx.moveTo(pad, py0); ctx.lineTo(W - pad, py0); ctx.stroke();
        var color = parsed.color || '#e74c3c';
        for (var ri = 0; ri < residuals.length; ri++) {
            var px = toPX3(residuals[ri].x), py = toPY3(residuals[ri].residual);
            ctx.beginPath(); ctx.arc(px, py, 5, 0, 2 * Math.PI); ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = 'white'; ctx.lineWidth = 1.5; ctx.stroke();
            ctx.fillStyle = '#666'; ctx.font = '10px Arial'; ctx.textAlign = 'left';
            ctx.fillText(residuals[ri].residual.toFixed(2), px + 8, py + 3);
        }
        ctx.restore();
    }
    renderWithDelay(chartId, renderFn, 150);
    return html;
}
registerRenderer('residual-plot', renderResidualPlot);

// ================================================================
// SLOPE-FIELD
// ================================================================
function renderSlopeField(parsed) {
    if (!parsed.equation) return '<div style="padding:10px;color:#999;">No equation provided</div>';
    var chartId = 'chart_' + Math.random().toString(36).substr(2, 9);
    var html = '<div style="margin:15px 0;padding:15px;background:#f8f9fa;border-radius:8px;border:1px solid #e9ecef;"><canvas id="' + chartId + '" style="max-height:400px;width:100%;"></canvas></div>';
    
    function renderFn() {
        var canvas = document.getElementById(chartId);
        if (!canvas) return;
        var W = canvas.width, H = canvas.height, pad = 50;
        var ctx = canvas.getContext('2d');
        var xMin = (parsed.xAxis && parsed.xAxis.min !== undefined) ? parsed.xAxis.min : -5;
        var xMax = (parsed.xAxis && parsed.xAxis.max !== undefined) ? parsed.xAxis.max : 5;
        var yMin = (parsed.yAxis && parsed.yAxis.min !== undefined) ? parsed.yAxis.min : -5;
        var yMax = (parsed.yAxis && parsed.yAxis.max !== undefined) ? parsed.yAxis.max : 5;
        var step = parsed.step || 0.8;
        var fn = parseFunction(parsed.equation);
        
        // 그리드
        ctx.save();
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 0.5;
        var tickX = (parsed.xAxis && parsed.xAxis.tick) || 1;
        var tickY = (parsed.yAxis && parsed.yAxis.tick) || 1;
        for (var x = Math.ceil(xMin / tickX) * tickX; x <= xMax; x += tickX) {
            var px = toPixelX(x, xMin, xMax, W, pad);
            ctx.beginPath(); ctx.moveTo(px, pad); ctx.lineTo(px, H - pad); ctx.stroke();
            ctx.fillStyle = '#333'; ctx.font = '11px Arial'; ctx.textAlign = 'center';
            ctx.fillText(x, px, H - pad + 16);
        }
        for (var y = Math.ceil(yMin / tickY) * tickY; y <= yMax; y += tickY) {
            var py = toPixelY(y, yMin, yMax, H, pad);
            ctx.beginPath(); ctx.moveTo(pad, py); ctx.lineTo(W - pad, py); ctx.stroke();
            ctx.fillStyle = '#333'; ctx.font = '11px Arial'; ctx.textAlign = 'right';
            ctx.fillText(y, pad - 8, py + 4);
        }
        ctx.fillStyle = '#333'; ctx.font = '13px Arial bold'; ctx.textAlign = 'center';
        ctx.fillText((parsed.xAxis && parsed.xAxis.label) || 'x', W / 2, H - 6);
        ctx.textAlign = 'center'; ctx.fillText((parsed.yAxis && parsed.yAxis.label) || 'y', 20, pad - 10);
        ctx.restore();
        
        // 기울기 장
        ctx.save();
        var color = parsed.color || '#2c3e50';
        for (var x2 = xMin; x2 <= xMax; x2 += step) {
            for (var y2 = yMin; y2 <= yMax; y2 += step) {
                try {
                    var slope = fn(x2, y2);
                    if (!isFinite(slope)) continue;
                    var angle = Math.atan(slope);
                    var len = step * 0.4;
                    var dx = len * Math.cos(angle);
                    var dy = len * Math.sin(angle);
                    var px1 = toPixelX(x2 - dx/2, xMin, xMax, W, pad);
                    var py1 = toPixelY(y2 - dy/2, yMin, yMax, H, pad);
                    var px2 = toPixelX(x2 + dx/2, xMin, xMax, W, pad);
                    var py2 = toPixelY(y2 + dy/2, yMin, yMax, H, pad);
                    ctx.beginPath(); ctx.moveTo(px1, py1); ctx.lineTo(px2, py2);
                    ctx.strokeStyle = color; ctx.lineWidth = 1.2; ctx.stroke();
                } catch(e) {}
            }
        }
        ctx.restore();
    }
    renderWithDelay(chartId, renderFn, 150);
    return html;
}
registerRenderer('slope-field', renderSlopeField);

// ================================================================
// MICHAELIS-MENTEN (AP Biology)
// ================================================================
function renderMichaelisMenten(parsed) {
    var Vmax = parsed.Vmax || 100;
    var Km = parsed.Km || 10;
    var domain = parsed.domain || [0, 50];
    var chartId = 'chart_' + Math.random().toString(36).substr(2, 9);
    var html = '<div style="margin:15px 0;padding:15px;background:#f8f9fa;border-radius:8px;border:1px solid #e9ecef;"><canvas id="' + chartId + '" style="max-height:400px;width:100%;"></canvas></div>';
    
    function renderFn() {
        var canvas = document.getElementById(chartId);
        if (!canvas) return;
        var W = canvas.width, H = canvas.height, pad = 50;
        var ctx = canvas.getContext('2d');
        var xMin = domain[0], xMax = domain[1];
        var yMin = 0, yMax = Vmax * 1.2;
        
        // 그리드
        ctx.save();
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 0.5;
        var tickX = (parsed.xAxis && parsed.xAxis.tick) || 5;
        var tickY = (parsed.yAxis && parsed.yAxis.tick) || 10;
        for (var x = Math.ceil(xMin / tickX) * tickX; x <= xMax; x += tickX) {
            var px = toPixelX(x, xMin, xMax, W, pad);
            ctx.beginPath(); ctx.moveTo(px, pad); ctx.lineTo(px, H - pad); ctx.stroke();
            ctx.fillStyle = '#333'; ctx.font = '11px Arial'; ctx.textAlign = 'center';
            ctx.fillText(x, px, H - pad + 16);
        }
        for (var y = Math.ceil(yMin / tickY) * tickY; y <= yMax; y += tickY) {
            var py = toPixelY(y, yMin, yMax, H, pad);
            ctx.beginPath(); ctx.moveTo(pad, py); ctx.lineTo(W - pad, py); ctx.stroke();
            ctx.fillStyle = '#333'; ctx.font = '11px Arial'; ctx.textAlign = 'right';
            ctx.fillText(y, pad - 8, py + 4);
        }
        ctx.fillStyle = '#333'; ctx.font = '13px Arial bold'; ctx.textAlign = 'center';
        ctx.fillText((parsed.xAxis && parsed.xAxis.label) || '[S] (substrate)', W / 2, H - 6);
        ctx.textAlign = 'center'; ctx.fillText((parsed.yAxis && parsed.yAxis.label) || 'v (rate)', 20, pad - 10);
        ctx.restore();
        
        var equation = Vmax + '*x/(' + Km + '+x)';
        var fn = parseFunction(equation);
        var points = [];
        var step = (xMax - xMin) / 200;
        for (var x2 = xMin; x2 <= xMax; x2 += step) {
            try { var y2 = fn(x2); if (isFinite(y2) && Math.abs(y2) < 100) points.push({ x: x2, y: y2 }); } catch(e) {}
        }
        var color = parsed.color || '#27ae60';
        ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = parsed.lineWidth || 3;
        ctx.beginPath();
        for (var i = 0; i < points.length; i++) {
            var px = toPixelX(points[i].x, xMin, xMax, W, pad);
            var py = toPixelY(points[i].y, yMin, yMax, H, pad);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.stroke(); ctx.restore();
        
        // Km 표시
        var kmX = toPixelX(Km, xMin, xMax, W, pad);
        var kmY = toPixelY(Vmax / 2, yMin, yMax, H, pad);
        ctx.save(); ctx.setLineDash([5, 5]); ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(kmX, pad); ctx.lineTo(kmX, kmY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(pad, kmY); ctx.lineTo(kmX, kmY); ctx.stroke();
        ctx.restore();
        ctx.save(); ctx.fillStyle = '#e74c3c'; ctx.font = '12px Arial'; ctx.textAlign = 'center';
        ctx.fillText('Km = ' + Km, kmX, toPixelY(yMax, yMin, yMax, H, pad) - 10);
        ctx.fillText('Vmax/2', toPixelX(xMin, xMin, xMax, W, pad) + 20, kmY - 5);
        ctx.restore();
        
        // 방정식
        ctx.save(); ctx.fillStyle = '#2c3e50'; ctx.font = '14px Arial'; ctx.textAlign = 'left';
        ctx.fillText('v = Vmax·[S]/(Km+[S])', toPixelX(xMin + (xMax - xMin) * 0.05, xMin, xMax, W, pad), toPixelY(yMax * 0.9, yMin, yMax, H, pad));
        ctx.restore();
    }
    renderWithDelay(chartId, renderFn, 150);
    return html;
}
registerRenderer('michaelis-menten', renderMichaelisMenten);
registerRenderer('michaelis', renderMichaelisMenten);

// ================================================================
// SAT RATIONAL (슬래시 지원)
// ================================================================
function renderSATRational(parsed) {
    if (!parsed.equation) return '<div style="padding:10px;color:#999;">No equation provided</div>';
    var chartId = 'chart_' + Math.random().toString(36).substr(2, 9);
    var html = '<div style="margin:15px 0;padding:15px;background:#f8f9fa;border-radius:8px;border:1px solid #e9ecef;"><canvas id="' + chartId + '" style="max-height:400px;width:100%;"></canvas></div>';
    
    function renderFn() {
        var canvas = document.getElementById(chartId);
        if (!canvas) return;
        var W = canvas.width, H = canvas.height, pad = 50;
        var ctx = canvas.getContext('2d');
        var xMin = (parsed.xAxis && parsed.xAxis.min !== undefined) ? parsed.xAxis.min : -8;
        var xMax = (parsed.xAxis && parsed.xAxis.max !== undefined) ? parsed.xAxis.max : 8;
        var yMin = (parsed.yAxis && parsed.yAxis.min !== undefined) ? parsed.yAxis.min : -8;
        var yMax = (parsed.yAxis && parsed.yAxis.max !== undefined) ? parsed.yAxis.max : 8;
        
        // 그리드
        ctx.save();
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 0.5;
        var tickX = (parsed.xAxis && parsed.xAxis.tick) || 1;
        var tickY = (parsed.yAxis && parsed.yAxis.tick) || 1;
        for (var x = Math.ceil(xMin / tickX) * tickX; x <= xMax; x += tickX) {
            var px = toPixelX(x, xMin, xMax, W, pad);
            ctx.beginPath(); ctx.moveTo(px, pad); ctx.lineTo(px, H - pad); ctx.stroke();
            ctx.fillStyle = '#333'; ctx.font = '11px Arial'; ctx.textAlign = 'center';
            ctx.fillText(x, px, H - pad + 16);
        }
        for (var y = Math.ceil(yMin / tickY) * tickY; y <= yMax; y += tickY) {
            var py = toPixelY(y, yMin, yMax, H, pad);
            ctx.beginPath(); ctx.moveTo(pad, py); ctx.lineTo(W - pad, py); ctx.stroke();
            ctx.fillStyle = '#333'; ctx.font = '11px Arial'; ctx.textAlign = 'right';
            ctx.fillText(y, pad - 8, py + 4);
        }
        ctx.fillStyle = '#333'; ctx.font = '13px Arial bold'; ctx.textAlign = 'center';
        ctx.fillText((parsed.xAxis && parsed.xAxis.label) || 'x', W / 2, H - 6);
        ctx.textAlign = 'center'; ctx.fillText((parsed.yAxis && parsed.yAxis.label) || 'y', 20, pad - 10);
        ctx.restore();
        
        var equation = parsed.equation;
        var fn = parseFunction(equation);
        var points = [];
        var domain = parsed.domain || [xMin, xMax];
        var step = (domain[1] - domain[0]) / 200;
        
        // 점근선
        var asymptotes = [];
        try {
            var denomStr = equation.split('/')[1];
            if (denomStr) {
                var denomFn = parseFunction(denomStr);
                for (var x3 = domain[0]; x3 <= domain[1]; x3 += 0.01) {
                    try { var d = denomFn(x3); if (Math.abs(d) < 0.001) asymptotes.push(x3); } catch(e) {}
                }
            }
        } catch(e) {}
        
        for (var x4 = domain[0]; x4 <= domain[1]; x4 += step) {
            try { var y2 = fn(x4); if (isFinite(y2) && Math.abs(y2) < 100) points.push({ x: x4, y: y2 }); } catch(e) {}
        }
        
        // 점근선
        if (asymptotes.length > 0) {
            ctx.save(); ctx.setLineDash([5, 5]); ctx.strokeStyle = '#95a5a6'; ctx.lineWidth = 1.5;
            for (var ai = 0; ai < asymptotes.length; ai++) {
                var ax = toPixelX(asymptotes[ai], xMin, xMax, W, pad);
                ctx.beginPath(); ctx.moveTo(ax, pad); ctx.lineTo(ax, H - pad); ctx.stroke();
            }
            ctx.restore();
        }
        
        var color = parsed.color || '#e74c3c';
        ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = parsed.lineWidth || 3;
        ctx.beginPath();
        for (var i = 0; i < points.length; i++) {
            var px = toPixelX(points[i].x, xMin, xMax, W, pad);
            var py = toPixelY(points[i].y, yMin, yMax, H, pad);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.stroke(); ctx.restore();
        
        ctx.save(); ctx.fillStyle = '#2c3e50'; ctx.font = '14px Arial'; ctx.textAlign = 'left';
        ctx.fillText('y = ' + equation, toPixelX(domain[0] + (domain[1] - domain[0]) * 0.7, xMin, xMax, W, pad), toPixelY(yMax * 0.8, yMin, yMax, H, pad));
        ctx.restore();
    }
    renderWithDelay(chartId, renderFn, 150);
    return html;
}
registerRenderer('sat-rational', renderSATRational);
registerRenderer('rational', renderSATRational);

// ================================================================
// MAIN DISPATCHER
// ================================================================
function renderGraphic(jsonData) {
    if (jsonData === null || jsonData === undefined) return "";
    if (typeof jsonData === 'string' && jsonData.trim() === "") return "";
    
    var parsed = safeParseJSON(jsonData);
    if (!parsed || typeof parsed !== 'object') {
        return '<div style="padding:10px;color:#999;text-align:center;">📊 Invalid graphic data</div>';
    }
    
    var type = parsed.type || '';
    if (!type) {
        return '<div style="padding:10px;color:#999;text-align:center;">📊 No type specified</div>';
    }
    
    if (typeof Chart === 'undefined') {
        return '<div style="padding:10px;color:#999;text-align:center;">📊 Loading chart library...</div>';
    }
    
    var renderer = getRenderer(type);
    if (renderer) {
        try {
            return renderer(parsed);
        } catch(e) {
            console.warn('⚠️ Renderer failed for type:', type, e);
            return '<div style="padding:10px;color:#999;text-align:center;">📊 Render error: ' + escapeHtml(type) + '</div>';
        }
    }
    
    return '<div style="padding:10px;text-align:center;color:#999;border:1px dashed #ddd;border-radius:8px;margin:15px 0;">' +
        '<span style="font-size:20px;">📊</span>' +
        '<p style="margin-top:8px;">Graph type "<strong>' + escapeHtml(type) + '</strong>" is not supported.</p>' +
        '</div>';
}

// ================================================================
// 전역 노출
// ================================================================
window.renderGraphic = renderGraphic;
window.safeParseJSON = safeParseJSON;
window.parseFunction = parseFunction;
window.CONFIG = CONFIG;
window.registerRenderer = registerRenderer;
window.getSupportedTypes = getSupportedTypes;

console.log('✅ main.js loaded successfully!');
console.log('📊 Supported types:', getSupportedTypes().join(', '));
