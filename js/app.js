let COMICS = [];
let currentIndex = 0;
let filteredComics = [];

// Extract reliable YYYY-MM-DD date from a comic entry.
// Uses the image path as source of truth since c.date may be in
// various text formats (e.g. "January 29, 2026") in older entries.
function getIsoDate(comic) {
  const match = (comic.image || '').match(/(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];
  if (/^\d{4}-\d{2}-\d{2}$/.test(comic.date)) return comic.date;
  return comic.date;
}

async function loadComics() {
  try {
    const res = await fetch('captions.json?v=' + Date.now());
    if (!res.ok) throw new Error('HTTP ' + res.status);
    COMICS = await res.json();
    filteredComics = [...COMICS];
    renderGrid(filteredComics);
  } catch (e) {
    document.getElementById('comicGrid').innerHTML =
      `<div class="no-results"><p>Could not load captions.json<br><small>${e.message}</small></p></div>`;
  }
}

const PAGE_SIZE = 40;
let visibleCount = PAGE_SIZE;

function renderGrid(comics, append = false) {
  const grid  = document.getElementById('comicGrid');
  const count = document.getElementById('searchCount');
  const bar   = document.getElementById('loadMoreBar');
  const isFiltered = comics.length < COMICS.length;
  const showAll = isFiltered;
  const slice = showAll ? comics : comics.slice(0, visibleCount);
  count.innerHTML = isFiltered
    ? `Found <span>${comics.length}</span> of <span>${COMICS.length}</span> total episodes`
    : `Showing <span>${Math.min(visibleCount, comics.length)}</span> of <span>${COMICS.length}</span> total episodes`;
  if (!comics.length) {
    grid.innerHTML = `<div class="no-results"><p>No episodes found. Try a different search!</p></div>`;
    bar.classList.remove('visible');
    return;
  }
  const startIdx = append ? (visibleCount - PAGE_SIZE) : 0;
  const newCards = slice.slice(startIdx).map((c, i) => {
    const globalIdx = COMICS.indexOf(c);
    return `<article class="comic-card" onclick="openComic(${globalIdx})" style="animation-delay:${(append ? i : (startIdx + i)) * 0.03}s">
      <div class="card-img-wrap"><img src="${c.image}" alt="${c.title}" loading="lazy" onerror="this.src='https://placehold.co/600x600/1c1818/f5a623?text='+encodeURIComponent(c.title)"></div>
      <div class="card-body">
        <div class="card-meta">${c.date}</div>
        <div class="card-title">${c.title}</div>
        <p class="card-intro">${c.intro.replace(/\n/g,' ')}</p>
      </div>
    </article>`;
  }).join('');
  if (append) { grid.insertAdjacentHTML('beforeend', newCards); }
  else { grid.innerHTML = newCards; }
  if (!showAll && visibleCount < comics.length) { bar.classList.add('visible'); }
  else { bar.classList.remove('visible'); }
}

function loadMore() { visibleCount += PAGE_SIZE; renderGrid(filteredComics, true); }
function loadAll()  { visibleCount = COMICS.length; renderGrid(filteredComics, false); }

function handleSearch() {
  const q = document.getElementById('searchInput').value.toLowerCase().trim();
  visibleCount = PAGE_SIZE;
  filteredComics = q ? COMICS.filter(c =>
    c.title.toLowerCase().includes(q) || c.intro.toLowerCase().includes(q) ||
    c.date.includes(q) || (c.tags||[]).some(t => t.toLowerCase().includes(q)))
    : [...COMICS];
  renderGrid(filteredComics);
}

function clearSearch() {
  document.getElementById('searchInput').value = '';
  visibleCount = PAGE_SIZE;
  filteredComics = [...COMICS];
  renderGrid(filteredComics);
}

function openComic(idx) {
  currentIndex = idx;
  renderSingle();
  document.getElementById('view-gallery').style.display = 'none';
  document.getElementById('view-single').style.display  = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderSingle() {
  const c = COMICS[currentIndex];
  document.getElementById('singleDate').textContent  = c.date;
  document.getElementById('singleTitle').textContent = c.title;
  document.getElementById('singleIntro').textContent = c.intro;
  const img = document.getElementById('singleImg');
  img.src = c.image; img.alt = c.title;
  img.onerror = () => { img.src = `https://placehold.co/800x800/1c1818/f5a623?text=${encodeURIComponent(c.title)}`; };
  document.getElementById('singleTags').innerHTML = (c.tags||[]).map(t => `<span class="caption-tag">#${t}</span>`).join('');
  document.getElementById('arrowNewer').classList.toggle('disabled', currentIndex <= 0);
  document.getElementById('arrowOlder').classList.toggle('disabled', currentIndex >= COMICS.length - 1);
  const pageUrl = window.location.href.split('#')[0] + '#' + getIsoDate(c);
  const shareText = `Sisters of Summerville: "${c.title}" #SistersOfSummerville`;
  document.getElementById('shareFb').href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}&quote=${encodeURIComponent(shareText)}`;
  document.getElementById('shareX').href  = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(pageUrl)}`;
}

function navigateComic(dir) {
  const next = currentIndex + dir;
  if (next < 0 || next >= COMICS.length) return;
  currentIndex = next; renderSingle();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function backToGallery() {
  document.getElementById('view-single').style.display  = 'none';
  document.getElementById('view-gallery').style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function copyLink() {
  const c = COMICS[currentIndex];
  const url = window.location.href.split('#')[0] + '#' + getIsoDate(COMICS[currentIndex]);
  navigator.clipboard.writeText(url).then(()=>showToast('Link copied!')).catch(()=>showToast('Could not copy'));
}

let CHARACTERS = [];
let currentCharIndex = 0;

async function loadCharacters() {
  if (CHARACTERS.length) return;
  try {
    const res = await fetch('characters.json?v=' + Date.now());
    if (!res.ok) throw new Error('HTTP ' + res.status);
    CHARACTERS = await res.json();
    renderCharacters();
  } catch(e) {
    document.getElementById('charGrid').innerHTML = `<div class="no-results"><p>Could not load characters.json</p></div>`;
  }
}

function renderCharacters() {
  document.getElementById('charGrid').innerHTML = CHARACTERS.map((c, i) => `
    <div class="char-card" onclick="openCharView(${i})" style="animation-delay:${i*0.04}s">
      <div class="char-img-wrap">
        <img src="${c.image}" alt="${c.name}" loading="lazy" onerror="this.src='https://placehold.co/400x400/1c1818/f5a623?text='+encodeURIComponent(c.name)">
      </div>
      <div class="char-card-body">
        <div class="char-name">${c.name}</div>
        <div class="char-tags">${(c.tags||[]).slice(0,2).map(t=>`<span class="char-tag">${t}</span>`).join('')}</div>
      </div>
    </div>`).join('');
}

function openCharView(idx) {
  currentCharIndex = idx;
  renderCharView();
  history.pushState(null, '', '#character/' + toSlug(CHARACTERS[idx].name));
  document.getElementById('view-gallery').style.display   = 'none';
  document.getElementById('view-single').style.display    = 'none';
  document.getElementById('view-character').style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderCharView() {
  const c = CHARACTERS[currentCharIndex];
  document.getElementById('charViewName').textContent = c.name;
  document.getElementById('charViewDesc').textContent = c.description;
  const img = document.getElementById('charViewImg');
  img.src = c.image; img.alt = c.name;
  img.onerror = () => { img.src = `https://placehold.co/800x800/1c1818/f5a623?text=${encodeURIComponent(c.name)}`; };
  document.getElementById('charViewTags').innerHTML = (c.tags||[]).map(t=>`<span class="caption-tag">#${t}</span>`).join('');
  document.getElementById('charArrowPrev').classList.toggle('disabled', currentCharIndex <= 0);
  document.getElementById('charArrowNext').classList.toggle('disabled', currentCharIndex >= CHARACTERS.length - 1);
}

function navigateChar(dir) {
  const next = currentCharIndex + dir;
  if (next < 0 || next >= CHARACTERS.length) return;
  currentCharIndex = next; renderCharView();
  history.pushState(null, '', '#character/' + toSlug(CHARACTERS[currentCharIndex].name));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function backToCharacters() {
  document.getElementById('view-character').style.display = 'none';
  document.getElementById('view-gallery').style.display   = 'block';
  history.pushState(null, '', '#characters');
  showTab('characters', null);
  document.querySelectorAll('#view-gallery .nav-link').forEach(l => {
    l.classList.toggle('active', l.textContent.includes('Characters'));
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

let BLOG_POSTS = [];
let currentBlogSlug = '';
let currentBlogIndex = 0;

async function loadBlog() {
  if (BLOG_POSTS.length) { renderBlogGrid(); return; }
  try {
    const res = await fetch('blog.json?v=' + Date.now());
    if (!res.ok) throw new Error('HTTP ' + res.status);
    BLOG_POSTS = await res.json();
    renderBlogGrid();
  } catch(e) {
    document.getElementById('blogGrid').innerHTML = `<div class="no-results"><p>Could not load blog.json</p></div>`;
  }
}

function renderBlogGrid() {
  document.getElementById('blogGrid').innerHTML = BLOG_POSTS.map((p, i) => {
    const thumb = p.youtube
      ? `<div class="blog-thumb-youtube"><img src="https://img.youtube.com/vi/${p.youtube}/mqdefault.jpg" alt="${p.title}"><span class="play-icon">&#9654;&#65039;</span></div>`
      : `<div class="blog-thumb"><img src="${p.image || ''}" alt="${p.title}" loading="lazy" onerror="this.src='https://placehold.co/400x225/1c1818/f5a623?text=Blog'"></div>`;
    return `<div class="blog-card" onclick="openBlogPost('${p.slug}')" style="animation-delay:${i*0.06}s">
      <div class="blog-card-inner">
        ${thumb}
        <div class="blog-card-body">
          <div class="blog-date">${p.date}</div>
          <div class="blog-title">${p.title}</div>
          <p class="blog-excerpt">${p.body.replace(/\n/g,' ')}</p>
          <div class="blog-tags">${(p.tags||[]).map(t=>`<span class="blog-tag">#${t}</span>`).join('')}</div>
          <div class="blog-read-more">Read more &rarr;</div>
        </div>
      </div>
    </div>`;
  }).join('');
}

function openBlogPost(slug) {
  const idx = BLOG_POSTS.findIndex(p => p.slug === slug);
  if (idx === -1) return;
  currentBlogIndex = idx;
  currentBlogSlug  = slug;
  const p = BLOG_POSTS[idx];

  document.getElementById('blogPostDate').textContent  = p.date;
  document.getElementById('blogPostTitle').textContent = p.title;
  document.getElementById('blogPostTags').innerHTML = (p.tags||[]).map(t=>`<span class="caption-tag">#${t}</span>`).join('');
  document.getElementById('blogPostBody').innerHTML = p.body.split(/\n\n+/).map(para => `<p>${para.replace(/\n/g,'<br>')}</p>`).join('');

  const ytWrap    = document.getElementById('blogYoutubeWrap');
  const imgEl     = document.getElementById('blogPostImage');
  const multiWrap = document.getElementById('blogMultiImages');
  if (multiWrap) multiWrap.remove();

  if (p.youtube) {
    document.getElementById('blogYoutubeFrame').src = `https://www.youtube.com/embed/${p.youtube}?rel=0`;
    ytWrap.style.display = 'block'; imgEl.style.display = 'none';
  } else if (p.images && p.images.length > 1) {
    ytWrap.style.display = 'none'; imgEl.style.display = 'none';
    const grid = document.createElement('div');
    grid.id = 'blogMultiImages';
    grid.style.cssText = 'display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:1rem; margin-bottom:1.5rem;';
    grid.innerHTML = p.images.map(src =>
      `<img src="${src}" alt="${p.title}" style="width:100%; border-radius:var(--radius,12px); border:1px solid var(--border-lit,#3d2f20); display:block;" loading="lazy">`
    ).join('');
    document.getElementById('blogPostBody').before(grid);
  } else if (p.image) {
    imgEl.src = p.image; imgEl.alt = p.title;
    imgEl.style.display = 'block'; ytWrap.style.display = 'none';
  } else {
    ytWrap.style.display = 'none'; imgEl.style.display = 'none';
  }

  // Update arrows — newest = index 0 (left = newer = lower index, right = older = higher index)
  document.getElementById('blogArrowNewer').classList.toggle('disabled', currentBlogIndex <= 0);
  document.getElementById('blogArrowOlder').classList.toggle('disabled', currentBlogIndex >= BLOG_POSTS.length - 1);

  history.pushState(null, '', '#blog/' + slug);
  document.getElementById('view-gallery').style.display   = 'none';
  document.getElementById('view-blog-post').style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function navigateBlog(dir) {
  const next = currentBlogIndex + dir;
  if (next < 0 || next >= BLOG_POSTS.length) return;
  openBlogPost(BLOG_POSTS[next].slug);
}

function backToBlog() {
  document.getElementById('blogYoutubeFrame').src = '';
  document.getElementById('view-blog-post').style.display = 'none';
  document.getElementById('view-gallery').style.display   = 'block';
  history.pushState(null, '', '#blog');
  showTab('blog', null);
  document.querySelectorAll('#view-gallery .nav-link').forEach(l => {
    l.classList.toggle('active', l.textContent.includes('Blog'));
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function shareBlogFb() {
  const url = window.location.href.split('#')[0] + '#blog/' + currentBlogSlug;
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
}
function shareBlogX() {
  const p = BLOG_POSTS.find(p => p.slug === currentBlogSlug);
  const url = window.location.href.split('#')[0] + '#blog/' + currentBlogSlug;
  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent((p?.title||'') + ' ')}&url=${encodeURIComponent(url)}`, '_blank');
}
function copyBlogLink() {
  const url = window.location.href.split('#')[0] + '#blog/' + currentBlogSlug;
  navigator.clipboard.writeText(url).then(()=>showToast('Link copied!')).catch(()=>showToast('Could not copy'));
}

function showTab(name, btn) {
  ['comics','characters','about','subscribe','blog'].forEach(s => {
    document.getElementById(`section-${s}`).style.display = (s === name) ? 'block' : 'none';
  });
  document.querySelectorAll('#view-gallery .nav-link').forEach(l => l.classList.remove('active'));
  if (btn) btn.classList.add('active');
  if (name === 'characters') loadCharacters();
  if (name === 'blog')       loadBlog();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

// FIXED keyboard handler
// ══════════════════════════════════════════
//  LIGHTBOX
// ══════════════════════════════════════════
function openLightbox() {
  const src = document.getElementById('singleImg').src;
  if (!src) return;
  const lb = document.getElementById('lightbox');
  document.getElementById('lightboxImg').src = src;
  lb.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  document.getElementById('lightbox').style.display = 'none';
  document.body.style.overflow = '';
}

document.addEventListener('keydown', e => {
  if (document.getElementById('view-single').style.display === 'block') {
    if (e.key === 'ArrowLeft')  navigateComic(-1);
    if (e.key === 'ArrowRight') navigateComic(1);
    if (e.key === 'Escape')     backToGallery();
  }
  if (document.getElementById('view-character').style.display === 'block') {
    if (e.key === 'ArrowLeft')  navigateChar(-1);
    if (e.key === 'ArrowRight') navigateChar(1);
    if (e.key === 'Escape')     backToCharacters();
  }
  if (document.getElementById('lightbox').style.display === 'flex') { if (e.key === 'Escape') closeLightbox(); return; }
  if (document.getElementById('view-blog-post').style.display === 'block') {
    if (e.key === 'ArrowLeft')  navigateBlog(-1);
    if (e.key === 'ArrowRight') navigateBlog(1);
    if (e.key === 'Escape') backToBlog();
  }
});

function openComicByHash() {
  const hash = decodeURIComponent(window.location.hash.replace('#',''));
  if (!hash) return;
  if (hash === 'blog') {
    showTab('blog', null);
    document.querySelectorAll('#view-gallery .nav-link').forEach(l => l.classList.toggle('active', l.textContent.includes('Blog')));
    return;
  }
  if (hash.startsWith('blog/')) {
    const slug = hash.replace('blog/','');
    const tryOpen = () => { if (BLOG_POSTS.find(p => p.slug === slug)) openBlogPost(slug); };
    if (BLOG_POSTS.length) { tryOpen(); } else { loadBlog().then(tryOpen); }
    return;
  }
  if (hash === 'subscribe') {
    showTab('subscribe', null);
    document.querySelectorAll('#view-gallery .nav-link').forEach(l => l.classList.toggle('active', l.textContent.includes('Subscribe')));
    return;
  }
  if (hash === 'about') {
    showTab('about', null);
    document.querySelectorAll('#view-gallery .nav-link').forEach(l => l.classList.toggle('active', l.textContent.includes('About')));
    return;
  }
  if (hash === 'characters') {
    showTab('characters', null);
    document.querySelectorAll('#view-gallery .nav-link').forEach(l => l.classList.toggle('active', l.textContent.includes('Characters')));
    return;
  }
  if (hash.startsWith('character/')) {
    const slug = hash.replace('character/','');
    const tryOpen = () => { const idx = CHARACTERS.findIndex(c => toSlug(c.name) === slug); if (idx !== -1) openCharView(idx); };
    if (CHARACTERS.length) { tryOpen(); } else { loadCharacters().then(tryOpen); }
    return;
  }
  if (hash.match(/\d{4}-\d{2}-\d{2}/)) {
    const idx = COMICS.findIndex(c => getIsoDate(c) === hash || c.image.includes(hash));
    if (idx !== -1) openComic(idx);
  }
}

function toSlug(name) {
  return name.toLowerCase().replace(/['']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function init() {
  await loadComics();
  showTab('comics', null);
  document.querySelector('#view-gallery .nav-link').classList.add('active');
  openComicByHash();
}

window.addEventListener('hashchange', openComicByHash);
init();