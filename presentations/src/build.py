"""Génère les dossiers de rendez-vous ABK (HTML autonome + PDF A4 paysage).

Usage : python3 presentations/src/build.py   (depuis la racine du dépôt)
"""
import base64, pathlib, subprocess, sys

SRC = pathlib.Path(__file__).resolve().parent
OUT = SRC.parent

def b64(name, mime):
    return f"data:{mime};base64," + base64.b64encode((SRC / name).read_bytes()).decode()

LOGO = b64("logo-abk.webp", "image/webp")
SHOT = b64("espace-client.jpg", "image/jpeg")
CSS = (SRC / "dossier.css").read_text()

ICONS = {
 "pool": '<path d="M3 16c2 0 2-1.4 4.5-1.4S10 16 12 16s2-1.4 4.5-1.4S19 16 21 16M3 20c2 0 2-1.4 4.5-1.4S10 20 12 20s2-1.4 4.5-1.4S19 20 21 20M8 13V5a2 2 0 0 1 4 0M14 13V5a2 2 0 0 1 4 0M8 8h6M8 11h6"/>',
 "house": '<path d="M3 11 12 4l9 7M5 10v10h14V10M10 20v-6h4v6"/>',
 "drop": '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/><path d="M9.5 14.5a2.5 2.5 0 0 0 2.5 2.5"/>',
 "doc": '<path d="M7 3h7l4 4v14H7zM14 3v4h4M10 12h5M10 16h5"/>',
 "calendar": '<path d="M4 6h16v14H4zM4 10h16M8 3v5M16 3v5"/>',
 "sun": '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
 "users": '<path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 5a3 3 0 0 1 0 6M18 14c2 .8 3 3 3 6"/>',
 "mega": '<path d="M4 10v4h3l7 4V6L7 10zM18 9a4 4 0 0 1 0 6"/>',
 "leaf": '<path d="M5 19C5 9 11 5 20 4c0 9-4 15-14 15zM5 19l8-8"/>',
 "key": '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3M14 9l2 2"/>',
 "shield": '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
 "chart": '<path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6"/>',
 "hall": '<path d="M3 21h18M5 21V10M19 21V10M9.7 21V10M14.3 21V10M2 10h20L12 3z"/>',
 "cap": '<path d="M2 9l10-5 10 5-10 5zM6 11v5c3 2 9 2 12 0v-5M22 9v5"/>',
 "eye": '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
 "pin": '<path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>',
}

def ico(name):
    return f'<div class="ico"><svg viewBox="0 0 24 24" aria-hidden="true">{ICONS[name]}</svg></div>'

def card(icon, title, body, items=None, tag=None):
    t = f'<span class="tag">{tag}</span>' if tag else ""
    lis = "".join(f"<li>{i}</li>" for i in (items or []))
    ul = f'<ul class="ticks">{lis}</ul>' if items else ""
    return f'<div class="card">{t}<div class="chead">{ico(icon)}<h3>{title}</h3></div><p>{body}</p>{ul}</div>'

def foot(label, n):
    return f'<div class="foot"><span>ABK Bâti &amp; Piscine · {label}</span><span>{n:02d}</span></div>'

# ---------------------------------------------------------------- illustrations
SKY_WAVES = '''
  <g opacity=".9"><path d="M0 640 C80 620 160 660 250 640 S420 620 500 640 V794 H0z" fill="#1580bd"/>
  <path d="M0 690 C90 670 170 710 260 690 S420 670 500 690 V794 H0z" fill="#0a6aa6"/></g>
  <g stroke="#ffffff" stroke-opacity=".45" stroke-width="2" fill="none">
  <path d="M30 665 q30 -10 60 0 t60 0"/><path d="M300 712 q30 -10 60 0 t60 0"/><path d="M120 740 q30 -10 60 0 t60 0"/></g>'''

