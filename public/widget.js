// public/widget.js
(function(){
  const root = document.getElementById('avito-reviews-widget');
  if(!root){ return; }

  const ENDPOINT = root.dataset.endpoint || '/api/reviews';
  const LIMIT = parseInt(root.dataset.limit || '6', 10);

  root.innerHTML = `
    <style>
      .arw-shell{ font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Inter,Arial,sans-serif; }
      .arw-head{ display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
      .arw-title{ font-weight:800; font-size:18px; margin:0; }
      .arw-link{ font-size:13px; color:#18a957; text-decoration:none; }
      .arw-grid{ display:grid; grid-template-columns: repeat(3, 1fr); gap:12px; }
      .arw-card{ border:1px solid #e5e7eb; border-radius:12px; padding:12px; background:#fff; }
      .arw-author{ font-weight:700; margin:0 0 6px; font-size:14px; }
      .arw-meta{ color:#667085; font-size:12px; margin-bottom:6px; }
      .arw-text{ font-size:14px; line-height:1.5; color:#111; }
      .arw-stars{ color:#f5a623; letter-spacing:1px; font-size:14px; }
      .arw-skel{ display:grid; grid-template-columns: repeat(3, 1fr); gap:12px; }
      .arw-skel .s{ height:110px; border-radius:12px; background:linear-gradient(90deg,#f2f4f7,#e9eef5,#f2f4f7); background-size: 200% 100%; animation: arwShine 1.2s infinite; }
      @keyframes arwShine{ 0%{background-position:0 0;} 100%{background-position:200% 0;} }
      @media (max-width: 800px){ .arw-grid{ grid-template-columns: 1fr; } .arw-skel{ grid-template-columns: 1fr; } }
    </style>
    <div class="arw-shell">
      <div class="arw-head">
        <h3 class="arw-title">Отзывы покупателей</h3>
        <a class="arw-link" target="_blank" rel="noopener" href="#">Смотреть все на Авито</a>
      </div>
      <div class="arw-skel">
        <div class="s"></div><div class="s"></div><div class="s"></div>
      </div>
      <div class="arw-grid" style="display:none;"></div>
    </div>
  `;

  const allLink = root.querySelector('.arw-link');
  const grid = root.querySelector('.arw-grid');
  const skel = root.querySelector('.arw-skel');

  fetch(`${ENDPOINT}?limit=${LIMIT}`)
    .then(r => r.json())
    .then(data => {
      if(!data || !data.ok){ throw new Error(data?.error || 'Bad response'); }
      allLink.href = data.source;
      if(!data.reviews || !data.reviews.length){
        skel.innerHTML = '<div class="arw-card">Пока нет отзывов. Посмотреть на Авито: <a href="'+data.source+'" target="_blank" rel="noopener">ссылка</a></div>';
        return;
      }
      grid.innerHTML = data.reviews.map(r => {
        const stars = r.rating ? '★'.repeat(Math.round(r.rating)) + '☆'.repeat(5-Math.round(r.rating)) : '';
        return `
          <div class="arw-card">
            <p class="arw-author">${escapeHtml(r.author)}</p>
            <div class="arw-meta">
              ${r.date ? `<span>${escapeHtml(r.date)}</span>` : ''}
              ${r.rating ? `<span class="arw-stars"> ${stars}</span>` : ''}
            </div>
            <div class="arw-text">${escapeHtml(r.text)}</div>
          </div>
        `;
      }).join('');
      skel.style.display = 'none';
      grid.style.display = 'grid';
    })
    .catch(err => {
      console.error(err);
      skel.innerHTML = '<div class="arw-card">Не удалось загрузить отзывы. Попробуйте позже.</div>';
    });

  function escapeHtml(s){
    return String(s||'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }
})();
