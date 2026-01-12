/**
 * Tiny renderer for JSON-driven affiliate cards (no frameworks).
 * Public pages: fast, static shell + fetch data JSON + render cards.
 */

function qs(sel, el=document){ return el.querySelector(sel); }
function qsa(sel, el=document){ return Array.from(el.querySelectorAll(sel)); }

function escapeHtml(str){
  return String(str ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function buildCard(item, kind){
  const isTravel = kind === "travel";
  const badge = item.featured ? "Featured" : (item.category || (isTravel ? item.brand : "Deal"));
  const title = isTravel ? `${item.brand}: ${item.title}` : item.title;
  const ctaText = isTravel ? (item.cta || "View deal") : "View on Amazon";
  const metaA = isTravel ? (item.category || "") : (item.category || "");
  const metaB = isTravel ? "" : (item.price_hint || "");
  const verified = item.last_verified ? `Verified: ${escapeHtml(item.last_verified)}` : "";
  const img = item.image || "";
  
  // REVENUE-SAFE: Open affiliate URL directly (no intermediary redirect)
  const directUrl = item.affiliate_url || "#";
  const network = isTravel ? "travel" : "amazon";
  const id = item.id || item.title || "";
  // Background tracking endpoint (returns 204, no redirect)
  const trackUrl = `/.netlify/functions/api/click?network=${encodeURIComponent(network)}&id=${encodeURIComponent(id)}&t=${Date.now()}`;

  return `
  <article class="card item" data-kind="${escapeHtml(kind)}" data-category="${escapeHtml(item.category || "")}" data-title="${escapeHtml(title)}">
    <div class="itemMedia">
      <img loading="lazy" decoding="async" src="${escapeHtml(img)}" alt="${escapeHtml(title)}">
    </div>
    <div class="badge">${escapeHtml(badge)}</div>
    <div class="itemBody">
      <h3 class="itemTitle">${escapeHtml(title)}</h3>
      <p class="itemTagline">${escapeHtml(item.tagline || "")}</p>
      <div class="itemMeta">
        ${metaA ? `<span class="chip">${escapeHtml(metaA)}</span>` : ""}
        ${metaB ? `<span class="chip">${escapeHtml(metaB)}</span>` : ""}
        ${verified ? `<span class="small">${verified}</span>` : ""}
      </div>
      <div class="itemCta">
        <a class="link primary" href="${escapeHtml(directUrl)}" data-track-url="${escapeHtml(trackUrl)}" target="_blank" rel="nofollow sponsored noopener">${escapeHtml(ctaText)}</a>
      </div>
    </div>
  </article>`;
}

async function loadJson(path){
  const res = await fetch(path, { cache: "no-store" });
  if(!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  const j = await res.json(); return Array.isArray(j) ? j : (j.items || []);
}

function renderList(container, items, kind){
  // Filter published deals only - NEVER show drafts publicly
  const validItems = items.filter(item => {
    // Migration: treat missing status as published (existing deals)
    const status = item.status || 'published';
    
    // MUST be published to appear publicly
    if (status !== 'published') return false;
    
    // Filter out incomplete/placeholder deals
    return item.title && 
           item.title !== 'New Deal Title' &&
           item.title.trim() !== '' &&
           item.affiliate_url !== 'https://example.com/affiliate' &&
           item.price_hint !== '$0 - $0' &&
           item.image && 
           !item.image.startsWith('data:image/svg+xml');
  });
  
  container.innerHTML = validItems.map(i => buildCard(i, kind)).join("");
}

function applyFilters(container, {query, category}){
  const cards = qsa(".item", container);
  const q = (query || "").trim().toLowerCase();
  const cat = (category || "").trim().toLowerCase();

  cards.forEach(card => {
    const title = (card.getAttribute("data-title") || "").toLowerCase();
    const c = (card.getAttribute("data-category") || "").toLowerCase();

    const matchQ = !q || title.includes(q);
    const matchC = !cat || c === cat;

    card.style.display = (matchQ && matchC) ? "" : "none";
  });
}

function uniqueCategories(items){
  const set = new Set();
  items.forEach(i => { if(i.category) set.add(i.category); });
  return Array.from(set).sort((a,b)=>a.localeCompare(b));
}

function populateCategorySelect(selectEl, categories){
  if(!selectEl) return;
  selectEl.innerHTML = `<option value="">All categories</option>` + categories.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
}

/**
 * Init a section with:
 * - container selector
 * - search input selector
 * - category select selector
 * - json path
 * - kind ("amazon" | "travel")
 */
async function initSection(opts){
  const container = qs(opts.container);
  if(!container) return;

  const searchEl = qs(opts.search);
  const catEl = qs(opts.category);

  try{
    const items = await loadJson(opts.json);
    // Sort by: priority (desc), featured (desc), then title (asc)
    items.sort((a,b) => {
      // Priority sorting (higher first) - default to 0 if not present
      const priorityA = a.priority ?? 0;
      const priorityB = b.priority ?? 0;
      if (priorityA !== priorityB) return priorityB - priorityA;
      
      // Featured sorting
      const featuredDiff = (b.featured===true) - (a.featured===true);
      if (featuredDiff !== 0) return featuredDiff;
      
      // Title sorting
      return String(a.title||"").localeCompare(String(b.title||""));
    });
    renderList(container, items, opts.kind);

    populateCategorySelect(catEl, uniqueCategories(items));

    const onChange = () => applyFilters(container, {
      query: searchEl ? searchEl.value : "",
      category: catEl ? catEl.value : ""
    });

    if(searchEl) searchEl.addEventListener("input", onChange, { passive: true });
    if(catEl) catEl.addEventListener("change", onChange, { passive: true });

  }catch(err){
    container.innerHTML = `<div class="notice">Could not load deals right now. Please refresh. <span class="small">${escapeHtml(err.message)}</span></div>`;
    console.error(err);
  }
}

// Background click tracking (non-blocking, best effort)
let clickTrackingInitialized = false;

function initClickTracking() {
  if (clickTrackingInitialized) return;
  clickTrackingInitialized = true;
  
  document.addEventListener('click', function(e) {
    const link = e.target.closest('a.link.primary[data-track-url]');
    if (!link) return;
    
    const trackUrl = link.getAttribute('data-track-url');
    if (!trackUrl) return;
    
    // Best effort tracking (doesn't block navigation)
    try {
      if (navigator.sendBeacon) {
        // Preferred: sendBeacon guarantees delivery even if page unloads
        navigator.sendBeacon(trackUrl, '');
      } else if (window.fetch) {
        // Fallback: fetch with keepalive
        fetch(trackUrl, { 
          method: 'GET',
          mode: 'no-cors',
          keepalive: true 
        }).catch(() => {});
      } else {
        // Last resort: pixel tracking
        const img = new Image();
        img.src = trackUrl;
      }
    } catch (err) {
      // Silently fail - don't block user navigation
      console.debug('Click tracking failed:', err);
    }
    
    // Don't preventDefault - let normal navigation happen
  }, { passive: true, capture: true });
}

// Initialize tracking on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initClickTracking);
} else {
  initClickTracking();
}

window.TT = { initSection };
