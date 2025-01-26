
    // Polyfill para closest() - Safari 9 não suporta este método
    if (!Element.prototype.closest) {
        Element.prototype.closest = function(selector) {
          var el = this;
          while (el) {
            if (el.matches(selector)) {
              return el;
            }
            el = el.parentElement;
          }
          return null;
        };
      }
    
      // Polyfill para scrollBehavior - Safari 9 não suporta rolagem suave
      if (!('scrollBehavior' in document.documentElement.style)) {
        window.smoothScrollTo = function(top, duration) {
          var start = window.pageYOffset,
              change = top - start,
              currentTime = 0,
              increment = 20;
    
          function animateScroll() {
            currentTime += increment;
            var val = Math.easeInOutQuad(currentTime, start, change, duration);
            window.scrollTo(0, val);
            if (currentTime < duration) {
              setTimeout(animateScroll, increment);
            }
          }
          animateScroll();
        };
    
        // Easing function para suavizar a rolagem
        Math.easeInOutQuad = function(t, b, c, d) {
          t /= d / 2;
          if (t < 1) return c / 2 * t * t + b;
          t--;
          return -c / 2 * (t * (t - 2) - 1) + b;
        };
      }
    
      document.addEventListener('DOMContentLoaded', function() {
        var scrollAnimation = null;
    
        function smoothScroll(startTime, duration, startScrollTop, targetScrollTop, callback) {
          var currentTime = (new Date()).getTime() - startTime;
          var progress = currentTime / duration;
          var easedProgress = Math.min(progress, 1);
          var newScrollTop = startScrollTop + (targetScrollTop - startScrollTop) * easedProgress;
          window.scrollTo(0, newScrollTop);
    
          if (easedProgress < 1) {
            scrollAnimation = setTimeout(function() {
              smoothScroll(startTime, duration, startScrollTop, targetScrollTop, callback);
            }, 16); // Aproximadamente 60 FPS
          } else {
            scrollAnimation = null; // Animação completa
            if (callback) callback(); // Executa a função de callback quando o scroll termina
          }
        }
    
        var buttons = document.querySelectorAll('.scroll-button');
    
        for (var i = 0; i < buttons.length; i++) {
          buttons[i].addEventListener('click', function() {
            var button = this;
            var container = button.closest('.container');
    
            // Se uma animação está rodando, pare-a e redefina o texto do botão
            if (scrollAnimation) {
              clearTimeout(scrollAnimation);
              scrollAnimation = null;
              button.textContent = 'Scroll';
              button.classList.remove('running');
              return;
            }
    
            // Obtém o tempo da div .time
            var timeText = container.querySelector('.time').textContent;
            var parts = timeText.split(':');
            var minutes = parseInt(parts[0], 10);
            var seconds = parseInt(parts[1], 10);
            var totalTime = (minutes * 60 + seconds) * 1000;
    
            // Calcula a altura do cabeçalho
            var header = document.querySelector('header');
            var headerHeight = header ? header.offsetHeight : 0;
    
            // Calcula a posição final do scroll
            var containerRect = container.getBoundingClientRect();
            var containerTop = containerRect.top + window.pageYOffset - headerHeight;
            var containerBottom = containerTop + container.offsetHeight;
            var scrollTop = window.pageYOffset;
            var windowHeight = window.innerHeight;
    
            // Distância até o final do container
            var distanceToBottom = containerBottom - (scrollTop + windowHeight);
    
            // Calcula o tempo ajustado proporcionalmente à distância restante
            var adjustedTime = (distanceToBottom / container.offsetHeight) * totalTime;
    
            // Função de callback para pular para o próximo container
            function scrollToNextContainer() {
              var nextContainer = container.nextElementSibling;
              if (nextContainer && nextContainer.classList.contains('container')) {
                // Obter o nome da próxima música ou ID da div
                var nextContainerName = nextContainer.id.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, function(l) {
                  return l.toUpperCase();
                });
    
                // Criar um botão dinâmico para o próximo scroll
                var nextButton = document.createElement('button');
                nextButton.textContent = 'Go to Next: ' + nextContainerName;
                nextButton.classList.add('next-button');
                document.body.appendChild(nextButton);
    
                // Função para rolar para a próxima música
                nextButton.addEventListener('click', function() {
                  var nextContainerTop = nextContainer.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                  scrollAnimation = setTimeout(function() {
                    smoothScroll((new Date()).getTime(), 1000, window.pageYOffset, nextContainerTop, function() {
                      button.textContent = 'Scroll';
                      button.classList.remove('running');
                      nextButton.remove(); // Remove o botão ao chegar à próxima música
                    });
                  }, 16);
                });
              }
    
              button.textContent = 'Scroll';
              button.classList.remove('running');
            }
    
            var startTime = (new Date()).getTime();
            scrollAnimation = setTimeout(function() {
              smoothScroll(startTime, adjustedTime, scrollTop, containerTop + container.offsetHeight - windowHeight + headerHeight, scrollToNextContainer);
            }, 16); 
    
            button.textContent = 'Cancel Scroll';
            button.classList.add('running');
          });
        }
      });
      
      (function() {
        function formatText(id) {
          return id
            .replace(/_/g, ' ')
            .replace(/-/g, ' ')
            .toLowerCase()
            .replace(/\b\w/g, function(l) {
              return l.toUpperCase();
            });
        }
    
        var list = document.getElementById('container-list');
        var containers = document.querySelectorAll('.container');
    
        Array.prototype.slice.call(containers).forEach(function(container, index) {
          var id = container.id;
          if (id) {
            var listItem = document.createElement('li');
            var link = document.createElement('a');
            link.href = '#' + id;
            link.textContent = (index + 1) + '. ' + formatText(id); 
            listItem.appendChild(link);
            list.appendChild(listItem);
          }
        });
      })();
      
      document.addEventListener('DOMContentLoaded', function() {
        var lyricsDivs = document.querySelectorAll('.chords');
    
        for (var i = 0; i < lyricsDivs.length; i++) {
          var content = lyricsDivs[i].innerHTML;
          var firstPipeReplaced = false;
    
          var newContent = content.split('').map(function(char) {
            if (char === '|' && !firstPipeReplaced) {
              firstPipeReplaced = true;
              return '<span class="first-pipe">|</span>';
            } else if (char === '|') {
              return '<span class="highlighted-char">|</span>';
            } else {
              return char;
            }
          }).join('');
    
          lyricsDivs[i].innerHTML = newContent;
        }
      });
    
      document.getElementById('scroll-top').addEventListener('click', function(e) {
        if ('scrollBehavior' in document.documentElement.style) {
          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        } else {
          window.smoothScrollTo(0, 500); // Polyfill para rolagem suave
        }
      });