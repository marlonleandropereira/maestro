// ------------------------------------------------
// POLYFILL (Safari antigo)
// ------------------------------------------------

if (!Element.prototype.closest) {
  Element.prototype.closest = function(selector) {
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

document.addEventListener('DOMContentLoaded', function() {

  var scrollAnimation = null;
  var activeContainer = null;
  var autoScrolling = false;

  var lastClickTime = 0;
  var doubleClickDelay = 400;

  // ------------------------------------------------
  // BOTAO SCROLL
  // ------------------------------------------------

  var button = document.createElement("button");
  button.className = "song-scroll-button";
  button.innerHTML = "Scroll";
  button.style.display = "none";

  document.body.appendChild(button);


  // ------------------------------------------------
  // BOTAO LIGHT / DARK
  // ------------------------------------------------

  var themeButton = document.createElement("button");
  themeButton.innerHTML = "LIGHT / DARK";
  themeButton.className = "theme-toggle";

  document.body.insertBefore(themeButton, document.body.firstChild);

  themeButton.addEventListener("click", function() {

    if (document.body.classList.contains("light-version")) {

      document.body.classList.remove("light-version");

    } else {

      document.body.classList.add("light-version");

    }

  });


  // ------------------------------------------------
  // BOTAO ONLY LYRIC
  // ------------------------------------------------

  var lyricButton = document.createElement("button");
  lyricButton.innerHTML = "ONLY LYRIC / WITH CHORDS";
  lyricButton.className = "lyric-toggle";

  document.body.insertBefore(lyricButton, themeButton.nextSibling);

  lyricButton.addEventListener("click", function() {

    if (document.body.classList.contains("only-lyric")) {

      document.body.classList.remove("only-lyric");

    } else {

      document.body.classList.add("only-lyric");

    }

  });


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
      button.style.display = "none";
      return;
    }

    var rect = activeContainer.getBoundingClientRect();

    if (rect.bottom > window.innerHeight) {
      button.style.display = "block";
    } else {
      button.style.display = "none";
    }

  }


  // ------------------------------------------------
  // ENGINE SCROLL
  // ------------------------------------------------

  function smoothScroll(container, startTime, duration, startScrollTop, targetScrollTop, callback) {

    var currentTime = (new Date()).getTime() - startTime;

    var progress = currentTime / duration;

    if (progress > 1) progress = 1;

    var newScrollTop =
      startScrollTop +
      (targetScrollTop - startScrollTop) * progress;

    window.scrollTo(0, newScrollTop);


    var rect = container.getBoundingClientRect();

    if (rect.bottom <= window.innerHeight) {

      autoScrolling = false;
      scrollAnimation = null;

      if (callback) callback();

      return;

    }

    if (progress < 1) {

      scrollAnimation = setTimeout(function() {

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

    var containerBottom = containerTop + containerHeight;

    var scrollTop = window.pageYOffset;
    var windowHeight = window.innerHeight;


    var distanceRemaining =
      containerBottom - (scrollTop + windowHeight);

    if (distanceRemaining < 0) distanceRemaining = 0;


    var adjustedTime =
      (distanceRemaining / containerHeight) * totalTime;


    var targetScroll = containerBottom - windowHeight;


    function finishScroll() {

      button.innerHTML = "Scroll";
      button.className = "song-scroll-button";

      updateButtonVisibility();

    }


    autoScrolling = true;

    var startTime = (new Date()).getTime();

    scrollAnimation = setTimeout(function() {

      smoothScroll(
        container,
        startTime,
        adjustedTime,
        scrollTop,
        targetScroll,
        finishScroll
      );

    }, 16);


    button.innerHTML = "Cancel";
    button.className = "song-scroll-button running";

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

    button.innerHTML = "Scroll";
    button.className = "song-scroll-button";

  }


  // ------------------------------------------------
  // BOTAO CLICK
  // ------------------------------------------------

  button.addEventListener("click", function(e) {

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

  window.addEventListener("wheel", manualAdjust);
  window.addEventListener("touchmove", manualAdjust);


  // ------------------------------------------------
  // DOUBLE CLICK NA TELA
  // ------------------------------------------------

  document.addEventListener("click", function(e) {

    if (e.target === button || e.target === themeButton) return;

    var now = new Date().getTime();

    if (now - lastClickTime < doubleClickDelay) {

      if (autoScrolling) {
        cancelScroll();
      } else {
        startScroll(activeContainer);
      }

      lastClickTime = 0;

    } else {

      lastClickTime = now;

    }

  });


  // ------------------------------------------------
  // SCROLL LISTENER
  // ------------------------------------------------

  window.addEventListener("scroll", function() {

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
      .replace(/\b\w/g, function(l) { return l.toUpperCase(); });

  }

  var list = document.getElementById('container-list');
  var containers = document.querySelectorAll('.container');

  for (var i = 0; i < containers.length; i++) {

    var id = containers[i].id;

    if (id) {

      var li = document.createElement('li');
      var link = document.createElement('a');

      link.href = "#" + id;
      link.textContent = (i + 1) + ". " + formatText(id);

      li.appendChild(link);
      list.appendChild(li);

    }

  }


  // ------------------------------------------------
  // HIGHLIGHT |
// ------------------------------------------------

  var chords = document.querySelectorAll('.chords');

  for (var c = 0; c < chords.length; c++) {

    var content = chords[c].innerHTML;
    var first = false;

    var newContent = content.split('').map(function(char) {

      if (char === "|" && !first) {
        first = true;
        return '<span class="first-pipe">|</span>';
      }

      if (char === "|") {
        return '<span class="highlighted-char">|</span>';
      }

      return char;

    }).join('');

    chords[c].innerHTML = newContent;

  }


  // ------------------------------------------------
  // SCROLL TOP
  // ------------------------------------------------

  var scrollTopButton = document.getElementById('scroll-top');

  if (scrollTopButton) {

    scrollTopButton.addEventListener('click', function() {
      window.scrollTo(0, 0);
    });

  }


  // ------------------------------------------------
  // AUTO LABEL
  // ------------------------------------------------

  var sections = document.querySelectorAll(".section");

  for (var s = 0; s < sections.length; s++) {

    var section = sections[s];

    if (!section.querySelector(".label")) {

      var text = section.textContent.replace(/^\s+|\s+$/g, "");

      section.innerHTML = "";

      var label = document.createElement("div");

      label.className = "label";
      label.appendChild(document.createTextNode(text));

      section.appendChild(label);

    }

  }

});