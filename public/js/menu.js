const toggleBtn = document.querySelector(".menu-toggle");
const nav = document.querySelector("header nav");

toggleBtn.addEventListener("click", () => {
  nav.classList.toggle("active");
});