COVER_ORPI = f'''<svg viewBox="0 0 500 794" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <circle cx="330" cy="250" r="120" fill="#ffc04a"/><circle cx="330" cy="250" r="150" fill="#ffc04a" opacity=".18"/>
  <path d="M70 330 L250 200 L430 330z" fill="#123f73"/>
  <rect x="100" y="328" width="300" height="232" fill="#fbfcfb"/>
  <rect x="135" y="372" width="64" height="64" fill="#0f5b8f" stroke="#fff" stroke-width="8"/>
  <rect x="300" y="372" width="64" height="64" fill="#0f5b8f" stroke="#fff" stroke-width="8"/>
  <rect x="222" y="440" width="58" height="120" rx="4" fill="#ff9d18"/><circle cx="268" cy="502" r="4" fill="#fff"/>
  <rect x="40" y="560" width="420" height="16" fill="#e7eef0"/>
  <rect x="70" y="576" width="360" height="60" rx="10" fill="#41c5e6"/>
  <path d="M90 600 q25 -8 50 0 t50 0 t50 0 t50 0 t50 0 t50 0" stroke="#fff" stroke-opacity=".7" stroke-width="3" fill="none"/>
  <g transform="translate(395 445)"><rect x="-3" y="0" width="7" height="120" fill="#6b4a2b"/>
  <rect x="-62" y="10" width="124" height="66" rx="8" fill="#fff" stroke="#123f73" stroke-width="3"/>
  <text x="0" y="38" text-anchor="middle" font-family="Manrope,sans-serif" font-weight="800" font-size="15" fill="#123f73">TRAVAUX</text>
  <text x="0" y="60" text-anchor="middle" font-family="Manrope,sans-serif" font-weight="800" font-size="15" fill="#e9780c">CHIFFRÉS ✓</text></g>
  {SKY_WAVES}
</svg>'''

COVER_ROYAN = f'''<svg viewBox="0 0 500 794" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <circle cx="160" cy="300" r="110" fill="#ffc04a"/><circle cx="160" cy="300" r="145" fill="#ffc04a" opacity=".18"/>
  <rect x="0" y="420" width="500" height="40" fill="#2aa7d6" opacity=".6"/>
  <g fill="#1f5a45"><path d="M410 470 l-38 -70 h20 l-28 -55 h18 l-20 -45 l46 0 l-20 45 h18 l-28 55 h20 l-38 70z" transform="translate(30 30)"/>
  <rect x="452" y="500" width="10" height="40" fill="#6b4a2b"/></g>
  <rect x="60" y="440" width="320" height="16" rx="3" fill="#123f73"/>
  <rect x="80" y="456" width="280" height="110" fill="#fbfcfb"/>
  <g fill="#123f73">{''.join(f'<rect x="{100+i*22}" y="470" width="9" height="56"/>' for i in range(6))}</g>
  <rect x="245" y="470" width="96" height="56" fill="#0f5b8f" stroke="#fff" stroke-width="6"/>
  <rect x="90" y="566" width="10" height="34" fill="#123f73"/><rect x="340" y="566" width="10" height="34" fill="#123f73"/>
  <rect x="40" y="598" width="420" height="10" fill="#efe3c6"/>
  <g transform="translate(250 560)"><ellipse cx="0" cy="28" rx="120" ry="16" fill="#0b2d4a" opacity=".18"/>
  <path d="M-105 26 C-112 -4 -80 -14 0 -14 S112 -4 105 26 Z" fill="#3b4f3c"/>
  <path d="M-80 -6 C-40 -12 40 -12 80 -6" stroke="#7d9a7e" stroke-width="3" fill="none"/>
  <rect x="96" y="12" width="34" height="10" rx="3" fill="#d7312f"/><circle cx="134" cy="17" r="8" fill="#d7312f"/></g>
  
  {SKY_WAVES}
</svg>'''

# ---------------------------------------------------------------- pages communes
def cover(partner, title_html, subtitle, art, meeting):
    return f'''<section class="page cover">
  <div class="left">
    <img class="logo" src="{LOGO}" alt="ABK Bâti &amp; Piscine">
    <div style="display:flex;flex-direction:column;gap:18px">
      <div class="x">ABK <b>×</b> {partner}</div>
      <h1>{title_html}</h1>
      <p class="lead">{subtitle}</p>
    </div>
    <div class="meta"><div><strong>Document de rendez-vous</strong>{meeting}</div><div><strong>Édition</strong>Novembre 2026</div><div><strong>Contact</strong>contact@abk-bati-piscine.fr</div></div>
  </div>
  <div class="right">{art}</div>
</section>'''

