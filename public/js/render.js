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
  const isActivities = kind === "activities";
  
  const badge = item.featured ? "Featured" : (item.category || (isTravel ? item.brand : "Deal"));
  
  // Title formatting based on kind
  let title = item.title;
  if (isTravel) {
    title = `${item.brand}: ${item.title}`;
  }
  
  // CTA text
  const ctaText = isActivities ? (item.cta || "View Deal") : 
                  isTravel ? (item.cta || "View deal") : 
                  "View on Amazon";
  
  // Meta fields
  const metaA = isActivities ? (item.city || "") : 
                isTravel ? (item.category || "") : 
                (item.category || "");
  const metaB = isActivities ? (item.price || "") :
                isTravel ? "" : 
                (item.price_hint || "");
  const verified = item.last_verified ? `Verified: ${escapeHtml(item.last_verified)}` : "";
  const img = item.image || "";
  
  // DIRECT NAVIGATION: Open affiliate URL directly (no /go redirect)
  // Background tracking via sendBeacon (non-blocking)
  // For activities, link to detail page instead of affiliate URL
  const directUrl = isActivities ? `/activity/${item.id}.html?id=${item.id}` : (item.affiliate_url || "#");
  const affiliateUrl = item.affiliate_url || "#";
  const network = isActivities ? "activities" : (isTravel ? "travel" : "amazon");
  const id = item.id || item.title || "";
  
  // Background tracking endpoint (returns 204, no redirect)
  const trackUrl = `/.netlify/functions/api/click?network=${encodeURIComponent(network)}&id=${encodeURIComponent(id)}&t=${Date.now()}`;

  // Social sharing - using affiliate URL to ensure credit
  const shareUrl = encodeURIComponent(directUrl);
  const shareTitle = encodeURIComponent(title);
  const shareText = encodeURIComponent(item.tagline || title);
  
  // Social media share URLs
  const facebookShare = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
  const twitterShare = `https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}`;
  const messengerShare = `fb-messenger://share/?link=${shareUrl}`;
  const pinterestShare = `https://pinterest.com/pin/create/button/?url=${shareUrl}&media=${encodeURIComponent(img)}&description=${shareText}`;
  const whatsappShare = `https://wa.me/?text=${shareTitle}%20${shareUrl}`;
  const linkedinShare = `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`;
  const redditShare = `https://reddit.com/submit?url=${shareUrl}&title=${shareTitle}`;
  const telegramShare = `https://t.me/share/url?url=${shareUrl}&text=${shareTitle}`;
  const emailShare = `mailto:?subject=${shareTitle}&body=Check%20this%20out:%20${shareUrl}`;
  const smsShare = `sms:?&body=${shareTitle}%20${shareUrl}`;

  return `
  <article class="card item" data-kind="${escapeHtml(kind)}" data-category="${escapeHtml(item.category || "")}" data-title="${escapeHtml(title)}" data-city="${escapeHtml(item.city || "")}" data-share-url="${escapeHtml(directUrl)}" data-share-title="${escapeHtml(title)}" data-share-image="${escapeHtml(img)}">
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
        <a class="link primary" href="${escapeHtml(directUrl)}" data-track-url="${escapeHtml(trackUrl)}" ${isActivities ? '' : 'target="_blank" rel="nofollow sponsored noopener"'}>${escapeHtml(ctaText)}</a>
        <button class="share-btn" data-card-id="${escapeHtml(id)}" aria-label="Share this deal" title="Share this deal">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="18" cy="5" r="3"></circle>
            <circle cx="6" cy="12" r="3"></circle>
            <circle cx="18" cy="19" r="3"></circle>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
          </svg>
          Share
        </button>
      </div>
      <div class="share-menu" id="share-menu-${escapeHtml(id)}" style="display:none;">
        <div class="share-menu-header">
          <span>Share this deal</span>
          <button class="share-close" data-close-id="${escapeHtml(id)}" aria-label="Close share menu">×</button>
        </div>
        <div class="share-options">
          <a href="${facebookShare}" target="_blank" rel="noopener" class="share-option facebook" data-platform="facebook">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            Facebook
          </a>
          <a href="${twitterShare}" target="_blank" rel="noopener" class="share-option twitter" data-platform="twitter">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            X (Twitter)
          </a>
          <a href="${messengerShare}" target="_blank" rel="noopener" class="share-option messenger" data-platform="messenger">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.486 2 2 6.262 2 11.5c0 2.847 1.277 5.44 3.355 7.25l-.681 2.75 2.883-.841A10.3 10.3 0 0012 21.5c5.514 0 10-4.262 10-9.5S17.514 2 12 2zm.836 12.813l-2.54-2.706-4.945 2.706 5.44-5.775 2.603 2.706 4.88-2.706-5.438 5.775z"/></svg>
            Messenger
          </a>
          <a href="${pinterestShare}" target="_blank" rel="noopener" class="share-option pinterest" data-platform="pinterest">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"/></svg>
            Pinterest
          </a>
          <a href="${whatsappShare}" target="_blank" rel="noopener" class="share-option whatsapp" data-platform="whatsapp">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
            WhatsApp
          </a>
          <a href="${linkedinShare}" target="_blank" rel="noopener" class="share-option linkedin" data-platform="linkedin">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            LinkedIn
          </a>
          <a href="${redditShare}" target="_blank" rel="noopener" class="share-option reddit" data-platform="reddit">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>
            Reddit
          </a>
          <a href="${telegramShare}" target="_blank" rel="noopener" class="share-option telegram" data-platform="telegram">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
            Telegram
          </a>
          <a href="${emailShare}" class="share-option email" data-platform="email">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
            Email
          </a>
          <a href="${smsShare}" class="share-option sms" data-platform="sms">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            SMS
          </a>
          <button class="share-option copy-link" data-copy-url="${escapeHtml(directUrl)}" data-platform="copy">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            Copy Link
          </button>
        </div>
      </div>
    </div>
    <div class="hover-tooltip">
      <h4 class="hover-tooltip-title">${escapeHtml(title)}</h4>
      <img class="hover-tooltip-image" src="${escapeHtml(img)}" alt="${escapeHtml(title)}" loading="lazy">
      <div class="hover-tooltip-description">${escapeHtml(item.tagline || "")}</div>
      <div class="hover-tooltip-meta">
        ${metaA ? `<div class="hover-tooltip-meta-item"><span class="hover-tooltip-meta-label">Location/Category:</span><span>${escapeHtml(metaA)}</span></div>` : ""}
        ${metaB ? `<div class="hover-tooltip-meta-item"><span class="hover-tooltip-meta-label">Price:</span><span>${escapeHtml(metaB)}</span></div>` : ""}
        ${verified ? `<div class="hover-tooltip-meta-item"><span class="hover-tooltip-meta-label">Status:</span><span>${verified}</span></div>` : ""}
        ${item.description ? `<div class="hover-tooltip-meta-item" style="flex-direction: column; align-items: flex-start; gap: 4px;"><span class="hover-tooltip-meta-label">Full Details:</span><span style="font-size: 12px; line-height: 1.5;">${escapeHtml(item.description)}</span></div>` : ""}
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
  // PHASE 5: Preview mode support
  const urlParams = new URLSearchParams(window.location.search);
  const previewMode = urlParams.has('preview') && urlParams.get('preview') === 'true';
  
  // Filter deals based on mode
  const validItems = items.filter(item => {
    // Migration: treat missing status as published (existing deals)
    const status = item.status || 'published';
    
    // Preview mode: show published + drafts
    // Normal mode: published only
    if (!previewMode && status !== 'published') return false;
    
    // Filter out incomplete/placeholder deals
    return item.title && 
           item.title !== 'New Deal Title' &&
           item.title.trim() !== '' &&
           item.affiliate_url !== 'https://example.com/affiliate' &&
           item.price_hint !== '$0 - $0' &&
           item.image && 
           !item.image.startsWith('data:image/svg+xml');
  });
  
  // Show preview banner if in preview mode
  if (previewMode && container.parentElement) {
    const existingBanner = container.parentElement.querySelector('.preview-banner');
    if (!existingBanner) {
      const banner = document.createElement('div');
      banner.className = 'preview-banner';
      banner.style.cssText = 'background: #ff6b35; color: white; padding: 10px; text-align: center; font-weight: 600; margin-bottom: 20px; border-radius: 8px;';
      banner.innerHTML = '👁️ PREVIEW MODE: Showing published + draft deals';
      container.parentElement.insertBefore(banner, container);
    }
  }
  
  container.innerHTML = validItems.map(i => buildCard(i, kind)).join("");
  
  // Add error handling for failed image loads
  const images = container.querySelectorAll('img');
  images.forEach(img => {
    img.onerror = function() {
      console.log('[Image] Failed to load:', this.src);
      // Use a placeholder or hide the image gracefully
      this.style.opacity = '0.3';
      this.alt = 'Image unavailable';
    };
  });
}

function applyFilters(container, {query, category}){
  const cards = qsa(".item", container);
  const q = (query || "").trim().toLowerCase();
  const cat = (category || "").trim().toLowerCase();

  cards.forEach(card => {
    const title = (card.getAttribute("data-title") || "").toLowerCase();
    const city = (card.getAttribute("data-city") || "").toLowerCase();
    const c = (card.getAttribute("data-category") || "").toLowerCase();

    const matchQ = !q || title.includes(q) || city.includes(q);
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
    if (trackUrl) {
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
    }
    
    // Don't preventDefault - let normal navigation happen directly to affiliate URL
  }, { passive: true, capture: true });
}

// Initialize tracking on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initClickTracking);
} else {
  initClickTracking();
}

// Social sharing functionality
let shareInitialized = false;

function initShareButtons() {
  if (shareInitialized) return;
  shareInitialized = true;
  
  // Handle share button clicks
  document.addEventListener('click', function(e) {
    // Open share menu
    const shareBtn = e.target.closest('.share-btn');
    if (shareBtn) {
      e.preventDefault();
      e.stopPropagation();
      const cardId = shareBtn.getAttribute('data-card-id');
      const shareMenu = document.getElementById(`share-menu-${cardId}`);
      
      // Close all other share menus
      document.querySelectorAll('.share-menu').forEach(menu => {
        if (menu.id !== `share-menu-${cardId}`) {
          menu.style.display = 'none';
        }
      });
      
      // Toggle current menu
      if (shareMenu) {
        shareMenu.style.display = shareMenu.style.display === 'none' ? 'block' : 'none';
      }
      return;
    }
    
    // Close share menu
    const closeBtn = e.target.closest('.share-close');
    if (closeBtn) {
      e.preventDefault();
      e.stopPropagation();
      const closeId = closeBtn.getAttribute('data-close-id');
      const shareMenu = document.getElementById(`share-menu-${closeId}`);
      if (shareMenu) {
        shareMenu.style.display = 'none';
      }
      return;
    }
    
    // Copy link functionality
    const copyBtn = e.target.closest('.copy-link');
    if (copyBtn) {
      e.preventDefault();
      e.stopPropagation();
      const url = copyBtn.getAttribute('data-copy-url');
      
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(() => {
          const originalText = copyBtn.innerHTML;
          copyBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
            Copied!
          `;
          copyBtn.classList.add('copied');
          
          setTimeout(() => {
            copyBtn.innerHTML = originalText;
            copyBtn.classList.remove('copied');
          }, 2000);
        }).catch(err => {
          console.error('Failed to copy:', err);
          fallbackCopyText(url, copyBtn);
        });
      } else {
        fallbackCopyText(url, copyBtn);
      }
      return;
    }
    
    // Close share menus when clicking outside
    if (!e.target.closest('.share-menu') && !e.target.closest('.share-btn')) {
      document.querySelectorAll('.share-menu').forEach(menu => {
        menu.style.display = 'none';
      });
    }
  });
  
  // Track share events
  document.addEventListener('click', function(e) {
    const shareOption = e.target.closest('.share-option[data-platform]');
    if (shareOption) {
      const platform = shareOption.getAttribute('data-platform');
      const card = shareOption.closest('.item');
      if (card) {
        const title = card.getAttribute('data-title');
        const kind = card.getAttribute('data-kind');
        
        // Track share event (analytics)
        try {
          if (typeof gtag !== 'undefined') {
            gtag('event', 'share', {
              method: platform,
              content_type: kind,
              item_id: title
            });
          }
        } catch (err) {
          console.debug('Analytics tracking failed:', err);
        }
      }
    }
  });
}

