(() => {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const canHover = matchMedia('(hover:hover) and (pointer:fine)').matches;

  /* ---------- tiny helpers ---------- */
  const q = (s, r=document) => r.querySelector(s);
  const qa = (s, r=document) => [...r.querySelectorAll(s)];
  const clamp = (n,a,b) => Math.min(b,Math.max(a,n));

  /* Page-to-page curtain removed: use immediate native navigation for a calmer UX. */

  /* ---------- sound: synthesized, opt-in only ---------- */
  let audioCtx = null, soundOn = false, lastTick = 0;
  const soundBtn = document.createElement('button');
  soundBtn.className = 'df-sound-toggle';
  soundBtn.type = 'button';
  soundBtn.setAttribute('aria-pressed','false');
  soundBtn.setAttribute('aria-label','Enable interface sound');
  soundBtn.innerHTML = '◌<span>Sound</span>';
  document.body.appendChild(soundBtn);

  const tone = (freq=420, duration=.055, gain=.018, type='sine') => {
    if (!soundOn || !audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator(), g = audioCtx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, now);
    g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(gain, now + .008); g.gain.exponentialRampToValueAtTime(.0001, now + duration);
    osc.connect(g).connect(audioCtx.destination); osc.start(now); osc.stop(now + duration + .02);
  };
  soundBtn.addEventListener('click', async () => {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') await audioCtx.resume();
    soundOn = !soundOn;
    soundBtn.classList.toggle('is-on', soundOn);
    soundBtn.setAttribute('aria-pressed', String(soundOn));
    soundBtn.setAttribute('aria-label', soundOn ? 'Disable interface sound' : 'Enable interface sound');
    soundBtn.firstChild.nodeValue = soundOn ? '◉' : '◌';
    if (soundOn) tone(540,.12,.03,'sine');
  });

  /* ---------- custom cursor ---------- */
  if (canHover && !reduce) {
    const dot = document.createElement('span'), ring = document.createElement('span');
    dot.className='df-cursor-dot'; ring.className='df-cursor-ring';
    document.body.append(dot,ring); document.body.classList.add('df-cursor-ready');
    let mx=-100,my=-100,rx=-100,ry=-100;
    addEventListener('pointermove', e => {mx=e.clientX;my=e.clientY;dot.style.transform=`translate3d(${mx-3.5}px,${my-3.5}px,0)`;});
    const loop = () => {rx += (mx-rx)*.16; ry += (my-ry)*.16; ring.style.transform=`translate3d(${rx-19}px,${ry-19}px,0)`; requestAnimationFrame(loop)}; loop();
    qa('a,button,input,select,textarea,summary,.card,.visual-card').forEach(el => {
      el.addEventListener('pointerenter',()=>{ring.classList.add('is-active'); if(soundOn && performance.now()-lastTick>90){tone(310,.03,.008);lastTick=performance.now();}});
      el.addEventListener('pointerleave',()=>ring.classList.remove('is-active'));
    });
    qa('h1,h2,h3,p').forEach(el=>{el.addEventListener('pointerenter',()=>ring.classList.add('is-text'));el.addEventListener('pointerleave',()=>ring.classList.remove('is-text'));});
  }

  /* ---------- WebGL liquid background ---------- */
  function createWebGL(host){
    if (!host || reduce || innerWidth < 620) return;
    const wrap=document.createElement('div'); wrap.className='df-webgl-stage'; wrap.setAttribute('aria-hidden','true');
    const canvas=document.createElement('canvas'); wrap.appendChild(canvas); host.prepend(wrap);
    const gl=canvas.getContext('webgl',{alpha:true,antialias:false,powerPreference:'low-power'}); if(!gl){wrap.remove();return;}
    const vert=`attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
    const frag=`precision mediump float;uniform vec2 r;uniform vec2 m;uniform float t;
      float n(vec2 p){return sin(p.x)*sin(p.y);}
      void main(){
        vec2 uv=(gl_FragCoord.xy-.5*r.xy)/min(r.x,r.y); vec2 mm=(m-.5*r.xy)/min(r.x,r.y);
        float d=length(uv-mm*.34); float a=atan(uv.y,uv.x);
        float w=sin(uv.x*4.2+t*.55)+sin(uv.y*5.1-t*.42)+sin((uv.x+uv.y)*3.2+t*.31);
        w += sin(a*4.0-d*7.0+t*.7);
        vec3 navy=vec3(.028,.075,.13); vec3 blue=vec3(.08,.27,.39); vec3 cyan=vec3(.18,.60,.70); vec3 orange=vec3(.88,.33,.12);
        float f=smoothstep(-2.3,2.6,w); vec3 col=mix(navy,blue,f); col=mix(col,cyan,smoothstep(.15,.95,f)*.46); col=mix(col,orange,smoothstep(.55,1.35,sin(d*8.0-t*.7))*.19);
        float glow=.13/max(.18,d*2.4); col+=orange*glow*.16; float edge=smoothstep(1.15,.18,length(uv));
        gl_FragColor=vec4(col,.74*edge);
      }`;
    const shader=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);return s};
    const prog=gl.createProgram();gl.attachShader(prog,shader(gl.VERTEX_SHADER,vert));gl.attachShader(prog,shader(gl.FRAGMENT_SHADER,frag));gl.linkProgram(prog);gl.useProgram(prog);
    const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
    const loc=gl.getAttribLocation(prog,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
    const ur=gl.getUniformLocation(prog,'r'), um=gl.getUniformLocation(prog,'m'), ut=gl.getUniformLocation(prog,'t'); let mouse=[0,0],start=performance.now(),running=true;
    const resize=()=>{const dpr=Math.min(devicePixelRatio||1,1.5),w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);canvas.width=w*dpr;canvas.height=h*dpr;gl.viewport(0,0,canvas.width,canvas.height);}; resize();
    new ResizeObserver(resize).observe(host);
    host.addEventListener('pointermove',e=>{const b=canvas.getBoundingClientRect();mouse=[(e.clientX-b.left)*(canvas.width/b.width),(b.height-(e.clientY-b.top))*(canvas.height/b.height)]},{passive:true});
    const draw=now=>{if(!running)return;gl.uniform2f(ur,canvas.width,canvas.height);gl.uniform2f(um,mouse[0]||canvas.width*.72,mouse[1]||canvas.height*.55);gl.uniform1f(ut,(now-start)/1000);gl.drawArrays(gl.TRIANGLES,0,6);requestAnimationFrame(draw)};requestAnimationFrame(draw);
    document.addEventListener('visibilitychange',()=>{running=!document.hidden;if(running){start=performance.now();requestAnimationFrame(draw)}});
  }
  createWebGL(q('.hero') || q('.page-hero'));

  /* ---------- lightweight digital-marketing HUD ---------- */
  const hero=q('.hero')||q('.page-hero');
  const pageKey=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  const marketingPageMap={
    'index.html':['Digital Marketing Focus','SEO · Ads · Content · Leads','Search visibility','Conversion paths'],
    'seo.html':['Search Visibility','Technical · Content · Authority','Relevant queries','Organic growth'],
    'local-seo.html':['Local Visibility','Google Profile · Maps · Reviews','Location relevance','Local enquiries'],
    'google-ads.html':['Paid Search','Keywords · Ads · Landing pages','Search demand','Conversion tracking'],
    'meta-ads.html':['Meta Campaigns','Audience · Hook · Creative · Lead','Creative testing','Lead quality'],
    'ai-video.html':['Video Creatives','Brief · Story · Visual · Edit','Campaign concepts','Short-form content'],
    'social-media-marketing.html':['Social Media','Content pillars · Posts · Reels','Content rhythm','Audience engagement'],
    'content-marketing.html':['Content Strategy','Research · Brief · Publish · Link','Customer questions','Useful content'],
    'lead-generation.html':['Lead Journey','Traffic · Offer · Form · Follow-up','Funnel clarity','Lead pathways'],
    'web-design.html':['Conversion UX','Message · Layout · CTA · Enquiry','User experience','CTA clarity'],
    'email-marketing.html':['Lifecycle Marketing','Segment · Message · Follow-up','Audience groups','Message timing'],
    'services.html':['Connected Channels','SEO · Ads · Social · Web · Content','Channel fit','Customer journey'],
    'blog.html':['Knowledge Hub','Questions · Guides · Services','Topic relevance','Practical education'],
    'portfolio.html':['Selected Work','Creative · Traffic · UX · Conversion','Campaign thinking','Experience design'],
    'contact.html':['Project Brief','Goal · Audience · Channel · Next step','Business context','Clear priorities']
  };
  const hudInfo=marketingPageMap[pageKey]||['Digital Marketing','Search · Ads · Content · Conversion','Customer intent','Lead journey'];
  if(hero && innerWidth>980){
    const hud=document.createElement('div');hud.className='df-ai-hud df-marketing-hud';hud.setAttribute('aria-hidden','true');hud.dataset.dfParallax='0.045';
    hud.innerHTML=`<div class="df-ai-hud__top"><span>${hudInfo[0]}</span><span class="df-ai-hud__live">Marketing overview</span></div><div class="df-ai-hud__title">${hudInfo[1]}</div><div class="df-ai-bars">${[38,72,50,86,62,94,54,78,66,92,48,82].map((h,i)=>`<i style="height:${h}%;animation-duration:${1.55+(i%4)*.24}s"></i>`).join('')}</div><div class="df-ai-hud__foot"><span>${hudInfo[2]}</span><span>${hudInfo[3]}</span></div>`;
    hero.appendChild(hud);
  }

  /* ---------- magnetic + liquid ---------- */
  qa('.btn,.mini-contact-trigger,.whatsapp,.df-sound-toggle').forEach(el=>{el.classList.add('df-magnetic'); if(el.classList.contains('btn-primary')||el.classList.contains('mini-contact-trigger'))el.classList.add('df-liquid');});
  if(canHover && !reduce){
    qa('.df-magnetic').forEach(el=>{
      el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect();const x=(e.clientX-r.left-r.width/2)*.16,y=(e.clientY-r.top-r.height/2)*.16;el.style.setProperty('--df-tx',`${clamp(x,-14,14)}px`);el.style.setProperty('--df-ty',`${clamp(y,-10,10)}px`)});
      el.addEventListener('pointerleave',()=>{el.style.setProperty('--df-tx','0px');el.style.setProperty('--df-ty','0px')});
    });
  }

  /* ---------- parallax ---------- */
  qa('.hero h1,.hero-panel,.page-hero h1,.featured-post,.search-card,.visual-explainer').forEach((el,i)=>{if(!el.hasAttribute('data-df-parallax'))el.dataset.dfParallax=String((i%3+1)*.025)});
  if(!reduce && !coarse){
    let sx=0,sy=0,tx=0,ty=0;
    addEventListener('pointermove',e=>{tx=(e.clientX/innerWidth-.5);ty=(e.clientY/innerHeight-.5)},{passive:true});
    const parallaxLoop=()=>{sx+=(tx-sx)*.055;sy+=(ty-sy)*.055;qa('[data-df-parallax]').forEach(el=>{const d=parseFloat(el.dataset.dfParallax||.03);el.style.translate=`${sx*d*140}px ${sy*d*100}px`});requestAnimationFrame(parallaxLoop)};parallaxLoop();
  }

  const home = location.pathname.endsWith('/') || /\/index\.html$/.test(location.pathname) || location.pathname.split('/').pop()==='';

  /* ---------- focused marketing experience: no AI command-center section ---------- */

  /* ---------- generic reveal ---------- */
  const revealTargets=qa('main section:not(.hero):not(.page-hero):not(.df-horizontal) .section-head, main section:not(.hero):not(.page-hero):not(.df-horizontal) .card, main section:not(.hero):not(.page-hero):not(.df-horizontal) .content-card, .blog-card, .visual-explainer');
  revealTargets.forEach(el=>el.classList.add('df-reveal'));
  if(!reduce){
    const io=new IntersectionObserver(entries=>entries.forEach(en=>{if(en.isIntersecting){en.target.classList.add('is-visible');io.unobserve(en.target)}}),{threshold:.12,rootMargin:'0px 0px -8%'});revealTargets.forEach(el=>io.observe(el));
  } else revealTargets.forEach(el=>el.classList.add('is-visible'));

  /* ---------- home horizontal growth roadmap ---------- */
  if(home && !q('[data-cinematic-horizontal]')){
    const anchor=q('.value-strip');
    if(anchor){
      const sec=document.createElement('section');sec.className='df-horizontal';sec.dataset.cinematicHorizontal='';
      const panels=[
        ['01','Understand Demand','Start with what customers are already looking for.','Search terms','Local intent','Customer questions','⌕'],
        ['02','Build Visibility','Create useful pages and a stronger local search presence.','SEO foundations','Service pages','Google profile','↗'],
        ['03','Reach Faster','Use Google and Meta campaigns when paid reach makes sense.','Audience','Offer','Campaign','◎'],
        ['04','Convert Interest','Make the website and enquiry path clear, useful and easy to act on.','Message','Proof','CTA / WhatsApp','→'],
        ['05','Measure & Improve','Use real enquiries and campaign signals to decide what to refine next.','Leads','Quality','Iteration','↻']
      ];
      sec.innerHTML=`<div class="df-horizontal__viewport"><div class="df-horizontal__track"><div class="df-horizontal__intro"><div class="df-horizontal__copy"><span class="df-horizontal__kicker">Digital Growth Roadmap</span><h2>A clear path from visibility to enquiries.</h2><p>Five practical stages connect search, advertising, website experience and follow-up—without unnecessary complexity.</p><div class="df-horizontal__intro-tags"><span>SEO</span><span>Google Ads</span><span>Meta Ads</span><span>Web</span><span>Leads</span></div></div><div class="df-roadmap-visual" aria-hidden="true"><div class="df-roadmap-core">GROW</div><i style="--i:0">SEO</i><i style="--i:1">ADS</i><i style="--i:2">WEB</i><i style="--i:3">LEADS</i></div></div>${panels.map((p,i)=>`<article class="df-horizontal__panel"><div class="df-horizontal__copy"><span class="df-horizontal__num">${p[0]} / 05</span><h3>${p[1]}</h3><p>${p[2]}</p><div class="df-horizontal__path"><span>${p[3]}</span><b>→</b><span>${p[4]}</span><b>→</b><span>${p[5]}</span></div></div><div class="df-step-visual" aria-hidden="true"><span class="df-step-visual__icon">${p[6]}</span><strong>${p[0]}</strong><i></i><i></i><i></i></div></article>`).join('')}</div><div class="df-horizontal__progress"><i></i></div><div class="df-horizontal__hint">Scroll to explore <span>→</span></div></div>`;
      anchor.insertAdjacentElement('afterend',sec);
    }
  }

  function initGSAP(){
    const gs=window.gsap, ST=window.ScrollTrigger; if(!gs||!ST||reduce)return false; gs.registerPlugin(ST);
    gs.from('.hero-copy>* , .page-hero .container>*',{y:38,opacity:0,duration:.9,stagger:.09,ease:'power3.out',delay:.08});
    gs.utils.toArray('[data-df-parallax]').forEach((el,i)=>{if(coarse)return;gs.to(el,{yPercent:(i%2?8:-8),ease:'none',scrollTrigger:{trigger:el,start:'top bottom',end:'bottom top',scrub:1.2}})});
    const sec=q('[data-cinematic-horizontal]');
    if(sec && innerWidth>800){
      const viewport=q('.df-horizontal__viewport',sec),track=q('.df-horizontal__track',sec),progress=q('.df-horizontal__progress i',sec);
      const distance=()=>Math.max(0,track.scrollWidth-innerWidth);
      const tween=gs.to(track,{x:()=>-distance(),ease:'none',scrollTrigger:{trigger:sec,start:'top top',end:()=>`+=${distance()+innerHeight*.55}`,scrub:1,pin:viewport,anticipatePin:1,invalidateOnRefresh:true,onUpdate:self=>progress&&gs.set(progress,{scaleX:.1+.9*self.progress})}});
      gs.utils.toArray('.df-horizontal__panel h3').forEach(h=>gs.from(h,{opacity:.2,y:70,scrollTrigger:{trigger:h,containerAnimation:tween,start:'left 84%',end:'left 55%',scrub:true}}));
    }
    gs.utils.toArray('.visual-card,.card').forEach((el,i)=>{if(i>20)return;gs.fromTo(el,{rotateX:0,rotateY:0},{scrollTrigger:{trigger:el,start:'top 92%',end:'bottom 10%',scrub:.8},rotateX:i%2?2:-2,rotateY:i%3?2:-2,ease:'none'})});
    return true;
  }
  let tries=0;const waitGSAP=()=>{if(initGSAP()||tries++>35)return;setTimeout(waitGSAP,120)};waitGSAP();

  /* Native link navigation intentionally retained; no full-screen transition overlay. */

})();