def about(label, n, angle):
    return f'''<section class="page">
  <div class="eyebrow">Qui sommes-nous</div>
  <div class="split" style="align-items:start;flex:0">
    <h2>Construire, rénover, embellir.<br><em>Un seul partenaire, toutes les compétences.</em></h2>
    <div style="display:flex;flex-direction:column;gap:14px">
      <p class="lead">ABK Bâti &amp; Piscine conduit les projets de l’étude à la pose : bâti et rénovation, piscines et aménagements extérieurs, réserves d’eau pour la défense incendie. Une équipe rigoureuse, des partenaires sélectionnés et une visibilité totale sur chaque étape.</p>
      <p class="note">{angle}</p>
    </div>
  </div>
  <div class="stats">
    <div><b>15 ans</b><span>d’expérience terrain</span></div>
    <div><b>7 500+</b><span>installations certifiées</span></div>
    <div><b>100 %</b><span>des clients accompagnés de bout en bout</span></div>
    <div><b>24 h</b><span>ouvrées pour rappeler chaque demande</span></div>
  </div>
  <div class="grid g3">
    {card("pool","Piscines &amp; extérieurs","Création, rénovation, équipements et aménagements qui prolongent la maison.",["Construction et rénovation de bassins","Margelles, plages, abords","Dispositifs de sécurité et mise en eau"])}
    {card("house","Bâti &amp; rénovation","Des travaux maîtrisés, de la structure aux finitions, avec un interlocuteur unique.",["Gros œuvre et extensions","Rénovation intérieure et extérieure","Coordination des corps d’état"])}
    {card("drop","Réserves incendie (DECI)","Citernes souples Q.B.-CSTB, installation clé en main.",["Pack sortie latérale","Sortie enterrée hors gel","Kit de sectionnement, pose et mise en service"])}
  </div>
  {foot(label, n)}
</section>'''

def method(label, n, title, lead):
    return f'''<section class="page">
  <div class="eyebrow">Notre méthode</div>
  <div class="split">
    <div style="display:flex;flex-direction:column;gap:22px">
      <h2>{title}</h2>
      <p class="lead">{lead}</p>
      <div class="steps">
        <div class="step"><i>1</i><div><h3>Écouter &amp; cadrer</h3><p>Visite, besoins, contraintes et enveloppe : on dessine le bon projet avant de le chiffrer.</p></div></div>
        <div class="step"><i>2</i><div><h3>Concevoir &amp; planifier</h3><p>Un dossier lisible, des choix validés et un planning partagé avec tous les intervenants.</p></div></div>
        <div class="step"><i>3</i><div><h3>Réaliser &amp; suivre</h3><p>Points d’avancement réguliers, photos et une équipe disponible jusqu’à la réception.</p></div></div>
      </div>
    </div>
    <figure style="margin:0;display:flex;flex-direction:column;gap:10px">
      <div class="shot"><img src="{SHOT}" alt="Espace client ABK : avancement du chantier, prochaines étapes et messages"></div>
      <figcaption style="font-size:12px;color:var(--muted)">L’espace client ABK : avancement, planning, documents et messages réunis au même endroit, consultables à distance.</figcaption>
    </figure>
  </div>
  {foot(label, n)}
</section>'''

def contact(label, n, title, questions):
    qs = "".join(f"<li>{q}</li>" for q in questions)
    return f'''<section class="page dark">
  <div class="eyebrow">Prochaines étapes</div>
  <div class="contact">
    <div style="display:flex;flex-direction:column;gap:22px">
      <h2>{title}</h2>
      <p class="lead">Les points à trancher ensemble lors du rendez-vous :</p>
      <ol class="qs">{qs}</ol>
    </div>
    <div class="box">
      <img src="{LOGO}" alt="ABK Bâti &amp; Piscine" style="width:170px;background:#fff;border-radius:14px;padding:10px 14px">
      <div class="row"><span>Interlocuteur</span><b class="fill">[Prénom Nom · fonction]</b></div>
      <div class="row"><span>Téléphone</span><b class="fill">[06 00 00 00 00]</b></div>
      <div class="row"><span>E-mail</span><b>contact@abk-bati-piscine.fr</b></div>
      <div class="row"><span>Engagement</span><b>Rappel sous 24 h ouvrées</b></div>
    </div>
  </div>
  {foot(label, n)}
</section>'''

