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
// Les demandes de devis arrivent dans le back-office ABK (espace superadmin).
const ABK_API = 'https://unlockit-escape.vercel.app/api/abk';
const thanks = () => { contact.classList.add('open'); contact.setAttribute('aria-hidden', 'false'); contact.innerHTML = '<button class="close" data-close-contact aria-label="Fermer">×</button><p class="eyebrow"><i></i> Demande reçue</p><h2>Merci,<br /><em>à très vite.</em></h2><p>Votre demande a bien été transmise à l’équipe ABK. Nous vous recontactons sous 24 h ouvrées.</p><button class="button primary wide" data-close-contact>Fermer <span>→</span></button>'; contact.querySelectorAll('[data-close-contact]').forEach(b=>b.addEventListener('click',()=>contact.classList.remove('open'))); };
$('#quote-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.target, button = form.querySelector('button'), note = $('#quote-note');
  const data = Object.fromEntries(new FormData(form));
  button.disabled = true; note.textContent = 'Envoi en cours…';
  try {
    const r = await fetch(ABK_API + '/quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    const res = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(res.error || 'Envoi impossible');
    form.reset(); modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); thanks();
  } catch (err) {
    note.textContent = (err.message || 'Envoi impossible') + ' — vous pouvez aussi nous écrire directement par e-mail.';
  } finally { button.disabled = false; }
});
// Téléphone et e-mail gérés depuis le back-office.
fetch(ABK_API + '/config').then(r => r.json()).then(({ phone, email }) => {
  if (phone) document.querySelectorAll('[data-abk-phone]').forEach(a => { a.href = 'tel:' + phone.replace(/[^\d+]/g, ''); });
  if (email) document.querySelectorAll('[data-abk-email]').forEach(a => { a.href = 'mailto:' + email; });
}).catch(() => {});
