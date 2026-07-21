// ------------------------------------------------
// POLYFILL (Safari antigo)
// ------------------------------------------------

if (!Element.prototype.closest) {
  Element.prototype.closest = function (selector) {
    var el = this;
    while (el) {
      if (el.matches && el.matches(selector)) return el;
      el = el.parentElement;
    }
    return null;
  };
}

// ------------------------------------------------
// MAIN
// ------------------------------------------------

document.addEventListener('DOMContentLoaded', function () {
  var scrollAnimation = null;
  var activeContainer = null;
  var autoScrolling = false;

  var lastTapTime = 0;
  var doubleTapDelay = 400;

  // ------------------------------------------------
  // PISCAR DO PEDAL NO BPM DA MUSICA
  // Compatível com Safari antigo / iPad 2011
  // ------------------------------------------------

  var pedalContainers = document.querySelectorAll('.container');

  for (var pedalIndex = 0; pedalIndex < pedalContainers.length; pedalIndex++) {
    var pedalContainer = pedalContainers[pedalIndex];
    var bpmElement = pedalContainer.querySelector('.bpm');

    if (!bpmElement) continue;

    var bpmMatch = bpmElement.textContent.match(/BPM:\s*(\d+(?:[.,]\d+)?)/i);

    if (!bpmMatch) continue;

    var bpm = parseFloat(bpmMatch[1].replace(',', '.'));

    if (!bpm || bpm <= 0) continue;

    var beatDuration = 60 / bpm + 's';
    var pedals = pedalContainer.querySelectorAll('.pedal');

    for (
      var pedalIndexInside = 0;
      pedalIndexInside < pedals.length;
      pedalIndexInside++
    ) {
      pedals[pedalIndexInside].style.webkitAnimationDuration = beatDuration;
      pedals[pedalIndexInside].style.animationDuration = beatDuration;
    }
  }

  // ------------------------------------------------
  // BOTAO SCROLL
  // ------------------------------------------------

  var button = document.createElement('button');
  button.className = 'song-scroll-button';
  button.innerHTML = 'Scroll';
  button.style.display = 'none';

  document.body.appendChild(button);

  // ------------------------------------------------
  // BOTOES TOPO (se não for home)
  // ------------------------------------------------

  var themeButton = null;
  var lyricButton = null;

  if (!document.body.classList.contains('home')) {
    /*
    themeButton = document.createElement("button");
    themeButton.className = "theme-toggle";

    function updateThemeButtonText() {

      if (document.body.classList.contains("light-version")) {
        themeButton.innerHTML = "Versão escura";
      } else {
        themeButton.innerHTML = "Versão clara";
      }

    }

    updateThemeButtonText();

    document.body.insertBefore(themeButton, document.body.firstChild);

    themeButton.addEventListener("click", function(e) {

      e.stopPropagation();

      if (document.body.classList.contains("light-version")) {
        document.body.classList.remove("light-version");
      } else {
        document.body.classList.add("light-version");
      }

      updateThemeButtonText();

    });
    */
    // Inicia o repertório exibindo somente as letras, sem os acordes.
    // document.body.classList.add("only-lyric");
    /*
    lyricButton = document.createElement("button");
    lyricButton.className = "lyric-toggle";

    function updateLyricButtonText() {

      if (document.body.classList.contains("only-lyric")) {
        lyricButton.innerHTML = "Mostrar acordes";
      } else {
        lyricButton.innerHTML = "Esconder acordes";
      }

    }

    updateLyricButtonText();

    // document.body.insertBefore(lyricButton, themeButton.nextSibling);
    document.body.insertBefore(lyricButton, document.body.firstChild);

    lyricButton.addEventListener("click", function(e) {

      e.stopPropagation();

      if (document.body.classList.contains("only-lyric")) {
        document.body.classList.remove("only-lyric");
      } else {
        document.body.classList.add("only-lyric");
      }

      updateLyricButtonText();

    });
    */
  }

  // ------------------------------------------------
  // DETECTAR MUSICA ATIVA
  // ------------------------------------------------

  function getActiveContainer() {
    var containers = document.querySelectorAll('.container');
    var middle = window.innerHeight / 2;

    for (var i = 0; i < containers.length; i++) {
      var rect = containers[i].getBoundingClientRect();

      if (rect.top <= middle && rect.bottom >= middle) {
        return containers[i];
      }
    }

    return null;
  }

  function updateActiveContainer() {
    activeContainer = getActiveContainer();
  }

  // ------------------------------------------------
  // VISIBILIDADE BOTAO
  // ------------------------------------------------

  function updateButtonVisibility() {
    if (!activeContainer) {
      button.style.display = 'none';
      return;
    }

    var rect = activeContainer.getBoundingClientRect();

    if (rect.bottom > window.innerHeight) {
      button.style.display = 'block';
    } else {
      button.style.display = 'none';
    }
  }

  // ------------------------------------------------
  // ENGINE SCROLL
  // ------------------------------------------------

  function smoothScroll(
    container,
    startTime,
    duration,
    startScrollTop,
    targetScrollTop,
    callback
  ) {
    var currentTime = new Date().getTime() - startTime;

    var progress = currentTime / duration;

    if (progress > 1) progress = 1;

    var newScrollTop =
      startScrollTop + (targetScrollTop - startScrollTop) * progress;

    window.scrollTo(0, newScrollTop);

    if (progress < 1) {
      scrollAnimation = setTimeout(function () {
        smoothScroll(
          container,
          startTime,
          duration,
          startScrollTop,
          targetScrollTop,
          callback
        );
      }, 16);
    } else {
      autoScrolling = false;
      scrollAnimation = null;

      if (callback) callback();
    }
  }

  // ------------------------------------------------
  // START SCROLL
  // ------------------------------------------------

  function startScroll(container) {
    if (!container) return;

    var timeText = container.querySelector('.time').textContent;

    var parts = timeText.split(':');

    var minutes = parseInt(parts[0], 10);
    var seconds = parseInt(parts[1], 10);

    var totalTime = (minutes * 60 + seconds) * 1000;

    var rect = container.getBoundingClientRect();

    var containerTop = rect.top + window.pageYOffset;
    var containerHeight = container.offsetHeight;

    var scrollTop = window.pageYOffset;
    var windowHeight = window.innerHeight;

    // ------------------------------------------------
    // PARAR NO BOTAO NEXT
    // ------------------------------------------------

    var nextButton = container.querySelector('.next-song-button');

    var stopPosition;

    if (nextButton) {
      var rectButton = nextButton.getBoundingClientRect();

      stopPosition =
        rectButton.top + window.pageYOffset + nextButton.offsetHeight;
    } else {
      stopPosition = containerTop + containerHeight;
    }

    var distanceRemaining = stopPosition - (scrollTop + windowHeight);

    if (distanceRemaining < 0) distanceRemaining = 0;

    var adjustedTime = (distanceRemaining / containerHeight) * totalTime;

    var targetScroll = stopPosition - windowHeight;

    function finishScroll() {
      button.innerHTML = 'Scroll';
      button.className = 'song-scroll-button';

      updateButtonVisibility();
    }

    autoScrolling = true;

    var startTime = new Date().getTime();

    scrollAnimation = setTimeout(function () {
      smoothScroll(
        container,
        startTime,
        adjustedTime,
        scrollTop,
        targetScroll,
        finishScroll
      );
    }, 16);

    button.innerHTML = 'Cancel';
    button.className = 'song-scroll-button running';
  }

  // ------------------------------------------------
  // CANCEL
  // ------------------------------------------------

  function cancelScroll() {
    autoScrolling = false;

    if (scrollAnimation) {
      clearTimeout(scrollAnimation);
      scrollAnimation = null;
    }

    button.innerHTML = 'Scroll';
    button.className = 'song-scroll-button';
  }

  // ------------------------------------------------
  // BOTAO CLICK
  // ------------------------------------------------

  button.addEventListener('click', function (e) {
    e.stopPropagation();

    if (autoScrolling) {
      cancelScroll();
    } else {
      startScroll(activeContainer);
    }
  });

  // ------------------------------------------------
  // SCROLL MANUAL AJUSTE
  // ------------------------------------------------

  function manualAdjust() {
    if (!autoScrolling) return;

    clearTimeout(scrollAnimation);
    startScroll(activeContainer);
  }

  window.addEventListener('wheel', manualAdjust);
  window.addEventListener('touchmove', manualAdjust);

  // ------------------------------------------------
  // DOUBLE TAP (ipad friendly)
  // ------------------------------------------------

  document.addEventListener('touchend', function (e) {
    if (
      e.target === button ||
      e.target === themeButton ||
      e.target === lyricButton
    )
      return;

    var now = new Date().getTime();

    if (now - lastTapTime < doubleTapDelay) {
      if (autoScrolling) {
        cancelScroll();
      } else {
        startScroll(activeContainer);
      }

      lastTapTime = 0;
    } else {
      lastTapTime = now;
    }
  });

  // ------------------------------------------------
  // SCROLL LISTENER
  // ------------------------------------------------

  window.addEventListener('scroll', function () {
    updateActiveContainer();
    updateButtonVisibility();
  });

  updateActiveContainer();
  updateButtonVisibility();

  // ------------------------------------------------
  // MENU AUTOMATICO
  // ------------------------------------------------

  function formatText(id) {
    return id
      .replace(/_/g, ' ')
      .replace(/-/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, function (l) {
        return l.toUpperCase();
      });
  }

  var list = document.getElementById('container-list');

  // proteção: se não existir a lista, não quebra o script
  if (list) {
    // limpa lista antes (evita duplicação se rodar mais de uma vez)
    list.innerHTML = '';

    var menuItems = document.querySelectorAll('.set-divider.block, .container');
    var songNumber = 1;

    // montar menu na mesma ordem do HTML, mantendo os divisores dos blocos
    for (var i = 0; i < menuItems.length; i++) {
      if ((' ' + menuItems[i].className + ' ').indexOf(' set-divider ') > -1) {
        var li = document.createElement('li');
        li.className = 'menu-block';
        li.textContent = menuItems[i].textContent;
        list.appendChild(li);

        continue;
      }

      var id = menuItems[i].id;

      if (id) {
        var li = document.createElement('li');
        var link = document.createElement('a');
        var title = menuItems[i].querySelector('.title');
        var label = title ? title.textContent : formatText(id);

        link.href = '#' + id;
        link.textContent = songNumber + '. ' + label;

        li.appendChild(link);
        list.appendChild(li);
        songNumber++;
      }
    }
  }

  // ------------------------------------------------
  // HIGHLIGHT |
  // ------------------------------------------------

  var chords = document.querySelectorAll('.chords');

  for (var c = 0; c < chords.length; c++) {
    var content = chords[c].innerHTML;
    var first = false;

    var newContent = content
      .split('')
      .map(function (char) {
        if (char === '|' && !first) {
          first = true;
          return '<span class="first-pipe">|</span>';
        }

        if (char === '|') {
          return '<span class="highlighted-char">|</span>';
        }

        return char;
      })
      .join('');

    chords[c].innerHTML = newContent;
  }

  // ------------------------------------------------
  // SCROLL TOP
  // ------------------------------------------------

  var scrollTopButton = document.getElementById('scroll-top');

  if (scrollTopButton) {
    scrollTopButton.addEventListener('click', function () {
      window.scrollTo(0, 0);
    });
  }

  // ------------------------------------------------
  // AUTO LABEL
  // ------------------------------------------------

  var sections = document.querySelectorAll('.section');

  for (var s = 0; s < sections.length; s++) {
    var section = sections[s];

    if (!section.querySelector('.label')) {
      var text = section.textContent.replace(/^\s+|\s+$/g, '');

      section.innerHTML = '';

      var label = document.createElement('div');

      label.className = 'label';
      label.appendChild(document.createTextNode(text));

      section.appendChild(label);
    }
  }

  // ------------------------------------------------
  // BOTAO NEXT COM NOME DA PROXIMA MUSICA
  // ------------------------------------------------

  var containersNext = document.querySelectorAll('.container');

  for (var i = 0; i < containersNext.length; i++) {
    var container = containersNext[i];

    var next = container.nextElementSibling;

    while (next && !next.classList.contains('container')) {
      next = next.nextElementSibling;
    }

    if (!next) continue;

    var titleElement = next.querySelector('.title');
    var nextTitle = titleElement ? titleElement.textContent : 'Next Song';
    var pedalWarning = container.querySelector('.pedal.on');

    var nextButton = document.createElement('button');

    nextButton.className = 'next-song-button full-width-next';
    if (pedalWarning) {
      nextButton.innerHTML =
        'Next → ' +
        nextTitle +
        "<span class='pedal-warning'>⚠ A musica atual usou o pedal DROP. Lembre de desligar.</span>";
    } else {
      nextButton.innerHTML = 'Next → ' + nextTitle;
    }

    container.appendChild(nextButton);

    var lastNextTap = 0;

    nextButton.addEventListener('click', function (e) {
      e.stopPropagation();

      var now = new Date().getTime();

      var currentContainer = this.closest('.container');
      if (!currentContainer) return;

      var next = currentContainer.nextElementSibling;

      while (next && !next.classList.contains('container')) {
        next = next.nextElementSibling;
      }

      if (!next) return;

      var target = next.getBoundingClientRect().top + window.pageYOffset;

      window.scrollTo(0, target);

      // double click inicia scroll automatico
      if (now - lastNextTap < doubleTapDelay) {
        setTimeout(function () {
          startScroll(next);
        }, 200);

        lastNextTap = 0;
      } else {
        lastNextTap = now;
      }
    });
  }
});