// Fallback copy method for older browsers
function fallbackCopyText(text, button) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  
  try {
    document.execCommand('copy');
    const originalText = button.innerHTML;
    button.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
      Copied!
    `;
    button.classList.add('copied');
    
    setTimeout(() => {
      button.innerHTML = originalText;
      button.classList.remove('copied');
    }, 2000);
  } catch (err) {
    console.error('Fallback copy failed:', err);
    alert('Please manually copy this link: ' + text);
  } finally {
    document.body.removeChild(textArea);
  }
}

// Initialize share buttons on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initShareButtons);
} else {
  initShareButtons();
}

// Make entire card clickable (opens affiliate link)
let cardClickInitialized = false;

function initCardClick() {
  if (cardClickInitialized) return;
  cardClickInitialized = true;
  
  document.addEventListener('click', function(e) {
    // Find if click was on a card
    const card = e.target.closest('.card.item');
    if (!card) return;
    
    // Don't trigger if clicking on interactive elements
    if (e.target.closest('a, button, .share-menu, .hover-tooltip')) return;
    
    // Find the primary CTA link
    const primaryLink = card.querySelector('a.link.primary');
    if (primaryLink) {
      // Trigger the link (this will also trigger background tracking)
      primaryLink.click();
    }
  }, { passive: false });
}

// Initialize card click on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCardClick);
} else {
  initCardClick();
}

// In-memory cache for JSON data
const jsonCache = new Map();

/**
 * Init carousel section (homepage variant - limited items)
 * @param {Object} opts - container, json, kind, maxItems
 */
async function initCarouselSection(opts) {
  const container = qs(opts.container);
  if (!container) return;

  try {
    // Check cache first
    let items;
    if (jsonCache.has(opts.json)) {
      items = jsonCache.get(opts.json);
    } else {
      items = await loadJson(opts.json);
      jsonCache.set(opts.json, items);
    }

    // Sort by: priority (desc), featured (desc), then title (asc)
    items.sort((a, b) => {
      const priorityA = a.priority ?? 0;
      const priorityB = b.priority ?? 0;
      if (priorityA !== priorityB) return priorityB - priorityA;

      const featuredDiff = (b.featured === true) - (a.featured === true);
      if (featuredDiff !== 0) return featuredDiff;

      return String(a.title || "").localeCompare(String(b.title || ""));
    });

    // Limit items for homepage carousel
    const maxItems = opts.maxItems || 12;
    const limitedItems = items.slice(0, maxItems);

    renderList(container, limitedItems, opts.kind);
  } catch (err) {
    container.innerHTML = `<div class="notice">Could not load deals right now. Please refresh. <span class="small">${escapeHtml(err.message)}</span></div>`;
    console.error(err);
  }
}

/**
 * Initialize carousel controls
 * @param {string} name - carousel identifier (shop, travel, activities)
 * @param {string} containerSel - carousel container selector
 */
function initCarousel(name, containerSel) {
  const container = qs(containerSel);
  if (!container) return;

  const prevBtn = qs(`.carousel-prev[data-carousel="${name}"]`);
  const nextBtn = qs(`.carousel-next[data-carousel="${name}"]`);

  if (!prevBtn || !nextBtn) return;

  function updateButtonStates() {
    const scrollLeft = container.scrollLeft;
    const scrollWidth = container.scrollWidth;
    const clientWidth = container.clientWidth;

    prevBtn.disabled = scrollLeft <= 0;
    nextBtn.disabled = scrollLeft + clientWidth >= scrollWidth - 1;
  }

  prevBtn.addEventListener('click', () => {
    const scrollAmount = container.clientWidth * 0.9;
    container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    setTimeout(updateButtonStates, 300);
  });

  nextBtn.addEventListener('click', () => {
    const scrollAmount = container.clientWidth * 0.9;
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    setTimeout(updateButtonStates, 300);
  });

  container.addEventListener('scroll', updateButtonStates, { passive: true });

  // Enable horizontal scrolling with mouse wheel
  container.addEventListener('wheel', (e) => {
    // Only handle horizontal scroll if there's horizontal overflow
    if (container.scrollWidth > container.clientWidth) {
      e.preventDefault();
      // Use deltaY (vertical wheel) to scroll horizontally
      container.scrollBy({
        left: e.deltaY,
        behavior: 'auto' // instant for responsive wheel feeling
      });
      updateButtonStates();
    }
  }, { passive: false }); // passive: false needed for preventDefault

  // Initial button state
  setTimeout(updateButtonStates, 100);
}

// Equalize card heights within each grid
function equalizeCardHeights() {
  const grids = document.querySelectorAll('.grid');
  
  grids.forEach(grid => {
    const items = grid.querySelectorAll('.item');
    if (items.length === 0) return;
    
    // Reset heights first
    items.forEach(item => {
      const card = item.querySelector('.card');
      if (card) card.style.height = 'auto';
    });
    
    // Group items by row based on their offsetTop
    const rows = new Map();
    items.forEach(item => {
      const top = item.offsetTop;
      if (!rows.has(top)) {
        rows.set(top, []);
      }
      rows.get(top).push(item);
    });
    
    // Equalize heights within each row
    rows.forEach(rowItems => {
      let maxHeight = 0;
      
      // Find max height in this row
      rowItems.forEach(item => {
        const card = item.querySelector('.card');
        if (card) {
          const height = card.offsetHeight;
          if (height > maxHeight) maxHeight = height;
        }
      });
      
      // Apply max height to all cards in this row
      rowItems.forEach(item => {
        const card = item.querySelector('.card');
        if (card) {
          card.style.height = maxHeight + 'px';
        }
      });
    });
  });
}

// Run on load and resize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(equalizeCardHeights, 100);
  });
} else {
  setTimeout(equalizeCardHeights, 100);
}

window.addEventListener('resize', () => {
  clearTimeout(window.resizeTimer);
  window.resizeTimer = setTimeout(equalizeCardHeights, 250);
});

// Note: Direct affiliate navigation is now the default behavior
// The /go endpoint is kept for legacy/shared links only

window.TT = { initSection, initCarouselSection, initCarousel, equalizeCardHeights };
