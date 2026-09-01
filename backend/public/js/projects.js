const searchInput = document.getElementById('searchInput');
const projectCards = Array.from(document.querySelectorAll('.project-card'));
const emptyState = document.getElementById('emptyState');
const loadMoreSection = document.getElementById('loadMoreSection');
const loadMoreButton = document.getElementById('loadMoreButton');
const loadMoreSummary = document.getElementById('loadMoreSummary');

const PAGE_SIZE = 3;
let visibleLimit = PAGE_SIZE;

function filterProjects() {
  const searchTerm = searchInput.value.toLowerCase().trim();
  let matchingCount = 0;
  let shownCount = 0;

  projectCards.forEach(card => {
    const title = card.dataset.title || '';
    const description = card.dataset.description || '';
    const tech = card.dataset.tech || '';

    const matchesSearch = !searchTerm ||
        title.includes(searchTerm) ||
        description.includes(searchTerm) ||
        tech.includes(searchTerm);

    if (matchesSearch) matchingCount++;

    const isVisible = matchesSearch && shownCount < visibleLimit;
    card.style.display = isVisible ? 'flex' : 'none';
    if (isVisible) shownCount++;
  });

  if (emptyState) {
    emptyState.style.display = matchingCount === 0 ? 'block' : 'none';
  }

  const hasHidden = matchingCount > visibleLimit;
  if (loadMoreSection) {
    loadMoreSection.style.display = hasHidden ? 'flex' : 'none';
  }
  if (hasHidden && loadMoreSummary) {
    loadMoreSummary.textContent = `Showing ${shownCount} of ${matchingCount} projects`;
  }
}

function loadMore() {
  visibleLimit += PAGE_SIZE;
  filterProjects();
}

function resetFilters() {
  searchInput.value = '';
  visibleLimit = PAGE_SIZE;
  filterProjects();
}

searchInput.addEventListener('input', () => {
  visibleLimit = PAGE_SIZE; // new search = fresh page of results
  filterProjects();
});
if (loadMoreButton) {
  loadMoreButton.addEventListener('click', loadMore);
}

filterProjects();

const style = document.createElement('style');
style.textContent = `
            .marquee-container {
                overflow: hidden;
            }
            .marquee-content {
                display: inline-block;
                white-space: nowrap;
                animation: marquee 30s linear infinite;
            }
            @keyframes marquee {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
            }
            .shadow-neo {
                box-shadow: 8px 8px 0 0 #000;
            }
            .line-clamp-3 {
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }
        `;
document.head.appendChild(style);