/* =========================================================
   LEO OLIVEIRA | PORTFÓLIO
   Interações em JavaScript puro. Cada recurso é uma função
   independente; se um falhar, o conteúdo continua visível.
   ========================================================= */

(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Cabeçalho: fundo ao rolar ---------- */
  function initHeader() {
    const header = document.querySelector('[data-header]');
    if (!header) return;

    let ticking = false;
    const update = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 24);
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });

    update();
  }

  /* ---------- Menu móvel ---------- */
  function initMenu() {
    const toggle = document.querySelector('[data-menu-toggle]');
    const nav = document.querySelector('[data-nav]');
    const header = document.querySelector('[data-header]');
    if (!toggle || !nav) return;

    const label = toggle.querySelector('.menu-toggle__label');
    const mobileQuery = window.matchMedia('(max-width: 860px)');

    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
      header && header.classList.toggle('menu-active', open);
      document.body.classList.toggle('menu-open', open);
      if (label) label.textContent = open ? 'Fechar' : 'Menu';
    };

    toggle.addEventListener('click', () => {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    // Fecha ao escolher um link
    nav.addEventListener('click', (event) => {
      if (event.target.closest('a')) setOpen(false);
    });

    // Fecha com Esc e devolve o foco ao botão
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) {
        setOpen(false);
        toggle.focus();
      }
    });

    // Ao voltar para o layout de desktop, garante o menu fechado
    mobileQuery.addEventListener('change', (event) => {
      if (!event.matches) setOpen(false);
    });
  }

  /* ---------- Indicador da seção ativa ---------- */
  function initScrollSpy() {
    const links = Array.from(document.querySelectorAll('[data-nav-link]'));
    const sections = Array.from(document.querySelectorAll('[data-section]'));
    if (!links.length || !sections.length || !('IntersectionObserver' in window)) return;

    const setActive = (id) => {
      links.forEach((link) => {
        const isActive = link.getAttribute('href') === '#' + id;
        if (isActive) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    };

    // Uma faixa estreita no meio da tela decide a seção ativa: evita oscilações.
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    sections.forEach((section) => observer.observe(section));
    setActive(sections[0].id);
  }

  /* ---------- Revelação ao rolar ---------- */
  function initReveal() {
    const items = document.querySelectorAll('.reveal');
    if (!items.length) return;

    const showAll = () => items.forEach((el) => el.classList.add('is-visible'));

    if (reduceMotion.matches || !('IntersectionObserver' in window)) {
      showAll();
      return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target); // anima uma única vez
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });

    items.forEach((el) => observer.observe(el));

    // Segurança: ao chegar ao fim da página, nada fica oculto
    window.addEventListener('scroll', () => {
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) showAll();
    }, { passive: true });
  }

  /* ---------- Parallax sutil da fotografia ---------- */
  function initParallax() {
    const media = document.querySelector('[data-parallax]');
    const hero = document.querySelector('.hero');
    if (!media || !hero) return;

    // Apenas em dispositivos com cursor preciso e sem preferência por movimento reduzido
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    if (!finePointer.matches || reduceMotion.matches) return;

    const MAX_X = 14; // deslocamento máximo em px
    const MAX_Y = 8;
    let frame = null;

    hero.addEventListener('pointermove', (event) => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        const rect = hero.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        media.style.setProperty('--px', (-x * MAX_X).toFixed(2) + 'px');
        media.style.setProperty('--py', (-y * MAX_Y).toFixed(2) + 'px');
        frame = null;
      });
    });

    hero.addEventListener('pointerleave', () => {
      media.style.setProperty('--px', '0px');
      media.style.setProperty('--py', '0px');
    });
  }

  /* ---------- Ano automático no rodapé ---------- */
  function initYear() {
    document.querySelectorAll('[data-year]').forEach((el) => {
      el.textContent = String(new Date().getFullYear());
    });
  }

  /* ---------- Inicialização ---------- */
  [initHeader, initMenu, initScrollSpy, initReveal, initParallax, initYear].forEach((fn) => {
    try {
      fn();
    } catch (error) {
      console.error('[portfólio] Falha ao iniciar ' + fn.name + ':', error);
      // Se algo der errado, garante que o conteúdo apareça
      document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
    }
  });
})();

