<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SAT Quiz - Adaptive Learning Platform</title>

  <!-- ============================================================ -->
  <!-- BLOCK 06: CSS (통합) -->
  <!-- ============================================================ -->
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', 'Malgun Gothic', sans-serif;
      background: #f0f2f5;
      color: #1a1a2e;
      min-height: 100vh;
    }
    #splashOverlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      z-index: 9999;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      color: #fff;
      transition: opacity 0.8s;
    }
    #splashOverlay .icon { font-size: 4rem; margin-bottom: 16px; }
    #splashOverlay .title { font-size: 2.4rem; font-weight: 800; letter-spacing: -1px; }
    #splashOverlay .title span { color: #f5a623; }
    #splashOverlay .subtitle { font-size: 1rem; opacity: 0.6; margin-top: 4px; letter-spacing: 4px; font-weight: 300; }
    #splashOverlay .bar-track { width: 280px; height: 4px; background: rgba(255,255,255,0.15); border-radius: 4px; overflow: hidden; margin-top: 30px; }
    #splashOverlay .bar-fill { width: 0%; height: 100%; background: linear-gradient(90deg, #f5a623, #e94560); border-radius: 4px; transition: width 0.5s ease; }
    #splashOverlay .status-text { font-size: 0.85rem; opacity: 0.5; margin-top: 14px; font-weight: 300; letter-spacing: 1px; }
    #splashOverlay .error-msg { color: #ff6b6b; font-size: 0.9rem; margin-top: 15px; display: none; }
    #splashOverlay .retry-btn { margin-top: 20px; padding: 12px 40px; font-size: 16px; font-weight: 700; background: #f5a623; color: #fff; border: none; border-radius: 12px; cursor: pointer; display: none; transition: all 0.3s; }
    #splashOverlay .retry-btn:hover { background: #e0941a; transform: scale(1.03); }
    #mainContainer { display: none; max-width: 820px; margin: 0 auto; padding: 20px; }
    .header {
      text-align: center;
      padding: 25px 20px 20px;
      background: linear-gradient(135deg, #1a1a2e, #16213e);
      border-radius: 20px;
      margin-bottom: 25px;
      color: #fff;
      position: relative;
      overflow: hidden;
    }
    .header::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(ellipse at 30% 50%, rgba(245, 166, 35, 0.05) 0%, transparent 70%);
      pointer-events: none;
    }
    .sat-logo { display: flex; align-items: center; justify-content: center; gap: 12px; flex-wrap: wrap; position: relative; z-index: 1; }
    .sat-icon { font-size: 1.6rem; }
    .sat-title { font-size: 1.8rem; font-weight: 800; letter-spacing: -0.5px; background: linear-gradient(90deg, #fff, #f5a623); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .sat-badge { background: rgba(245, 166, 35, 0.2); border: 1px solid rgba(245, 166, 35, 0.4); color: #f5a623; font-size: 0.6rem; font-weight: 700; padding: 2px 12px; border-radius: 20px; letter-spacing: 1px; text-transform: uppercase; -webkit-text-fill-color: #f5a623; }
    .sat-sub { font-size: 0.7rem; opacity: 0.5; letter-spacing: 4px; margin-top: 4px; font-weight: 300; position: relative; z-index: 1; }
    .setup-area { padding: 30px 25px; background: #fff; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); display: none; }
    .cards-container { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; max-width: 680px; margin: 0 auto; }
    .card { border-radius: 18px; padding: 24px 20px; transition: all 0.3s ease; display: flex; flex-direction: column; align-items: center; }
    .card-new { background: #fff; border: 2px solid rgba(0,0,0,0.06); box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
    .card-new:hover { border-color: #f5a623; box-shadow: 0 6px 30px rgba(0,0,0,0.08); transform: translateY(-2px); }
    .card-resume { background: #fff; border: 2px solid #ffd700; box-shadow: 0 4px 20px rgba(255,215,0,0.12); cursor: pointer; justify-content: center; min-height: 200px; }
    .card-resume:hover { border-color: #f5a623; box-shadow: 0 6px 30px rgba(255,215,0,0.20); transform: translateY(-2px); }
    .card-icon { font-size: 2.4rem; }
    .card-title { font-weight: 700; font-size: 1.2rem; letter-spacing: 0.5px; margin-top: 4px; }
    .card-title-new { color: #2c3e50; }
    .card-title-resume { color: #f5a623; }
    .card-sub { font-size: 0.9rem; color: #666; margin-top: 2px; font-weight: 400; }
    .card-sub-resume { color: #888; }
    .input-wrapper { width: 100%; margin-top: 8px; }
    .input-wrapper input,
    .input-wrapper select {
      width: 100%;
      padding: 12px 14px;
      font-size: 15px;
      font-weight: 600;
      border: 2px solid #ddd;
      border-radius: 12px;
      text-align: center;
      background: #f8f9fa;
      outline: none;
      transition: all 0.3s;
      color: #1a1a2e;
      box-sizing: border-box;
    }
    .input-wrapper input:focus,
    .input-wrapper select:focus { border-color: #f5a623; box-shadow: 0 0 20px rgba(245,166,35,0.10); background: #fff; }
    .input-wrapper input::placeholder { color: #aaa; font-weight: 400; }
    .input-wrapper select {
      cursor: pointer;
      appearance: none;
      -webkit-appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 14px center;
    }
    .btn-start {
      width: 100%;
      padding: 14px;
      margin-top: 10px;
      font-size: 17px;
      font-weight: 700;
      background: #f5a623;
      color: #fff;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s;
      letter-spacing: 0.5px;
      box-shadow: 0 2px 10px rgba(245,166,35,0.25);
    }
    .btn-start:hover { background: #e0941a; transform: scale(1.02); box-shadow: 0 4px 20px rgba(245,166,35,0.35); }
    .btn-start:disabled { opacity: 0.6; cursor: wait; transform: none; }
    #savedBadgeContainer { width: 100%; margin-top: 8px; }
    .resume-badge { background: #fef9e7; border-radius: 12px; padding: 14px 12px; border: 2px solid #ffd700; cursor: pointer; transition: all 0.3s; width: 100%; text-align: center; }
    .resume-badge:hover { background: #fef3d0; border-color: #f5a623; transform: scale(1.01); }
    .resume-badge .count { font-weight: 700; color: #2c3e50; font-size: 1rem; }
    .resume-badge .time { font-size: 0.75rem; color: #888; margin-top: 2px; }
    .resume-badge .hint { font-size: 0.7rem; color: #f5a623; margin-top: 4px; font-weight: 500; }
    .no-session { background: #f8f9fa; border-radius: 12px; padding: 14px 12px; border: 2px dashed #ddd; width: 100%; text-align: center; font-size: 0.8rem; color: #aaa; }
    .no-session small { display: block; font-size: 0.65rem; color: #ccc; margin-top: 2px; }
    .card-hint { font-size: 0.7rem; color: #aaa; margin-top: 6px; font-weight: 400; }
    .bottom-hint { margin-top: 18px; color: #999; font-size: 0.8rem; letter-spacing: 0.3px; border-top: 1px solid #eee; padding-top: 14px; font-weight: 400; text-align: center; }
    .quiz-main { padding: 10px 0; display: none; }
    .progress-area { background: #f8f9fa; border-radius: 12px; padding: 12px 16px; margin-bottom: 16px; display: flex; justify-content: space-between; flex-wrap: wrap; align-items: center; display: none; }
    .progress-count { background: #fff; padding: 6px 16px; border-radius: 30px; font-weight: 700; border: 1px solid #3498db; font-size: 0.9rem; }
    .progress-bar-container { width: 100%; background: #ddd; border-radius: 10px; height: 8px; margin-top: 6px; }
    .progress-bar { width: 0%; background: #27ae60; border-radius: 10px; height: 8px; transition: width 0.3s; }
    .review-banner { background: #e67e22; color: #fff; padding: 10px 16px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; font-weight: 700; display: none; }
    .exit-review-btn { background: #fff; color: #e67e22; border: none; padding: 5px 14px; border-radius: 20px; cursor: pointer; font-weight: 700; font-size: 0.85rem; }
    .question-card { background: #fff; border: 2px solid #e9ecef; border-radius: 16px; padding: 20px; margin-bottom: 16px; }
    .q-num { display: inline-block; background: #2c3e50; color: #fff; padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; margin-bottom: 12px; }
    .question-text { font-size: 1.05rem; line-height: 1.6; margin: 12px 0 20px; font-weight: 600; }
    .choices { display: flex; flex-direction: column; gap: 10px; }
    .choice { display: flex; align-items: center; padding: 12px 16px; background: #fff; border: 2px solid #ddd; border-radius: 12px; cursor: pointer; transition: all 0.2s; }
    .choice:hover:not(.disabled) { background: #f0f7ff; border-color: #3498db; transform: translateX(4px); }
    .choice-letter { width: 30px; height: 30px; background: #3498db; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; margin-right: 14px; flex-shrink: 0; font-size: 0.85rem; }
    .choice.correct { background: #e9f7ef; border-color: #27ae60; }
    .choice.correct .choice-letter { background: #27ae60; }
    .choice.incorrect { background: #fde8e8; border-color: #e74c3c; }
    .choice.incorrect .choice-letter { background: #e74c3c; }
    .choice.disabled { cursor: default; }
    .explanation { margin-top: 16px; padding: 16px; background: #e8f4fc; border-radius: 12px; border-left: 5px solid #3498db; display: none; }
    .explanation.show { display: block; }
    .subjective-input-group { display: flex; gap: 10px; margin-top: 16px; align-items: center; flex-wrap: wrap; }
    .subjective-input-group input { flex: 1; min-width: 180px; padding: 12px 16px; font-size: 15px; border: 2px solid #ddd; border-radius: 12px; background: #f8f9fa; outline: none; transition: all 0.3s; min-height: 48px; box-sizing: border-box; }
    .subjective-input-group input:focus { border-color: #f5a623; box-shadow: 0 0 0 3px rgba(245,166,35,0.10); background: #fff; }
    .subjective-input-group button { padding: 12px 24px; background: #f5a623; color: #fff; border: none; border-radius: 12px; font-weight: 700; font-size: 15px; cursor: pointer; transition: all 0.2s; white-space: nowrap; min-height: 48px; }
    .subjective-input-group button:hover { background: #e0941a; transform: scale(1.02); }
    .nav-buttons { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; margin-top: 16px; }
    .nav-btn { padding: 10px 18px; font-size: 0.9rem; font-weight: 700; border: none; border-radius: 12px; cursor: pointer; transition: all 0.2s; flex: 1; min-width: 70px; }
    .nav-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-prev { background: #3498db; color: #fff; }
    .btn-prev:hover:not(:disabled) { background: #2980b9; transform: scale(1.02); }
    .btn-next { background: #2ecc71; color: #fff; }
    .btn-next:hover:not(:disabled) { background: #27ae60; transform: scale(1.02); }
    .btn-skip { background: #f39c12; color: #fff; }
    .btn-skip:hover:not(:disabled) { background: #e67e22; transform: scale(1.02); }
    .btn-submit { background: #27ae60; color: #fff; }
    .btn-submit:hover:not(:disabled) { background: #1e8449; transform: scale(1.02); }
    .btn-quit { background: #e74c3c; color: #fff; }
    .btn-quit:hover { background: #c0392b; transform: scale(1.02); }
    .btn-warning { background: #e67e22; color: #fff; }
    .btn-warning:hover { background: #d35400; transform: scale(1.02); }
    .modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.55); z-index: 999; justify-content: center; align-items: center; padding: 20px; }
    .modal-content { background: #fff; max-width: 700px; width: 100%; max-height: 90vh; overflow-y: auto; border-radius: 24px; padding: 28px; box-shadow: 0 20px 60px rgba(0,0,0,0.25); position: relative; }
    .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 16px 0; }
    .stat-card { text-align: center; padding: 12px; background: #f8f9fa; border-radius: 12px; }
    .stat-value { font-size: 26px; font-weight: 700; color: #2c3e50; }
    .result-grid { display: grid; grid-template-columns: repeat(10, 1fr); gap: 5px; margin: 12px 0; max-height: 220px; overflow-y: auto; padding: 4px; }
    .result-item { text-align: center; padding: 5px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer; border: 1px solid #ddd; }
    .result-item.correct { background: #d4edda; color: #0d4620; }
    .result-item.incorrect { background: #f8d7da; color: #5a1414; }
    .result-item.skipped { background: #fff3cd; color: #856404; }
    .result-item.unanswered { background: #e9ecef; color: #6c757d; }
    .wrong-list { max-height: 400px; overflow-y: auto; }
    .wrong-item { background: #fff; border: 2px solid #eee; border-radius: 12px; padding: 16px; margin-bottom: 14px; }
    .button-group { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 16px; }
    .status-badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; margin-left: 6px; }
    .timer-container { position: fixed; top: 16px; right: 16px; background: rgba(26,26,46,0.92); color: #fff; padding: 10px 16px; border-radius: 12px; z-index: 1000; box-shadow: 0 4px 20px rgba(0,0,0,0.25); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.08); min-width: 120px; text-align: center; }
    .timer-display { font-size: 1.5rem; font-weight: 700; letter-spacing: 2px; font-variant-numeric: tabular-nums; color: #f5a623; }
    .timer-display.warning { animation: blink 1s infinite; }
    @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
    .timer-label { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 2px; opacity: 0.5; margin-top: 2px; }
    .timer-controls { display: flex; gap: 6px; justify-content: center; margin-top: 4px; }
    .timer-btn { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); color: #fff; padding: 3px 12px; border-radius: 6px; cursor: pointer; font-size: 0.65rem; font-weight: 600; transition: all 0.2s; }
    .timer-btn:hover { background: rgba(245,166,35,0.25); border-color: #f5a623; }
    .timer-btn.reset-btn { color: #e74c3c; }
    .timer-btn.reset-btn:hover { background: rgba(231,76,60,0.20); border-color: #e74c3c; }
    @media (max-width: 640px) {
      #mainContainer { padding: 12px; }
      .cards-container { grid-template-columns: 1fr; gap: 14px; }
      .card-resume { min-height: auto; }
      .setup-area { padding: 20px 16px; }
      .nav-btn { padding: 10px 12px; font-size: 0.8rem; }
      .result-grid { grid-template-columns: repeat(5, 1fr); }
      .sat-title { font-size: 1.3rem; }
      .sat-icon { font-size: 1.2rem; }
      .sat-sub { font-size: 0.6rem; letter-spacing: 2px; }
      .timer-container { top: 10px; right: 10px; padding: 8px 12px; min-width: 90px; }
      .timer-display { font-size: 1.2rem; }
      .subjective-input-group { flex-direction: column; align-items: stretch; }
      .subjective-input-group button { width: 100%; }
      .header { padding: 18px 14px; }
      .modal-content { padding: 20px; }
    }
  </style>

  <!-- ============================================================ -->
  <!-- BLOCK 07: 외부 라이브러리 로드 -->
  <!-- ============================================================ -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/tex-chtml.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
</head>
<body>

  <!-- ============================================================ -->
  <!-- BLOCK 01: 스플래시 오버레이 -->
  <!-- ============================================================ -->
  <div id="splashOverlay">
    <div class="icon">📚</div>
    <div class="title">SAT <span>Quiz</span></div>
    <div class="subtitle">ADAPTIVE LEARNING PLATFORM</div>
    <div class="bar-track"><div class="bar-fill" id="splashBar"></div></div>
    <div class="status-text" id="splashStatus">Loading...</div>
    <div class="error-msg" id="splashError"></div>
    <button class="retry-btn" id="splashRetry">🔄 Retry</button>
  </div>

  <!-- ============================================================ -->
  <!-- BLOCK 02: 메인 컨테이너 -->
  <!-- ============================================================ -->
  <div id="mainContainer">

    <!-- ============================================================ -->
    <!-- BLOCK 03: 헤더 -->
    <!-- ============================================================ -->
    <header class="header">
      <div class="sat-logo">
        <span class="sat-icon">📖</span>
        <span class="sat-title">SAT Quiz</span>
        <span class="sat-badge">v2.5</span>
      </div>
      <div class="sat-sub">Reading &amp; Writing · Math</div>
    </header>

    <!-- ============================================================ -->
    <!-- BLOCK 04: 설정 영역 -->
    <!-- ============================================================ -->
    <div id="setupSection" class="setup-area">
      <div class="cards-container">
        <div class="card card-new">
          <div class="card-icon">📖</div>
          <div class="card-title card-title-new">NEW LESSON</div>
          <div class="card-sub">Start from a new number</div>
          <div class="input-wrapper" style="margin-top:6px;">
            <select id="subjectSelect"><option value="">Loading subjects...</option></select>
          </div>
          <div class="input-wrapper" style="margin-top:6px;">
            <select id="setSelector"><option value="1">Loading sets...</option></select>
          </div>
          <div class="input-wrapper">
            <input type="number" id="startNumber" min="1" placeholder="1-720">
          </div>
          <button class="btn-start" id="startQuizBtn">▶ START</button>
          <div class="card-hint">Select a set or enter a number</div>
        </div>
        <div class="card card-resume" id="resumeCard">
          <div class="card-icon">⏳</div>
          <div class="card-title card-title-resume">RESUME</div>
          <div class="card-sub card-sub-resume">Continue previous session</div>
          <div id="savedBadgeContainer">
            <div class="no-session">No saved session <small>Start a new lesson</small></div>
          </div>
        </div>
      </div>
      <div class="bottom-hint">Progress is saved automatically</div>
    </div>

    <!-- ============================================================ -->
    <!-- BLOCK 05: 퀴즈 본문 -->
    <!-- ============================================================ -->
    <div id="quizMain" class="quiz-main">
      <div id="reviewBanner" class="review-banner" style="display:none;">
        <span>Review Mode</span>
        <button id="exitReviewBtn" class="exit-review-btn">EXIT REVIEW</button>
      </div>
      <div class="progress-area" style="display:none;">
        <span class="progress-count" id="progressText">1 / 1</span>
        <div class="progress-bar-container">
          <div class="progress-bar" id="quizProgressBar"></div>
        </div>
      </div>
      <div id="quizContent" style="display:none;">
        <div id="questionContainer"></div>
        <div id="explanationBox" class="explanation">
          <div id="explanationText" style="margin-top:5px;"></div>
        </div>
        <div class="nav-buttons">
          <button id="prevBtn" class="nav-btn btn-prev">◀ PREV (P)</button>
          <button id="skipBtn" class="nav-btn btn-skip">SKIP (S)</button>
          <button id="nextBtn" class="nav-btn btn-next">NEXT (N) ▶</button>
        </div>
        <div class="nav-buttons" style="margin-top:10px;">
          <button id="submitBtn" class="nav-btn btn-submit" style="display:none;">SUBMIT (Enter)</button>
          <button id="quitBtn" class="nav-btn btn-quit">✕ QUIT</button>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- BLOCK 06: 타이머 -->
    <!-- ============================================================ -->
    <div class="timer-container" id="timerContainer">
      <div class="timer-display" id="timerDisplay">00:00:00</div>
      <div class="timer-label">⏱ TIME</div>
      <div class="timer-controls">
        <button class="timer-btn" id="timerPauseBtn">Pause</button>
        <button class="timer-btn reset-btn" id="timerResetBtn">Reset</button>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- BLOCK 07: 결과 모달 -->
    <!-- ============================================================ -->
    <div id="resultModal" class="modal">
      <div class="modal-content">
        <h2 style="text-align:center;">📊 RESULT</h2>
        <div class="stats">
          <div class="stat-card"><div>✅ CORRECT</div><div class="stat-value" id="correctCount">0</div></div>
          <div class="stat-card"><div>🎯 ACCURACY</div><div class="stat-value" id="accuracyRate">0%</div></div>
        </div>
        <div><strong>Results (Click to move)</strong></div>
        <div id="resultGrid" class="result-grid"></div>
        <div class="button-group">
          <button id="retryAllBtn" class="nav-btn btn-prev" style="flex:1;">🔄 RETRY</button>
          <button id="reviewWrongBtn" class="nav-btn btn-warning" style="flex:1;">📝 REVIEW</button>
          <button id="closeModalBtn" class="nav-btn btn-prev" style="flex:1;">✕ CLOSE</button>
        </div>
        <div id="loadNextContainer" style="margin-top:12px;"></div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- BLOCK 08: 오답 리뷰 모달 -->
    <!-- ============================================================ -->
    <div id="wrongModal" class="modal">
      <div class="modal-content" style="max-width:750px;">
        <h2 style="text-align:center;">📝 REVIEW</h2>
        <p style="text-align:center;margin-bottom:12px;color:#666;">Wrong / Skipped / Unanswered</p>
        <div id="wrongList" class="wrong-list"></div>
        <div class="button-group">
          <button id="retryWrongFromReviewBtn" class="nav-btn btn-warning" style="flex:1;">🔄 RETRY WRONG ONLY</button>
          <button id="closeWrongBtn" class="nav-btn btn-prev" style="flex:1;">✕ CLOSE</button>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- BLOCK 09: 진행 복원 모달 -->
    <!-- ============================================================ -->
    <div id="progressModal" class="modal" style="display:none;">
      <div class="modal-content" style="max-width:500px;text-align:center;border-radius:16px;padding:28px;">
        <div id="progressModalBody" style="text-align:left;margin:10px 0;line-height:1.8;font-size:15px;"></div>
        <div class="button-group" style="display:flex;justify-content:center;gap:10px;margin-top:20px;">
          <button id="progressContinueBtn" class="nav-btn" style="flex:1;max-width:160px;padding:12px 20px;font-size:15px;font-weight:700;border:none;border-radius:12px;cursor:pointer;background:#27ae60;color:#fff;">▶ Continue</button>
          <button id="progressCancelBtn" class="nav-btn" style="flex:1;max-width:160px;padding:12px 20px;font-size:15px;font-weight:700;border:none;border-radius:12px;cursor:pointer;background:#e74c3c;color:#fff;">Start Fresh</button>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- BLOCK 10: SAT Chatbot -->
    <!-- ============================================================ -->
    <div style="max-width:700px;margin:20px auto 10px;padding:18px 20px;background:#fff;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,0.06);border:2px solid #f5a623;">
      <h3 style="margin-bottom:12px;color:#1a1a2e;font-size:1.1rem;">🤖 SAT Chatbot</h3>
      <div style="display:flex;flex-direction:column;gap:8px;">
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <input id="chatbotQuestion" placeholder="Ask about this question..." style="flex:1;min-width:160px;padding:12px 16px;border:2px solid #ddd;border-radius:30px;font-size:15px;outline:none;transition:all 0.3s;" onkeypress="if(event.key==='Enter') sendChatbotMessage()">
          <button onclick="sendChatbotMessage()" style="padding:12px 24px;background:#f5a623;color:#fff;border:none;border-radius:30px;font-weight:700;cursor:pointer;font-size:15px;transition:all 0.3s;white-space:nowrap;" onmouseover="this.style.background='#e0941a'" onmouseout="this.style.background='#f5a623'">Send</button>
        </div>
        <div id="chatbotResponse" style="margin-top:6px;padding:14px 16px;background:#f8f9fa;border-radius:14px;min-height:60px;white-space:pre-wrap;border-left:4px solid #f5a623;font-size:14px;line-height:1.6;color:#1a1a2e;">Ask anything about this SAT question.</div>
      </div>
    </div>

  </div><!-- /mainContainer -->

  <!-- ============================================================ -->
  <!-- BLOCK 11: JavaScript 로드 -->
  <!-- ============================================================ -->

  <!-- main.js (type="module") -->
  <script type="module" src="https://adopt397-dotcom.github.io/JavaScript/js/main.js?v=28"></script>

  <!-- 임시 initialize 함수 (main.js에 없을 경우 대비) -->
  <script>
    function initialize() {
      console.log('✅ initialize called from HTML (fallback)');
      var setupSection = document.getElementById('setupSection');
      var quizMain = document.getElementById('quizMain');
      if (setupSection) setupSection.style.display = 'block';
      if (quizMain) quizMain.style.display = 'none';
      console.log('✅ Fallback initialize complete');
    }
  </script>

  <!-- 실행 스크립트 -->
  <script type="module">
    let initializeFn;
    try {
      const module = await import('https://adopt397-dotcom.github.io/JavaScript/js/main.js?v=28');
      initializeFn = module.initialize;
      console.log('✅ main.js에서 initialize 로드 성공');
    } catch (e) {
      console.warn('⚠️ main.js에서 initialize 로드 실패, fallback 사용:', e.message);
      initializeFn = window.initialize;
    }

    document.addEventListener('DOMContentLoaded', function() {
      window.sendChatbotMessage = async function() {
        const questionInput = document.getElementById('chatbotQuestion');
        const responseDiv = document.getElementById('chatbotResponse');
        const question = questionInput.value.trim();
        if (!question) {
          responseDiv.innerHTML = 'Please enter a question.';
          return;
        }
        let problemNumber = '1';
        const qNumElement = document.querySelector('.q-num');
        if (qNumElement) {
          const match = qNumElement.textContent.match(/\(Original #(\d+)\)/);
          if (match) problemNumber = match[1];
        }
        responseDiv.innerHTML = '⏳ Processing...';
        questionInput.disabled = true;
        try {
          const res = await fetch('https://sat-bot-07020143.vercel.app/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ problemNumber: problemNumber, question: question })
          });
          const data = await res.json();
          if (res.ok) {
            responseDiv.innerHTML = '🤖 ' + (data.message || data.response || 'No response.');
          } else {
            responseDiv.innerHTML = '❌ Error: ' + (data.error || 'Unknown error');
          }
        } catch (e) {
          responseDiv.innerHTML = '❌ Network error: Could not reach server.';
          console.error('Chatbot error:', e);
        } finally {
          questionInput.disabled = false;
          questionInput.value = '';
          questionInput.focus();
        }
      };

      const startBtn = document.getElementById('startQuizBtn');
      if (startBtn) {
        startBtn.addEventListener('click', function(e) {
          if (this.disabled) return;
          this.disabled = true;
          this.textContent = '⏳ Loading...';
          this.style.opacity = '0.6';
          this.style.cursor = 'wait';
          setTimeout(() => {
            this.disabled = false;
            this.textContent = '▶ START';
            this.style.opacity = '1';
            this.style.cursor = 'pointer';
          }, 5000);
        });
      }

      if (typeof initializeFn === 'function') {
        initializeFn();
      } else {
        console.error('❌ initialize 함수를 찾을 수 없습니다.');
        const setup = document.getElementById('setupSection');
        if (setup) setup.style.display = 'block';
      }
    });
  </script>

</body>
</html>
