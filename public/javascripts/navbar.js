document.addEventListener('DOMContentLoaded', () => {
    fetch('/navbar.html')
      .then(response => response.text())
      .then(data => {
        document.querySelector('body').insertAdjacentHTML('afterbegin', data);
  
        const toggleButton = document.getElementById('navbar-toggle');
        const menuMobile = document.getElementById('navbar-menu-mobile');
        const menuDesktop = document.getElementById('navbar-menu');
  
        toggleButton.addEventListener('click', () => {
          // Toggle the visibility of the mobile menu
          menuMobile.classList.toggle('hidden');
          // Hide the desktop menu on mobile view
          menuDesktop.classList.add('hidden');
        });
      });
  });
  