document.addEventListener('DOMContentLoaded', () => {
 const menu=document.querySelector('.menu-btn'),nav=document.querySelector('.navlinks');
 const setMenu=open=>{nav?.classList.toggle('open',open);menu?.setAttribute('aria-expanded',String(open));};
 menu?.addEventListener('click',()=>setMenu(menu.getAttribute('aria-expanded')!=='true'));
 nav?.querySelectorAll('a').forEach(a=>{if(new URL(a.href).pathname===location.pathname)a.setAttribute('aria-current','page');});
 const popup=document.getElementById('miniContact'),trigger=document.getElementById('miniContactTrigger');let previousFocus;
 const background=[...document.body.children].filter(el=>el!==popup&&!['SCRIPT','STYLE'].includes(el.tagName));
 const close=()=>{popup?.classList.remove('is-open');popup?.setAttribute('aria-hidden','true');document.body.classList.remove('mini-contact-open');background.forEach(el=>el.inert=false);previousFocus?.focus();};
 trigger?.addEventListener('click',()=>{previousFocus=document.activeElement;popup.classList.add('is-open');popup.setAttribute('aria-hidden','false');document.body.classList.add('mini-contact-open');background.forEach(el=>el.inert=true);popup.querySelector('button').focus();});
 popup?.querySelectorAll('[data-mini-close]').forEach(el=>el.addEventListener('click',close));
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(popup?.classList.contains('is-open'))close();else setMenu(false);}if(e.key==='Tab'&&popup?.classList.contains('is-open')){const nodes=[...popup.querySelectorAll('a,button,input,select,textarea')].filter(n=>!n.disabled),first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
 ['waForm','miniContactForm'].forEach(id=>{const form=document.getElementById(id);if(!form)return;form.addEventListener('submit',e=>{e.preventDefault();if(!form.reportValidity())return;const d=new FormData(form),message=['Hello Digitalford, I would like to enquire.',...['name','business','phone','service','message'].filter(k=>d.get(k)).map(k=>`${k[0].toUpperCase()+k.slice(1)}: ${d.get(k)}`)].join('\n');window.location.assign('https://wa.me/919866383147?text='+encodeURIComponent(message));});});
});

// Immersive 3D layer: decorative scene + pointer-responsive depth.
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;

  // Inject a lightweight CSS-only true 3D scene into hero areas.
  document.querySelectorAll('.hero,.page-hero').forEach((hero, index) => {
    if (hero.querySelector('.df-3d-scene')) return;
    const scene = document.createElement('div');
    scene.className = 'df-3d-scene';
    scene.setAttribute('aria-hidden','true');
    scene.innerHTML = `
      <span class="df-3d-orb one"></span>
      <span class="df-3d-orb two"></span>
      <span class="df-3d-ring"></span>
      <span class="df-cube-wrap"><span class="df-cube"><i></i><i></i><i></i><i></i><i></i><i></i></span></span>
      <span class="df-signal-chip chip-seo">SEO</span>
      <span class="df-signal-chip chip-google">Google Ads</span>
      <span class="df-signal-chip chip-meta">Meta Ads</span>
      <span class="df-signal-chip chip-ai">AI Creative</span>
      <span class="df-signal-chip chip-leads">Leads</span>`;
    hero.prepend(scene);
  });

  if (reduce || coarse || window.innerWidth < 900) return;

  // Hero dashboard tracks the pointer with controlled perspective.
  const panel = document.querySelector('.hero-panel');
  const hero = document.querySelector('.hero');
  if (panel && hero) {
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / r.width - .5);
      const ny = ((e.clientY - r.top) / r.height - .5);
      panel.style.setProperty('--ry', `${-7 + nx * 7}deg`);
      panel.style.setProperty('--rx', `${2 - ny * 5}deg`);
      panel.style.setProperty('--tx', `${nx * 8}px`);
      panel.style.setProperty('--ty', `${ny * 6}px`);

      const scene = hero.querySelector('.df-3d-scene');
      if (scene) scene.style.transform = `translate3d(${nx * -10}px,${ny * -8}px,0)`;
    });
    hero.addEventListener('pointerleave', () => {
      panel.style.removeProperty('--ry');panel.style.removeProperty('--rx');
      panel.style.removeProperty('--tx');panel.style.removeProperty('--ty');
      const scene = hero.querySelector('.df-3d-scene');
      if (scene) scene.style.transform = '';
    });
  }

  // Shared interactive cards. Uses CSS variables so hover depth and glare work together.
  const selectors = '.card,.content-card,.side-card,.search-card,.blog-card,.process>div,.strip-grid>div,.faq details';
  document.querySelectorAll(selectors).forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      const x = px - .5, y = py - .5;
      el.style.setProperty('--ry', `${x * 7}deg`);
      el.style.setProperty('--rx', `${-y * 6}deg`);
      el.style.setProperty('--gx', `${px * 100}%`);
      el.style.setProperty('--gy', `${py * 100}%`);
    });
    el.addEventListener('pointerleave', () => {
      el.style.removeProperty('--ry');el.style.removeProperty('--rx');
      el.style.removeProperty('--gx');el.style.removeProperty('--gy');
    });
  });
})();
