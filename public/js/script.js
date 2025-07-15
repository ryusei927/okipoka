const section = document.querySelector('.time-based-bg');
const now = new Date();
const hour = now.getHours();
const minute = now.getMinutes();

if (hour >= 7 && hour < 17) {
  section.classList.add('morning');
} else if ((hour === 17) || (hour === 18 && minute < 30)) {
  section.classList.add('afternoon');
} else {
  section.classList.add('night');
}