// ============================================================
// 최소 연결 테스트 (initialize export 포함)
// ============================================================

function testConnection() {
  console.log("✅ testConnection function is working!");
  return "✅ Connection successful! (test)";
}

function initialize() {
  console.log("✅ initialize() called!");
  
  // 간단한 초기화
  var splashBar = document.getElementById('splashBar');
  var splashStatus = document.getElementById('splashStatus');
  var mainContainer = document.getElementById('mainContainer');
  
  if (splashBar) splashBar.style.width = '100%';
  if (splashStatus) splashStatus.textContent = 'Ready!';
  if (mainContainer) mainContainer.style.display = 'block';
  
  console.log("✅ initialize() complete");
  return "✅ Initialization complete!";
}

function renderGraphic(jsonData) {
  console.log("✅ renderGraphic called");
  return '<div style="padding:20px;background:#e8f5e9;border-radius:8px;border:2px solid #4caf50;text-align:center;">' +
         '<h3>✅ 연결 성공!</h3>' +
         '<p>renderGraphic() 정상 호출됨</p>' +
         '</div>';
}

// ===== 이 3줄이 가장 중요합니다! =====
export { 
    initialize,
    testConnection,
    renderGraphic
};

// ===== window에도 노출 (HTML에서 직접 호출용) =====
window.initialize = initialize;
window.testConnection = testConnection;
window.renderGraphic = renderGraphic;

console.log("✅ main.js loaded with exports: initialize, testConnection, renderGraphic");
