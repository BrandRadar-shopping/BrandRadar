// Mega Menu Hover System
const categoryItems = document.querySelectorAll('.category-item');
const megaMenu = document.querySelector('.mega-menu');
const megaContents = document.querySelectorAll('.mega-content');

let activeCategory = null;

categoryItems.forEach(item => {
  item.addEventListener('mouseenter', () => {
    const category = item.dataset.category;
    activeCategory = category;

    megaMenu.classList.add('active');
    megaContents.forEach(content => {
      content.classList.remove('active');
      if (content.id === category) {
        content.classList.add('active');
      }
    });
  });
});

// Hide menu when leaving the area
megaMenu.addEventListener('mouseleave', () => {
  megaMenu.classList.remove('active');
});


