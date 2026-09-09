const btn=document.querySelector('.menu-btn');const nav=document.querySelector('.navlinks');if(btn&&nav){btn.addEventListener('click',()=>nav.classList.toggle('open'));}const form=document.getElementById('waForm');if(form){form.addEventListener('submit',e=>{e.preventDefault();const d=new FormData(form);const msg=`Hello Digitalford,%0A%0AName: ${encodeURIComponent(d.get('name')||'')}%0ABusiness: ${encodeURIComponent(d.get('business')||'')}%0APhone: ${encodeURIComponent(d.get('phone')||'')}%0AService: ${encodeURIComponent(d.get('service')||'')}%0ARequirement: ${encodeURIComponent(d.get('message')||'')}`;window.open('https://wa.me/919866383147?text='+msg,'_blank');});}
// Closeable mini contact popup
document.addEventListener('DOMContentLoaded', function () {
  const popup = document.getElementById('miniContact');
  const trigger = document.getElementById('miniContactTrigger');
  const form = document.getElementById('miniContactForm');
  if (!popup || !trigger) return;

  const closePopup = () => {
    popup.classList.remove('is-open');
    popup.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('mini-contact-open');
    sessionStorage.setItem('digitalfordMiniContactClosed', '1');
  };

  const openPopup = () => {
    popup.classList.add('is-open');
    popup.setAttribute('aria-hidden', 'false');
    document.body.classList.add('mini-contact-open');
  };

  trigger.addEventListener('click', openPopup);
  popup.querySelectorAll('[data-mini-close]').forEach(el => el.addEventListener('click', closePopup));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && popup.classList.contains('is-open')) closePopup();
  });

  // Optional automatic popup: once per browser tab/session, after 12 seconds.
  if (!sessionStorage.getItem('digitalfordMiniContactClosed')) {
    setTimeout(openPopup, 12000);
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const data = new FormData(form);
      const name = data.get('name') || '';
      const phone = data.get('phone') || '';
      const service = data.get('service') || '';
      const message = data.get('message') || '';
      const text =
        `Hi Digitalford, I would like to enquire.%0A%0A` +
        `Name: ${encodeURIComponent(name)}%0A` +
        `Phone: ${encodeURIComponent(phone)}%0A` +
        `Service: ${encodeURIComponent(service)}%0A` +
        `Message: ${encodeURIComponent(message)}`;
      window.open(`https://wa.me/919866383147?text=${text}`, '_blank', 'noopener');
      closePopup();
    });
  }
});