def doc(title, pages):
    return f'''<title>{title}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Manrope:wght@600;700;800&display=swap">
<style>{CSS}</style>
<main class="deck">
{"".join(pages)}
</main>
'''

# ---------------------------------------------------------------- ORPI
L1 = "Partenariat Orpi"
orpi = doc("ABK × Orpi", [
 cover("Orpi", "Des biens qui se vendent <span>avec un projet chiffré.</span>",
       "Proposition de partenariat entre ABK Bâti &amp; Piscine et l’agence Orpi : accompagner vendeurs et acquéreurs sur les travaux, de l’estimation à la remise des clés.",
       COVER_ORPI, "Agence Orpi · partenariat local"),
 about(L1, 2, "Pour une agence immobilière, ABK est un relais unique : un seul contact pour chiffrer, planifier et réaliser les travaux d’un bien, qu’il s’agisse d’une remise en état avant la vente, d’une rénovation après l’achat ou d’une piscine."),
 f'''<section class="page">
  <div class="eyebrow">Pourquoi travailler ensemble</div>
  <h2>La question qui ralentit une vente : <em>« combien coûtent les travaux ? »</em></h2>
  <div class="grid g3">
    {card("eye","Pour les vendeurs","Un bien présenté propre, sécurisé et mis en valeur se défend mieux à la négociation. Une remise en état ciblée coûte moins qu’une baisse de prix.")}
    {card("key","Pour les acquéreurs","Un chiffrage clair avant l’offre rassure, aide à monter le financement (prêt travaux) et évite les renégociations de dernière minute.")}
    {card("chart","Pour l’agence","Des dossiers plus solides, moins d’objections en visite, des délais de vente réduits et un service différenciant à proposer en rendez-vous d’estimation.")}
  </div>
  <div class="grid g2">
    <div class="card" style="background:var(--ink);color:#fff;border:0">
      <h3>Un atout sur la côte royannaise</h3>
      <p style="color:#c5d6e6">Une part importante des acquéreurs achète une résidence secondaire et vit loin du bien. Avec l’espace client ABK, ils suivent leur chantier à distance : planning, photos, documents et validations en ligne.</p>
    </div>
    <div class="card" style="background:var(--mist);border:0">
      <h3>La piscine, argument de vente</h3>
      <p>Bassin à rénover, équipement vieillissant, dispositif de sécurité à mettre en conformité : ABK chiffre et traite le sujet pour qu’il devienne un atout dans l’annonce plutôt qu’un point de négociation.</p>
    </div>
  </div>
  {foot(L1, 3)}
</section>''',
 method(L1, 4, "Un process rassurant, <em>que vos clients peuvent suivre.</em>",
        "Chaque client orienté par l’agence bénéficie du même cadre : un interlocuteur unique, un devis détaillé et un suivi en ligne jusqu’à la réception."),
 f'''<section class="page">
  <div class="eyebrow">Le parcours client</div>
  <h2>ABK intervient <em>à chaque étape de la transaction.</em></h2>
  <p class="lead">Six moments où l’agence peut s’appuyer sur ABK, sans alourdir son travail.</p>
  <div class="flow mid">
    <div class="st"><div class="dot">1</div><b>Mandat</b><div class="abk"><strong>Pré-diagnostic</strong>Visite rapide du bien et liste des points à traiter avant la mise en vente.</div></div>
    <div class="st"><div class="dot">2</div><b>Mise en vente</b><div class="abk"><strong>Remise en état</strong>Petits travaux, extérieurs, remise en service de la piscine.</div></div>
    <div class="st"><div class="dot">3</div><b>Visites</b><div class="abk"><strong>Fiche potentiel travaux</strong>Fourchettes de prix jointes au dossier de visite.</div></div>
    <div class="st"><div class="dot">4</div><b>Offre</b><div class="abk"><strong>Visite technique acquéreur</strong>Devis détaillé pour sécuriser le financement.</div></div>
    <div class="st"><div class="dot">5</div><b>Acte</b><div class="abk"><strong>Planning prêt</strong>Démarrage du chantier calé sur la date de signature.</div></div>
    <div class="st"><div class="dot">6</div><b>Après l’achat</b><div class="abk"><strong>Suivi &amp; entretien</strong>Chantier suivi à distance, entretien des biens en gestion.</div></div>
  </div>
  <p class="note push">L’agence reste maître de la relation client : ABK n’intervient qu’à sa demande ou avec l’accord du client, et partage un compte rendu après chaque visite.</p>
  {foot(L1, 5)}
</section>''',
 f'''<section class="page">
  <div class="eyebrow">Idées de collaboration</div>
  <h2>Six offres à construire ensemble.</h2>
  <div class="grid g3">
    {card("sun","Pack « Prêt à vendre »","Une remise en état ciblée avant les photos et les visites : peinture, extérieurs, abords et remise en eau de la piscine.",None,"Vendeurs")}
    {card("doc","Fiche « Potentiel travaux »","Une page jointe à l’annonce ou au dossier de visite : travaux possibles, fourchettes de prix, délais indicatifs.",None,"Annonces")}
    {card("calendar","Visite technique express","Une visite avec l’acquéreur avant l’offre, et un devis détaillé pour monter le financement.",None,"Acquéreurs")}
    {card("key","Offre « Bienvenue chez vous »","Pour les clients de l’agence : visite et devis offerts, conditions préférentielles sur les premiers travaux.",None,"Nouveaux propriétaires")}
    {card("pool","Biens en gestion &amp; résidences secondaires","Remise en service des piscines avant la saison, interventions rapides sur les biens gérés, rapport photo au propriétaire.",None,"Gestion locative")}
    {card("mega","Co-marketing","Contenus avant/après pour les réseaux de l’agence, réunion d’information « Rénover avant de vendre », supports en vitrine.",None,"Visibilité")}
  </div>
  {foot(L1, 6)}
</section>''',
 f'''<section class="page">
  <div class="eyebrow">Cadre proposé</div>
  <h2>Un pilote de 90 jours, <em>simple à mesurer.</em></h2>
  <div class="timeline">
    <div class="phase"><span class="when">Mois 1</span><h3>Cadrer</h3><ul class="ticks"><li>Choix de 2 ou 3 offres à tester</li><li>Désignation d’un référent de chaque côté</li><li>Modèle de fiche « Potentiel travaux »</li><li>Formation courte des négociateurs</li></ul></div>
    <div class="phase"><span class="when">Mois 2</span><h3>Lancer</h3><ul class="ticks"><li>Premiers biens accompagnés</li><li>Visites techniques acquéreurs</li><li>Premiers contenus avant/après</li><li>Point d’étape mensuel</li></ul></div>
    <div class="phase"><span class="when">Mois 3</span><h3>Mesurer</h3><ul class="ticks"><li>Bilan chiffré partagé</li><li>Retours clients et négociateurs</li><li>Décision : poursuite, ajustement, extension</li><li>Convention de partenariat</li></ul></div>
  </div>
  <div class="kpis mid">
    <div class="kpi"><b>Dossiers transmis</b><span>Biens et clients orientés vers ABK</span></div>
    <div class="kpi"><b>Délai de devis</b><span>De la visite au devis remis</span></div>
    <div class="kpi"><b>Taux de signature</b><span>Devis acceptés sur devis remis</span></div>
    <div class="kpi"><b>Satisfaction</b><span>Avis des clients accompagnés</span></div>
  </div>
  <p class="note">Rémunération et réciprocité (apport d’affaires, conditions clients, visibilité croisée) à définir ensemble et à formaliser dans une convention écrite, en toute transparence vis-à-vis des clients.</p>
  {foot(L1, 7)}
</section>''',
 contact(L1, 8, "On démarre <em>avec un premier bien ?</em>",
   ["Quelles offres tester en priorité pendant le pilote ?",
    "Qui sont les référents côté agence et côté ABK ?",
    "Quel modèle de rémunération et quels avantages pour les clients ?",
    "Un premier bien du portefeuille à accompagner dès maintenant ?"]),
])

