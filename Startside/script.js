document.addEventListener("DOMContentLoaded", () => {
  const texts = [
    "🐸 PIXEL ARCADE",
    "💣 MINESWEEPER",
    "🟡 PAC-MAN",
    "🏁 TETRIS",
    "🏓 PONG",
    "🐍 SNAKE",
    "🌀 2048"
  ];

const colors = [
  "#ff355e", // Neon Red
  "#ff9f1c", // Arcade Orange
  "#fff65b", // CRT Yellow
  "#39ff14", // Neon Green
  "#00e5ff", // Electric Cyan
  "#5f5cff", // Retro Blue
  "#c77dff"  // Neon Purple
];

  const rainbow = [...colors];
  const scrambleChars = "!@#$%^&*<>?/\\|~";

  const textEl = document.getElementById("text");
  const icon = document.getElementById("nextText");

  let index = 0;
  let typing = false;
  let intervalId = null;

  const randomChar = () =>
    scrambleChars[Math.floor(Math.random() * scrambleChars.length)];

  function span(char, color, drop = false) {
    const s = document.createElement("span");
    s.textContent = char;
    s.style.color = color;
    if (drop) s.classList.add("char-drop");
    return s;
  }

  function typeText(text, finalColor) {
    if (typing) return;
    typing = true;

    textEl.innerHTML = "";
    icon.style.color = finalColor;

    const chars = Array.from(text);
    let i = 0;

    const underscore = document.createElement("span");
    underscore.classList.add("console-underscore");
    underscore.textContent = "_";
    underscore.style.backdropFilter = "blur(4px)";
    textEl.appendChild(underscore);

    function next() {
      if (i >= chars.length) {
        setTimeout(() => {
          textEl.querySelectorAll(".char-final").forEach((l, idx) => {
            l.style.transition = "color .5s ease, transform .3s ease";
            l.style.color = rainbow[idx % rainbow.length];
            l.style.transform = "scale(1)";
          });
          typing = false;
        }, 100);
        return;
      }

      const fake = span(randomChar(), rainbow[i % rainbow.length], true);
      fake.style.opacity = "0.5";
      fake.style.transform = "scale(0.8)";
      fake.style.transition = "opacity .2s ease, transform .2s ease";
      textEl.insertBefore(fake, underscore);

      setTimeout(() => {
        fake.remove();

        const real = span(chars[i], rainbow[i % rainbow.length]);
        real.classList.add("char-final");
        real.style.opacity = "1";
        real.style.transform = "scale(1.1)";
        real.style.transition = "opacity .3s ease, transform .3s ease";
        textEl.insertBefore(real, underscore);

        i++;
        setTimeout(next, 80);
      }, 70);
    }

    next();
  }

  function nextText() {
    index = (index + 1) % texts.length;
    typeText(texts[index], colors[index % colors.length]);
  }

  function resetInterval() {
    clearInterval(intervalId);
    intervalId = setInterval(nextText, 8000);
  }

  // Start
  typeText(texts[index], colors[index % colors.length]);
  resetInterval();

  // Klick = nächster + Timer reset
  textEl.addEventListener("click", () => {
    nextText();
    resetInterval();
  });

  icon.addEventListener("click", () => {
    nextText();
    resetInterval();
  });
});
