const hamburger = document.getElementById("hamburger");
const navMenu = document.getElementById("navMenu");

hamburger.addEventListener("click", () => {
    navMenu.classList.toggle("show");
    hamburger.classList.toggle("active");
});