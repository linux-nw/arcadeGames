document.addEventListener("DOMContentLoaded", () => {
  const colors = [
    "#ff355e","#ff9f1c","#fff65b","#39ff14","#00e5ff","#5f5cff","#c77dff"
  ];
  const rainbow = [...colors];
  const scrambleChars = "!@#$%^&*<>?/\\|~";

  const textEl = document.getElementById("text");
  const icon = document.getElementById("nextText");
  if(!textEl) return;

  // allow custom list via data-texts (comma separated), otherwise use current text only
  const raw = textEl.dataset.texts;
  const texts = raw ? raw.split(',').map(s=>s.trim()) : [textEl.textContent || document.title];

  let index = 0;
  let typing = false;

  const randomChar = () => scrambleChars[Math.floor(Math.random() * scrambleChars.length)];

  function span(char, color, drop = false) {
    const s = document.createElement("span");
    s.textContent = char;
    s.style.color = color;
    if (drop) s.classList.add("char-drop");
    return s;
  }

  function typeText(text) {
    if (typing) return;
    typing = true;

    textEl.innerHTML = "";
    if(icon) icon.style.color = colors[index % colors.length];

    const chars = Array.from(text);
    let i = 0;

    const underscore = document.createElement("span");
    underscore.classList.add("console-underscore");
    underscore.textContent = "_";
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
    typeText(texts[index]);
  }

  let intervalId = setInterval(nextText, 8000);
  // initial
  typeText(texts[index]);

  function resetInterval() {
    clearInterval(intervalId);
    intervalId = setInterval(nextText, 8000);
  }

  textEl.addEventListener("click", () => { nextText(); resetInterval(); });
  if(icon) icon.addEventListener("click", () => { nextText(); resetInterval(); });
});
