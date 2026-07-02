// ============================================================
// 기본 연결 테스트 (초기 버전) - 순수 연결 확인용
// ============================================================

function testConnection() {
  console.log("✅ testConnection function is working!");
  return "✅ Connection successful! (test)";
}

function initialize() {
  console.log("✅ initialize() called!");
  
  // DOM 요소 확인 (간단한 초기화)
  var splashBar = document.getElementById('splashBar');
  var splashStatus = document.getElementById('splashStatus');
  var mainContainer = document.getElementById('mainContainer');
  
  if (splashBar) {
    splashBar.style.width = '100%';
  }
  if (splashStatus) {
    splashStatus.textContent = 'Ready!';
  }
  if (mainContainer) {
    mainContainer.style.display = 'block';
  }
  
  console.log("✅ initialize() complete");
  return "✅ Initialization complete!";
}

function renderGraphic(jsonData) {
  console.log("✅ renderGraphic called with:", jsonData);
  
  return '<div style="padding:20px;background:#e8f5e9;border-radius:8px;border:2px solid #4caf50;text-align:center;">' +
         '<h3>✅ renderGraphic works!</h3>' +
         '<p>Data: ' + (jsonData || '(none)') + '</p>' +
         '</div>';
}

// ===== export (모듈 내보내기) =====
export { 
    initialize,
    testConnection,
    renderGraphic
};

// ===== window 전역 노출 =====
window.initialize = initialize;
window.testConnection = testConnection;
window.renderGraphic = renderGraphic;

console.log("✅ main.js test version loaded!");
