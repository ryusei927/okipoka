window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('blog-search-button')?.addEventListener('click', () => {
    const keyword = document.getElementById('blog-search-input').value.toLowerCase();
    document.querySelectorAll('.blog-thumb').forEach(el => {
      const text = el.innerText.toLowerCase() + el.dataset.tags + el.dataset.author;
      el.style.display = text.includes(keyword) ? '' : 'none';
    });
  });

  document.querySelectorAll('.filter-button').forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      document.querySelectorAll('.blog-thumb').forEach(el => {
        const isFree = el.getAttribute('href')?.includes('/free/');
        if (filter === 'all') {
          el.style.display = '';
        } else if (filter === 'free') {
          el.style.display = isFree ? '' : 'none';
        } else if (filter === 'paid') {
          el.style.display = !isFree ? '' : 'none';
        }
      });
    });
  });

  const blogItems = Array.from(document.querySelectorAll('.blog-thumb'));
  const paginationContainer = document.querySelector('.pagination');
  const isMobile = window.innerWidth < 768;
  const perPage = isMobile ? 8 : 12;
  let currentPage = 1;

  function renderPagination() {
    const totalPages = Math.ceil(blogItems.length / perPage);
    if (!paginationContainer) return;
    paginationContainer.innerHTML = '';

    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement('button');
      btn.textContent = i;
      btn.classList.add('pagination-button');
      if (i === currentPage) btn.classList.add('active');
      btn.addEventListener('click', () => {
        currentPage = i;
        renderPage();
        renderPagination();
      });
      paginationContainer.appendChild(btn);
    }
  }

  function renderPage() {
    const start = (currentPage - 1) * perPage;
    const end = start + perPage;
    blogItems.forEach((el, i) => {
      el.style.display = (i >= start && i < end) ? '' : 'none';
    });
  }

  renderPage();
  renderPagination();
});