// ============================================================
// 최소 연결 테스트 (통신 확인용) - initialize 포함
// ============================================================

function testConnection() {
  console.log("✅ testConnection function is working!");
  return "✅ Connection successful! (test)";
}

function initialize() {
  console.log("✅ initialize() called!");
  
  // 간단한 초기화 작업
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
         '<h3>✅ 연결 성공!</h3>' +
         '<p>renderGraphic() 함수가 정상적으로 호출되었습니다.</p>' +
         '<p>전달된 데이터: ' + (jsonData || '(없음)') + '</p>' +
         '</div>';
}

// ===== 내보내기 (export) - HTML의 import가 찾음 =====
export { 
    initialize,
    testConnection,
    renderGraphic
};

// ===== 전역 노출 (HTML에서 직접 호출 가능) =====
window.initialize = initialize;
window.testConnection = testConnection;
window.renderGraphic = renderGraphic;

console.log("✅ main.js loaded - initialize, testConnection, renderGraphic ready!");
