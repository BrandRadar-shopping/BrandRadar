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

// --- Clean Mega Menu ---
const navItems = document.querySelectorAll('.nav-item');
const megaMenu = document.getElementById('mega-menu');
const megaContents = document.querySelectorAll('.mega-content');

let currentCategory = null;

navItems.forEach(item => {
  item.addEventListener('mouseenter', () => {
    const target = item.dataset.target;
    currentCategory = target;
    megaMenu.classList.add('active');

    megaContents.forEach(content => {
      content.classList.remove('active');
      if (content.id === target) content.classList.add('active');
    });

    navItems.forEach(n => n.classList.remove('active'));
    item.classList.add('active');
  });
});

megaMenu.addEventListener('mouseleave', () => {
  megaMenu.classList.remove('active');
  navItems.forEach(n => n.classList.remove('active'));
});


