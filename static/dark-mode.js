const root = document.documentElement;
const button = document.getElementById("theme-toggle");

button.addEventListener("click", () => {
  const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";

  root.dataset.theme = nextTheme;
  localStorage.setItem("theme", nextTheme);
});
