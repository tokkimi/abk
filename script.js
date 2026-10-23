const $ = (selector) => document.querySelector(selector);
const contact = $('.contact-panel');
const modal = $('#quote-modal');
const portal = $('#portal');
document.querySelectorAll('[data-open-contact]').forEach((button) => button.addEventListener('click', () => {
  contact.classList.add('open'); contact.setAttribute('aria-hidden', 'false');
}));
document.querySelectorAll('[data-close-contact]').forEach((button) => button.addEventListener('click', () => {
  contact.classList.remove('open'); contact.setAttribute('aria-hidden', 'true');
}));
document.querySelectorAll('[data-show-quote]').forEach((button) => button.addEventListener('click', () => {
  contact.classList.remove('open'); modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false');
}));
document.querySelectorAll('[data-close-modal]').forEach((button) => button.addEventListener('click', () => {
  modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true');
}));
document.querySelectorAll('[data-show-portal]').forEach((button) => button.addEventListener('click', () => {
  portal.classList.add('open'); portal.setAttribute('aria-hidden', 'false');
}));
$('.exit-portal').addEventListener('click', () => { portal.classList.remove('open'); portal.setAttribute('aria-hidden', 'true'); });
$('#quote-form').addEventListener('submit', (event) => { event.preventDefault(); event.target.reset(); modal.classList.remove('open'); contact.classList.add('open'); contact.innerHTML = '<button class="close" data-close-contact aria-label="Fermer">×</button><p class="eyebrow"><i></i> Demande reçue</p><h2>Merci,<br /><em>à très vite.</em></h2><p>Votre demande est prête à être transmise à l’équipe ABK. En production, elle pourra être reliée à votre boîte e-mail ou CRM.</p><button class="button primary wide" data-close-contact>Fermer <span>→</span></button>'; contact.querySelectorAll('[data-close-contact]').forEach(b=>b.addEventListener('click',()=>contact.classList.remove('open'))); });