# ---------------------------------------------------------------- ROYAN
L2 = "Rencontre Ville de Royan"
royan = doc("ABK × Ville de Royan", [
 cover("Ville de Royan", "Un partenaire local pour <span>un territoire sûr et bien bâti.</span>",
       "Présentation d’ABK Bâti &amp; Piscine et pistes de collaboration avec la Ville : défense incendie, bâti, prévention autour de l’eau et emploi local.",
       COVER_ROYAN, "Ville de Royan · services techniques et élus"),
 about(L2, 2, "Pour une collectivité, ABK apporte une expertise technique de proximité sur trois sujets qui la concernent directement : la défense extérieure contre l’incendie, l’entretien du bâti et la sécurité autour de l’eau."),
 f'''<section class="page">
  <div class="eyebrow">Les enjeux du territoire</div>
  <h2>Une ville littorale, <em>des besoins très concrets.</em></h2>
  <div class="grid g2 mid">
    {card("drop","Défense incendie (DECI)","Le maire est responsable de la défense extérieure contre l’incendie sur sa commune. Là où le réseau d’eau ne permet pas d’assurer les débits, une réserve d’eau est une solution rapide à mettre en place.",["Secteurs éloignés des poteaux incendie","Proximité de massifs boisés en été","Sites accueillant du public en saison"])}
    {card("hall","Patrimoine et bâti","La ville reconstruite après-guerre possède un patrimoine architectural des années 1950 qui demande des interventions soignées et respectueuses.",["Entretien des bâtiments communaux","Rénovation respectueuse du style","Chantiers planifiés hors saison"])}
    {card("pool","Sécurité autour de l’eau","Nombreuses piscines privées, résidences secondaires et location saisonnière : la prévention des noyades est un sujet de chaque été.",["Dispositifs de sécurité obligatoires","Information des propriétaires","Remise en service avant la saison"])}
    {card("users","Économie et emploi local","Les travaux du bâtiment font vivre les entreprises du bassin royannais toute l’année, y compris hors saison touristique.",["Apprentissage et stages","Artisans et fournisseurs locaux","Activité répartie sur l’année"])}
  </div>
  {foot(L2, 3)}
</section>''',
 f'''<section class="page">
  <div class="eyebrow">Expertise phare · Réserves incendie</div>
  <div class="split" style="align-items:start">
    <div style="display:flex;flex-direction:column;gap:18px">
      <h2>La citerne souple : <em>une réponse rapide aux zones mal défendues.</em></h2>
      <p class="lead">Conçues pour répondre aux exigences des services de secours, nos réserves s’intègrent aux contraintes du terrain et se posent en quelques jours.</p>
      <ul class="ticks" style="font-size:14.5px;gap:8px">
        <li>Citernes souples Q.B.-CSTB, volumes adaptés au risque à défendre</li>
        <li>Pack sortie latérale ou sortie enterrée hors gel</li>
        <li>Kit de sectionnement, poteau d’aspiration et signalisation</li>
        <li>Pose clé en main, terrassement et mise en eau compris</li>
        <li>Dossier technique remis pour la réception par les services compétents</li>
      </ul>
    </div>
    <div class="card" style="padding:18px">
      <svg viewBox="0 0 460 300" role="img" aria-label="Schéma d’une réserve incendie souple avec poteau d’aspiration">
        <rect x="0" y="0" width="460" height="300" rx="14" fill="#eaf6fa"/>
        <rect x="0" y="210" width="460" height="90" fill="#cfe3d2"/>
        <path d="M60 210 C50 160 110 150 210 150 S370 160 360 210 Z" fill="#3b4f3c"/>
        <path d="M95 168 C150 160 280 160 330 168" stroke="#7d9a7e" stroke-width="3" fill="none"/>
        <path d="M360 200 H400 V150" stroke="#123f73" stroke-width="8" fill="none" stroke-linecap="round"/>
        <rect x="388" y="118" width="24" height="36" rx="5" fill="#d7312f"/>
        <rect x="380" y="112" width="40" height="10" rx="4" fill="#d7312f"/>
        <rect x="372" y="196" width="10" height="18" fill="#ff9d18"/>
        <g font-family="DM Sans,sans-serif" font-size="12" fill="#072a5c">
          <text x="140" y="138" font-weight="700">Citerne souple</text>
          <text x="140" y="124" fill="#4f6680">30 à 120 m³ selon le besoin</text>
          <text x="330" y="100" font-weight="700">Poteau d’aspiration</text>
          <text x="290" y="244" font-weight="700">Vanne de sectionnement</text>
          <path d="M377 214 L360 232" stroke="#072a5c"/>
          <text x="40" y="270" fill="#4f6680">Plateforme stabilisée · accès engins de secours</text>
        </g>
      </svg>
    </div>
  </div>
  {foot(L2, 4)}
</section>''',
 method(L2, 5, "Des chantiers <em>organisés et traçables.</em>",
        "Les services techniques suivent chaque intervention en ligne : planning, comptes rendus, photos et documents de réception."),
 f'''<section class="page">
  <div class="eyebrow">Idées de collaboration</div>
  <h2>Six pistes pour agir ensemble.</h2>
  <div class="grid g3">
    {card("drop","Diagnostic DECI des secteurs sensibles","Avec les services techniques et le SDIS, repérer les zones où une réserve d’eau compléterait le réseau, puis équiper un premier site pilote.",None,"Sécurité")}
    {card("calendar","Réserves pour l’été et les événements","Solutions de réserve d’eau pour les sites saisonniers et les grands rassemblements, installées avant la saison.",None,"Saison")}
    {card("hall","Entretien du bâti communal","Interventions de maçonnerie et de rénovation sur les bâtiments communaux, avec des chantiers programmés hors saison touristique.",None,"Patrimoine")}
    {card("shield","Campagne « Piscine en sécurité »","Avant l’été, information des propriétaires et loueurs saisonniers sur les dispositifs de sécurité obligatoires : fiche pratique, stand, réunion publique.",None,"Prévention")}
    {card("cap","Apprentissage et emploi local","Accueil d’apprentis et de stagiaires, participation aux forums emploi, recours aux artisans et fournisseurs du bassin.",None,"Emploi")}
    {card("leaf","Charte chantier responsable","Propreté, gestion des déchets et des eaux, horaires adaptés, nuisances réduites aux abords des chantiers.",None,"Environnement")}
  </div>
  <p class="note push">Toute commande de la Ville passera par les procédures de la commande publique. ABK se propose comme ressource technique et candidat aux consultations, dans le respect de ces règles.</p>
  {foot(L2, 6)}
</section>''',
 f'''<section class="page">
  <div class="eyebrow">Feuille de route</div>
  <h2>Avancer d’ici <em>la saison 2027.</em></h2>
  <div class="timeline">
    <div class="phase"><span class="when">Décembre – janvier</span><h3>Rencontrer</h3><ul class="ticks"><li>Échange avec les services techniques</li><li>Identification de 1 ou 2 sites pilotes DECI</li><li>Calendrier des consultations à venir</li></ul></div>
    <div class="phase"><span class="when">Février – avril</span><h3>Préparer</h3><ul class="ticks"><li>Visite technique des sites pilotes</li><li>Étude et chiffrage des solutions</li><li>Supports de la campagne « Piscine en sécurité »</li></ul></div>
    <div class="phase"><span class="when">Mai – juin</span><h3>Agir avant l’été</h3><ul class="ticks"><li>Installations réalisées avant la saison</li><li>Lancement de la campagne de prévention</li><li>Bilan partagé avec la Ville</li></ul></div>
  </div>
  <div class="kpis mid">
    <div class="kpi"><b>Sites étudiés</b><span>Secteurs diagnostiqués avec les services</span></div>
    <div class="kpi"><b>Réserves posées</b><span>Mises en service avant l’été</span></div>
    <div class="kpi"><b>Foyers informés</b><span>Propriétaires touchés par la campagne</span></div>
    <div class="kpi"><b>Emplois locaux</b><span>Apprentis et artisans mobilisés</span></div>
  </div>
  {foot(L2, 7)}
</section>''',
 contact(L2, 8, "Construisons la suite, <em>ensemble.</em>",
   ["Quels secteurs de la commune sont aujourd’hui les moins bien couverts en défense incendie ?",
    "Quel interlocuteur côté services techniques pour un premier diagnostic ?",
    "Une action de prévention autour des piscines intéresse-t-elle la Ville pour l’été 2027 ?",
    "Quelles consultations de travaux sont prévues dans les prochains mois ?"]),
])

for name, html in (("abk-x-orpi", orpi), ("abk-x-ville-de-royan", royan)):
    (OUT / f"{name}.html").write_text(html)
    print("écrit", OUT / f"{name}.html")
