/**
 * CausalFunnel Analytics Tracker
 * 
 * Tracks page_view and click events, sends to backend API.
 * 
 * Usage: Add to any webpage:
 *   <script src="tracker.js" data-api="http://localhost:5000/api/events"></script>
 */
(function () {
  "use strict";

  const SCRIPT_TAG = document.currentScript;
  const API_ENDPOINT = (SCRIPT_TAG && SCRIPT_TAG.getAttribute("data-api")) || "http://localhost:5000/api/events";
  const BATCH_INTERVAL = 3000; // Send events every 3 seconds
  const SESSION_KEY = "cf_session_id";

  // ─── Session Management ─────────────────────────────────────────────
  function generateSessionId() {
    return "sess_" + Math.random().toString(36).substring(2, 14) + Date.now().toString(36);
  }

  function getSessionId() {
    let sid = localStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = generateSessionId();
      localStorage.setItem(SESSION_KEY, sid);
    }
    // Also set cookie as fallback
    document.cookie = `${SESSION_KEY}=${sid};path=/;max-age=1800;SameSite=Lax`;
    return sid;
  }

  const SESSION_ID = getSessionId();

  // ─── Event Queue ────────────────────────────────────────────────────
  let eventQueue = [];

  function queueEvent(event) {
    event.session_id = SESSION_ID;
    event.timestamp = new Date().toISOString();
    event.page_url = window.location.href;
    eventQueue.push(event);
  }

  function flushEvents() {
    if (eventQueue.length === 0) return;

    const batch = [...eventQueue];
    eventQueue = [];

    fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(batch),
      keepalive: true,
    }).catch(function (err) {
      console.warn("[CausalFunnel] Failed to send events:", err);
      // Put events back in queue for retry
      eventQueue = batch.concat(eventQueue);
    });
  }

  // Flush on interval
  setInterval(flushEvents, BATCH_INTERVAL);

  // Flush on page unload
  window.addEventListener("beforeunload", flushEvents);
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") flushEvents();
  });

  // ─── Track Page View ────────────────────────────────────────────────
  function trackPageView() {
    queueEvent({
      event_type: "page_view",
      referrer: document.referrer || "direct",
      user_agent: navigator.userAgent,
      screen_width: window.screen.width,
      screen_height: window.screen.height,
    });
    // Send page view immediately
    setTimeout(flushEvents, 100);
  }

  // ─── Track Clicks ───────────────────────────────────────────────────
  document.addEventListener("click", function (e) {
    const target = e.target.closest("a, button, input[type='submit'], [role='button']") || e.target;

    queueEvent({
      event_type: "click",
      x: Math.round(e.pageX),
      y: Math.round(e.pageY),
      element_tag: target.tagName.toLowerCase(),
      element_text: (target.textContent || target.value || "").trim().substring(0, 100),
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
    });
  }, true);

  // ─── Initialize ─────────────────────────────────────────────────────
  trackPageView();
  console.log("[CausalFunnel] Tracker initialized | Session:", SESSION_ID);
})();
