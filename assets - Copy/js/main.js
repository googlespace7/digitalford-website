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
 ['waForm','miniContactForm'].forEach(id=>{const form=document.getElementById(id);if(!form)return;form.addEventListener('submit',e=>{e.preventDefault();if(!form.reportValidity())return;const d=new FormData(form),message=['Hello Digitalford, I would like to enquire.',...['name','business','phone','service','message'].filter(k=>d.get(k)).map(k=>`${k[0].toUpperCase()+k.slice(1)}: ${d.get(k)}`)].join('\n');window.location.assign('https://wa.me/919014328361?text='+encodeURIComponent(message));});});
});


const scene=document.querySelector('.growth-scene');
if(scene&&matchMedia('(pointer:fine) and (prefers-reduced-motion:no-preference)').matches){scene.addEventListener('pointermove',e=>{const r=scene.getBoundingClientRect();scene.style.setProperty('--tilt-x',((e.clientY-r.top)/r.height-.5)*-7+'deg');scene.style.setProperty('--tilt-y',((e.clientX-r.left)/r.width-.5)*9+'deg')});scene.addEventListener('pointerleave',()=>{scene.style.setProperty('--tilt-x','0deg');scene.style.setProperty('--tilt-y','0deg')})}
