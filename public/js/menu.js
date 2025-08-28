const toggleBtn = document.querySelector(".menu-toggle");
const nav = document.querySelector("header nav");
const overlay = document.querySelector(".overlay");

// abrir / cerrar menú
toggleBtn.addEventListener("click", () => {
  nav.classList.toggle("active");
  overlay.classList.toggle("active");
});

// cerrar al hacer clic en overlay
overlay.addEventListener("click", () => {
  nav.classList.remove("active");
  overlay.classList.remove("active");
});

// cerrar al hacer clic en un enlace del menú
document.querySelectorAll("header nav a").forEach(link => {
  link.addEventListener("click", () => {
    nav.classList.remove("active");
    overlay.classList.remove("active");
  });
});
