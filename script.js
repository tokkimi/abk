const $ = (selector) => document.querySelector(selector);
const contact = $('.contact-panel');
const portal = $('#portal');
document.querySelectorAll('[data-open-contact]').forEach((button) => button.addEventListener('click', () => {
  contact.classList.add('open'); contact.setAttribute('aria-hidden', 'false');
}));
document.querySelectorAll('[data-close-contact]').forEach((button) => button.addEventListener('click', () => {
  contact.classList.remove('open'); contact.setAttribute('aria-hidden', 'true');
}));
document.querySelectorAll('[data-show-quote]').forEach((button) => button.addEventListener('click', () => {
  const type = button.dataset.quoteType || 'Demande de devis';
  window.ABKQuote?.open(type.includes('DECI') ? 'incendie' : 'general');
}));
document.querySelectorAll('[data-show-portal]').forEach((button) => button.addEventListener('click', () => {
  portal.classList.add('open'); portal.setAttribute('aria-hidden', 'false');
}));
$('.exit-portal').addEventListener('click', () => { portal.classList.remove('open'); portal.setAttribute('aria-hidden', 'true'); });
