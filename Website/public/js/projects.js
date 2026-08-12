const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const projectCards = document.querySelectorAll('.project-card');
const emptyState = document.getElementById('emptyState');

function filterProjects() {
  const searchTerm = searchInput.value.toLowerCase();
  const statusValue = statusFilter.value.toLowerCase();
  let visibleCount = 0;

  projectCards.forEach(card => {
    const title = card.dataset.title;
    const description = card.dataset.description;
    const tech = card.dataset.tech;
    const status = card.dataset.status;

    const matchesSearch = !searchTerm ||
      title.includes(searchTerm) ||
      description.includes(searchTerm) ||
      tech.includes(searchTerm);

    const matchesStatus = !statusValue || status === statusValue;

    if (matchesSearch && matchesStatus) {
      card.style.display = 'flex';
      visibleCount++;
    } else {
      card.style.display = 'none';
    }
  });

  if (visibleCount === 0) {
    emptyState.style.display = 'block';
  } else {
    emptyState.style.display = 'none';
  }
}

searchInput.addEventListener('input', filterProjects);
statusFilter.addEventListener('change', filterProjects);

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