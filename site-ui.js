(() => {
  const inboxScript=document.createElement('script');inboxScript.src='/quote-inbox.js';inboxScript.defer=true;document.head.append(inboxScript);
  const nav = document.querySelector('header.nav');
  if (nav) {
    const menu = nav.querySelector('nav');
    const expertiseLink = menu?.querySelector('a[href$="#prestations"]');
    if (expertiseLink) {
      const group=document.createElement('div');group.className='expertise-menu';
      const toggle=document.createElement('button');toggle.type='button';toggle.className='expertise-toggle';toggle.textContent=expertiseLink.textContent;toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls','expertise-links');
      const panel=document.createElement('div');panel.className='expertise-panel';panel.id='expertise-links';panel.hidden=true;
      [['piscines-exterieurs.html','Piscines & extérieurs'],['bati-renovation.html','Bâti & rénovation'],['pac-incendie.html','Réserves incendie']].forEach(([href,label])=>{const link=document.createElement('a');link.href=href;link.textContent=label;panel.append(link);});
      function setOpen(open){panel.hidden=!open;toggle.setAttribute('aria-expanded',String(open));}
      toggle.addEventListener('click',()=>setOpen(panel.hidden));
      group.append(toggle,panel);expertiseLink.replaceWith(group);
      document.addEventListener('click',event=>{if(!group.contains(event.target))setOpen(false);});
      group.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();setOpen(false);toggle.focus();}if(event.key==='ArrowDown'&&event.target===toggle){event.preventDefault();setOpen(true);panel.querySelector('a').focus();}});
    }
    if (menu && !menu.querySelector('[href="a-propos.html"]')) {
      const about = document.createElement('a'); about.href = 'a-propos.html'; about.textContent = 'À propos'; menu.append(about);
    }
    const actions = document.createElement('div'); actions.className = 'header-actions';
    actions.innerHTML = '<a href="connexion.html" aria-label="Connexion à votre espace" title="Connexion"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7" r="3.5"/><path d="M4.5 21v-2a7.5 7.5 0 0 1 15 0v2"/></svg></a><span role="img" aria-label="Instagram"><img src="public/brands/instagram.svg" alt="" width="19" height="19"/></span><span role="img" aria-label="Facebook"><img src="public/brands/facebook.png" alt="" width="19" height="19"/></span>';
    nav.insertBefore(actions, nav.querySelector(':scope > button'));
    const contactButton=document.createElement('button');
    contactButton.type='button';contactButton.className='header-contact-button';contactButton.textContent='Contact';
    contactButton.setAttribute('aria-haspopup','dialog');
    const contactDialog=document.createElement('dialog');contactDialog.className='header-contact-dialog';contactDialog.setAttribute('aria-labelledby','header-contact-title');
    contactDialog.innerHTML='<button class="header-contact-close" type="button" aria-label="Fermer les coordonnées">×</button><p class="eyebrow">ABK Bâti & Piscine</p><h2 id="header-contact-title">Contactez notre équipe.</h2><a href="tel:+33546057292"><span>Téléphone</span><strong>05 46 05 72 92</strong></a><a href="mailto:info@abk-piscine.fr"><span>E-mail</span><strong>info@abk-piscine.fr</strong></a><p class="header-contact-address">62 ter rue François Arago<br>17200 Royan</p>';
    document.body.append(contactDialog);actions.prepend(contactButton);
    contactButton.addEventListener('click',()=>contactDialog.showModal());
    contactDialog.querySelector('.header-contact-close').addEventListener('click',()=>contactDialog.close());
    nav.querySelector('.site-menu-toggle')?.addEventListener('click', event => {
      const open = menu.classList.toggle('open'); event.currentTarget.setAttribute('aria-expanded', String(open));
    });
  }
  const common = ['Non défini', 'Dès que possible', 'Dans les 3 mois', 'Dans les 6 mois', 'Dans l’année', 'Autre échéance'];
  const field = (name, label, type = 'text', options = null, required = false, full = false) => ({name, label, type, options, required, full});
  const select = (name, label, options, required = false) => field(name, label, 'select', options, required);
  const schemes = {
    piscine: {label: 'Piscine & extérieurs', groups: [
      ['Votre piscine, vos usages', [select('operation','Votre projet',['Création de piscine','Rénovation de piscine','Équipements / local technique','Aménagement extérieur','Plusieurs besoins'],true),select('bassin','Type de bassin envisagé',['À définir ensemble','Bassin enterré','Mini-piscine','Bassin existant à rénover','Autre']),field('dimensions','Dimensions et profondeur souhaitées'),select('usage','Usage principal',['Familial / loisirs','Nage','Bien-être','Location / accueil','À définir']),select('revetement','Revêtement souhaité',['À définir ensemble','Liner','Membrane armée','Autre / existant à conserver']),field('existant','Pour une rénovation : âge, état, fuites et équipements actuels','textarea',null,false,true)]],
      ['Terrain, équipements et enveloppe', [field('commune','Commune et code postal','text',null,true),select('terrain','Votre terrain',['Plat','En pente','Terrasses / niveaux','À évaluer']),select('acces','Accès aux engins',['Accès large et direct','Passage étroit','Accès difficile / à étudier','Je ne sais pas']),field('acces_largeur','Largeur du passage et obstacles connus'),field('terrasse','Terrasse, margelles, plage : matériaux et surface envisagés'),field('equipements','Équipements souhaités : chauffage, traitement, éclairage, couverture, pilotage…','textarea',null,false,true),select('budget','Enveloppe globale envisagée',['À définir','Moins de 20 000 €','20 000 à 40 000 €','40 000 à 60 000 €','60 000 à 100 000 €','Plus de 100 000 €']),select('delai','Échéance souhaitée',common),select('etudes','Plans / démarches déjà engagés',['Aucun à ce stade','Plans disponibles','Démarches en cours','Autorisations obtenues','À préciser']),field('contraintes','Contraintes, réseaux, voisinage ou attentes particulières','textarea',null,false,true)]]
    ]},
    renovation: {label: 'Bâti & rénovation', groups: [
      ['Le bien et le périmètre des travaux', [select('operation','Nature du projet',['Rénovation complète','Rénovation partielle','Réaménagement intérieur','Extension / transformation','Travaux extérieurs','À définir'],true),select('bien','Type de bien',['Maison','Appartement','Local professionnel','Dépendance','Autre'],true),field('surface','Surface concernée (m²)'),field('anciennete','Année de construction ou période estimée'),select('occupation','Occupation pendant les travaux',['Bien vacant','Habité pendant les travaux','À définir']),field('pieces','Pièces et niveaux concernés'),field('travaux','Travaux souhaités : structure, cloisons, isolation, électricité, plomberie, sols, peinture…','textarea',null,true,true),field('etat','État actuel et problèmes connus','textarea',null,false,true)]],
      ['Organisation, contraintes et budget', [field('commune','Commune et code postal','text',null,true),select('statut','Votre situation',['Propriétaire','Acquéreur / achat en cours','Locataire avec autorisation','Professionnel / mandataire','Autre']),select('acces','Accès au chantier',['Accès direct','Étage sans ascenseur','Étage avec ascenseur','Accès contraint','À préciser']),select('documents','Documents disponibles',['Aucun à ce stade','Plans','Diagnostics','Plans et diagnostics','Dossier d’architecte / maîtrise d’œuvre']),select('budget','Enveloppe globale envisagée',['À définir','Moins de 20 000 €','20 000 à 50 000 €','50 000 à 100 000 €','100 000 à 200 000 €','Plus de 200 000 €']),select('delai','Début souhaité',common),field('livraison','Date de livraison souhaitée / impérative'),field('contraintes','Copropriété, accès, horaires, autorisations et contraintes de calendrier','textarea',null,false,true),field('priorites','Vos priorités : confort, performance, esthétique, budget, mise en location…','textarea',null,false,true)]]
    ]},
    incendie: {label: 'Réserve incendie · DECI', groups: [
      ['Votre site et le besoin en réserve d’eau', [select('operation','Votre besoin',['Nouvelle installation','Remplacement de citerne','Mise à niveau d’un équipement','Étude de faisabilité','À définir'],true),select('site','Type de site',['Habitation / lotissement','Exploitation agricole','Entreprise / entrepôt','Établissement accueillant du public','Collectivité','Autre'],true),field('commune','Commune et code postal','text',null,true),select('prescriptions','Prescriptions du SDIS / service compétent',['Pas encore de prescriptions','Dossier en cours','Prescriptions disponibles','Volume déjà communiqué'],true),field('volume','Volume demandé ou envisagé (m³)'),select('sortie','Configuration envisagée',['À étudier ensemble','Sortie latérale','Sortie enterrée hors gel','Col de cygne','Poteau d’aspiration']),field('prescriptions_detail','Exigences connues : volume, accès, nombre de sorties, distance au bâtiment…','textarea',null,false,true)]],
      ['Implantation et équipements', [field('emprise','Dimensions de l’emplacement disponible (longueur × largeur)'),select('plateforme','État de la plateforme',['À créer','Existante à contrôler','Plateforme prête','Je ne sais pas']),select('pente','Nature du terrain',['Plat','En pente','À évaluer']),select('acces','Accès livraison / secours',['Accès dégagé','Accès contraint','À vérifier avec les services compétents']),field('distance','Distance estimée entre la citerne et la prise d’aspiration'),select('sectionnement','Kit de sectionnement enterré',['À étudier','Souhaité','Déjà présent']),field('eau','Point de remplissage disponible et emplacement'),select('budget','Budget envisagé',['À définir après étude','Moins de 15 000 €','15 000 à 25 000 €','25 000 à 40 000 €','Plus de 40 000 €']),select('delai','Échéance souhaitée',common),field('contraintes','Climat, gel, réseaux enterrés, accès et autres contraintes','textarea',null,false,true)]]
    ]}
  };
  let dialog, form, stage = 0, category = 'piscine', lastFocus;
  const contacts = [field('nom','Nom et prénom','text',null,true),field('email','E-mail','email',null,true),field('telephone','Téléphone','tel',null,true),select('profil','Vous êtes',['Particulier','Professionnel','Collectivité','Autre'],true),field('disponibilites','Créneaux de rappel préférés'),field('message','Précisions complémentaires','textarea',null,false,true)];
  function buildField(f) {
    const label = document.createElement('label'); label.textContent = f.label + (f.required ? ' *' : '');
    if (f.full) label.className='full';
    const input = document.createElement(f.type==='select'?'select':f.type==='textarea'?'textarea':'input');
    if (input.tagName==='INPUT') input.type=f.type;
    if (f.options) {const empty=document.createElement('option');empty.value='';empty.textContent='Sélectionner';input.append(empty);f.options.forEach(value=>{const option=document.createElement('option');option.value=value;option.textContent=value;input.append(option);});}
    input.name=f.name;input.required=f.required;input.dataset.label=f.label;
    if(f.name==='nom')input.autocomplete='name';if(f.name==='email')input.autocomplete='email';if(f.name==='telephone')input.autocomplete='tel';
    label.append(input);return label;
  }
  function showStage() {
    form.querySelectorAll('fieldset').forEach((f,i)=>f.hidden=i!==stage);
    form.querySelectorAll('.quote-steps li').forEach((li,i)=>{li.classList.toggle('active',i===stage);li.classList.toggle('done',i<stage);});
    form.querySelector('[data-back]').hidden=stage===0;
    form.querySelector('[data-next]').textContent=stage===2?'Préparer ma demande':'Continuer';
    dialog.scrollTop=0;
  }
  function valid() {for(const control of form.querySelectorAll('fieldset:not([hidden]) input,fieldset:not([hidden]) select,fieldset:not([hidden]) textarea'))if(!control.reportValidity())return false;return true;}
  function ensureDialog() {
    if(dialog)return;
    dialog=document.createElement('dialog');dialog.className='quote-dialog';dialog.setAttribute('aria-labelledby','detailed-quote-title');
    dialog.innerHTML='<header><div><p class="eyebrow">Votre étude sur mesure</p><h2 id="detailed-quote-title"></h2></div><button class="quote-close" aria-label="Fermer le questionnaire">×</button></header><form novalidate></form><div class="quote-result" hidden><h3>Votre demande est prête.</h3><p>Ouvrez votre messagerie pour vérifier et envoyer votre demande à ABK. Le questionnaire seul ne transmet aucun message.</p><textarea readonly aria-label="Récapitulatif de votre demande"></textarea><p><a data-send-mail class="button primary">Ouvrir ma messagerie</a></p><button type="button" class="button ghost" data-download>Télécharger le récapitulatif</button></div>';
    document.body.append(dialog);form=dialog.querySelector('form');
    function close(){dialog.close();document.documentElement.classList.remove('quote-lock');lastFocus?.focus();}
    dialog.querySelector('.quote-close').addEventListener('click',close);
    dialog.addEventListener('close',()=>{document.documentElement.classList.remove('quote-lock');lastFocus?.focus();});
    dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}});
    form.addEventListener('submit',event=>{event.preventDefault();if(!valid())return;if(stage<2){stage++;showStage();return;}const lines=[`Demande de devis — ${schemes[category].label}`,''];form.querySelectorAll('[data-label]').forEach(input=>{if(input.value)lines.push(`${input.dataset.label} : ${input.value}`);});const body=lines.join('\n');const result=dialog.querySelector('.quote-result');result.querySelector('textarea').value=body;result.querySelector('[data-send-mail]').href=`mailto:contact@abk-bati-piscine.fr?subject=${encodeURIComponent('Demande de devis — '+schemes[category].label)}&body=${encodeURIComponent(body)}`;form.hidden=true;result.hidden=false;dialog.scrollTop=0;});
    dialog.querySelector('[data-download]').addEventListener('click',()=>{const blob=new Blob([dialog.querySelector('.quote-result textarea').value],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`demande-devis-abk-${category}.txt`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
  }
  function open(type='piscine') {
    ensureDialog();if(!dialog.open)lastFocus=document.activeElement;
    if(type==='general') {
      document.querySelector('.contact-panel')?.classList.remove('open');
      dialog.querySelector('h2').textContent='Quel est votre projet ?';dialog.querySelector('.quote-result').hidden=true;form.hidden=false;form.replaceChildren();
      const intro=document.createElement('p');intro.className='quote-help';intro.textContent='Choisissez votre expertise pour ouvrir le questionnaire adapté.';form.append(intro);
      Object.entries(schemes).forEach(([key,scheme])=>{const button=document.createElement('button');button.type='button';button.className='button primary wide';button.textContent=scheme.label;button.addEventListener('click',()=>open(key));form.append(button);});
      if(!dialog.open)dialog.showModal();document.documentElement.classList.add('quote-lock');return;
    }
    category=schemes[type]?type:'piscine';stage=0;
    document.querySelector('.contact-panel')?.classList.remove('open');
    dialog.querySelector('h2').textContent=schemes[category].label;dialog.querySelector('.quote-result').hidden=true;form.hidden=false;form.replaceChildren();
    const steps=document.createElement('ol');steps.className='quote-steps';steps.innerHTML='<li>01 · Le projet</li><li>02 · Les détails</li><li>03 · Vos coordonnées</li>';form.append(steps);
    const groups=[...schemes[category].groups,['Restons en contact',contacts]];
    groups.forEach(([title,fields],i)=>{const set=document.createElement('fieldset');const legend=document.createElement('legend');legend.textContent=title;set.append(legend);const grid=document.createElement('div');grid.className='quote-fields';fields.forEach(f=>grid.append(buildField(f)));if(i===2){const consent=document.createElement('label');consent.className='consent full';const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.required=true;checkbox.name='consent';consent.append(checkbox,document.createTextNode('J’accepte que les coordonnées renseignées soient utilisées pour répondre à cette demande.'));grid.append(consent);}set.append(grid);form.append(set);});
    const actions=document.createElement('div');actions.className='quote-actions';actions.innerHTML='<button type="button" class="button ghost" data-back>Retour</button><button class="button primary" type="submit" data-next>Continuer</button>';actions.querySelector('[data-back]').onclick=()=>{stage--;showStage();};form.append(actions);const help=document.createElement('p');help.className='quote-help';help.textContent='Les champs marqués * sont nécessaires. Vous pourrez relire votre demande avant de l’envoyer par e-mail.';form.append(help);
    showStage();if(!dialog.open)dialog.showModal();document.documentElement.classList.add('quote-lock');
  }
  window.ABKQuote={open};
  document.querySelectorAll('[data-quote-category]').forEach(button=>button.addEventListener('click',()=>open(button.dataset.quoteCategory)));
})();
