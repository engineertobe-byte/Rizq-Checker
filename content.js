(function() {
  const styles = `
    #rizq-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 999999; display: none; align-items: center; justify-content: center; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    #rizq-modal { background: white; border-radius: 16px; width: 580px; max-width: 92%; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.3); animation: rizqFadeIn 0.3s ease; }
    @keyframes rizqFadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    
    .rizq-banner { padding: 25px; color: white; font-size: 24px; font-weight: bold; text-align: center; }
    .v-halal { background-color: #10b981; }
    .v-haram { background-color: #ef4444; }
    .v-shubha { background-color: #f59e0b; }

    .rizq-body { padding: 25px; }
    .rizq-section { margin-bottom: 20px; padding: 15px; border-left: 4px solid #e5e7eb; background: #f9fafb; border-radius: 0 8px 8px 0; }
    .rizq-section.permissible { border-left-color: #10b981; }
    .rizq-section.doubtful { border-left-color: #f59e0b; }
    .rizq-section.forbidden { border-left-color: #ef4444; }
    
    .section-title { font-weight: bold; font-size: 16px; color: #374151; margin-bottom: 5px; display: block; }
    .section-status { font-size: 14px; color: #6b7280; }

    .scripture-box { margin-top: 25px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
    .scripture-header { font-weight: bold; color: #111827; margin-bottom: 10px; display: block; }
    .scripture-text-en { font-style: italic; color: #4b5563; font-size: 14px; line-height: 1.6; margin-bottom: 15px; }
    .scripture-text-ar { direction: rtl; text-align: right; font-family: 'Traditional Arabic', 'Sakkal Majalla', serif; font-size: 18px; color: #111827; margin-bottom: 10px; line-height: 1.8; }
    
    .source-badge { display: inline-block; background: #fef3c7; color: #92400e; font-size: 11px; font-weight: bold; padding: 4px 12px; border-radius: 20px; border: 1px solid #fde68a; }
    
    .warning-box { background: #fff7ed; border-left: 4px solid #f97316; padding: 12px; margin-top: 20px; font-size: 12px; color: #9a3412; line-height: 1.4; }
    
    #rizq-close-btn { width: 100%; background: #0a66c2; color: white; border: none; padding: 15px; font-size: 16px; font-weight: bold; cursor: pointer; transition: background 0.2s; }
    #rizq-close-btn:hover { background: #084f91; }

    #rizq-float-btn { position: fixed; bottom: 25px; right: 25px; z-index: 999998; background: #0a66c2; color: white; border: none; padding: 14px 24px; border-radius: 50px; cursor: pointer; font-weight: bold; font-size: 15px; box-shadow: 0 4px 15px rgba(10, 102, 194, 0.3); display: flex; align-items: center; gap: 8px; transition: transform 0.2s; }
    #rizq-float-btn:hover { transform: scale(1.05); }
    #rizq-float-btn.loading { background: #6b7280; cursor: wait; }
  `;

  const styleSheet = document.createElement("style");
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);

  const overlay = document.createElement("div");
  overlay.id = "rizq-modal-overlay";
  overlay.innerHTML = `
    <div id="rizq-modal">
      <div id="rizq-banner" class="rizq-banner">Analyzing...</div>
      <div class="rizq-body">
        <div id="rizq-company-sec" class="rizq-section">
          <span class="section-title">🏢 Company: <span id="rizq-comp-name">-</span></span>
          <span id="rizq-comp-status" class="section-status">Analyzing...</span>
        </div>
        <div id="rizq-role-sec" class="rizq-section">
          <span class="section-title">💼 Role: <span id="rizq-role-name">-</span></span>
          <span id="rizq-role-status" class="section-status">Analyzing...</span>
        </div>
        <div class="scripture-box">
          <span class="scripture-header">📜 Scriptural Grounding</span>
          <div id="rizq-text-en" class="scripture-text-en"></div>
          <div id="rizq-text-ar" class="scripture-text-ar"></div>
          <div id="rizq-source" class="source-badge">Source: -</div>
        </div>
        <div class="warning-box">
          This analysis is based on automated data retrieval and keyword matching. It is NOT a Fatwa. Please consult a qualified Islamic scholar for a definitive ruling.
        </div>
      </div>
      <button id="rizq-close-btn">Close</button>
    </div>
  `;
  document.body.appendChild(overlay);

  const btn = document.createElement("button");
  btn.id = "rizq-float-btn";
  btn.innerHTML = `<span>🔍 RizqAnalyser</span>`;
  document.body.appendChild(btn);

  function detectCompany() {
    const selectors = [
      'span[data-control-name="company_name"]', '.top-card-layout__entity-lockup-title', 
      '[data-testid="company-name"]', '.companyName', '[class*="employer-name"]', 
      'a[href*="/company/"]', 'h1', '.company-name'
    ];
    for (let s of selectors) {
      const el = document.querySelector(s);
      if (el && el.innerText.trim()) return el.innerText.trim();
    }
    return "Unknown Company";
  }

  function detectRole() {
    const selectors = [
      'h1[class*="job-title"]', 'h1[data-testid="job-title"]', '.jobTitle', 
      '[class*="job-title"]', '[class*="position"]', 'h1', '.job-detail-header__title'
    ];
    for (let s of selectors) {
      const el = document.querySelector(s);
      if (el && el.innerText.trim()) return el.innerText.trim();
    }
    return "Unknown Role";
  }

  btn.onclick = async () => {
    const company = detectCompany();
    const role = detectRole();
    
    btn.innerText = "Analyzing... ⏳";
    btn.classList.add("loading");
    overlay.style.display = "flex";
    
    document.getElementById("rizq-banner").innerText = "Analyzing... ⏳";
    document.getElementById("rizq-banner").className = "rizq-banner";
    document.getElementById("rizq-comp-name").innerText = company;
    document.getElementById("rizq-role-name").innerText = role;

    chrome.runtime.sendMessage({ action: "analyze", data: { company, role } }, async (response) => {
      btn.innerText = "🔍 RizqAnalyser";
      btn.classList.remove("loading");
      
      const banner = document.getElementById("rizq-banner");
      const compSec = document.getElementById("rizq-company-sec");
      const roleSec = document.getElementById("rizq-role-sec");
      const compStatus = document.getElementById("rizq-comp-status");
      const roleStatus = document.getElementById("rizq-role-status");

      banner.innerText = `✅ Final Verdict: ${response.verdict}`;
      banner.className = "rizq-banner " + (response.verdict === "HALAL" ? "v-halal" : (response.verdict === "HARAM" ? "v-haram" : "v-shubha"));

      compStatus.innerText = response.company.reason;
      compSec.className = "rizq-section " + (response.company.verdict === "HALAL" ? "permissible" : (response.company.verdict === "HARAM" ? "forbidden" : "doubtful"));

      roleStatus.innerText = response.role.reason;
      roleSec.className = "rizq-section " + (response.role.verdict === "HALAL" ? "permissible" : (response.role.verdict === "HARAM" ? "forbidden" : "doubtful"));

      // Load Scripture from extension data
      chrome.runtime.sendMessage({ action: "getScripture", key: response.scriptureKey }, (scripture) => {
        document.getElementById("rizq-text-en").innerText = scripture.english;
        document.getElementById("rizq-text-ar").innerText = scripture.arabic;
        document.getElementById("rizq-source").innerText = "Source: " + scripture.source;
      });
    });
  };

  document.getElementById("rizq-close-btn").onclick = () => overlay.style.display = "none";

  // Handle SPA navigation (LinkedIn)
  const observer = new MutationObserver(() => {
    if (!document.getElementById("rizq-float-btn")) {
      // Button already exists, but check if we are on a new job page to reset state
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
