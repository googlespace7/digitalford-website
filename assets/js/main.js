const btn=document.querySelector('.menu-btn');const nav=document.querySelector('.navlinks');if(btn&&nav)btn.addEventListener('click',()=>nav.classList.toggle('open'));
const obs=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('in')}),{threshold:.15});document.querySelectorAll('.card,.case,.quote,.mini-stat').forEach(el=>obs.observe(el));
