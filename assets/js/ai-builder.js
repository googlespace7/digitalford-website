(() => {
  'use strict';
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const root = $('#aiBuilder');
  if (!root) return;

  const state = {
    step: 1,
    data: {},
    concept: null,
    logoData: '',
    mode: 'local',
    nonce: '',
    draftKey: 'digitalford-ai-builder-draft-v4',
    site: null, originalSite: null, editMode: false, activePageId: 'home', history: [], future: [],
    generationIndex: 0, previousGeneration: null
  };


  const commerceSession = {
    key: '', cart: [], wishlist: [], user: null, orders: []
  };

  function commerceStorageKey(){
    const name=state.site?.brand?.name||state.data?.businessName||'website';
    return `digitalford-store-preview-${slug(name)||'website'}`;
  }
  function loadCommerceSession(){
    const key=commerceStorageKey();
    if(commerceSession.key===key)return;
    commerceSession.key=key;commerceSession.cart=[];commerceSession.wishlist=[];commerceSession.user=null;commerceSession.orders=[];
    try{const raw=JSON.parse(localStorage.getItem(key)||'{}');commerceSession.cart=Array.isArray(raw.cart)?raw.cart:[];commerceSession.wishlist=Array.isArray(raw.wishlist)?raw.wishlist:[];commerceSession.user=raw.user||null;commerceSession.orders=Array.isArray(raw.orders)?raw.orders:[];}catch(_){}
  }
  function saveCommerceSession(){
    loadCommerceSession();
    try{localStorage.setItem(commerceSession.key,JSON.stringify({cart:commerceSession.cart,wishlist:commerceSession.wishlist,user:commerceSession.user,orders:commerceSession.orders.slice(0,30)}));}catch(_){}
  }
  function commerceCounts(){
    loadCommerceSession();
    return {cart:commerceSession.cart.reduce((n,x)=>n+(Number(x.qty)||1),0),wishlist:commerceSession.wishlist.length};
  }
  function cleanWhatsapp(v=''){return String(v).replace(/\D/g,'');}
  function whatsappUrl(message=''){
    const n=cleanWhatsapp(state.site?.contact?.whatsapp||state.site?.contact?.phone||'');
    return n?`https://wa.me/${n}?text=${encodeURIComponent(message)}`:'';
  }
  function priceValue(label=''){
    const text=String(label);if(!text||/free|enquire/i.test(text)||/sq\.ft|month|session|day|hour/i.test(text))return null;
    const num=Number((text.match(/[\d,.]+/)||[])[0]?.replace(/,/g,''));if(!Number.isFinite(num))return null;
    return /lakh/i.test(text)?num*100000:num;
  }
  function sampleTotal(items=[]){const vals=items.map(x=>priceValue(x.meta)).filter(v=>Number.isFinite(v));if(vals.length!==items.length)return null;return items.reduce((sum,x)=>sum+(priceValue(x.meta)||0)*(Number(x.qty)||1),0);}
  function money(v){const c=currencyInfo(state.data?.location||'');return `${c.symbol}${Number(v||0).toLocaleString(c.code==='INR'?'en-IN':'en-US')}`;}
  function socialLabel(k){return ({instagram:'Instagram',facebook:'Facebook',youtube:'YouTube',linkedin:'LinkedIn'})[k]||k;}

  const categories = {
    'Restaurant': {noun:'restaurant', action:'Book a Table', visual:'Signature dishes', sections:['Popular Menu','Dining & Catering Services','About the Restaurant']},
    'E-commerce': {noun:'store', action:'Shop Now', visual:'Featured products', sections:['Featured Products','Customer Services','Why Shop With Us']},
    'Real Estate': {noun:'real estate agency', action:'View Properties', visual:'Featured properties', sections:['Featured Properties','Property Services','Local Market Expertise']},
    'Agency': {noun:'agency', action:'Start a Project', visual:'Selected work', sections:['Core Services','Growth Packages','How We Work']},
    'Salon & Beauty': {noun:'salon', action:'Book an Appointment', visual:'Beauty services', sections:['Popular Services','Beauty Packages','Why Clients Choose Us']},
    'Healthcare': {noun:'clinic', action:'Book an Appointment', visual:'Patient care', sections:['Clinic Services','Consultations & Care','Care Approach']},
    'Fitness': {noun:'fitness business', action:'Join Today', visual:'Fitness programs', sections:['Memberships & Programs','Coaching Services','Member Benefits']},
    'Education': {noun:'education institute', action:'Explore Courses', visual:'Learning programs', sections:['Popular Courses','Student Services','Why Learn With Us']},
    'Construction': {noun:'construction company', action:'Request a Quote', visual:'Recent projects', sections:['Construction Services','Project Packages','Why Choose Us']},
    'Professional Services': {noun:'professional services business', action:'Request a Consultation', visual:'Professional expertise', sections:['Professional Services','Service Packages','How We Work']},
    'Local Business': {noun:'local business', action:'Contact Us', visual:'Local service', sections:['Popular Offerings','Services','Serving Your Area']},
    'Technology': {noun:'technology company', action:'Request a Demo', visual:'Digital solutions', sections:['Solutions','Technology Services','How It Works']},
    'Portfolio': {noun:'portfolio', action:'View My Work', visual:'Selected projects', sections:['Featured Work','Services','Skills & Expertise']},
    'Freelancer': {noun:'freelance business', action:'Hire Me', visual:'Selected work', sections:['Services','Project Packages','Why Work With Me']},
    'Other': {noun:'business', action:'Get Started', visual:'Business highlights', sections:['What We Offer','Services','How We Help']}
  };

  const fallbackCopy = {
    modern: 'A modern, conversion-focused website built to make the value clear quickly.',
    minimal: 'A clean, focused website that removes distractions and keeps attention on the offer.',
    premium: 'A refined website concept with strong positioning, trust signals and a polished visual hierarchy.',
    professional: 'A credible, professional website designed to explain services clearly and encourage enquiries.',
    bold: 'A high-impact website with confident messaging and clear calls to action.',
    elegant: 'An elegant website concept with balanced typography, generous spacing and refined presentation.',
    creative: 'A distinctive website concept with expressive sections while keeping usability clear.',
    friendly: 'A warm, approachable website that makes it easy for customers to understand and contact the business.',
    luxury: 'A premium, high-end website concept with understated copy and sophisticated presentation.',
    corporate: 'A structured corporate website focused on credibility, capabilities and clear next steps.'
  };

  const mediaPools = {
    'Restaurant':['14459158','15098824','36630804','8951178'],
    'E-commerce':['33516464','8101464','7670689','6312177','9869067'],
    'Real Estate':['17087548','8267009','8089185','23224987'],
    'Agency':['36765719','36733421','8068833','7144262'],
    'Salon & Beauty':['33607401','29692108','33580449','33580446'],
    'Healthcare':['34159000','5214997','6749750','7659876'],
    'Fitness':['841130','1552252','416717','3768916'],
    'Education':['5676748','7092350','8423457','37811262'],
    'Construction':['2219024','834892','1216589','159358'],
    'Professional Services':['3184465','3184418','3184291','3184436'],
    'Local Business':['7144262','36765719','8068833','36733421'],
    'Technology':['3861958','3861969','3861964','3861972'],
    'Portfolio':['7014337','7129665','6322367','12662868'],
    'Freelancer':['7014337','7129665','6322367','12662868'],
    'Fashion':['5424922','5490969','8311879','7679444'],
    'Wellness':['31234759','6560254','27925507','6187430'],
    'Travel':['8300817','8134375','5007279','8085334'],
    'Other':['7144262','36765719','8068833','36733421']
  };

  const sampleCatalog = {
    'Restaurant': {
      products:[['Signature Biryani',249],['Chef Special Meal',329],['Family Combo',699],['Dessert Special',149]],
      services:[['Dine-In Experience',0],['Home Delivery',49],['Event Catering',1499],['Party Orders',999]]
    },
    'E-commerce': {
      products:[['Best Seller',999],['Premium Collection',1499],['Everyday Essential',599],['Gift Combo',1299]],
      services:[['Doorstep Delivery',79],['Gift Packaging',149],['Bulk Order Support',499],['Product Consultation',0]]
    },
    'Real Estate': {
      products:[['2 BHK Apartment',4500000],['Premium Villa',8500000],['Residential Plot',3200000],['Commercial Space',6500000]],
      services:[['Property Consultation',0],['Site Visit',0],['Home Loan Guidance',0],['Property Management',4999]]
    },
    'Agency': {
      products:[['Growth Starter Package',9999],['Business Launch Package',14999],['Performance Package',24999]],
      services:[['Strategy Consultation',1499],['Campaign Management',12000],['Creative Production',4999],['Monthly Reporting',2499]]
    },
    'Salon & Beauty': {
      products:[['Premium Hair Care',899],['Skin Care Combo',1299],['Beauty Essentials',699]],
      services:[['Haircut & Styling',499],['Hair Spa',1299],['Facial & Skin Care',1499],['Bridal Makeup',9999]]
    },
    'Healthcare': {
      products:[['Wellness Care Pack',699],['Health Essentials',499]],
      services:[['Doctor Consultation',600],['General Health Check',1499],['Follow-up Consultation',400],['Preventive Care Consultation',799]]
    },
    'Fitness': {
      products:[['Fitness Starter Kit',1499],['Training Accessories',799]],
      services:[['Monthly Membership',1499],['Personal Training Session',799],['Group Fitness Class',399],['12-Week Transformation Plan',7999]]
    },
    'Education': {
      products:[['Study Material Pack',999],['Practice Test Pack',599]],
      services:[['Foundation Course',4999],['Professional Course',8999],['One-to-One Mentoring',1499],['Exam Preparation Program',6999]]
    },
    'Construction': {
      products:[['Material Supply Package',25000],['Premium Finish Package',75000]],
      services:[['Home Construction',1850],['Renovation Service',50000],['Interior Work',75000],['Site Consultation',1499]]
    },
    'Professional Services': {
      products:[['Starter Documentation Pack',2999],['Business Support Pack',4999]],
      services:[['Initial Consultation',1500],['Professional Advisory',5000],['Monthly Retainer',12000],['Documentation Support',3500]]
    },
    'Local Business': {
      products:[['Popular Product',699],['Premium Product',1199],['Value Combo',999]],
      services:[['Standard Service',799],['Premium Service',1499],['Doorstep Service',999],['Consultation',499]]
    },
    'Technology': {
      products:[['Business Software Starter',24999],['Automation Package',39999]],
      services:[['Website Development',29999],['App Development',79999],['Software Consultation',2499],['Support & Maintenance',9999]]
    },
    'Portfolio': {
      products:[['Digital Portfolio Pack',4999],['Creative Asset Pack',2999]],
      services:[['Creative Project',9999],['Consultation',1499],['Custom Design Service',5999],['Project Retainer',14999]]
    },
    'Freelancer': {
      products:[['Starter Project Package',5999],['Premium Project Package',12999]],
      services:[['Consultation',999],['Project Service',5999],['Monthly Support',7999],['Custom Assignment',9999]]
    },
    'Fashion': {
      products:[['Designer Saree',2499],['Festive Kurti',1499],['Bridal Collection',5999],['Fashion Accessories',799]],
      services:[['Blouse Stitching',899],['Alterations',399],['Personal Styling',999],['Bridal Styling Consultation',1499]]
    },
    'Wellness': {
      products:[['Herbal Wellness Pack',899],['Daily Care Essentials',699],['Natural Self-Care Set',1199],['Wellness Gift Box',1499]],
      services:[['Wellness Consultation',699],['Therapy Session',1199],['Personal Care Service',899],['Wellness Program',2999]]
    },
    'Travel': {
      products:[['Weekend Getaway Package',6999],['Family Holiday Package',14999],['Honeymoon Package',19999],['Pilgrimage Package',8999]],
      services:[['Flight Booking Support',499],['Hotel Reservation',499],['Visa Assistance',1999],['Custom Tour Planning',1499]]
    },
    'Other': {
      products:[['Popular Product',699],['Premium Product',1199],['Value Package',1499]],
      services:[['Core Service',999],['Premium Service',1999],['Consultation',499],['Custom Service',1499]]
    }
  };

  function escapeHTML(v='') { return String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
  function slug(v='') { return String(v).trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }
  function checkedValues(name) { return $$(`input[name="${name}"]:checked`).map(i => i.value); }
  function categoryValue() { const c = $('#businessCategory').value; return c === 'Other' && $('#customCategory').value.trim() ? $('#customCategory').value.trim() : c; }
  function safeCategoryConfig(cat) { return categories[cat] || categories['Other']; }
  function pexels(id,width=1200){ return id ? `https://images.pexels.com/photos/${encodeURIComponent(id)}/pexels-photo-${encodeURIComponent(id)}.jpeg?auto=compress&cs=tinysrgb&w=${width}` : ''; }
  function mediaForCategory(cat,index=0,width=1200){ const pool=mediaPools[cat]||mediaPools.Other; return pexels(pool[Math.abs(index)%pool.length],width); }
  function visualCategory(d={}){ const t=`${d.category||''} ${d.description||''}`.toLowerCase(); if(/fashion|boutique|saree|clothing|apparel|jewel|jewellery|jewelry/.test(t))return 'Fashion'; if(/ayurved|wellness|herbal|spa|yoga/.test(t)&&!/salon|beauty/.test(t))return 'Wellness'; if(/travel|tour|holiday|hotel|destination/.test(t))return 'Travel'; return d.category||'Other'; }
  function mediaForBusiness(d,index=0,width=1200){return mediaForCategory(visualCategory(d),index,width);}
  function titleCase(v=''){ return String(v).trim().replace(/\s+/g,' ').replace(/\b\w/g,c=>c.toUpperCase()); }
  function businessTypeValue(){ return $('#businessType')?.value || 'Products + Services'; }

  function tidyText(v='',max=220){
    const text=String(v||'').replace(/\s+/g,' ').trim();
    if(text.length<=max)return text;
    const cut=text.slice(0,max-1);const stop=Math.max(cut.lastIndexOf('. '),cut.lastIndexOf(' '));
    return (cut.slice(0,stop>max*.65?stop:max-1).replace(/[,:;\-\s]+$/,'')+'.').replace('..','.');
  }
  function locLabel(d={}){return String(d.location||'').trim() || 'your area';}
  function naturalOfferDescription(title,kind,d,index=0){
    const business=d.businessName||'the business', location=locLabel(d);
    const product=[
      `${title} is one of the featured choices from ${business}, with a simple path to ask about availability, options and current pricing.`,
      `Explore ${title} from ${business} and contact the team for the latest details, available variants and price.`,
      `${title} gives customers another way to explore what ${business} offers before making an enquiry.`,
      `Discover ${title} from ${business}. Customers in ${location} can enquire directly for availability and the most suitable option.`
    ];
    const service=[
      `${title} is one of the services available from ${business}. Customers in ${location} can enquire directly for scope, availability and final pricing.`,
      `Choose ${title} when you need focused support from ${business}. Share your requirement to confirm the right option and next step.`,
      `${business} offers ${title} for customers looking for a clear, straightforward service and an easy way to enquire.`,
      `Learn more about ${title} from ${business} and contact the team to discuss your requirement, timing and price.`
    ];
    return (kind==='product'?product:service)[Math.abs(index)%4];
  }

  function naturalAboutCopy(d={}){
    const base=tidyText(d.description||'',260);
    const location=d.location?` Based in ${d.location}, ${d.businessName||'the business'} makes it easy for customers to explore the available products and services and get in touch for more information.`:'';
    return `${base}${location}`.trim();
  }

  function naturalPageDescription(pageName,d={},brandName=''){
    const business=brandName||d.businessName||'the business', location=(String(d.location||'').split(',')[0]||'your area').trim(), category=d.category||'business';
    const key=String(pageName||'Home').toLowerCase();
    if(key==='about')return `Learn about ${business}, its ${category.toLowerCase()} offering and the products or services available for customers in ${location}.`;
    if(key==='products')return `Browse products from ${business} in ${location}. View featured options and sample pricing, then enquire for availability and final prices.`;
    if(key==='services')return `Explore services from ${business} in ${location}. See the main options and contact the business for scope, availability and final pricing.`;
    if(key==='contact')return `Contact ${business} in ${location} by phone, WhatsApp or email to ask about products, services, availability or a specific requirement.`;
    if(key==='gallery'||key==='portfolio')return `Browse selected work and visual highlights from ${business}, then contact the team in ${location} for more information.`;
    if(key==='faq')return `Find clear answers to common questions about ${business}, its products, services, pricing and enquiries in ${location}.`;
    return `Explore ${business}, a ${category.toLowerCase()} business in ${location}. View products and services, check sample pricing and contact the team directly.`;
  }
  function fitSeoTitle(v='',max=60){const t=String(v).replace(/\s+/g,' ').trim();if(t.length<=max)return t;return t.slice(0,max).replace(/\s+\S*$/,'').replace(/[|,:;\-\s]+$/,'').trim();}
  function fitMeta(v='',max=158){let t=String(v).replace(/\s+/g,' ').trim();if(t.length<=max)return t;let cut=t.slice(0,max);cut=cut.replace(/\s+\S*$/,'').replace(/[,:;\-\s]+$/,'').trim();cut=cut.replace(/\b(?:and|or|the|a|an|to|for|with|in|of|what|that|your|our)$/i,'').trim();return cut.replace(/[.!?]?$/,'.');}
  function pageSeo(pageName,d={},brandName=''){
    const business=brandName||d.businessName||'Business', shortLocation=(String(d.location||'').split(',')[0]||'').trim(), loc=shortLocation?` in ${shortLocation}`:'', category=d.category||'Business';
    const key=String(pageName||'Home').toLowerCase();
    let title;
    if(key==='home')title=`${business} | ${category}${loc}`;
    else if(key==='about')title=`About ${business} | ${category}${loc}`;
    else if(key==='products')title=`Products | ${business}${loc}`;
    else if(key==='services')title=`Services | ${business}${loc}`;
    else if(key==='contact')title=`Contact ${business}${loc}`;
    else title=`${pageName} | ${business}${loc}`;
    return {title:fitSeoTitle(title),description:fitMeta(naturalPageDescription(pageName,d,business))};
  }


  function getFormData() {
    const customColor = $('input[name="colorPreference"]:checked')?.value === 'Custom';
    return {
      businessName: $('#businessName').value.trim(),
      businessType: businessTypeValue(),
      category: categoryValue(),
      description: $('#businessDescription').value.trim(),
      location: $('#businessLocation').value.trim(),
      websiteUrl: $('#businessUrl').value.trim(),
      phone: $('#businessPhone').value.trim(),
      whatsapp: $('#businessWhatsApp').value.trim(),
      email: $('#businessEmail').value.trim(),
      address: $('#businessAddress').value.trim(),
      offers: [],
      audiences: checkedValues('audience'),
      idealCustomer: $('#idealCustomer').value.trim(),
      goals: checkedValues('goal'),
      style: $('input[name="siteStyle"]:checked')?.value || 'Modern',
      colorPreference: $('input[name="colorPreference"]:checked')?.value || 'Suggested by AI',
      primaryColor: customColor ? $('#brandPrimaryColor').value : '',
      accentColor: customColor ? $('#brandAccentColor').value : '',
      logoName: $('#businessLogo')?.files?.[0]?.name || '',
      logoData: state.logoData
    };
  }

  function validateStep(step) {
    if (step === 1) {
      for (const id of ['businessName','businessCategory','businessType','businessDescription','businessLocation']) {
        const el = $('#'+id); if (!el?.value.trim()) { el?.focus(); el?.reportValidity?.(); return false; }
      }
      if ($('#businessCategory').value === 'Other' && !$('#customCategory').value.trim()) { $('#customCategory').focus(); return false; }
    }
    return true;
  }

  function showStep(n) {
    state.step = Math.max(1, Math.min(4, n));
    $$('.ai-step').forEach(el => el.classList.toggle('is-active', Number(el.dataset.step) === state.step));
    $('#aiProgressBar').style.width = `${state.step * 25}%`;
    $('#aiProgressLabel').textContent = `Step ${state.step} of 4`;
    $('#aiBuilder').scrollIntoView({behavior:'smooth', block:'start'});
  }

  root.addEventListener('click', e => {
    const next = e.target.closest('[data-next]');
    const back = e.target.closest('[data-back]');
    if (next) { if (validateStep(state.step)) showStep(state.step + 1); }
    if (back) showStep(state.step - 1);
  });

  $('#businessCategory').addEventListener('change', e => $('#customCategory').classList.toggle('is-visible', e.target.value === 'Other'));
  $$('input[name="colorPreference"]').forEach(i => i.addEventListener('change', () => $('#customColors').classList.toggle('is-visible', i.value === 'Custom' && i.checked)));
  $('#businessLogo')?.addEventListener('change', e => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('Please choose a logo under 2 MB.'); e.target.value=''; return; }
    const reader = new FileReader(); reader.onload = () => { state.logoData = reader.result; $('#logoPreview').innerHTML = `<img alt="Logo preview" src="${reader.result}">`; }; reader.readAsDataURL(file);
  });

  const colorMap = {
    'Blue':['#173b5c','#f57c00'], 'Green':['#245843','#e39141'], 'Purple':['#493b78','#ef7c3c'], 'Red':['#7a2d2b','#e89a43'],
    'Orange':['#6e3513','#f57c00'], 'Black':['#15171a','#d59a52'], 'White':['#253246','#e57c28'], 'Suggested by AI':['#173b5c','#f57c00']
  };

  function currencyInfo(location=''){
    const s=String(location).toLowerCase();
    if(/india|telangana|hyderabad|bhuvanagiri|bhongir|warangal|andhra|bengaluru|bangalore|chennai|mumbai|delhi|pune|kolkata|kerala|karnataka|tamil|vijayawada|secunderabad/.test(s))return{symbol:'₹',code:'INR'};
    if(/uae|dubai|abu dhabi|emirates/.test(s))return{symbol:'AED ',code:'AED'};
    if(/uk|united kingdom|london|england|scotland|wales/.test(s))return{symbol:'£',code:'GBP'};
    if(/europe|germany|france|italy|spain|ireland|netherlands/.test(s))return{symbol:'€',code:'EUR'};
    return{symbol:'$',code:'USD'};
  }
  function formatSamplePrice(n,d,kind='product'){
    if(!n)return kind==='service'?'Free enquiry':'Enquire for price';
    const c=currencyInfo(d.location), isIndia=c.code==='INR';
    if(isIndia && n>=100000){const lakh=(n/100000);return `From ₹${Number.isInteger(lakh)?lakh:lakh.toFixed(1)} Lakh`;}
    if(isIndia && d.category==='Construction' && n<5000 && kind==='service')return `From ₹${n.toLocaleString('en-IN')}/sq.ft`;
    const val=isIndia?n.toLocaleString('en-IN'):n.toLocaleString('en-US');
    return `From ${c.symbol}${val}`;
  }
  function splitNames(raw=''){
    return String(raw).split(/,|\/|\||\band\b|\n/gi).map(x=>x.trim().replace(/^(?:we|also|provide|offer|sell|selling|services?|products?|include|including)\s+/i,'')).filter(x=>x.length>=2&&x.length<=55&&!/^(the|our|a|an|for|customers?)$/i.test(x));
  }
  function extractMentioned(description,kind){
    const text=String(description||'').replace(/\s+/g,' ').trim();
    const patterns=kind==='product'?
      [/(?:sell|selling|products?|stock|speciali[sz]e in)\s*[:\-]?\s*(.+?)(?=\.|;|\bservices?\b|\bwe also\b|$)/i,/(?:products? include|we have)\s*[:\-]?\s*(.+?)(?=\.|;|$)/i]:
      [/(?:services? include|services?|offer|offering|provide|providing)\s*[:\-]?\s*(.+?)(?=\.|;|\bproducts?\b|\bwe also\b|$)/i,/(?:we also)\s+(.+?)(?=\.|;|$)/i];
    for(const re of patterns){const m=text.match(re);if(m&&m[1]){const out=splitNames(m[1]);if(out.length)return out.slice(0,6).map(titleCase);}}
    return [];
  }
  function inferredOfferItems(d,kind){
    const cat=sampleCatalog[d.category]||sampleCatalog[visualCategory(d)]||sampleCatalog.Other;
    const source=kind==='product'?cat.products:cat.services;
    const extracted=extractMentioned(d.description,kind);
    const wanted=[];
    extracted.forEach((name,i)=>wanted.push({title:name,basePrice:source[i%source.length]?.[1]||((i+1)*999)}));
    source.forEach(([name,price])=>{if(wanted.length<4&&!wanted.some(x=>x.title.toLowerCase()===name.toLowerCase()))wanted.push({title:name,basePrice:price});});
    return wanted.slice(0,4).map((it,i)=>({
      title:it.title,
      description:naturalOfferDescription(it.title,kind,d,i),
      meta:formatSamplePrice(it.basePrice,d,kind),
      image:mediaForBusiness(d,(kind==='service'?5:1)+i,1200),
      imageKeyword:`${d.category} ${it.title}`
    }));
  }
  function autoLogoDataUri(name,primary='#173b5c',accent='#f57c00'){
    const words=String(name||'Business').trim().split(/\s+/).filter(Boolean);const initials=(words[0]?.[0]||'B')+(words.length>1?(words[words.length-1]?.[0]||''):'');
    const safeName=String(name||'Business').replace(/[&<>"']/g,'');
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="420" height="120" viewBox="0 0 420 120"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${primary}"/><stop offset="1" stop-color="${accent}"/></linearGradient></defs><rect width="420" height="120" rx="24" fill="white"/><rect x="8" y="8" width="104" height="104" rx="26" fill="url(#g)"/><text x="60" y="75" text-anchor="middle" font-family="Arial,sans-serif" font-weight="800" font-size="44" fill="white">${initials.toUpperCase()}</text><text x="132" y="69" font-family="Arial,sans-serif" font-weight="800" font-size="26" fill="${primary}">${safeName.slice(0,24)}</text><text x="132" y="92" font-family="Arial,sans-serif" font-size="14" fill="#667085">Starter logo · editable</text></svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  function localGenerate(d) {
    const cfg = safeCategoryConfig(d.category);
    const variation = Math.max(0,Number(d.variationIndex||0));
    const styleKey = d.style.toLowerCase();
    const audience = d.idealCustomer || d.audiences.join(', ') || 'customers who need a clear and reliable solution';
    const goals = d.goals.length ? d.goals : [d.businessType==='Products'?'Sell products':d.businessType==='Services'?'Receive enquiries':'Generate leads'];
    const primaryGoal = goals[0];
    const palette = d.colorPreference === 'Custom' ? [d.primaryColor || '#173b5c', d.accentColor || '#f57c00'] : (colorMap[d.colorPreference] || colorMap['Suggested by AI']);
    const products=inferredOfferItems(d,'product'), services=inferredOfferItems(d,'service');
    const includeProducts=['Products + Services','Products'].includes(d.businessType);
    const includeServices=['Products + Services','Services'].includes(d.businessType);
    const primaryName=(includeProducts?products[0]?.title:services[0]?.title)||cfg.noun;
    const businessSummary=naturalAboutCopy(d);
    const sections=[];
    if(includeProducts)sections.push({type:'products',title:'Featured Products',intro:`Browse a selection of products from ${d.businessName}. Enquire directly for availability, variants and current pricing.`,items:products});
    if(includeServices)sections.push({type:'services',title:'Services',intro:`Explore the main services available from ${d.businessName} and get in touch to discuss the right option for your requirement.`,items:services});
    if(d.businessType==='Portfolio / Information'||(!includeProducts&&!includeServices))sections.push({type:'portfolio',title:cfg.sections[0],intro:`A clear showcase of what ${d.businessName} does, who it helps and how customers can get in touch.`,items:services.slice(0,3)});
    sections.push({type:'benefits',title:`Why Choose ${d.businessName}`,intro:`A simple overview that helps customers understand the business and take the next step with confidence.`,items:[
      {title:'Easy to explore',description:`Customers can quickly see the main products and services available from ${d.businessName}.`,meta:'Clear choices',image:mediaForBusiness(d,8,1200)},
      {title:'Easy to enquire',description:`Customers can contact ${d.businessName} by phone, WhatsApp or email to ask questions before deciding.`,meta:'Direct contact',image:mediaForBusiness(d,9,1200)},
      {title:d.location?`Serving ${d.location}`:'Local customer focus',description:d.location?`${d.businessName} is based in ${d.location}. Contact the business to confirm availability or service coverage for your area.`:'Contact the business to confirm the areas it serves.',meta:'Local enquiries',image:mediaForBusiness(d,10,1200)}]});
    sections.push({type:'about',title:`About ${d.businessName}`,intro:businessSummary,items:[]});
    const seo=pageSeo('Home',d,d.businessName);
    const heroHeadings=[`${d.businessName}${d.location ? ' in '+d.location : ''}`,`Discover ${d.businessName}${d.location?' in '+d.location:''}`,`${primaryName} and more from ${d.businessName}`,`A better way to explore ${d.businessName}`,`Explore what ${d.businessName} offers${d.location?' in '+d.location:''}`];
    const heroExtras=[d.location?`Explore the products and services available in ${d.location}, then contact the business for the latest details.`:'Explore the main offerings and contact the business for current details.',`Browse the main options, compare what fits your needs and contact ${d.businessName} for current availability and pricing.`,`See the products, services and useful business information customers need before making an enquiry.`,`Start with the most relevant offerings, then contact ${d.businessName} directly when you are ready to ask about availability or pricing.`,`A clear, customer-friendly website concept built around the business information you provided.`];
    return {
      brand:{name:d.businessName, tagline:`${d.category}${d.location ? ' in '+d.location : ''}`, intro:fallbackCopy[styleKey] || fallbackCopy.modern, primary:palette[0], accent:palette[1]},
      seo,
      hero:{eyebrow:`${d.category}${d.location ? ' · '+d.location : ''}`, heading:heroHeadings[variation%heroHeadings.length], subheading:`${tidyText(d.description,180)} ${heroExtras[variation%heroExtras.length]}`.trim(), primaryCta:cfg.action, secondaryCta:includeProducts?'View Products':includeServices?'Explore Services':'Learn More'},
      sections,
      contact:{phone:d.phone,whatsapp:d.whatsapp,email:d.email,address:d.address || d.location},
      visualLabel:cfg.visual,
      style:d.style
    };
  }

  async function getNonce() {
    if (location.protocol === 'file:') return '';
    try { const r = await fetch('api/ai-generate.php?action=nonce',{credentials:'same-origin'}); const j = await r.json(); if (j.ok) state.nonce = j.nonce || ''; } catch (_) {}
    return state.nonce;
  }

  async function aiGenerate(d) {
    if (location.protocol === 'file:') throw new Error('Local file mode');
    if (!state.nonce) await getNonce();
    const payload = {...d, logoData:'', offers:[], regenerationMode:d.regenerationMode||'', variationIndex:Number(d.variationIndex||0)};
    const form = new FormData(); form.set('nonce',state.nonce); form.set('payload',JSON.stringify(payload));
    const r = await fetch('api/ai-generate.php',{method:'POST',body:form,credentials:'same-origin'});
    const j = await r.json().catch(()=>({ok:false,message:'Invalid server response'}));
    if (!r.ok || !j.ok || !j.concept) throw new Error(j.message || 'AI generation unavailable');
    state.mode = j.mode || 'ai';
    return j.concept;
  }

  const tasks = $$('.ai-generation-task');
  const genProgress = $('#aiGenProgress span');
  let taskTimer;
  function startGenerationUI() {
    $('#aiWizard').hidden = true; $('#aiGeneration').classList.add('is-active'); $('#aiResult').classList.remove('is-active');
    tasks.forEach(t=>t.classList.remove('is-active','is-done'));
    let i=0; genProgress.style.width='5%';
    const advance = () => {
      tasks.forEach((t,idx)=>{ t.classList.toggle('is-done', idx<i); t.classList.toggle('is-active', idx===i); });
      genProgress.style.width = `${Math.min(94, 10 + i*(84/Math.max(1,tasks.length-1)))}%`;
      i = Math.min(tasks.length-1, i+1);
    };
    advance(); taskTimer=setInterval(advance,650);
  }
  function finishGenerationUI() {
    clearInterval(taskTimer); tasks.forEach(t=>{t.classList.remove('is-active');t.classList.add('is-done');}); genProgress.style.width='100%';
  }

  async function runGeneration(){
    if(!validateStep(1))return;
    const d=getFormData();state.data=d;state.generationIndex=0;state.previousGeneration=null;syncRegenerateControls();startGenerationUI();
    let concept,mode='local';
    try{concept=await aiGenerate(d);mode=state.mode;}catch(_){concept=localGenerate(d);mode='local';}
    state.concept=normalizeConcept(concept,d);state.mode=mode;finishGenerationUI();state.site=null;initEditorModel();
    setTimeout(()=>{ $('#aiGeneration').classList.remove('is-active'); $('#aiResult').classList.add('is-active'); $('#resultMode').textContent = `${state.site.pages.length}-page ultra-premium editable website`; hydrateCustomizer(); renderPreview(); $('#aiResult').scrollIntoView({behavior:'smooth',block:'start'}); },520);
  }
  $('#generateWebsite')?.addEventListener('click', runGeneration);
  $('#quickGenerateWebsite')?.addEventListener('click', runGeneration);

  function normalizeConcept(c,d) {
    const fallback = localGenerate(d);
    const merged = {
      brand:{...fallback.brand,...(c?.brand||{})}, seo:{...fallback.seo,...(c?.seo||{})}, hero:{...fallback.hero,...(c?.hero||{})},
      sections:Array.isArray(c?.sections)&&c.sections.length ? c.sections : fallback.sections,
      contact:{...fallback.contact,...(c?.contact||{})}, visualLabel:c?.visualLabel||fallback.visualLabel, style:c?.style||d.style
    };
    merged.sections = merged.sections.slice(0,8).map((s,si)=>({
      type:s.type||'content',title:s.title||'Section',intro:s.intro||'',
      items:Array.isArray(s.items)?s.items.slice(0,12).map((it,i)=>({...it,image:it.image||mediaForBusiness(d,si*4+i+1,1200)})):[]
    }));
    return merged;
  }

  function deepClone(v){return JSON.parse(JSON.stringify(v));}
  function uid(prefix='id'){return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;}
  function validHex(v){return /^#[0-9a-f]{6}$/i.test(v||'');}
  function getPath(obj,path){return String(path).split('.').reduce((o,k)=>o==null?undefined:o[k],obj);}
  function setPath(obj,path,value){const keys=String(path).split('.');let o=obj;keys.slice(0,-1).forEach(k=>{if(o[k]==null)o[k]={};o=o[k];});o[keys[keys.length-1]]=value;}
  function editorEscapeAttr(v=''){return escapeHTML(String(v)).replace(/`/g,'&#96;');}
  function generatedImage(index,width=1200){return mediaForBusiness(state.data||{},index,width);}

  function convertSection(s,idx){
    const isAbout=s.type==='about'||!s.items?.length;
    if(isAbout){return {id:uid('section'),type:'about',eyebrow:state.data.category||'About',title:s.title||'About Us',text:s.intro||'',text2:state.concept?.brand?.intro||'',image:generatedImage(idx+4),background:idx%2?'soft':'white',layout:'split'};}
    return {id:uid('section'),type:'cards',offerKind:s.type==='products'?'product':s.type==='services'?'service':'mixed',eyebrow:state.data.category||'Services',title:s.title||'What We Offer',text:s.intro||'',background:idx%2?'soft':'white',layout:'grid3',items:(s.items||[]).map((it,i)=>({id:uid('item'),title:it.title||`Item ${i+1}`,description:it.description||'',meta:it.meta||'',image:it.image||generatedImage(idx*4+i+1)}))};
  }


  function premiumProfile(d={}){
    const cat=visualCategory(d);
    const map={
      'Restaurant':{page:'Menu',kind:'product',title:'Signature Menu',layout:'immersive'},
      'E-commerce':{page:'Collections',kind:'product',title:'Featured Collections',layout:'editorial'},
      'Fashion':{page:'Collections',kind:'product',title:'Curated Collections',layout:'immersive'},
      'Real Estate':{page:'Properties',kind:'product',title:'Featured Properties',layout:'immersive'},
      'Agency':{page:'Capabilities',kind:'service',title:'Capabilities',layout:'editorial'},
      'Salon & Beauty':{page:'Packages',kind:'service',title:'Beauty Packages',layout:'immersive'},
      'Healthcare':{page:'Care Services',kind:'service',title:'Care & Consultation',layout:'editorial'},
      'Wellness':{page:'Treatments',kind:'service',title:'Treatments & Wellness',layout:'immersive'},
      'Fitness':{page:'Programs',kind:'service',title:'Fitness Programs',layout:'editorial'},
      'Education':{page:'Courses',kind:'service',title:'Courses & Programs',layout:'editorial'},
      'Construction':{page:'Project Types',kind:'service',title:'Project Types',layout:'immersive'},
      'Professional Services':{page:'Expertise',kind:'service',title:'Areas of Expertise',layout:'editorial'},
      'Technology':{page:'Solutions',kind:'service',title:'Digital Solutions',layout:'editorial'},
      'Portfolio':{page:'Work',kind:'mixed',title:'Selected Work',layout:'immersive'},
      'Freelancer':{page:'Work',kind:'mixed',title:'Selected Work',layout:'immersive'},
      'Travel':{page:'Packages',kind:'product',title:'Travel Packages',layout:'immersive'}
    };
    return map[cat]||map[d.category]||{page:'Offerings',kind:'mixed',title:'Popular Offerings',layout:'editorial'};
  }

  function premiumHero(pageName,title,text,index=0,layout='editorial'){
    const d=state.data||{};
    return {id:uid('section'),type:'hero',eyebrow:`${pageName}${d.location?' · '+d.location:''}`,title,text,primaryCta:pageName==='Contact'?'Send an Enquiry':state.concept?.hero?.primaryCta||'Get Started',secondaryCta:pageName==='Home'?(state.concept?.hero?.secondaryCta||'Explore More'):'Explore '+pageName,image:generatedImage(index,1800),background:'gradient',layout};
  }

  function premiumTrust(){
    const d=state.data||{},b=state.site?.brand?.name||d.businessName||'the business',loc=locLabel(d);
    return {id:uid('section'),type:'trustbar',background:'white',layout:'grid3',items:[
      {id:uid('item'),title:'Clear choices',description:'Explore products, services and next steps without unnecessary complexity.'},
      {id:uid('item'),title:'Direct enquiries',description:`Contact ${b} by phone, WhatsApp or email to confirm availability and pricing.`},
      {id:uid('item'),title:`Serving ${loc}`,description:'Confirm delivery, service coverage or appointment availability directly with the business.'}
    ]};
  }

  function premiumSpotlight(title='A clearer way to choose',index=7){
    const d=state.data||{},b=state.site?.brand?.name||d.businessName||'the business';
    return {id:uid('section'),type:'spotlight',eyebrow:'Why It Works',title,text:`Help visitors move naturally from discovering ${b} to choosing an option and making an enquiry.`,cta:state.site?.brand?.navCta||state.concept?.hero?.primaryCta||'Contact Us',image:generatedImage(index,1600),background:'soft',layout:'split',items:[
      {id:uid('item'),title:'Understand the offer quickly',description:'Important products, services and business information are organized into clear sections.'},
      {id:uid('item'),title:'Compare before enquiring',description:'Descriptions, images and sample pricing help visitors shortlist what they want to ask about.'},
      {id:uid('item'),title:'Take the next step easily',description:'Clear calls to action lead naturally to phone, WhatsApp or enquiry.'}
    ]};
  }

  function premiumBento(title='Featured Highlights',items=null){
    const d=state.data||{};
    let list=items||[...inferredOfferItems(d,'product').slice(0,2),...inferredOfferItems(d,'service').slice(0,2)];
    if(!list.length)list=[itemDefault('cards',1),itemDefault('cards',2),itemDefault('cards',3),itemDefault('cards',4)];
    return {id:uid('section'),type:'bento',eyebrow:'Highlights',title,text:'A visual overview of the products, services or experiences visitors are most likely to explore first.',background:'white',layout:'bento',items:list.slice(0,6).map((it,i)=>({id:it.id||uid('item'),title:it.title||`Highlight ${i+1}`,description:it.description||'',meta:it.meta||'',image:it.image||generatedImage(i+1)}))};
  }

  function premiumGallery(title='Gallery',count=6){
    const d=state.data||{};
    const names=[...inferredOfferItems(d,'product'),...inferredOfferItems(d,'service')].map(x=>x.title);
    return {id:uid('section'),type:'gallery',eyebrow:'Gallery',title,text:'Replace these sample visuals with real business, product, service or project photography before publishing.',background:'white',items:Array.from({length:count},(_,i)=>({id:uid('item'),title:names[i%Math.max(names.length,1)]||`Business highlight ${i+1}`,image:generatedImage(i+1,1400)}))};
  }

  function premiumProcess(){
    return {id:uid('section'),type:'process',eyebrow:'How It Works',title:'From Interest to Enquiry',text:'A simple journey helps visitors understand what to do after they find something they like.',background:'soft',items:[
      {id:uid('item'),title:'Explore your options',description:'Browse the products, services, packages or information relevant to your requirement.'},
      {id:uid('item'),title:'Shortlist what fits',description:'Review descriptions, imagery and sample pricing to identify what you want to ask about.'},
      {id:uid('item'),title:'Contact the business',description:'Confirm availability, final pricing and the next step by phone, WhatsApp or email.'}
    ]};
  }

  function premiumFaq(count=6){
    const d=state.data||{},b=state.site?.brand?.name||d.businessName||'the business',loc=locLabel(d);
    const items=[
      ['How do I enquire about a product or service?',`Use the phone, WhatsApp or email details on this website and mention what you are interested in. ${b} can then confirm availability and the next step.`],
      ['Are the prices shown final?','Any AI-generated prices are editable sample values. Replace them with the business’s actual prices before publishing and confirm current pricing for enquiries.'],
      [`Do you serve customers in ${loc}?`,`The business is shown as being based in ${loc}. Contact ${b} to confirm delivery, service coverage or appointment availability for your exact location.`],
      ['Can I ask for a custom requirement?','Yes. Use the enquiry options to describe what you need so the business can confirm whether a suitable option is available.'],
      ['What should I include in my enquiry?','Mention the product or service, your location, preferred timing and any important requirement so the business can respond more efficiently.'],
      ['What is the fastest way to get in touch?','Use the phone or WhatsApp details shown on the website for a direct enquiry, or email when you need to share more detailed information.']
    ];
    return {id:uid('section'),type:'faq',eyebrow:'FAQ',title:'Questions Customers Often Ask',text:`Helpful answers for people considering ${b}. Review and edit them before publishing.`,background:'soft',items:items.slice(0,count).map(([title,description])=>({id:uid('item'),title,description}))};
  }

  function premiumSpecialSection(){
    const d=state.data||{},profile=premiumProfile(d);
    let items=profile.kind==='product'?inferredOfferItems(d,'product'):profile.kind==='service'?inferredOfferItems(d,'service'):[...inferredOfferItems(d,'product').slice(0,2),...inferredOfferItems(d,'service').slice(0,2)];
    return {id:uid('section'),type:'cards',offerKind:profile.kind==='product'?'product':profile.kind==='service'?'service':'mixed',eyebrow:profile.page,title:profile.title,text:`Explore the main ${profile.page.toLowerCase()} from ${d.businessName||'the business'} and contact the business for current availability and final pricing.`,background:'white',layout:'grid2',items:items.map((x,i)=>({id:uid('item'),...x,image:x.image||generatedImage(i+2)}))};
  }
  function conceptToSiteModel(){
    const c=state.concept,d=state.data,profile=premiumProfile(d);
    const brandName=c.brand.name||d.businessName;
    const converted=(c.sections||[]).map(convertSection);
    const sectionBySource=(type)=>{const idx=(c.sections||[]).findIndex(x=>x.type===type);return idx>=0?deepClone(converted[idx]):null;};
    const productSection=sectionBySource('products');
    const serviceSection=sectionBySource('services');
    const aboutSection=sectionBySource('about')||converted.find(x=>x.type==='about')||{id:uid('section'),type:'about',eyebrow:'About',title:`About ${brandName}`,text:naturalAboutCopy(d),text2:'Use this space to explain the business, what it offers and what customers should know before making an enquiry.',image:generatedImage(7),background:'white',layout:'split'};
    const contact={id:uid('section'),type:'contact',eyebrow:'Contact',title:`Talk to ${brandName}`,text:`Tell ${brandName} what you are looking for and confirm availability, current pricing or the next step directly.`,cta:c.hero.primaryCta||'Send an Enquiry',background:'dark',layout:'split'};
    const makePage=(id,name,sections)=>({id,name,slug:id==='home'?'':slug(name),seo:pageSeo(name,d,brandName),sections});
    const pageHero=(name,title,index,layout='center')=>premiumHero(name,title,naturalPageDescription(name,d,brandName),index,layout);
    const products=productSection?deepClone(productSection):null;
    const services=serviceSection?deepClone(serviceSection):null;
    if(products){products.layout='grid2';products.eyebrow='Featured Products';products.background='white';products.offerKind='product';}
    if(services){services.layout='grid2';services.eyebrow='Services';services.background='soft';services.offerKind='service';}

    const home=[
      {id:uid('section'),type:'hero',eyebrow:c.hero.eyebrow||`${d.category}${d.location?' · '+d.location:''}`,title:c.hero.heading||brandName,text:c.hero.subheading||naturalPageDescription('Home',d,brandName),primaryCta:c.hero.primaryCta||'Get Started',secondaryCta:c.hero.secondaryCta||(products?'View Products':services?'Explore Services':'Learn More'),image:generatedImage(0,1800),background:'gradient',layout:profile.layout},
      premiumTrust()
    ];
    if(products)home.push(products);
    if(services)home.push(services);
    home.push(premiumBento(`Explore ${brandName}`));
    home.push({...deepClone(aboutSection),eyebrow:'About',background:'white',layout:'split'});
    home.push(premiumSpotlight(`Why explore ${brandName}`,8));
    home.push(premiumProcess());
    home.push(premiumGallery('A Closer Look',5));
    home.push(premiumFaq(4));
    home.push(contact);

    const pages=[makePage('home','Home',home)];
    pages.push(makePage(uid('page'),'About',[pageHero('About',`More About ${brandName}`,5,'center'),deepClone(aboutSection),premiumTrust(),premiumSpotlight(`What customers can expect from ${brandName}`,7),premiumProcess(),premiumGallery(`Inside ${brandName}`,4),sectionDefault('cta')]));
    if(products)pages.push(makePage(uid('page'),'Products',[pageHero('Products',`Explore Products from ${brandName}`,1,'editorial'),premiumTrust(),deepClone(products),premiumBento('Featured Product Highlights',products.items),premiumSpotlight('Need help choosing the right option?',2),premiumFaq(5),sectionDefault('cta')]));
    if(services)pages.push(makePage(uid('page'),'Services',[pageHero('Services',`Services from ${brandName}`,5,'editorial'),premiumTrust(),deepClone(services),premiumProcess(),premiumSpotlight('A clear service journey from enquiry to next step',6),premiumFaq(5),sectionDefault('cta')]));
    if(profile.page!=='Offerings'&&!pages.some(pg=>pg.name.toLowerCase()===profile.page.toLowerCase())){
      const sec=premiumSpecialSection();
      pages.push(makePage(uid('page'),profile.page,[pageHero(profile.page,`${profile.page} from ${brandName}`,3,profile.layout),premiumTrust(),sec,premiumBento(`Explore ${profile.page}`,sec.items),premiumSpotlight(`Find the right ${profile.page.toLowerCase()} for your needs`,4),premiumFaq(4),sectionDefault('cta')]));
    }
    let galleryName=['Portfolio','Freelancer','Agency'].includes(visualCategory(d))?'Work':'Gallery';
    if(pages.some(pg=>pg.name.toLowerCase()===galleryName.toLowerCase()))galleryName='Gallery';
    pages.push(makePage(uid('page'),galleryName,[pageHero(galleryName,`${galleryName} from ${brandName}`,4,'immersive'),premiumGallery(`Explore ${brandName}`,8),premiumBento('Featured Highlights'),sectionDefault('cta')]));
    pages.push(makePage(uid('page'),'FAQ',[pageHero('FAQ',`Questions About ${brandName}`,8,'center'),premiumFaq(6),premiumTrust(),deepClone(contact)]));
    pages.push(makePage(uid('page'),'Contact',[pageHero('Contact',`Contact ${brandName}`,9,'center'),deepClone(contact),premiumTrust(),premiumFaq(3)]));

    return {
      brand:{name:brandName,tagline:c.brand.tagline||'',logo:state.logoData||autoLogoDataUri(brandName,validHex(c.brand.primary)?c.brand.primary:'#173b5c',validHex(c.brand.accent)?c.brand.accent:'#f57c00'),navCta:c.hero.primaryCta||'Contact Us'},
      style:{primary:validHex(c.brand.primary)?c.brand.primary:'#173b5c',accent:validHex(c.brand.accent)?c.brand.accent:'#f57c00',background:'#ffffff',text:'#17202b',font:'Inter, Arial, sans-serif',radius:22,spacing:64,maxWidth:1240,buttonStyle:'rounded'},
      contact:{phone:c.contact.phone||'',whatsapp:c.contact.whatsapp||'',email:c.contact.email||'',address:c.contact.address||''},
      social:{instagram:'',facebook:'',youtube:'',linkedin:''},
      commerce:{enabled:true,accountEnabled:true,wishlistEnabled:true,cartEnabled:true},
      seo:pageSeo('Home',d,brandName),pages,
      footer:{headline:brandName,text:`${c.brand.tagline||d.category}${d.location?' · '+d.location:''}. Explore the website and contact the business directly for current details.`,copyright:`© ${new Date().getFullYear()} ${brandName}. All rights reserved.`}
    };
  }

  function generationSnapshot(){
    return state.site ? {site:deepClone(state.site),originalSite:deepClone(state.originalSite||state.site),concept:deepClone(state.concept),activePageId:state.activePageId,mode:state.mode,generationIndex:state.generationIndex} : null;
  }
  function restoreGenerationSnapshot(snap){
    if(!snap)return;
    state.site=deepClone(snap.site);state.originalSite=deepClone(snap.originalSite||snap.site);state.concept=deepClone(snap.concept);state.activePageId=snap.activePageId||'home';state.mode=snap.mode||state.mode;state.generationIndex=Number(snap.generationIndex||0);state.history=[];state.future=[];ensureActivePage();renderPreview();hydrateCustomizer();syncUndoRedo();syncRegenerateControls();
  }
  function syncRegenerateControls(){
    const r=$('#restorePreviousGeneration');if(r)r.hidden=!state.previousGeneration;
  }
  function generatedMedia(src=''){return /^https:\/\/images\.pexels\.com\//i.test(String(src));}
  function applyDesignVariation(site,variant=1){
    if(!site)return site;
    const v=Math.max(1,Number(variant)||1);
    const presets=[
      {font:'Inter, Arial, sans-serif',radius:18,spacing:58,maxWidth:1240,buttonStyle:'rounded'},
      {font:'Poppins, Arial, sans-serif',radius:26,spacing:72,maxWidth:1320,buttonStyle:'pill'},
      {font:"Georgia, 'Times New Roman', serif",radius:8,spacing:78,maxWidth:1180,buttonStyle:'square'},
      {font:"'Trebuchet MS', Arial, sans-serif",radius:30,spacing:62,maxWidth:1320,buttonStyle:'rounded'},
      {font:'Inter, Arial, sans-serif',radius:12,spacing:84,maxWidth:1040,buttonStyle:'square'}
    ];
    const preset=presets[v%presets.length];Object.assign(site.style,preset);
    const paletteSets=[['#173b5c','#f57c00'],['#102a43','#2f80ed'],['#2b213a','#c18b4a'],['#14352f','#d9843d'],['#252525','#d6a85f']];
    if((state.data?.colorPreference||'Suggested by AI')==='Suggested by AI'){
      const pal=paletteSets[v%paletteSets.length];site.style.primary=pal[0];site.style.accent=pal[1];
    }
    const heroLayouts=['editorial','immersive','center','split','editorial'];
    const cardLayouts=['grid2','bento','grid3','editorial','list'];
    const sectionBgs=['white','soft','white','gradient','soft'];
    site.pages.forEach((p,pi)=>{
      p.sections.forEach((sec,si)=>{
        if(sec.type==='hero')sec.layout=heroLayouts[(v+pi)%heroLayouts.length];
        else if(['cards','bento','spotlight','about'].includes(sec.type))sec.layout=cardLayouts[(v+pi+si)%cardLayouts.length];
        if(!['contact','cta','hero'].includes(sec.type))sec.background=sectionBgs[(v+si)%sectionBgs.length];
        if(sec.image&&generatedMedia(sec.image))sec.image=generatedImage(v*7+pi*4+si+1,sec.type==='hero'?1800:1400);
        (sec.items||[]).forEach((it,ii)=>{if(it.image&&generatedMedia(it.image))it.image=generatedImage(v*9+pi*5+si*3+ii+1,1200);});
      });
    });
    const home=site.pages.find(p=>p.id==='home');
    if(home&&home.sections.length>4){
      const hero=home.sections.find(s=>s.type==='hero');const end=home.sections.filter(s=>['contact','cta'].includes(s.type));
      const middle=home.sections.filter(s=>s!==hero&&!end.includes(s));
      const priorities=[
        ['trustbar','cards','bento','about','spotlight','process','gallery','faq'],
        ['trustbar','about','bento','cards','spotlight','gallery','process','faq'],
        ['trustbar','spotlight','cards','about','bento','process','faq','gallery'],
        ['trustbar','bento','spotlight','cards','process','about','gallery','faq'],
        ['trustbar','about','spotlight','process','cards','bento','gallery','faq']
      ][v%5];
      middle.sort((a,b)=>{const ai=priorities.indexOf(a.type),bi=priorities.indexOf(b.type);return (ai<0?99:ai)-(bi<0?99:bi);});
      home.sections=[hero,...middle,...end].filter(Boolean);
    }
    if(!state.logoData)site.brand.logo=autoLogoDataUri(site.brand.name,site.style.primary,site.style.accent);
    return site;
  }
  function showRegenerateModal(){
    if(!state.site)return;
    document.querySelector('.ai-regenerate-modal')?.remove();
    const overlay=document.createElement('div');overlay.className='ai-editor-modal ai-regenerate-modal';
    overlay.innerHTML=`<div class="ai-editor-modal__panel"><div class="ai-editor-modal__head"><strong>Generate another website</strong><button type="button" data-close>×</button></div><p>Keep the same business details and try a different direction. Your current version is kept temporarily so you can restore it.</p><div class="ai-regenerate-options"><button type="button" class="ai-regenerate-option is-recommended" data-regenerate-mode="full"><b>Fresh Website Version</b><span>Generate new copy and a visibly different premium layout using the same business details.</span><em>Recommended</em></button><button type="button" class="ai-regenerate-option" data-regenerate-mode="design"><b>New Design, Same Content</b><span>Keep your current products, services, pages and text, but change layouts, imagery, spacing and styling.</span></button></div><div class="ai-regenerate-note">Any manual edits in the current version are preserved as the previous version until you regenerate again or start over.</div></div>`;
    overlay.addEventListener('click',e=>{if(e.target===overlay||e.target.closest('[data-close]'))overlay.remove();const b=e.target.closest('[data-regenerate-mode]');if(!b)return;const mode=b.dataset.regenerateMode;overlay.remove();regenerateWebsite(mode);});
    document.body.appendChild(overlay);
  }
  async function regenerateWebsite(mode='full'){
    if(!state.site)return;
    state.previousGeneration=generationSnapshot();state.generationIndex+=1;syncRegenerateControls();
    if(mode==='design'){
      state.site=applyDesignVariation(deepClone(state.site),state.generationIndex);state.originalSite=deepClone(state.site);state.activePageId='home';state.history=[];state.future=[];renderPreview();hydrateCustomizer();syncUndoRedo();$('#resultMode').textContent=`Version ${state.generationIndex+1} · new design with the same content`;$('#aiResult').scrollIntoView({behavior:'smooth',block:'start'});return;
    }
    const d={...getFormData(),regenerationMode:'fresh',variationIndex:state.generationIndex};state.data={...d};startGenerationUI();
    try{state.concept=normalizeConcept(await aiGenerate(d),d);state.mode='ai';}catch(_){state.concept=localGenerate(d);state.mode='local';}
    finishGenerationUI();state.site=null;initEditorModel();state.site=applyDesignVariation(state.site,state.generationIndex);state.originalSite=deepClone(state.site);
    setTimeout(()=>{$('#aiGeneration').classList.remove('is-active');$('#aiResult').classList.add('is-active');$('#resultMode').textContent=`Version ${state.generationIndex+1} · ${state.site.pages.length}-page editable website`;hydrateCustomizer();renderPreview();syncRegenerateControls();$('#aiResult').scrollIntoView({behavior:'smooth',block:'start'});},420);
  }

  function initEditorModel(){
    state.site=conceptToSiteModel();
    state.originalSite=deepClone(state.site);
    state.activePageId='home'; state.editMode=true; state.history=[]; state.future=[];
  }

  function currentPage(){return state.site?.pages?.find(p=>p.id===state.activePageId)||state.site?.pages?.[0];}
  function pageIndex(){return Math.max(0,state.site.pages.findIndex(p=>p.id===state.activePageId));}
  function snapshot(){return deepClone(state.site);}
  function commitHistory(before){
    if(!before||JSON.stringify(before)===JSON.stringify(state.site))return;
    state.history.push(before); if(state.history.length>30)state.history.shift(); state.future=[]; syncUndoRedo();
  }
  function checkpoint(){const before=snapshot();state.history.push(before);if(state.history.length>30)state.history.shift();state.future=[];syncUndoRedo();}
  function undo(){if(!state.history.length)return;state.future.push(snapshot());state.site=state.history.pop();ensureActivePage();renderPreview();hydrateCustomizer();syncUndoRedo();}
  function redo(){if(!state.future.length)return;state.history.push(snapshot());state.site=state.future.pop();ensureActivePage();renderPreview();hydrateCustomizer();syncUndoRedo();}
  function syncUndoRedo(){const u=$('#editorUndo'),r=$('#editorRedo');if(u)u.disabled=!state.history.length;if(r)r.disabled=!state.future.length;}
  function ensureActivePage(){if(!state.site.pages.some(p=>p.id===state.activePageId))state.activePageId=state.site.pages[0]?.id||'home';}

  function editable(path,value,opts={}){
    const tag=opts.tag||'span',cls=opts.className||'',multi=opts.multiline?'true':'false';
    return `<${tag} class="ai-inline-editable ${cls}" data-edit-path="${editorEscapeAttr(path)}" data-multiline="${multi}"><span class="ai-edit-value" ${state.editMode?'contenteditable="true" spellcheck="true"':''}>${escapeHTML(value||'')}</span>${state.editMode?'<button type="button" class="ai-pencil" title="Edit text" aria-label="Edit text">✎</button>':''}</${tag}>`;
  }
  function imageEditor(path,src,label,className=''){
    const content=src?`<img src="${editorEscapeAttr(src)}" alt="${editorEscapeAttr(label)}">`:`<div class="ai-image-placeholder"><span>${escapeHTML(label)}</span></div>`;
    return `<div class="ai-image-edit ${className}" data-image-path="${editorEscapeAttr(path)}">${content}${state.editMode?'<button type="button" class="ai-replace-image">Replace image</button>':''}</div>`;
  }
  function sectionTools(si,type){
    if(!state.editMode)return '';
    const addable=['cards','bento','trustbar','spotlight','gallery','testimonials','stats','process','faq'].includes(type);
    return `<details class="ai-section-tools" aria-label="Section tools"><summary title="Section options">Section</summary><div class="ai-section-tools__menu">
      <button type="button" data-editor-action="move-up" data-section="${si}" title="Move section up">↑ Move up</button>
      <button type="button" data-editor-action="move-down" data-section="${si}" title="Move section down">↓ Move down</button>
      <button type="button" data-editor-action="duplicate-section" data-section="${si}" title="Duplicate section">Duplicate</button>
      <button type="button" data-editor-action="cycle-layout" data-section="${si}" title="Change section layout">Change layout</button>
      <button type="button" data-editor-action="cycle-bg" data-section="${si}" title="Change background">Background</button>
      ${addable?`<button type="button" data-editor-action="add-item" data-section="${si}" title="Add another item">+ Add item</button>`:''}
      <button type="button" class="danger" data-editor-action="remove-section" data-section="${si}" title="Remove section">Remove section</button>
    </div></details>`;
  }

  function itemTools(si,ii){return state.editMode?`<details class="ai-item-tools"><summary title="Item options">•••</summary><div class="ai-item-tools__menu"><button type="button" data-editor-action="duplicate-item" data-section="${si}" data-item="${ii}">Duplicate</button><button type="button" class="danger" data-editor-action="remove-item" data-section="${si}" data-item="${ii}">Remove</button></div></details>`:'';}

  function renderHero(s,pi,si){const b=`pages.${pi}.sections.${si}`;return `<section class="ai-site-hero ai-edit-section bg-${s.background||'gradient'} layout-${s.layout||'split'}" data-section-index="${si}">${sectionTools(si,s.type)}<div class="ai-site-hero__copy">${editable(`${b}.eyebrow`,s.eyebrow,{tag:'small'})}${editable(`${b}.title`,s.title,{tag:'h1'})}${editable(`${b}.text`,s.text,{tag:'p',multiline:true})}<div class="ai-site-hero__actions">${editable(`${b}.primaryCta`,s.primaryCta,{tag:'span',className:'primary'})}${editable(`${b}.secondaryCta`,s.secondaryCta,{tag:'span',className:'secondary'})}</div></div>${imageEditor(`${b}.image`,s.image,'Hero image','ai-site-visual')}</section>`;}

  function renderCards(s,pi,si){
    const b=`pages.${pi}.sections.${si}`,kind=s.offerKind||'mixed';
    const actionHtml=(it,ii)=>{
      if(kind==='product')return `<div class="ai-commerce-actions"><button type="button" class="ai-shop-btn primary" data-commerce-action="buy" data-section="${si}" data-item="${ii}">Buy Now</button><button type="button" class="ai-shop-btn" data-commerce-action="add-cart" data-section="${si}" data-item="${ii}">Add to Cart</button><button type="button" class="ai-shop-save" data-commerce-action="wishlist-item" data-section="${si}" data-item="${ii}" aria-label="Save ${editorEscapeAttr(it.title||'product')} for later">♡ Save</button></div>`;
      if(kind==='service')return `<div class="ai-commerce-actions service"><button type="button" class="ai-shop-btn primary" data-commerce-action="enquire-service" data-section="${si}" data-item="${ii}">Enquiry Now</button></div>`;
      return '';
    };
    return `<section class="ai-site-section ai-edit-section bg-${s.background||'white'} layout-${s.layout||'grid3'}" data-section-index="${si}">${sectionTools(si,s.type)}<div class="ai-site-section__head">${editable(`${b}.eyebrow`,s.eyebrow,{tag:'small'})}${editable(`${b}.title`,s.title,{tag:'h2'})}${editable(`${b}.text`,s.text,{tag:'p',multiline:true})}</div><div class="ai-site-grid">${(s.items||[]).map((it,ii)=>`<article class="ai-site-card" data-offer-kind="${kind}">${itemTools(si,ii)}${imageEditor(`${b}.items.${ii}.image`,it.image,it.title||'Item image','ai-site-card__image')}${editable(`${b}.items.${ii}.title`,it.title,{tag:'h3'})}${editable(`${b}.items.${ii}.description`,it.description,{tag:'p',multiline:true})}${editable(`${b}.items.${ii}.meta`,it.meta,{tag:'b'})}${actionHtml(it,ii)}</article>`).join('')}</div></section>`;
  }

  function renderAbout(s,pi,si){const b=`pages.${pi}.sections.${si}`;return `<section class="ai-site-section ai-edit-section bg-${s.background||'white'} layout-${s.layout||'split'}" data-section-index="${si}">${sectionTools(si,s.type)}<div class="ai-site-about">${imageEditor(`${b}.image`,s.image,'About image','ai-site-about__visual')}<div>${editable(`${b}.eyebrow`,s.eyebrow,{tag:'small'})}${editable(`${b}.title`,s.title,{tag:'h2'})}${editable(`${b}.text`,s.text,{tag:'p',multiline:true})}${editable(`${b}.text2`,s.text2,{tag:'p',multiline:true})}</div></div></section>`;}

  function renderGallery(s,pi,si){const b=`pages.${pi}.sections.${si}`;return `<section class="ai-site-section ai-edit-section bg-${s.background||'white'}" data-section-index="${si}">${sectionTools(si,s.type)}<div class="ai-site-section__head">${editable(`${b}.eyebrow`,s.eyebrow,{tag:'small'})}${editable(`${b}.title`,s.title,{tag:'h2'})}${editable(`${b}.text`,s.text,{tag:'p',multiline:true})}</div><div class="ai-generated-gallery">${(s.items||[]).map((it,ii)=>`<figure>${itemTools(si,ii)}${imageEditor(`${b}.items.${ii}.image`,it.image,it.title||'Gallery image')}${editable(`${b}.items.${ii}.title`,it.title,{tag:'figcaption'})}</figure>`).join('')}</div></section>`;}

  function renderTestimonials(s,pi,si){const b=`pages.${pi}.sections.${si}`;return `<section class="ai-site-section ai-edit-section bg-${s.background||'soft'}" data-section-index="${si}">${sectionTools(si,s.type)}<div class="ai-site-section__head">${editable(`${b}.eyebrow`,s.eyebrow,{tag:'small'})}${editable(`${b}.title`,s.title,{tag:'h2'})}${editable(`${b}.text`,s.text,{tag:'p',multiline:true})}</div><div class="ai-testimonial-grid">${(s.items||[]).map((it,ii)=>`<blockquote>${itemTools(si,ii)}${editable(`${b}.items.${ii}.description`,it.description,{tag:'p',multiline:true})}${editable(`${b}.items.${ii}.title`,it.title,{tag:'strong'})}${editable(`${b}.items.${ii}.meta`,it.meta,{tag:'small'})}</blockquote>`).join('')}</div></section>`;}

  function renderStats(s,pi,si){const b=`pages.${pi}.sections.${si}`;return `<section class="ai-site-section ai-edit-section bg-${s.background||'white'}" data-section-index="${si}">${sectionTools(si,s.type)}<div class="ai-stat-grid">${(s.items||[]).map((it,ii)=>`<div class="ai-stat">${itemTools(si,ii)}${editable(`${b}.items.${ii}.title`,it.title,{tag:'strong'})}${editable(`${b}.items.${ii}.description`,it.description,{tag:'span'})}</div>`).join('')}</div></section>`;}

  function renderProcess(s,pi,si){const b=`pages.${pi}.sections.${si}`;return `<section class="ai-site-section ai-edit-section bg-${s.background||'soft'}" data-section-index="${si}">${sectionTools(si,s.type)}<div class="ai-site-section__head">${editable(`${b}.eyebrow`,s.eyebrow,{tag:'small'})}${editable(`${b}.title`,s.title,{tag:'h2'})}${editable(`${b}.text`,s.text,{tag:'p',multiline:true})}</div><div class="ai-process-grid">${(s.items||[]).map((it,ii)=>`<div class="ai-process-step">${itemTools(si,ii)}<i>${ii+1}</i>${editable(`${b}.items.${ii}.title`,it.title,{tag:'h3'})}${editable(`${b}.items.${ii}.description`,it.description,{tag:'p',multiline:true})}</div>`).join('')}</div></section>`;}

  function renderFaq(s,pi,si){const b=`pages.${pi}.sections.${si}`;return `<section class="ai-site-section ai-edit-section bg-${s.background||'white'}" data-section-index="${si}">${sectionTools(si,s.type)}<div class="ai-site-section__head">${editable(`${b}.eyebrow`,s.eyebrow,{tag:'small'})}${editable(`${b}.title`,s.title,{tag:'h2'})}${editable(`${b}.text`,s.text,{tag:'p',multiline:true})}</div><div class="ai-faq-grid">${(s.items||[]).map((it,ii)=>`<article>${itemTools(si,ii)}${editable(`${b}.items.${ii}.title`,it.title,{tag:'h3'})}${editable(`${b}.items.${ii}.description`,it.description,{tag:'p',multiline:true})}</article>`).join('')}</div></section>`;}

  function renderText(s,pi,si){const b=`pages.${pi}.sections.${si}`;return `<section class="ai-site-section ai-edit-section bg-${s.background||'white'}" data-section-index="${si}">${sectionTools(si,s.type)}<div class="ai-rich-text">${editable(`${b}.eyebrow`,s.eyebrow,{tag:'small'})}${editable(`${b}.title`,s.title,{tag:'h2'})}${editable(`${b}.text`,s.text,{tag:'p',multiline:true})}</div></section>`;}

  function contactField(label,path,value){return `<div class="ai-contact-card"><span class="ai-contact-label">${escapeHTML(label)}</span>${editable(path,value||'Add details',{tag:'div',className:'ai-contact-value',multiline:label==='Address'})}</div>`;}
  function renderContact(s,pi,si){const b=`pages.${pi}.sections.${si}`;return `<section class="ai-site-contact ai-edit-section bg-${s.background||'dark'}" data-section-index="${si}">${sectionTools(si,s.type)}<div class="ai-site-contact__content">${editable(`${b}.title`,s.title,{tag:'h2'})}${editable(`${b}.text`,s.text,{tag:'p',multiline:true})}<div class="ai-contact-grid">${contactField('Phone','contact.phone',state.site.contact.phone)}${contactField('WhatsApp','contact.whatsapp',state.site.contact.whatsapp)}${contactField('Email','contact.email',state.site.contact.email)}${contactField('Address','contact.address',state.site.contact.address)}</div></div><div class="ai-site-contact__action">${editable(`${b}.cta`,s.cta,{tag:'span',className:'contact-cta'})}</div></section>`;}

  function renderCta(s,pi,si){const b=`pages.${pi}.sections.${si}`;return `<section class="ai-site-cta-section ai-edit-section bg-${s.background||'dark'}" data-section-index="${si}">${sectionTools(si,s.type)}${editable(`${b}.eyebrow`,s.eyebrow,{tag:'small'})}${editable(`${b}.title`,s.title,{tag:'h2'})}${editable(`${b}.text`,s.text,{tag:'p',multiline:true})}${editable(`${b}.cta`,s.cta,{tag:'span',className:'cta-button'})}</section>`;}

  function renderTrustbar(s,pi,si){const b=`pages.${pi}.sections.${si}`;return `<section class="ai-premium-trust ai-edit-section bg-${s.background||'white'}" data-section-index="${si}">${sectionTools(si,s.type)}<div class="ai-premium-trust__grid">${(s.items||[]).map((it,ii)=>`<article>${itemTools(si,ii)}<span class="ai-premium-trust__icon">${ii+1}</span><div>${editable(`${b}.items.${ii}.title`,it.title,{tag:'strong'})}${editable(`${b}.items.${ii}.description`,it.description,{tag:'p',multiline:true})}</div></article>`).join('')}</div></section>`;}

  function renderBento(s,pi,si){const b=`pages.${pi}.sections.${si}`;return `<section class="ai-site-section ai-premium-bento ai-edit-section bg-${s.background||'white'}" data-section-index="${si}">${sectionTools(si,s.type)}<div class="ai-site-section__head">${editable(`${b}.eyebrow`,s.eyebrow,{tag:'small'})}${editable(`${b}.title`,s.title,{tag:'h2'})}${editable(`${b}.text`,s.text,{tag:'p',multiline:true})}</div><div class="ai-premium-bento__grid">${(s.items||[]).map((it,ii)=>`<article class="ai-premium-bento__card ${ii===0?'is-featured':''}">${itemTools(si,ii)}${imageEditor(`${b}.items.${ii}.image`,it.image,it.title||'Highlight image','ai-premium-bento__image')}<div class="ai-premium-bento__copy">${editable(`${b}.items.${ii}.title`,it.title,{tag:'h3'})}${editable(`${b}.items.${ii}.description`,it.description,{tag:'p',multiline:true})}${it.meta!==undefined?editable(`${b}.items.${ii}.meta`,it.meta,{tag:'b'}):''}</div></article>`).join('')}</div></section>`;}

  function renderSpotlight(s,pi,si){const b=`pages.${pi}.sections.${si}`;return `<section class="ai-site-section ai-premium-spotlight ai-edit-section bg-${s.background||'soft'}" data-section-index="${si}">${sectionTools(si,s.type)}<div class="ai-premium-spotlight__wrap">${imageEditor(`${b}.image`,s.image,'Spotlight image','ai-premium-spotlight__media')}<div class="ai-premium-spotlight__copy">${editable(`${b}.eyebrow`,s.eyebrow,{tag:'small'})}${editable(`${b}.title`,s.title,{tag:'h2'})}${editable(`${b}.text`,s.text,{tag:'p',multiline:true})}<div class="ai-premium-spotlight__list">${(s.items||[]).map((it,ii)=>`<article>${itemTools(si,ii)}<span>✓</span><div>${editable(`${b}.items.${ii}.title`,it.title,{tag:'strong'})}${editable(`${b}.items.${ii}.description`,it.description,{tag:'p',multiline:true})}</div></article>`).join('')}</div>${editable(`${b}.cta`,s.cta||'Contact Us',{tag:'span',className:'cta-button'})}</div></div></section>`;}

  function renderSection(s,pi,si){switch(s.type){case'hero':return renderHero(s,pi,si);case'cards':return renderCards(s,pi,si);case'bento':return renderBento(s,pi,si);case'trustbar':return renderTrustbar(s,pi,si);case'spotlight':return renderSpotlight(s,pi,si);case'about':return renderAbout(s,pi,si);case'gallery':return renderGallery(s,pi,si);case'testimonials':return renderTestimonials(s,pi,si);case'stats':return renderStats(s,pi,si);case'process':return renderProcess(s,pi,si);case'faq':return renderFaq(s,pi,si);case'contact':return renderContact(s,pi,si);case'cta':return renderCta(s,pi,si);default:return renderText(s,pi,si);}}

  function hydrateCustomizer(){
    if(!state.site)initEditorModel();
    const s=state.site;
    const cp=currentPage();cp.seo=cp.seo||pageSeo(cp.name,state.data,s.brand.name);
    const map={customBusinessName:s.brand.name,customTagline:s.brand.tagline,customPrimaryColor:s.style.primary,customAccentColor:s.style.accent,customBackgroundColor:s.style.background,customTextColor:s.style.text,customFont:s.style.font,customRadius:String(s.style.radius),customSpacing:String(s.style.spacing),customMaxWidth:String(s.style.maxWidth),customPhone:s.contact.phone,customWhatsapp:s.contact.whatsapp,customEmail:s.contact.email,customAddress:s.contact.address,customInstagram:s.social?.instagram||'',customFacebook:s.social?.facebook||'',customYoutube:s.social?.youtube||'',customLinkedin:s.social?.linkedin||'',customPageSlug:cp.slug||'',customSeoTitle:cp.seo.title||'',customSeoDescription:cp.seo.description||''};
    Object.entries(map).forEach(([id,v])=>{const el=$('#'+id);if(el)el.value=v??'';});
    const bs=$('#customButtonStyle');if(bs)bs.value=s.style.buttonStyle||'rounded';const slugInput=$('#customPageSlug');if(slugInput)slugInput.disabled=cp.id==='home';const seoLabel=$('#customSeoPageLabel');if(seoLabel)seoLabel.textContent=`SEO for ${cp.name}`;
    const p=$('#customizerPanel');if(p)p.hidden=!state.editMode;
    const bar=$('#visualEditorBar');if(bar)bar.hidden=!state.editMode;
    const t=$('#toggleCustomizer');if(t){t.textContent=state.editMode?'Done Editing':'Edit Website';t.classList.toggle('is-active',state.editMode);}
    refreshPageSelect();syncUndoRedo();
  }

  function refreshPageSelect(){const sel=$('#editorPageSelect');if(!sel||!state.site)return;sel.innerHTML=state.site.pages.map(p=>`<option value="${editorEscapeAttr(p.id)}" ${p.id===state.activePageId?'selected':''}>${escapeHTML(p.name)}</option>`).join('');const del=$('#editorDeletePage');if(del)del.disabled=state.site.pages.length<=1||state.activePageId==='home';}


  function getOfferFromButton(btn){
    const p=currentPage(),si=Number(btn.dataset.section),ii=Number(btn.dataset.item),sec=p?.sections?.[si],it=sec?.items?.[ii];
    if(!it)return null;
    return {id:it.id||`${p.id}-${si}-${ii}`,title:it.title||'Item',description:it.description||'',meta:it.meta||'',image:it.image||'',qty:1,kind:sec.offerKind||'mixed'};
  }
  function addCart(item,qty=1){
    loadCommerceSession();const found=commerceSession.cart.find(x=>x.id===item.id);if(found)found.qty=(Number(found.qty)||1)+qty;else commerceSession.cart.push({...item,qty});saveCommerceSession();renderPreview();
  }
  function toggleWishlist(item){
    loadCommerceSession();const idx=commerceSession.wishlist.findIndex(x=>x.id===item.id);if(idx>=0)commerceSession.wishlist.splice(idx,1);else commerceSession.wishlist.push({...item,qty:1});saveCommerceSession();renderPreview();
  }
  function commerceModalBase(title,body,cls=''){
    document.querySelector('.ai-commerce-modal')?.remove();
    const overlay=document.createElement('div');overlay.className=`ai-commerce-modal ${cls}`;overlay.style.setProperty('--store-primary',state.site?.style?.primary||'#173b5c');overlay.style.setProperty('--store-accent',state.site?.style?.accent||'#f57c00');
    overlay.innerHTML=`<div class="ai-commerce-dialog"><div class="ai-commerce-dialog__head"><strong>${escapeHTML(title)}</strong><button type="button" data-commerce-close aria-label="Close">×</button></div><div class="ai-commerce-dialog__body">${body}</div></div>`;
    overlay.addEventListener('click',e=>{if(e.target===overlay||e.target.closest('[data-commerce-close]'))overlay.remove();});document.body.appendChild(overlay);return overlay;
  }
  function cartRow(x,mode='cart'){
    return `<div class="ai-cart-row" data-cart-id="${editorEscapeAttr(x.id)}">${x.image?`<img src="${editorEscapeAttr(x.image)}" alt="">`:''}<div><strong>${escapeHTML(x.title)}</strong><span>${escapeHTML(x.meta||'Confirm price')}</span>${mode==='cart'?`<div class="ai-qty"><button data-modal-action="qty-down">−</button><em>${Number(x.qty)||1}</em><button data-modal-action="qty-up">+</button></div>`:''}</div><div class="ai-cart-row__actions">${mode==='cart'?'<button data-modal-action="save-later">Save for later</button>':'<button data-modal-action="move-cart">Move to cart</button>'}<button data-modal-action="remove">Remove</button></div></div>`;
  }
  function showCart(){
    loadCommerceSession();const total=sampleTotal(commerceSession.cart);const body=commerceSession.cart.length?`${commerceSession.cart.map(x=>cartRow(x)).join('')}<div class="ai-cart-summary"><span>${total==null?'Final price confirmed by business':'Sample total'}</span><strong>${total==null?'Confirm at checkout':money(total)}</strong></div><button class="ai-commerce-primary wide" data-modal-action="checkout-cart">Checkout / Order</button>`:`<div class="ai-commerce-empty"><b>Your cart is empty</b><p>Add a product and it will appear here.</p></div>`;
    const o=commerceModalBase('Your Cart',body,'cart');
    o.addEventListener('click',e=>{const a=e.target.closest('[data-modal-action]');if(!a)return;const row=a.closest('[data-cart-id]'),id=row?.dataset.cartId,idx=commerceSession.cart.findIndex(x=>x.id===id);if(a.dataset.modalAction==='checkout-cart'){o.remove();showCheckout(commerceSession.cart);return;}if(idx<0)return;if(a.dataset.modalAction==='qty-up')commerceSession.cart[idx].qty=(Number(commerceSession.cart[idx].qty)||1)+1;if(a.dataset.modalAction==='qty-down'){commerceSession.cart[idx].qty=Math.max(1,(Number(commerceSession.cart[idx].qty)||1)-1);}if(a.dataset.modalAction==='remove')commerceSession.cart.splice(idx,1);if(a.dataset.modalAction==='save-later'){const x=commerceSession.cart.splice(idx,1)[0];if(x&&!commerceSession.wishlist.some(w=>w.id===x.id))commerceSession.wishlist.push({...x,qty:1});}saveCommerceSession();o.remove();showCart();renderPreview();});
  }
  function showWishlist(){
    loadCommerceSession();const body=commerceSession.wishlist.length?commerceSession.wishlist.map(x=>cartRow(x,'wishlist')).join(''):`<div class="ai-commerce-empty"><b>No saved products yet</b><p>Use “Save” on a product to keep it for later.</p></div>`;
    const o=commerceModalBase('Saved for Later',body,'wishlist');o.addEventListener('click',e=>{const a=e.target.closest('[data-modal-action]');if(!a)return;const row=a.closest('[data-cart-id]'),id=row?.dataset.cartId,idx=commerceSession.wishlist.findIndex(x=>x.id===id);if(idx<0)return;const x=commerceSession.wishlist[idx];if(a.dataset.modalAction==='move-cart'){commerceSession.wishlist.splice(idx,1);addCart(x);o.remove();showWishlist();return;}if(a.dataset.modalAction==='remove')commerceSession.wishlist.splice(idx,1);saveCommerceSession();o.remove();showWishlist();renderPreview();});
  }
  function orderHistoryHtml(){
    if(!commerceSession.orders.length)return '<div class="ai-commerce-empty"><b>No orders yet</b><p>Orders placed from this preview will appear here.</p></div>';
    return commerceSession.orders.map(o=>`<article class="ai-order-card"><div><strong>${escapeHTML(o.id)}</strong><span>${escapeHTML(o.date)}</span></div><p>${o.items.map(x=>`${escapeHTML(x.title)} × ${x.qty||1}`).join('<br>')}</p><b>${o.totalLabel||'Price to be confirmed'}</b><em>${escapeHTML(o.status||'Order request sent')}</em></article>`).join('');
  }
  function showAccount(){
    loadCommerceSession();
    const body=commerceSession.user?`<div class="ai-account-summary"><div class="ai-account-avatar">${escapeHTML((commerceSession.user.name||'C')[0].toUpperCase())}</div><div><strong>${escapeHTML(commerceSession.user.name||'Customer')}</strong><span>${escapeHTML(commerceSession.user.email||'')}</span></div><button data-account-action="logout">Log out</button></div><h4>Order history</h4>${orderHistoryHtml()}`:`<div class="ai-account-tabs"><button class="is-active" data-account-tab="signup">Sign up</button><button data-account-tab="login">Login</button></div><form class="ai-account-form" data-account-form="signup"><label>Name<input name="name" required maxlength="80"></label><label>Email<input name="email" type="email" required maxlength="120"></label><label>Phone<input name="phone" type="tel" maxlength="30"></label><button class="ai-commerce-primary" type="submit">Create account</button></form><form class="ai-account-form" data-account-form="login" hidden><label>Email<input name="email" type="email" required maxlength="120"></label><button class="ai-commerce-primary" type="submit">Login</button></form><p class="ai-commerce-demo-note">Preview account only. A production website needs a secure server-side customer account system.</p>`;
    const o=commerceModalBase('Customer Account',body,'account');
    o.addEventListener('click',e=>{const tab=e.target.closest('[data-account-tab]');if(tab){o.querySelectorAll('[data-account-tab]').forEach(b=>b.classList.toggle('is-active',b===tab));o.querySelectorAll('[data-account-form]').forEach(f=>f.hidden=f.dataset.accountForm!==tab.dataset.accountTab);}if(e.target.closest('[data-account-action="logout"]')){commerceSession.user=null;saveCommerceSession();o.remove();renderPreview();showAccount();}});
    o.addEventListener('submit',e=>{const f=e.target.closest('[data-account-form]');if(!f)return;e.preventDefault();const fd=new FormData(f);const email=String(fd.get('email')||'').trim();if(!email)return;if(f.dataset.accountForm==='signup')commerceSession.user={name:String(fd.get('name')||'Customer').trim(),email,phone:String(fd.get('phone')||'').trim()};else commerceSession.user={name:email.split('@')[0]||'Customer',email,phone:''};saveCommerceSession();o.remove();renderPreview();showAccount();});
  }
  function showCheckout(items){
    loadCommerceSession();const list=(items||[]).map(x=>({...x,qty:Number(x.qty)||1}));if(!list.length)return;const total=sampleTotal(list);const u=commerceSession.user||{};
    const body=`<div class="ai-checkout-items">${list.map(x=>`<div><span>${escapeHTML(x.title)} × ${x.qty}</span><b>${escapeHTML(x.meta||'')}</b></div>`).join('')}</div><div class="ai-cart-summary"><span>${total==null?'Final price':'Sample total'}</span><strong>${total==null?'Confirm with business':money(total)}</strong></div><form class="ai-checkout-form"><label>Name<input name="name" required value="${editorEscapeAttr(u.name||'')}"></label><label>Phone<input name="phone" required value="${editorEscapeAttr(u.phone||'')}"></label><label>Delivery / contact address<textarea name="address" required>${escapeHTML(state.site?.contact?.address||'')}</textarea></label><button class="ai-commerce-primary wide" type="submit">Place Order / Continue on WhatsApp</button></form><p class="ai-commerce-demo-note">This builder preview does not process payments. The order request is saved locally and can be sent to the business on WhatsApp.</p>`;
    const o=commerceModalBase('Checkout',body,'checkout');o.addEventListener('submit',e=>{const f=e.target.closest('.ai-checkout-form');if(!f)return;e.preventDefault();const fd=new FormData(f),orderId=`ORD-${Date.now().toString().slice(-6)}`;const order={id:orderId,date:new Date().toLocaleString(),items:list,totalLabel:total==null?'Price to be confirmed':money(total),status:'Order request sent'};commerceSession.orders.unshift(order);if(items===commerceSession.cart||list.length===commerceSession.cart.length&&commerceSession.cart.every(x=>list.some(y=>y.id===x.id)))commerceSession.cart=[];saveCommerceSession();renderPreview();const msg=`Hi ${state.site.brand.name}, I would like to place an order.

${list.map(x=>`• ${x.title} × ${x.qty} — ${x.meta||'Confirm price'}`).join('\n')}

Name: ${fd.get('name')}
Phone: ${fd.get('phone')}
Address: ${fd.get('address')}
Order reference: ${orderId}`;const wa=whatsappUrl(msg);o.remove();if(wa)window.open(wa,'_blank','noopener');else alert('Order request saved in this preview. Add a WhatsApp number to send it to the business.');});
  }
  function serviceEnquiry(item){const msg=`Hi ${state.site.brand.name}, I am interested in the service “${item.title}”. ${item.meta?`Price shown: ${item.meta}. `:''}Please share availability and details.`;const wa=whatsappUrl(msg);if(wa)window.open(wa,'_blank','noopener');else alert('Add a WhatsApp number in Site Settings to use service enquiries.');}
  function openSiteWhatsapp(){const wa=whatsappUrl(`Hi ${state.site.brand.name}, I would like to know more about your products/services.`);if(wa)window.open(wa,'_blank','noopener');else alert('Add a WhatsApp number in Site Settings to enable WhatsApp.');}

  function renderPreview(){
    if(!state.site)return;
    const s=state.site,p=currentPage(),pi=pageIndex(),frame=$('#sitePreview');
    frame.style.setProperty('--site-primary',validHex(s.style.primary)?s.style.primary:'#173b5c');frame.style.setProperty('--site-accent',validHex(s.style.accent)?s.style.accent:'#f57c00');frame.style.setProperty('--site-bg',validHex(s.style.background)?s.style.background:'#ffffff');frame.style.setProperty('--site-text',validHex(s.style.text)?s.style.text:'#17202b');frame.style.setProperty('--site-radius',`${Number(s.style.radius)||18}px`);frame.style.setProperty('--site-spacing',`${Number(s.style.spacing)||48}px`);frame.style.setProperty('--site-max-width',`${Number(s.style.maxWidth)||1180}px`);frame.style.setProperty('--site-font',s.style.font||'Inter, Arial, sans-serif');frame.dataset.buttonStyle=s.style.buttonStyle||'rounded';frame.classList.toggle('is-editing',state.editMode);
    const logo=s.brand.logo?`<img src="${editorEscapeAttr(s.brand.logo)}" alt="${editorEscapeAttr(s.brand.name)} logo">`:'<span class="ai-site-brand__mark"></span>';
    const logoWrap=`<span class="ai-logo-edit" data-image-path="brand.logo">${logo}${state.editMode?'<button type="button" class="ai-replace-image ai-logo-replace">Logo</button>':''}</span>`;
    loadCommerceSession();const counts=commerceCounts();
    const navLinks=s.pages.map(pg=>`<button type="button" class="ai-site-page-link ${pg.id===p.id?'is-active':''}" data-page-id="${editorEscapeAttr(pg.id)}">${escapeHTML(pg.name)}</button>`).join('');
    const utilityNav=`<div class="ai-store-utils"><button type="button" data-commerce-action="wishlist" title="Saved items">♡<span>${counts.wishlist}</span></button><button type="button" data-commerce-action="account" title="Customer account">${commerceSession.user?'●':'◉'}</button><button type="button" data-commerce-action="cart" title="Cart">Cart <span>${counts.cart}</span></button></div>`;
    const socials=Object.entries(s.social||{}).filter(([,url])=>String(url||'').trim()).map(([k,url])=>`<a href="${editorEscapeAttr(url)}" target="_blank" rel="noopener">${socialLabel(k)}</a>`).join('');
    const socialArea=socials?`<div class="ai-site-socials">${socials}</div>`:(state.editMode?'<div class="ai-site-socials is-empty">Add social links in Site Settings</div>':'');
    const waButton=(s.contact?.whatsapp||s.contact?.phone)?`<button type="button" class="ai-site-whatsapp" data-commerce-action="whatsapp" aria-label="Chat on WhatsApp">WA</button>`:'';
    frame.innerHTML=`<div class="ai-site-shell"><nav class="ai-site-nav"><div class="ai-site-brand">${logoWrap}${editable('brand.name',s.brand.name)}</div><div class="ai-site-links">${navLinks}</div><div class="ai-site-nav-actions">${utilityNav}${editable('brand.navCta',s.brand.navCta,{tag:'span',className:'ai-site-cta'})}</div></nav><main>${p.sections.map((section,si)=>renderSection(section,pi,si)).join('')}</main><footer class="ai-site-footer"><div>${editable('footer.headline',s.footer.headline,{tag:'strong'})}${editable('footer.text',s.footer.text,{tag:'span',multiline:true})}${socialArea}</div>${editable('footer.copyright',s.footer.copyright,{tag:'span'})}</footer>${waButton}</div>`;
    if(p.id==='home'){s.seo=deepClone(p.seo||s.seo);}
    $('#previewUrl').textContent=`${slug(s.brand.name)||'your-business'}.example/${p.slug||''}`.replace(/\/$/,'');
    refreshPageSelect();
  }

  function updateGlobalSetting(id,path,transform=v=>v){const el=$('#'+id);if(!el)return;el.addEventListener('input',()=>{const before=snapshot();setPath(state.site,path,transform(el.value));commitHistory(before);renderPreview();});}
  ['customBusinessName','customTagline','customPhone','customWhatsapp','customEmail','customAddress','customInstagram','customFacebook','customYoutube','customLinkedin'].forEach(id=>{const paths={customBusinessName:'brand.name',customTagline:'brand.tagline',customPhone:'contact.phone',customWhatsapp:'contact.whatsapp',customEmail:'contact.email',customAddress:'contact.address',customInstagram:'social.instagram',customFacebook:'social.facebook',customYoutube:'social.youtube',customLinkedin:'social.linkedin'};updateGlobalSetting(id,paths[id]);});
  function updateCurrentPageSetting(id,key,transform=v=>v){const el=$('#'+id);if(!el)return;el.addEventListener('input',()=>{const p=currentPage();if(!p)return;const before=snapshot();p.seo=p.seo||pageSeo(p.name,state.data,state.site.brand.name);if(key==='slug'){if(p.id==='home')return;p.slug=slug(transform(el.value));}else p.seo[key]=transform(el.value);commitHistory(before);renderPreview();});}
  updateCurrentPageSetting('customPageSlug','slug');updateCurrentPageSetting('customSeoTitle','title',v=>fitSeoTitle(v,70));updateCurrentPageSetting('customSeoDescription','description',v=>fitMeta(v,180));
  updateGlobalSetting('customPrimaryColor','style.primary');updateGlobalSetting('customAccentColor','style.accent');updateGlobalSetting('customBackgroundColor','style.background');updateGlobalSetting('customTextColor','style.text');updateGlobalSetting('customFont','style.font');updateGlobalSetting('customRadius','style.radius',v=>Number(v));updateGlobalSetting('customSpacing','style.spacing',v=>Number(v));updateGlobalSetting('customMaxWidth','style.maxWidth',v=>Number(v));
  $('#customButtonStyle')?.addEventListener('change',e=>{const before=snapshot();state.site.style.buttonStyle=e.target.value;commitHistory(before);renderPreview();});

  let editBefore=null;
  $('#sitePreview').addEventListener('focusin',e=>{if(!state.editMode)return;const v=e.target.closest('.ai-edit-value');if(v&&!editBefore)editBefore=snapshot();});
  $('#sitePreview').addEventListener('input',e=>{if(!state.editMode)return;const v=e.target.closest('.ai-edit-value');if(!v)return;const wrap=v.closest('[data-edit-path]');if(!wrap)return;setPath(state.site,wrap.dataset.editPath,v.innerText.replace(/\u00a0/g,' ').slice(0,3000));});
  $('#sitePreview').addEventListener('focusout',e=>{const v=e.target.closest('.ai-edit-value');if(!v||!editBefore)return;commitHistory(editBefore);editBefore=null;renderPreview();hydrateCustomizer();});
  $('#sitePreview').addEventListener('keydown',e=>{const v=e.target.closest('.ai-edit-value');if(!v)return;const wrap=v.closest('.ai-inline-editable');if(e.key==='Enter'&&wrap?.dataset.multiline!=='true'){e.preventDefault();v.blur();}if(e.key==='Escape'){e.preventDefault();v.blur();}});

  function pickImage(path){const inp=document.createElement('input');inp.type='file';inp.accept='image/png,image/jpeg,image/webp';inp.addEventListener('change',()=>{const f=inp.files?.[0];if(!f)return;if(f.size>3*1024*1024){alert('Please use an image smaller than 3 MB.');return;}const before=snapshot();const r=new FileReader();r.onload=()=>{setPath(state.site,path,r.result);commitHistory(before);renderPreview();};r.readAsDataURL(f);});inp.click();}

  function itemDefault(type,i){
    const d=state.data||{},b=state.site?.brand?.name||d.businessName||'Your Business';
    switch(type){
      case'trustbar':return{id:uid('item'),title:`Trust point ${i}`,description:'Add a clear, verifiable reason customers can feel confident taking the next step.'};
      case'spotlight':return{id:uid('item'),title:`Key benefit ${i}`,description:'Explain a useful customer benefit without making an unsupported claim.'};
      case'bento':return{id:uid('item'),title:`Highlight ${i}`,description:'Add a short description of the product, service or experience.',meta:'Enquire for details',image:generatedImage(i+2)};
      case'gallery':return{id:uid('item'),title:`Gallery image ${i}`,image:generatedImage(i+3)};
      case'testimonials':return{id:uid('item'),title:'Customer name',description:'Replace this placeholder with a genuine customer review before publishing.',meta:'Customer'};
      case'stats':return{id:uid('item'),title:'Add a number',description:'Add a real, verifiable business statistic'};
      case'process':return{id:uid('item'),title:i===1?'Tell us what you need':i===2?'Get the right recommendation':'Confirm the next step',description:i===1?'Share your requirement so the business can understand what you are looking for.':i===2?'Review the most relevant product or service option for your requirement.':'Confirm availability, final pricing or the next action directly with the business.'};
      case'faq':return{id:uid('item'),title:i===1?`How do I contact ${b}?`:i===2?'Are the prices shown final?':'Can I ask for a custom requirement?',description:i===1?'Use the phone, WhatsApp or email details on this website to send your enquiry.':i===2?'Prices generated by this website builder are sample draft values. Replace them with the business’s actual prices before publishing.':'Yes. Use the enquiry option to describe what you need and confirm the available options directly.'};
      default:return{id:uid('item'),title:`New item ${i}`,description:`Add the exact details customers should know about this ${type==='cards'?'product or service':'item'}.`,meta:'Enquire for details',image:generatedImage(i+2)};
    }
  }

  function sectionDefault(type){
    const d=state.data||{},b=state.site?.brand?.name||d.businessName||'Your Business',location=locLabel(d);
    const common={id:uid('section'),type,background:'white',layout:'grid3'};
    if(type==='hero')return{...common,eyebrow:`${d.category||'Business'}${d.location?' · '+d.location:''}`,title:b,text:`Explore what ${b} offers in ${location}.`,primaryCta:state.site?.brand?.navCta||'Get Started',secondaryCta:'Learn More',image:generatedImage(0,1800),background:'gradient',layout:'editorial'};
    if(type==='cards')return{...common,offerKind:'mixed',eyebrow:'What We Offer',title:'Products & Services',text:`Explore the key products and services available from ${b}.`,items:[itemDefault('cards',1),itemDefault('cards',2),itemDefault('cards',3),itemDefault('cards',4)]};
    if(type==='products'){const sec={...common,type:'cards',offerKind:'product',eyebrow:'Products',title:`Products from ${b}`,text:`Explore products from ${b}. Add items to cart, save favourites or buy now.`,items:inferredOfferItems(d,'product').map((it,i)=>({id:uid('item'),...it,image:it.image||generatedImage(i+1)}))};return sec;}
    if(type==='services'){const sec={...common,type:'cards',offerKind:'service',eyebrow:'Services',title:`Services from ${b}`,text:`Explore services from ${b} and send an enquiry for the option you need.`,items:inferredOfferItems(d,'service').map((it,i)=>({id:uid('item'),...it,image:it.image||generatedImage(i+5)}))};return sec;}
    if(type==='bento')return premiumBento('Premium Highlights');
    if(type==='trustbar')return premiumTrust();
    if(type==='spotlight')return premiumSpotlight(`Why explore ${b}`,6);
    if(type==='about')return{...common,eyebrow:'About',title:`About ${b}`,text:naturalAboutCopy(d),text2:'Use this section to explain what makes the business relevant to customers.',image:generatedImage(6),layout:'split'};
    if(type==='gallery')return premiumGallery('See More of Our Work',6);
    if(type==='testimonials')return{...common,eyebrow:'Testimonials',title:'Customer Feedback',text:'Add only genuine feedback from real customers before publishing.',background:'soft',items:[itemDefault(type,1),itemDefault(type,2),itemDefault(type,3)]};
    if(type==='stats')return{...common,items:[itemDefault(type,1),itemDefault(type,2),itemDefault(type,3),itemDefault(type,4)]};
    if(type==='process')return premiumProcess();
    if(type==='faq')return premiumFaq(6);
    if(type==='contact')return{...common,title:`Contact ${b}`,text:`Have a question about a product or service? Contact ${b} and share what you need.`,cta:'Send an Enquiry',background:'dark',layout:'split'};
    if(type==='cta')return{...common,eyebrow:'Next Step',title:`Ready to contact ${b}?`,text:'Send your requirement and confirm availability, final pricing or the most suitable option directly with the business.',cta:state.site?.brand?.navCta||'Contact Us',background:'dark'};
    return{...common,eyebrow:'Information',title:'More Information',text:`Add useful information that helps customers understand ${b} and decide what to do next.`};
  }

  function buildPagePreset(type,name){
    const d=state.data||{},b=state.site.brand.name,n=name||'New Page',profile=premiumProfile(d);
    const hero=page=>premiumHero(page,type==='about'?`About ${b}`:type==='contact'?`Contact ${b}`:type==='products'?`Products from ${b}`:type==='services'?`Services from ${b}`:page,naturalPageDescription(page,d,b),state.site.pages.length+2,type==='contact'?'center':'editorial');
    let sections=[hero(n)];
    if(type==='about')sections.push(sectionDefault('about'),sectionDefault('trustbar'),sectionDefault('spotlight'),sectionDefault('process'),sectionDefault('gallery'),sectionDefault('cta'));
    else if(type==='products'){const sec=sectionDefault('cards');sec.offerKind='product';sec.eyebrow='Products';sec.title=`Products from ${b}`;sec.items=inferredOfferItems(d,'product').map((it,i)=>({id:uid('item'),...it,image:it.image||generatedImage(i+1)}));sections.push(sectionDefault('trustbar'),sec,premiumBento('Featured Product Highlights',sec.items),sectionDefault('spotlight'),sectionDefault('faq'),sectionDefault('cta'));}
    else if(type==='services'){const sec=sectionDefault('cards');sec.offerKind='service';sec.eyebrow='Services';sec.title=`Services from ${b}`;sec.items=inferredOfferItems(d,'service').map((it,i)=>({id:uid('item'),...it,image:it.image||generatedImage(i+5)}));sections.push(sectionDefault('trustbar'),sec,sectionDefault('process'),sectionDefault('spotlight'),sectionDefault('faq'),sectionDefault('cta'));}
    else if(type==='special'){const sec=premiumSpecialSection();sections=[hero(profile.page),sectionDefault('trustbar'),sec,premiumBento(`Explore ${profile.page}`,sec.items),sectionDefault('spotlight'),sectionDefault('faq'),sectionDefault('cta')];}
    else if(type==='gallery'||type==='portfolio')sections.push(sectionDefault('gallery'),sectionDefault('bento'),sectionDefault('cta'));
    else if(type==='process')sections.push(sectionDefault('process'),sectionDefault('spotlight'),sectionDefault('faq'),sectionDefault('cta'));
    else if(type==='faq')sections.push(sectionDefault('faq'),sectionDefault('trustbar'),sectionDefault('contact'));
    else if(type==='testimonials')sections.push(sectionDefault('testimonials'),sectionDefault('trustbar'),sectionDefault('contact'));
    else if(type==='contact')sections.push(sectionDefault('contact'),sectionDefault('trustbar'),sectionDefault('faq'));
    else sections.push(sectionDefault('text'),sectionDefault('spotlight'),sectionDefault('cta'));
    return {id:uid('page'),name:n,slug:slug(n),seo:pageSeo(n,d,b),sections};
  }

  function showChoiceModal(mode){
    document.querySelector('.ai-editor-modal')?.remove();
    const overlay=document.createElement('div');overlay.className='ai-editor-modal';
    if(mode==='section'){
      const choices=[['hero','Premium Hero'],['trustbar','Trust Strip'],['products','Products + Cart'],['services','Services + Enquiry'],['cards','Products / Services'],['bento','Bento Showcase'],['spotlight','Editorial Spotlight'],['about','About'],['gallery','Gallery'],['process','Process'],['faq','FAQ'],['testimonials','Testimonials'],['stats','Stats'],['text','Text'],['contact','Contact'],['cta','Call to Action']];
      overlay.innerHTML=`<div class="ai-editor-modal__panel"><div class="ai-editor-modal__head"><strong>Add a section</strong><button type="button" data-close>×</button></div><p>Choose a section. Every text field and image can be edited after you add it.</p><div class="ai-editor-choice-grid">${choices.map(([t,l])=>`<button type="button" data-section-type="${t}">${l}</button>`).join('')}</div></div>`;
      overlay.addEventListener('click',e=>{const b=e.target.closest('[data-section-type]');if(b){checkpoint();currentPage().sections.push(sectionDefault(b.dataset.sectionType));renderPreview();overlay.remove();}if(e.target===overlay||e.target.closest('[data-close]'))overlay.remove();});
    } else {
      const profile=premiumProfile(state.data||{});const pages=[['about','About'],['products','Products'],['services','Services'],['special',profile.page],['gallery','Gallery'],['portfolio','Portfolio / Work'],['process','How It Works'],['faq','FAQ'],['testimonials','Testimonials'],['contact','Contact'],['custom','Custom Page']];
      overlay.innerHTML=`<div class="ai-editor-modal__panel"><div class="ai-editor-modal__head"><strong>Add a page</strong><button type="button" data-close>×</button></div><p>Choose a ready-made page. A natural SEO title, meta description and starter content will be created automatically, and everything remains editable.</p><div class="ai-editor-choice-grid">${pages.map(([t,l])=>`<button type="button" data-page-type="${t}" data-page-name="${l}">${l}</button>`).join('')}</div><label class="ai-editor-custom-page">Custom page name<input maxlength="50" placeholder="e.g. Bridal Packages"><button type="button" data-custom-page>Add Page</button></label></div>`;
      const addPage=(type,name)=>{if(state.site.pages.length>=16){alert('You can add up to 16 pages in this website concept.');return;}const n=(name||'New Page').trim().slice(0,50);checkpoint();const pg=buildPagePreset(type,n);state.site.pages.push(pg);state.activePageId=pg.id;renderPreview();hydrateCustomizer();overlay.remove();};
      overlay.addEventListener('click',e=>{const b=e.target.closest('[data-page-type]');if(b&&b.dataset.pageType!=='custom')addPage(b.dataset.pageType,b.dataset.pageName);const customPreset=e.target.closest('[data-page-type="custom"]');if(customPreset){const input=overlay.querySelector('.ai-editor-custom-page input');input?.focus();}const c=e.target.closest('[data-custom-page]');if(c){const input=overlay.querySelector('.ai-editor-custom-page input');const n=input.value.trim();if(!n){input.focus();return;}addPage('custom',n);}if(e.target===overlay||e.target.closest('[data-close]'))overlay.remove();});
    }
    document.body.appendChild(overlay);
  }

  function showPageSettings(){
    const p=currentPage();if(!p)return;p.seo=p.seo||pageSeo(p.name,state.data,state.site.brand.name);
    document.querySelector('.ai-editor-modal')?.remove();
    const overlay=document.createElement('div');overlay.className='ai-editor-modal';
    overlay.innerHTML=`<div class="ai-editor-modal__panel ai-page-settings-modal"><div class="ai-editor-modal__head"><strong>Page settings</strong><button type="button" data-close>×</button></div><p>Manage the page name, URL and search snippet. The suggestions are written naturally for this business and can be edited.</p><label>Page name<input data-page-setting="name" maxlength="50" value="${editorEscapeAttr(p.name)}"></label><label>URL slug<input data-page-setting="slug" maxlength="80" ${p.id==='home'?'disabled':''} value="${editorEscapeAttr(p.slug||'')}"></label><label>SEO title <small>Recommended: concise and descriptive</small><input data-page-setting="title" maxlength="70" value="${editorEscapeAttr(p.seo.title||'')}"></label><label>Meta description <small>Recommended: natural summary for search visitors</small><textarea data-page-setting="description" maxlength="180">${escapeHTML(p.seo.description||'')}</textarea></label><div class="ai-page-settings-actions"><button type="button" data-seo-suggest>Refresh SEO suggestion</button><button class="primary" type="button" data-page-save>Save settings</button></div></div>`;
    overlay.addEventListener('click',e=>{if(e.target===overlay||e.target.closest('[data-close]'))overlay.remove();if(e.target.closest('[data-seo-suggest]')){const suggestion=pageSeo(overlay.querySelector('[data-page-setting="name"]').value||p.name,state.data,state.site.brand.name);overlay.querySelector('[data-page-setting="title"]').value=suggestion.title;overlay.querySelector('[data-page-setting="description"]').value=suggestion.description;}if(e.target.closest('[data-page-save]')){const name=overlay.querySelector('[data-page-setting="name"]').value.trim()||p.name;const slugValue=overlay.querySelector('[data-page-setting="slug"]').value.trim();const title=overlay.querySelector('[data-page-setting="title"]').value.trim();const description=overlay.querySelector('[data-page-setting="description"]').value.trim();checkpoint();p.name=name.slice(0,50);if(p.id!=='home')p.slug=slug(slugValue||name);p.seo={title:fitSeoTitle(title||pageSeo(name,state.data,state.site.brand.name).title,70),description:fitMeta(description||pageSeo(name,state.data,state.site.brand.name).description,180)};renderPreview();hydrateCustomizer();overlay.remove();}});
    document.body.appendChild(overlay);
  }

  $('#sitePreview').addEventListener('click',e=>{
    const commerceBtn=e.target.closest('[data-commerce-action]');
    if(commerceBtn){e.preventDefault();const action=commerceBtn.dataset.commerceAction,item=getOfferFromButton(commerceBtn);if(action==='cart')showCart();else if(action==='wishlist')showWishlist();else if(action==='account')showAccount();else if(action==='whatsapp')openSiteWhatsapp();else if(item&&action==='add-cart')addCart(item);else if(item&&action==='wishlist-item')toggleWishlist(item);else if(item&&action==='buy')showCheckout([item]);else if(item&&action==='enquire-service')serviceEnquiry(item);return;}
    const pageLink=e.target.closest('[data-page-id]');if(pageLink){state.activePageId=pageLink.dataset.pageId;renderPreview();hydrateCustomizer();return;}
    const pencil=e.target.closest('.ai-pencil');if(pencil){const v=pencil.closest('.ai-inline-editable')?.querySelector('.ai-edit-value');v?.focus();document.execCommand?.('selectAll',false,null);return;}
    const imgBtn=e.target.closest('.ai-replace-image');if(imgBtn){const wrap=imgBtn.closest('[data-image-path]');if(wrap)pickImage(wrap.dataset.imagePath);return;}
    const btn=e.target.closest('[data-editor-action]');if(!btn||!state.editMode)return;
    const si=Number(btn.dataset.section),ii=Number(btn.dataset.item),p=currentPage(),sections=p.sections,action=btn.dataset.editorAction;
    if(!Number.isInteger(si)||!sections[si])return;
    if(action==='move-up'&&si>0){checkpoint();[sections[si-1],sections[si]]=[sections[si],sections[si-1]];renderPreview();}
    else if(action==='move-down'&&si<sections.length-1){checkpoint();[sections[si+1],sections[si]]=[sections[si],sections[si+1]];renderPreview();}
    else if(action==='duplicate-section'){checkpoint();const cp=deepClone(sections[si]);cp.id=uid('section');(cp.items||[]).forEach(x=>x.id=uid('item'));sections.splice(si+1,0,cp);renderPreview();}
    else if(action==='remove-section'){if(confirm('Remove this section?')){checkpoint();sections.splice(si,1);renderPreview();}}
    else if(action==='cycle-bg'){checkpoint();const vals=['white','soft','dark','gradient'];const cur=vals.indexOf(sections[si].background);sections[si].background=vals[(cur+1)%vals.length];renderPreview();}
    else if(action==='cycle-layout'){checkpoint();const vals=['grid3','grid2','list','split','center','editorial','immersive','bento'];const cur=vals.indexOf(sections[si].layout);sections[si].layout=vals[(cur+1)%vals.length];renderPreview();}
    else if(action==='add-item'){checkpoint();sections[si].items=sections[si].items||[];sections[si].items.push(itemDefault(sections[si].type,sections[si].items.length+1));renderPreview();}
    else if(action==='duplicate-item'&&Number.isInteger(ii)&&sections[si].items?.[ii]){checkpoint();const cp=deepClone(sections[si].items[ii]);cp.id=uid('item');sections[si].items.splice(ii+1,0,cp);renderPreview();}
    else if(action==='remove-item'&&Number.isInteger(ii)&&sections[si].items?.[ii]){checkpoint();sections[si].items.splice(ii,1);renderPreview();}
  });

  $$('.ai-result-actions [data-device]').forEach(btn=>btn.addEventListener('click',()=>{$$('.ai-result-actions [data-device]').forEach(b=>b.classList.remove('is-active'));btn.classList.add('is-active');$('#deviceFrame').dataset.device=btn.dataset.device;}));
  $('#toggleCustomizer').addEventListener('click',()=>{state.editMode=!state.editMode;renderPreview();hydrateCustomizer();});
  $('#editorDone')?.addEventListener('click',()=>{state.editMode=false;renderPreview();hydrateCustomizer();});
  $('#editorAddSection')?.addEventListener('click',()=>showChoiceModal('section'));
  $('#editorAddPage')?.addEventListener('click',()=>showChoiceModal('page'));
  $('#editorPageSettings')?.addEventListener('click',showPageSettings);
  $('#editorUndo')?.addEventListener('click',undo);$('#editorRedo')?.addEventListener('click',redo);
  $('#editorPageSelect')?.addEventListener('change',e=>{state.activePageId=e.target.value;renderPreview();hydrateCustomizer();});
  $('#editorRenamePage')?.addEventListener('click',showPageSettings);
  $('#editorDeletePage')?.addEventListener('click',()=>{const p=currentPage();if(p.id==='home'||state.site.pages.length<=1)return;if(confirm(`Delete ${p.name}?`)){checkpoint();state.site.pages=state.site.pages.filter(x=>x.id!==p.id);state.activePageId='home';renderPreview();hydrateCustomizer();}});
  $('#editorReset')?.addEventListener('click',()=>{if(confirm('Reset all visual edits back to the generated website?')){checkpoint();state.site=deepClone(state.originalSite);state.activePageId='home';renderPreview();hydrateCustomizer();}});

  $('#startOver').addEventListener('click',()=>{if(confirm('Start over and clear this generated concept?')){state.concept=null;state.site=null;state.originalSite=null;state.history=[];state.future=[];state.previousGeneration=null;state.generationIndex=0;syncRegenerateControls();$('#aiResult').classList.remove('is-active');$('#aiWizard').hidden=false;showStep(1);}});
  $('#saveDraft').addEventListener('click',()=>{const payload={data:{...state.data,logoData:'',offers:[]},concept:state.concept,site:state.site,activePageId:state.activePageId,savedAt:new Date().toISOString()};try{localStorage.setItem(state.draftKey,JSON.stringify(payload));flash($('#saveDraft'),'Saved');}catch(_){const compact=deepClone(payload);compact.site.brand.logo='';compact.site.pages.forEach(p=>p.sections.forEach(s=>{if(s.image)s.image='';(s.items||[]).forEach(i=>{if(i.image)i.image='';});}));localStorage.setItem(state.draftKey,JSON.stringify(compact));flash($('#saveDraft'),'Saved text');}});
  function flash(btn,text){const old=btn.textContent;btn.textContent=text;setTimeout(()=>btn.textContent=old,1400);}

  function whatsappPublish(){
    if(!state.site)return;const s=state.site,d=state.data;const sections=s.pages.reduce((n,p)=>n+p.sections.length,0);const msg=[`Hi Digitalford, I created and customized a website using the AI Website Builder and I would like to build/publish it.`,`Business: ${s.brand.name}`,`Category: ${d.category}`,`Business type: ${d.businessType||'-'}`,`Location: ${d.location||'-'}`,`Website style: ${d.style}`,`Goals: ${(d.goals||[]).join(', ')||'-'}`,`Pages: ${s.pages.map(p=>p.name).join(', ')}`,`Total sections: ${sections}`,`Main CTA: ${s.brand.navCta}`,`Please review my customized concept and tell me the next steps and price.`].join('\n');window.open('https://wa.me/919866383147?text='+encodeURIComponent(msg),'_blank','noopener');
  }
  $('#publishWebsite').addEventListener('click',whatsappPublish);$('#publishWebsiteBottom').addEventListener('click',whatsappPublish);$('#discussConcept').addEventListener('click',whatsappPublish);
  $('#regenerateWebsite')?.addEventListener('click',showRegenerateModal);
  $('#regenerateWebsiteHint')?.addEventListener('click',showRegenerateModal);
  $('#editorRegenerate')?.addEventListener('click',showRegenerateModal);
  $('#restorePreviousGeneration')?.addEventListener('click',()=>{if(!state.previousGeneration)return;const current=generationSnapshot();restoreGenerationSnapshot(state.previousGeneration);state.previousGeneration=current;syncRegenerateControls();flash($('#restorePreviousGeneration'),'Restored');});

  $('#heroCreateWebsite').addEventListener('click',e=>{e.preventDefault();$('#aiBuilder').scrollIntoView({behavior:'smooth',block:'start'});setTimeout(()=>$('#businessName').focus(),500)});
  $('#heroHowItWorks').addEventListener('click',e=>{e.preventDefault();$('#howItWorks').scrollIntoView({behavior:'smooth'});});

  getNonce();
})();