/* ================= CARD STACK / PROJETOS ================= */
(() => {
  const roots = document.querySelectorAll("[data-card-stack]");
  if (!roots.length) return;

  roots.forEach((root) => {
    const stage = root.querySelector("[data-card-stage]");
    const cards = Array.from(root.querySelectorAll("[data-project-card]"));
    const dotsContainer = root.querySelector("[data-card-dots]");
    const prevButton = root.querySelector("[data-card-prev]");
    const nextButton = root.querySelector("[data-card-next]");
    const counter = root.querySelector("[data-card-counter]");

    if (!stage || !cards.length || !dotsContainer) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let active = 0;
    let pointerStartX = 0;
    let pointerStartY = 0;
    let pointerId = null;
    let dragging = false;
    let moved = false;
    let suppressClick = false;
    let autoplayId = null;

    const dots = cards.map((card, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("aria-label", `Mostrar projeto ${index + 1}: ${card.querySelector("h3")?.textContent.trim() || ""}`);
      button.addEventListener("click", () => show(index));
      dotsContainer.appendChild(button);
      return button;
    });

    const wrap = (index) => (index + cards.length) % cards.length;

    function show(index) {
      active = wrap(index);

      const maxOffset = Math.min(2, Math.floor((cards.length - 1) / 2));

      cards.forEach((card, i) => {
        let offset = i - active;

        if (offset > cards.length / 2) offset -= cards.length;
        if (offset < -cards.length / 2) offset += cards.length;

        const abs = Math.abs(offset);
        const isActive = offset === 0;
        const visible = abs <= maxOffset;

        const x = offset * parseFloat(getComputedStyle(root).getPropertyValue("--stack-offset")) || offset * 80;
        const rotate = offset * 9;
        const y = abs * 10;
        const scale = isActive ? 1 : Math.max(.84, 1 - abs * .07);
        const z = -abs * 90;

        card.style.zIndex = String(20 - abs);
        card.style.opacity = visible ? String(1 - abs * .14) : "0";
        card.style.visibility = visible ? "visible" : "hidden";
        card.style.pointerEvents = visible ? "auto" : "none";
        card.style.filter = isActive ? "none" : `saturate(${Math.max(.55, 1 - abs * .2)})`;
        card.style.transform = `translate3d(calc(-50% + ${x}px), ${y}px, ${z}px) rotateZ(${rotate}deg) rotateX(${isActive ? 0 : 5}deg) scale(${scale})`;
        card.classList.toggle("is-active", isActive);
        card.setAttribute("aria-hidden", String(!isActive));

        if (isActive) {
          card.removeAttribute("inert");
        } else {
          card.setAttribute("inert", "");
        }

        dots[i].setAttribute("aria-current", String(i === active));
      });

      if (counter) {
        counter.textContent = `${String(active + 1).padStart(2, "0")} / ${String(cards.length).padStart(2, "0")}`;
      }

      if (prevButton) prevButton.disabled = cards.length < 2;
      if (nextButton) nextButton.disabled = cards.length < 2;
    }

    function previous() {
      show(active - 1);
    }

    function next() {
      show(active + 1);
    }

    prevButton?.addEventListener("click", previous);
    nextButton?.addEventListener("click", next);

    stage.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        previous();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        next();
      } else if (event.key === "Home") {
        event.preventDefault();
        show(0);
      } else if (event.key === "End") {
        event.preventDefault();
        show(cards.length - 1);
      }
    });

    stage.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;

      pointerStartX = event.clientX;
      pointerStartY = event.clientY;
      pointerId = event.pointerId;
      dragging = true;
      moved = false;
    });

    stage.addEventListener("pointermove", (event) => {
      if (!dragging || event.pointerId !== pointerId) return;

      const dx = event.clientX - pointerStartX;
      const dy = event.clientY - pointerStartY;

      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
        moved = true;
      }
    });

    function finishDrag(event) {
      if (!dragging || event.pointerId !== pointerId) return;

      const dx = event.clientX - pointerStartX;
      const dy = event.clientY - pointerStartY;

      dragging = false;
      pointerId = null;

      if (moved && Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
        suppressClick = true;
        dx < 0 ? next() : previous();
        window.setTimeout(() => {
          suppressClick = false;
        }, 0);
      }
    }

    stage.addEventListener("pointerup", finishDrag);
    stage.addEventListener("pointercancel", finishDrag);

    cards.forEach((card, index) => {
      card.addEventListener("click", (event) => {
        if (suppressClick) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }

        if (index !== active) {
          event.preventDefault();
          show(index);
        }
      });
    });

    function stopAutoplay() {
      if (autoplayId !== null) {
        window.clearInterval(autoplayId);
        autoplayId = null;
      }
    }

    function startAutoplay() {
      stopAutoplay();

      if (reducedMotion.matches || cards.length < 2) return;

      autoplayId = window.setInterval(() => {
        if (document.hidden || root.matches(":hover")) return;
        next();
      }, 5000);
    }

    root.addEventListener("mouseenter", stopAutoplay);
    root.addEventListener("mouseleave", startAutoplay);
    root.addEventListener("focusin", stopAutoplay);
    root.addEventListener("focusout", (event) => {
      if (!root.contains(event.relatedTarget)) startAutoplay();
    });

    reducedMotion.addEventListener?.("change", startAutoplay);

    show(0);
    startAutoplay();
  });
})();
