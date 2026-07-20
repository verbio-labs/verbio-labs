/* Verbio Labs 자체 방문 분석 — 개인정보 미수집(쿠키·IP·지문 없음), 세션ID는 브라우저 탭 수준 난수 */
(function () {
  var SB_URL = 'https://kpqrvvfcirkxlihcibqr.supabase.co';
  var SB_KEY = 'sb_publishable__ywsnui3UjB6Xls94pmbTQ_c13LyARM';
  if (location.pathname.indexOf('/admin') === 0) return; // 관리자 페이지 제외

  function sid() {
    try {
      var s = sessionStorage.getItem('vl_sid');
      if (!s) { s = Math.random().toString(36).slice(2) + Date.now().toString(36); sessionStorage.setItem('vl_sid', s); }
      return s;
    } catch (e) { return 'nosess'; }
  }

  function classify(ref, params) {
    if (params.get('fbclid') || (params.get('utm_medium') || '').match(/^(cpc|paid|ads?)$/i)) return ['ads', params.get('utm_source') || 'meta'];
    if (!ref) return ['direct', ''];
    var h = '';
    try { h = new URL(ref).hostname.toLowerCase(); } catch (e) { return ['other', ref.slice(0, 40)]; }
    if (h.indexOf('verbiolabs.com') > -1) return ['internal', h];
    var AI = { 'chatgpt.com': 'ChatGPT', 'chat.openai.com': 'ChatGPT', 'perplexity.ai': 'Perplexity', 'claude.ai': 'Claude', 'gemini.google.com': 'Gemini', 'copilot.microsoft.com': 'Copilot', 'you.com': 'You.com', 'wrtn.ai': '뤼튼', 'felo.ai': 'Felo', 'liner.com': 'Liner', 'getliner.com': 'Liner' };
    for (var k in AI) if (h === k || h.endsWith('.' + k)) return ['ai', AI[k]];
    var SEARCH = ['google.', 'naver.', 'daum.', 'bing.', 'duckduckgo.', 'yahoo.'];
    for (var i = 0; i < SEARCH.length; i++) if (h.indexOf(SEARCH[i]) > -1) return ['search', h];
    var SOCIAL = ['instagram', 'threads', 'facebook', 'fb.me', 't.co', 'twitter', 'x.com', 'youtube', 'youtu.be', 'linkedin', 'kakao', 'litt.ly', 'linktr.ee', 'discord', 'blog.'];
    for (var j = 0; j < SOCIAL.length; j++) if (h.indexOf(SOCIAL[j]) > -1) return ['social', h];
    return ['other', h];
  }

  function send(event, extra) {
    var p = new URLSearchParams(location.search);
    var cls = classify(document.referrer, p);
    var row = {
      event: event,
      path: location.pathname,
      referrer: (document.referrer || '').slice(0, 300),
      ref_group: cls[0],
      ref_detail: cls[1],
      utm_source: p.get('utm_source'),
      utm_medium: p.get('utm_medium'),
      utm_campaign: p.get('utm_campaign'),
      session_id: sid(),
      device: (matchMedia('(max-width: 768px)').matches ? 'mobile' : 'desktop')
    };
    if (extra) for (var k in extra) row[k] = extra[k];
    try {
      var body = JSON.stringify(row);
      fetch(SB_URL + '/rest/v1/site_events', {
        method: 'POST', keepalive: true,
        headers: { 'Content-Type': 'application/json', 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY, 'Prefer': 'return=minimal' },
        body: body
      }).catch(function () {});
    } catch (e) {}
  }
  window.vlTrack = send;

  // 1) pageview
  send('pageview');

  // 2) 원데이 CTA 클릭 (모든 페이지의 /oneday 링크)
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="/oneday"], a[href*="liveklass.com"]');
    if (a) send(a.href.indexOf('liveklass') > -1 ? 'cta_card_pay' : 'cta_oneday');
    var b = e.target.closest && e.target.closest('a[href^="/starter-kit"]');
    if (b) send('cta_kit');
  }, true);

  // 3) 신청 폼 퍼널 (form_start 1회 + form_submit)
  var started = false;
  document.addEventListener('focusin', function (e) {
    if (!started && e.target && e.target.closest && e.target.closest('form')) { started = true; send('form_start'); }
  }, true);
  document.addEventListener('submit', function () { send('form_submit'); }, true);
})();