// ------------------------------------------------
// TOGGLE LINES (RIGHT SQUARE BUTTON)
// ------------------------------------------------

var containersToggle = document.querySelectorAll('.container');

for (var i = 0; i < containersToggle.length; i++) {
  var container = containersToggle[i];

  var toggleButton = document.createElement('button');
  toggleButton.className = 'toggle-lines-button square';

  // começa fechado
  container.classList.add('collapsed');
  toggleButton.innerHTML = '+';

  container.appendChild(toggleButton);

  toggleButton.addEventListener('click', function (e) {
    e.stopPropagation();

    var parent = this.closest('.container');
    if (!parent) return;

    parent.classList.toggle('collapsed');

    if (parent.classList.contains('collapsed')) {
      this.innerHTML = '+';
    } else {
      this.innerHTML = '−';
    }
  });
}

// ------------------------------------------------
// DIV COLAPSADA
// ------------------------------------------------

var collapsedDivElements = document.querySelectorAll('div.colapsado');

for (
  var collapsedDivIndex = 0;
  collapsedDivIndex < collapsedDivElements.length;
  collapsedDivIndex++
) {
  var collapsedDiv = collapsedDivElements[collapsedDivIndex];
  var collapsedDivButton = document.createElement('button');

  collapsedDiv.style.display = 'none';

  if (!collapsedDiv.id) {
    collapsedDiv.id = 'colapsado-' + collapsedDivIndex;
  }

  collapsedDivButton.type = 'button';
  collapsedDivButton.className = 'collapsed-content-toggle';
  collapsedDivButton.textContent = 'MOSTRAR TAB';
  collapsedDivButton.setAttribute('aria-controls', collapsedDiv.id);
  collapsedDivButton.setAttribute('aria-expanded', 'false');

  collapsedDiv.parentNode.insertBefore(collapsedDivButton, collapsedDiv);

  (function (divElement, toggleButton) {
    toggleButton.addEventListener('click', function (e) {
      e.stopPropagation();

      var isExpanded = divElement.style.display !== 'none';

      divElement.style.display = isExpanded ? 'none' : 'block';
      toggleButton.textContent = isExpanded ? 'MOSTRAR TAB' : 'ESCONDER TAB';
      toggleButton.setAttribute('aria-expanded', String(!isExpanded));
    });
  })(collapsedDiv, collapsedDivButton);
}
