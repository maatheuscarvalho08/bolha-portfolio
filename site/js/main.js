/* =========================================================
   Bolha Comunicação · interações
   ========================================================= */
(() => {
  const WHATSAPP_NUMBER = '5521965555427';
  const WA_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Olá! Vim pelo site da Bolha e quero pedir um orçamento.')}`;
  const INSTAGRAM_URL = 'https://instagram.com/bolhacomunicacao';

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);

  /* ---------- Infra: GSAP + Lenis ---------- */
  let lenis = null;
  if (hasGsap) {
    gsap.registerPlugin(ScrollTrigger);
    if (window.CustomEase) {
      gsap.registerPlugin(CustomEase);
      CustomEase.create('bolha', '.32,.72,0,1');
      gsap.defaults({ ease: 'bolha' });
    }
    if (window.Lenis && !reduced) {
      lenis = new Lenis({ lerp: 0.1 });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }
  }

  if (reduced) {
    if (lenis) { lenis.destroy(); lenis = null; }
    if (hasGsap) ScrollTrigger.getAll().forEach(st => st.kill());
  }

  // Seções com content-visibility mudam de altura no caminho. Corrige o destino no fim.
  const scrollToTarget = target => {
    if (lenis) lenis.scrollTo(target, { offset: -24, onComplete: () => lenis.scrollTo(target, { offset: -24, duration: .5 }) });
    else target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  };

  if (hasGsap && !reduced) {
    let refreshTimer;
    new ResizeObserver(() => {
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 200);
    }).observe(document.body);
  }

  /* ---------- 1. Loader ---------- */
  const loader = $('.loader');
  const loaderNum = $('#loader-num');
  const loaderFill = $('.loader__fill');
  const hideLoader = () => { loader.remove(); startEditor(); };

  if (reduced || !hasGsap) {
    hideLoader();
  } else {
    let n = 0;
    const tick = setInterval(() => {
      n = Math.min(100, n + 6 + Math.ceil(Math.random() * 8));
      loaderNum.textContent = n;
      loaderFill.style.setProperty('--fill', n);
      if (n < 100) return;
      clearInterval(tick);
      gsap.timeline({ onComplete: hideLoader })
        .to('.loader__bubble', { scale: 1.35, opacity: 0, duration: .4, ease: 'power2.out' }, 0)
        .to('.loader__count, .loader__label', { y: -24, opacity: 0, duration: .4, stagger: .05 }, 0)
        .to(loader, { yPercent: -100, duration: .8 }, .2)
        .from('.hero__copy > *', { y: 48, duration: 1.1, stagger: .07 }, .35)
        .from('.editor', { y: 64, opacity: 0, duration: 1.1 }, .5);
    }, 30);
  }

  /* ---------- 2. Header ilha + menu mobile ---------- */
  const burger = $('.burger');
  const menu = $('#menu');
  menu.hidden = false;
  menu.inert = true;
  const setMenu = open => {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    menu.classList.toggle('is-open', open);
    menu.inert = !open;
    if (lenis) open ? lenis.stop() : lenis.start();
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) { setMenu(false); burger.focus(); }
  });

  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    const target = id === '#top' ? document.body : $(id);
    if (!target) return;
    e.preventDefault();
    if (menu.classList.contains('is-open')) setMenu(false);
    scrollToTarget(target);
    history.replaceState(null, '', id === '#top' ? location.pathname : id);
  });

  const navLinks = $$('.island__nav a');
  const navObserver = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      navLinks.forEach(l => l.classList.toggle('is-active', l.getAttribute('href') === `#${en.target.id}`));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['sobre', 'servicos', 'projetos', 'como-funciona', 'contato'].forEach(id => navObserver.observe($(`#${id}`)));

  /* ---------- 3. Hero ---------- */
  const heroBubble = $('.hero__bubble');
  if (hasGsap && !reduced) {
    gsap.to('.hero__bubble-wrap', {
      yPercent: 30, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
  }

  /* ---------- Editor fake ---------- */
  const CODE = [
    ['c', '// seu-negocio.js\n'],
    ['k', 'const '], ['', 'negocio = {\n'],
    ['', '  nome: '], ['s', '"o seu"'], ['', ',\n'],
    ['', '  site: '], ['s', '"rápido e no Google"'], ['', ',\n'],
    ['', '  sistema: '], ['s', '"agenda e clientes"'], ['', ',\n'],
    ['', '  template: '], ['b', 'false'], ['', ',\n'],
    ['', '};\n\n'],
    ['', 'bolha.'], ['k', 'construir'], ['', '(negocio);']
  ];
  const codeEl = $('#code');
  const outEl = $('#out');
  const runBtn = $('#run');
  let typed = false;
  let typeTimer = null;

  function renderFull() {
    clearInterval(typeTimer);
    codeEl.innerHTML = '';
    CODE.forEach(([cls, txt]) => {
      const span = document.createElement('span');
      if (cls) span.className = cls;
      span.textContent = txt;
      codeEl.appendChild(span);
    });
    typed = true;
  }

  function startEditor() {
    if (reduced) { renderFull(); return; }
    let seg = 0, ch = 0, span = null;
    typeTimer = setInterval(() => {
      if (seg >= CODE.length) { clearInterval(typeTimer); typed = true; return; }
      const [cls, txt] = CODE[seg];
      if (!span) {
        span = document.createElement('span');
        if (cls) span.className = cls;
        codeEl.appendChild(span);
      }
      span.textContent += txt[ch++];
      if (ch >= txt.length) { seg++; ch = 0; span = null; }
    }, 28);
  }

  const OUTPUT = [
    ['', '> bolha build seu-negocio.js'],
    ['ok', '  ✓ layout desenhado do zero'],
    ['ok', '  ✓ agendamento ligado ao WhatsApp'],
    ['ok', '  ✓ SEO local configurado'],
    ['done', '✓ Bolha: site no ar 🫧']
  ];

  runBtn.addEventListener('click', () => {
    if (!typed) renderFull();
    runBtn.disabled = true;
    outEl.innerHTML = '';
    OUTPUT.forEach(([cls, line], i) => {
      setTimeout(() => {
        const div = document.createElement('div');
        if (cls) div.className = cls;
        div.textContent = line;
        outEl.appendChild(div);
        if (i === OUTPUT.length - 1) { popBubbles(runBtn); runBtn.disabled = false; }
      }, reduced ? 0 : 420 * (i + 1));
    });
  });

  // Bolhas que estouram em volta do botão
  function popBubbles(origin) {
    if (reduced || !hasGsap) return;
    const box = origin.closest('.editor');
    const r = origin.getBoundingClientRect();
    const b = box.getBoundingClientRect();
    for (let i = 0; i < 10; i++) {
      const p = document.createElement('span');
      p.className = 'pop';
      p.style.left = `${r.left - b.left + r.width / 2}px`;
      p.style.top = `${r.top - b.top + r.height / 2}px`;
      box.appendChild(p);
      const a = (Math.PI * 2 * i) / 10;
      gsap.fromTo(p, { scale: .4, opacity: 1 }, {
        x: Math.cos(a) * (40 + Math.random() * 40),
        y: Math.sin(a) * (40 + Math.random() * 40),
        scale: 1.6 + Math.random(), opacity: 0,
        duration: .9 + Math.random() * .4, ease: 'power2.out',
        onComplete: () => p.remove()
      });
    }
    gsap.fromTo(heroBubble, { scale: 1 }, { scale: 1.08, duration: .25, yoyo: true, repeat: 1, ease: 'power2.out' });
  }

  /* ---------- 5. Manifesto: palavra por palavra ---------- */
  const manifesto = $('#manifesto');
  const words = [];
  const wrapWords = (text, hl) => text.split(/(\s+)/).map(part => {
    if (!part.trim()) return document.createTextNode(part);
    const w = document.createElement('span');
    w.className = hl ? 'w hl' : 'w';
    w.textContent = part;
    words.push(w);
    return w;
  });
  [...manifesto.childNodes].forEach(node => {
    const isHl = node.nodeName === 'EM';
    const parts = wrapWords(node.textContent, isHl);
    const frag = document.createDocumentFragment();
    parts.forEach(p => frag.appendChild(p));
    if (isHl) { node.textContent = ''; node.appendChild(frag); }
    else node.replaceWith(frag);
  });
  const wordObserver = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('on'); wordObserver.unobserve(en.target); }
    });
  }, { rootMargin: '0px 0px -28% 0px', threshold: 1 });
  words.forEach(w => wordObserver.observe(w));

  /* ---------- Reveal global ---------- */
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('in'); revealObserver.unobserve(en.target); }
    });
  }, { rootMargin: '0px 0px -10% 0px' });
  const observeReveals = root => $$('.reveal:not(.in)', root).forEach((el, i) => {
    if (!el.style.transitionDelay && el.parentElement.children.length > 1) {
      const idx = [...el.parentElement.children].indexOf(el);
      if (idx > 0 && idx < 8) el.style.transitionDelay = `${idx * 0.06}s`;
    }
    revealObserver.observe(el);
  });
  observeReveals(document);

  /* ---------- 8. Projetos ---------- */
  const worksEl = $('#works');
  const caseEl = $('#case');
  const caseInner = $('#case-inner');
  let projects = [];
  let lastFocus = null;

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = n => String(n).padStart(2, '0');
  const componentName = p => `<span class="br">&lt;</span>${esc(p.component)}<span class="br"> /&gt;</span>`;

  function mediaHTML(p, eager) {
    const m = p.media;
    if (m.type === 'image') {
      return `<img src="${esc(m.src)}" alt="${esc(m.alt)}" width="${m.width}" height="${m.height}" loading="${eager ? 'eager' : 'lazy'}" decoding="async">`;
    }
    if (m.type === 'video') {
      return `<video src="${esc(m.src)}" ${m.poster ? `poster="${esc(m.poster)}"` : ''} muted loop playsinline preload="none" aria-label="${esc(m.alt)}"></video>`;
    }
    return `<div class="ph ph--work" role="img" aria-label="${esc(m.alt)}"><span class="bubble" aria-hidden="true"></span><p>${esc(m.label)}</p></div>`;
  }

  function renderWorks() {
    const total = pad(projects.length);
    worksEl.innerHTML = projects.map((p, i) => `
      <li class="work reveal">
        <div class="work__meta"><span>${pad(i + 1)}/${total}</span><span class="work__tags">${p.tags.map(t => `<span>${esc(t)}</span>`).join('')}</span></div>
        <h3 class="work__name">${componentName(p)}</h3>
        <p class="work__benefit">${esc(p.benefit)}</p>
        <button class="work__open" type="button" data-i="${i}" aria-label="Ver case ${esc(p.component)}: desafio, solução e resultado">
          <div class="work__media">${mediaHTML(p)}</div>
          <span class="work__cta">Ver case →</span>
        </button>
        ${p.link
          ? `<a class="work__link" href="${esc(p.link)}" target="_blank" rel="noopener">${esc(p.linkLabel || 'Ver projeto')} ↗</a>`
          : `<span class="work__private">Sistema interno · dados protegidos</span>`}
      </li>`).join('');

    observeReveals(worksEl);

    // Vídeo só toca quando o card está na tela
    const vidObserver = new IntersectionObserver(entries => {
      entries.forEach(en => {
        const v = en.target;
        if (en.isIntersecting && !reduced) v.play().catch(() => {});
        else v.pause();
      });
    });
    $$('video', worksEl).forEach(v => vidObserver.observe(v));

    if (hasGsap && !reduced) {
      $$('.work', worksEl).forEach((w, i) => {
        gsap.to(w.querySelector('.work__media'), {
          yPercent: i % 2 ? -6 : 6, ease: 'none',
          scrollTrigger: { trigger: w, start: 'top bottom', end: 'bottom top', scrub: true }
        });
      });
      ScrollTrigger.refresh();
    }
  }

  function openCase(i) {
    const p = projects[i];
    lastFocus = document.activeElement;
    caseInner.innerHTML = `
      <button class="case__close" type="button" data-close>Fechar ✕</button>
      <div class="work__meta"><span>${pad(i + 1)}/${pad(projects.length)}</span><span class="work__tags">${p.tags.map(t => `<span>${esc(t)}</span>`).join('')}</span></div>
      <h2 id="case-title">${componentName(p)}</h2>
      <p>${esc(p.benefit)}</p>
      <div class="case__media">${mediaHTML(p, true)}</div>
      <h3>[ Desafio ]</h3>
      <p>${esc(p.challenge)}</p>
      <h3>[ Solução ]</h3>
      <ul>${p.solution.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
      ${p.result ? `<h3>[ Resultado ]</h3><p>${esc(p.result)}</p>` : ''}
      ${p.link ? `<p style="margin-top:40px"><a class="btn" href="${esc(p.link)}" target="_blank" rel="noopener">${esc(p.linkLabel || 'Ver projeto')} ↗</a></p>` : ''}
      <p style="margin-top:${p.link ? '12px' : '40px'}"><a class="btn btn--ghost" href="${WA_URL}" target="_blank" rel="noopener">Quero um projeto assim</a></p>`;
    caseEl.hidden = false;
    caseEl.scrollTop = 0;
    document.body.style.overflow = 'hidden';
    if (lenis) lenis.stop();
    $('[data-close]', caseInner).focus();
    if (hasGsap && !reduced) {
      gsap.from([...caseInner.children].filter(el => !el.matches('[data-close]')), {
        y: 64, opacity: 0, filter: 'blur(12px)', duration: .9, stagger: .06, ease: 'power3.out'
      });
    }
  }

  function closeCase() {
    caseEl.hidden = true;
    document.body.style.overflow = '';
    if (lenis) lenis.start();
    if (lastFocus) lastFocus.focus();
  }

  worksEl.addEventListener('click', e => {
    const btn = e.target.closest('.work__open');
    if (btn) openCase(Number(btn.dataset.i));
  });
  caseEl.addEventListener('click', e => {
    if (e.target.closest('[data-close]')) closeCase();
  });
  caseEl.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeCase();
    if (e.key !== 'Tab') return;
    const f = $$('a[href], button', caseEl);
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  fetch('data/projects.json')
    .then(r => r.json())
    .then(data => { projects = data.projects; renderWorks(); })
    .catch(() => { worksEl.innerHTML = '<li>Não deu para carregar os projetos. Recarregue a página.</li>'; });

  /* ---------- 10. Terminal ---------- */
  const screen = $('#term-screen');
  const form = $('#term-form');
  const input = $('#term-input');

  const print = (html, cls) => {
    const div = document.createElement('div');
    if (cls) div.className = cls;
    div.innerHTML = html;
    screen.appendChild(div);
    screen.scrollTop = screen.scrollHeight;
  };

  const COMMANDS = {
    ajuda: () => print('Comandos: ajuda, sobre, servicos, projetos, contato, orcamento, limpar'),
    sobre: () => print('A Bolha cria sites e sistemas sob medida em São Gonçalo, RJ.\nFundada por Matheus Carvalho, desenvolvedor full stack.\nSem template, sem enrolação.'),
    servicos: () => print('[01] Sites                institucionais e de negócio local\n[02] Sistemas sob medida  agenda, CRM, gestão e WhatsApp'),
    projetos: () => print(projects.length
      ? projects.map((p, i) => `${pad(i + 1)}  &lt;${esc(p.component)} /&gt;  ${esc(p.tags.join(' + '))}`).join('\n') + '\n\nRole até <a href="#projetos">[ Projetos ]</a> para ver os cases.'
      : 'Carregando projetos...'),
    contato: () => print(`WhatsApp   <a href="${WA_URL}" target="_blank" rel="noopener">(21) 96555-5427</a>\nInstagram  <a href="${INSTAGRAM_URL}" target="_blank" rel="noopener">@bolhacomunicacao</a>`),
    orcamento: () => { print('Abrindo o WhatsApp...'); window.open(WA_URL, '_blank', 'noopener'); },
    limpar: () => { screen.innerHTML = ''; }
  };

  const run = raw => {
    const cmd = raw.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (!cmd) return;
    print(esc(raw.trim()), 'cmd');
    (COMMANDS[cmd] || (() => print(`Comando não encontrado: ${esc(cmd)}. Digite ajuda.`)))();
  };

  print('Bem-vindo à Bolha. Digite ajuda ou toque num comando abaixo.');
  form.addEventListener('submit', e => { e.preventDefault(); run(input.value); input.value = ''; });
  $$('.term__cmds button').forEach(b => b.addEventListener('click', () => run(b.dataset.cmd)));

  /* ---------- 12. Contato: floating spans ---------- */
  const floats = $$('.contact__float span');
  if (hasGsap && !reduced) {
    floats.forEach((el, i) => {
      gsap.to(el, {
        y: (i % 2 ? -1 : 1) * 80, ease: 'none',
        scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
  }

  /* ---------- Cursor + magnetismo (desktop) ---------- */
  if (hasGsap && finePointer && !reduced) {
    const cursor = $('.cursor');
    const cx = gsap.quickTo(cursor, 'x', { duration: .5, ease: 'power3.out' });
    const cy = gsap.quickTo(cursor, 'y', { duration: .5, ease: 'power3.out' });
    const hero = $('.hero');
    const contact = $('.contact');

    window.addEventListener('pointermove', e => {
      cursor.classList.add('is-on');
      cx(e.clientX); cy(e.clientY);
      const mx = e.clientX / window.innerWidth - .5;
      const my = e.clientY / window.innerHeight - .5;
      const hr = hero.getBoundingClientRect();
      if (hr.bottom > 0) {
        gsap.to(heroBubble, { x: mx * 40, y: my * 30, duration: 1.2, ease: 'power3.out', overwrite: 'auto' });
      }
      const cr = contact.getBoundingClientRect();
      if (cr.top < window.innerHeight && cr.bottom > 0) {
        floats.forEach((el, i) => gsap.to(el, { x: mx * (30 + i * 12), duration: 1.2, ease: 'power3.out', overwrite: 'auto' }));
      }
    }, { passive: true });

    document.addEventListener('pointerover', e => {
      cursor.classList.toggle('is-hover', !!e.target.closest('a, button, summary, input'));
    });
    document.addEventListener('pointerleave', () => cursor.classList.remove('is-on'));
  }
})();
