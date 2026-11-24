"""Plaquettes 4 pages A4 portrait (couverture + 3 pages) pour Orpi et la Ville de Royan.

Pensées pour l'impression recto-verso : marges identiques à gauche et à droite,
numéro de page centré, hauteur de page fixe.
Usage : python3 presentations/src/plaquette.py   (depuis la racine du dépôt)
"""
from build import CSS, LOGO, SHOT, PARTNERS, CAPTIONS, b64, photo, ico, OUT

EXTRA = """
.a4p .page{width:min(794px,100%);min-height:1123px;padding:52px 56px 70px;gap:20px}
.a4p .foot{left:56px;right:56px;bottom:28px;justify-content:center}
.a4p h2{font-size:28px;line-height:1.1}
.a4p .lead{font-size:14.5px}
.a4p .cover{flex-direction:column;padding:0;gap:0}
.a4p .cover .right{flex:none;height:560px;order:-1}
.a4p .cover .left{flex:1;padding:40px 56px 46px;gap:20px}
.a4p .cover .logo{width:190px}
.a4p .cover h1{font-size:44px}
.a4p .page:not(.cover){justify-content:space-between}
.sec{display:flex;flex-direction:column;gap:12px}
.sec h2+.lead{margin-top:-4px}
.st4{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.st4 div{padding:12px 12px 10px;border-left:1px solid var(--line)}
.st4 div:first-child{border-left:0;padding-left:0}
.st4 b{display:block;font:800 24px/1.05 var(--display)}
.st4 span{font-size:12px;color:var(--muted)}
.ex3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.mini{background:var(--white);border:1px solid var(--line);border-radius:14px;padding:13px 14px;display:flex;flex-direction:column;gap:5px;min-width:0}
.mini .chead{gap:10px}
.mini .ico{width:34px;height:34px;border-radius:10px}
.mini .ico svg{width:19px;height:19px}
.mini h3{font-size:14.5px;line-height:1.2}
.mini p{font-size:12.3px;color:var(--muted);line-height:1.45}
.mini .tag{align-self:flex-start;font:700 9.5px var(--text);letter-spacing:.08em;text-transform:uppercase;color:var(--orange-d);background:#fff3e2;border-radius:99px;padding:3px 9px}
.ph3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.ph3 figure{margin:0;height:150px;border-radius:12px;overflow:hidden;position:relative}
.ph3 img{width:100%;height:100%;object-fit:cover;display:block}
.ph3 figcaption{position:absolute;left:8px;bottom:8px;background:#ffffffe6;font-size:10.5px;font-weight:700;border-radius:99px;padding:4px 9px;color:var(--ink)}
.logos{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
.logos div{background:var(--white);border:1px solid var(--line);border-radius:10px;height:54px;display:grid;place-items:center;padding:6px 10px}
.logos img{max-height:30px;max-width:100%;object-fit:contain}
.small{font-size:11px;color:var(--muted)}
.two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.steps6{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.s6{background:var(--white);border:1px solid var(--line);border-top:3px solid var(--orange);border-radius:12px;padding:11px 12px;display:flex;flex-direction:column;gap:3px}
.s6 em{font:800 11px var(--display);font-style:normal;color:var(--blue);letter-spacing:.06em;text-transform:uppercase}
.s6 b{font:800 13.5px var(--display)}
.s6 span{font-size:12px;color:var(--muted);line-height:1.4}
.band{background:var(--ink);color:#fff;border-radius:16px;padding:16px 18px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
.band div{display:flex;flex-direction:column;gap:3px}
.band em{font:800 11px var(--display);font-style:normal;color:var(--orange);letter-spacing:.1em;text-transform:uppercase}
.band b{font:800 14px var(--display)}
.band span{font-size:12px;color:#c5d6e6;line-height:1.4}
.contactbar{background:#0d3a75;color:#fff;border-radius:16px;padding:16px 18px;display:grid;grid-template-columns:auto 1fr 1fr;gap:18px;align-items:center}
.contactbar img{width:120px;background:#fff;border-radius:10px;padding:6px 8px}
.contactbar div{display:flex;flex-direction:column;gap:2px;font-size:12.5px}
.contactbar span{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#9fb6cf}
.contactbar b{font-size:13.5px}
.feat{display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:stretch}
.feat img{width:100%;height:100%;min-height:250px;object-fit:cover;border-radius:14px;display:block}
.qs2{margin:0;padding:0;display:flex;flex-direction:column;gap:6px}
.qs2 li{list-style:none;font-size:12.5px;padding-left:18px;position:relative;color:var(--ink)}
.qs2 li::before{content:"?";position:absolute;left:0;top:0;font:800 12px var(--display);color:var(--orange-d)}
@media screen and (max-width:820px){
  .st4,.logos{grid-template-columns:repeat(2,minmax(0,1fr))}
  .ex3,.two,.steps6,.band,.contactbar,.feat,.ph3{grid-template-columns:1fr}
}
@page{size:210mm 297mm;margin:0}
@media print{.a4p .page{width:210mm;height:297mm;min-height:0}}
"""


def mini(icon, title, body, tag=None):
    t = f'<span class="tag">{tag}</span>' if tag else ""
    return f'<div class="mini">{t}<div class="chead">{ico(icon)}<h3>{title}</h3></div><p>{body}</p></div>'


def foot(label, n):
    return f'<div class="foot"><span>ABK Bâti &amp; Piscine · {label} · {n}</span></div>'


def cover(partner, title_html, subtitle, pic, caption, meeting):
    return f'''<section class="page cover">
  <div class="left">
    <img class="logo" src="{LOGO}" alt="ABK Bâti &amp; Piscine">
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="x">ABK <b>×</b> {partner}</div>
      <h1>{title_html}</h1>
      <p class="lead">{subtitle}</p>
    </div>
    <div class="meta"><div><strong>Rendez-vous</strong>{meeting}</div><div><strong>Contact</strong>05 46 05 72 92</div><div><strong>Site</strong>www.abk-bati.com</div></div>
  </div>
  <div class="right"><img class="cover-photo" src="{photo(pic)}" alt="{caption}"><span class="cover-cap">{caption}</span></div>
</section>'''


def page_abk(label, angle, pics):
    logos = "".join(f'<div><img src="{b64("img/partenaires/" + f, m)}" alt="{n}"></div>' for n, f, m, _, _ in PARTNERS)
    tiles = "".join(f'<figure><img src="{photo(p)}" alt="{CAPTIONS[p]}"><figcaption>{CAPTIONS[p]}</figcaption></figure>' for p in pics)
    return f'''<section class="page">
  <div class="sec">
    <div class="eyebrow">Qui sommes-nous</div>
    <h2>Construire, rénover, embellir. <em>Un seul partenaire, toutes les compétences.</em></h2>
    <p class="lead">Fondée en 1986 et reprise par Karine et son frère Benjamin, ABK Bâti &amp; Piscine conduit les projets de l’étude à la pose : bâti et rénovation, piscines et aménagements extérieurs, réserves d’eau pour la défense incendie.</p>
    <p class="note">{angle}</p>
  </div>
  <div class="st4">
    <div><b>1986</b><span>entreprise familiale</span></div>
    <div><b>3</b><span>expertises</span></div>
    <div><b>Royan</b><span>62 ter rue François Arago</span></div>
    <div><b>24 h</b><span>ouvrées pour rappeler</span></div>
  </div>
  <div class="ex3">
    {mini("pool", "Piscines &amp; extérieurs", "Création et rénovation de bassins, margelles, plages, équipements, sécurité et mise en eau.")}
    {mini("house", "Bâti &amp; rénovation", "Gros œuvre, extensions, rénovation intérieure et extérieure, un seul interlocuteur.")}
    {mini("drop", "Réserves incendie", "Citernes souples Q.B.-CSTB, sortie latérale ou enterrée hors gel, pose clé en main.")}
  </div>
  <div class="sec" style="gap:8px">
    <div class="eyebrow">Nos réalisations</div>
    <div class="ph3">{tiles}</div>
  </div>
  <div class="sec" style="gap:8px">
    <div class="eyebrow">Nos partenaires</div>
    <div class="logos">{logos}</div>
    <p class="small">Les marques et logos restent la propriété de leurs titulaires.</p>
  </div>
  {foot(label, 1)}
</section>'''


def contactbar():
    return f'''<div class="contactbar">
    <img src="{LOGO}" alt="ABK Bâti &amp; Piscine">
    <div><span>Interlocuteurs</span><b>Karine &amp; Benjamin, dirigeants</b><span style="margin-top:6px">Téléphone</span><b>05 46 05 72 92</b></div>
    <div><span>E-mail</span><b>info@abk-piscine.fr</b><span style="margin-top:6px">Adresse</span><b>62 ter rue François Arago, Royan</b></div>
  </div>'''


def document(title, pages):
    return f'''<title>{title}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Manrope:wght@600;700;800&display=swap">
<style>{CSS}{EXTRA}</style>
<main class="deck a4p">
{"".join(pages)}
</main>
'''


# ---------------------------------------------------------------- ORPI
L1 = "Partenariat Orpi"
orpi = document("ABK × Orpi · plaquette", [
 cover("Orpi", "Des biens qui se vendent <span>avec un projet chiffré.</span>",
       "Proposition de partenariat entre ABK Bâti &amp; Piscine et l’agence Orpi : accompagner vendeurs et acquéreurs sur les travaux, de l’estimation à la remise des clés.",
       "maison-contemporaine_01", "Réalisation ABK · villa contemporaine et piscine", "Agence Orpi Royan"),
 page_abk(L1, "Pour une agence immobilière, ABK est un relais unique : un seul contact pour chiffrer, planifier et réaliser les travaux d’un bien, avant la vente comme après l’achat.",
          ["cour-pierre_01", "vue-mer_05", "volet-jardin_01"]),
 f'''<section class="page">
  <div class="sec">
    <div class="eyebrow">Pourquoi travailler ensemble</div>
    <h2>La question qui ralentit une vente : <em>« combien coûtent les travaux ? »</em></h2>
  </div>
  <div class="ex3">
    {mini("eye", "Pour les vendeurs", "Un bien remis en état se défend mieux à la négociation. Une remise en état ciblée coûte moins qu’une baisse de prix.")}
    {mini("key", "Pour les acquéreurs", "Un chiffrage clair avant l’offre rassure et aide à monter le financement du prêt travaux.")}
    {mini("chart", "Pour l’agence", "Moins d’objections en visite, des délais de vente réduits, un service en plus à proposer.")}
  </div>
  <div class="two">
    <div class="mini" style="background:var(--ink);border:0;color:#fff"><h3>Un atout sur la côte royannaise</h3><p style="color:#c5d6e6">Beaucoup d’acquéreurs achètent une résidence secondaire et vivent loin. Avec l’espace client ABK, ils suivent leur chantier à distance : planning, photos, documents.</p></div>
    <div class="mini" style="background:var(--mist);border:0"><h3>La piscine, argument de vente</h3><p>Bassin à rénover, équipement vieillissant, sécurité à mettre aux normes : ABK chiffre et traite le sujet pour en faire un atout de l’annonce.</p></div>
  </div>
  <div class="sec" style="gap:10px">
    <div class="eyebrow">Le parcours client</div>
    <h2 style="font-size:22px">ABK intervient <em>à chaque étape de la transaction.</em></h2>
    <div class="steps6">
      <div class="s6"><em>1 · Mandat</em><b>Pré-diagnostic</b><span>Visite rapide et liste des points à traiter avant la mise en vente.</span></div>
      <div class="s6"><em>2 · Mise en vente</em><b>Remise en état</b><span>Petits travaux, extérieurs, remise en service de la piscine.</span></div>
      <div class="s6"><em>3 · Visites</em><b>Fiche potentiel travaux</b><span>Fourchettes de prix jointes au dossier de visite.</span></div>
      <div class="s6"><em>4 · Offre</em><b>Visite acquéreur</b><span>Devis détaillé pour sécuriser le financement.</span></div>
      <div class="s6"><em>5 · Acte</em><b>Planning prêt</b><span>Démarrage du chantier calé sur la signature.</span></div>
      <div class="s6"><em>6 · Après l’achat</em><b>Suivi &amp; entretien</b><span>Chantier suivi à distance, entretien des biens gérés.</span></div>
    </div>
  </div>
  <div class="feat" style="grid-template-columns:1.1fr .9fr">
    <img src="{b64('espace-client.jpg','image/jpeg')}" alt="Espace client ABK" style="min-height:190px;object-position:left top;border:1px solid var(--line)">
    <div class="mini" style="justify-content:center"><h3>Un suivi que vos clients peuvent voir</h3><p>Chaque client orienté par l’agence a un interlocuteur unique, un devis détaillé et un espace en ligne : avancement, planning, documents et messages.</p><p class="small">L’agence reste maître de la relation client : ABK intervient à sa demande et partage un compte rendu après chaque visite.</p></div>
  </div>
  {foot(L1, 2)}
</section>''',
 f'''<section class="page">
  <div class="sec">
    <div class="eyebrow">Idées de collaboration</div>
    <h2>Six offres <em>à construire ensemble.</em></h2>
  </div>
  <div class="two">
    {mini("sun", "Pack « Prêt à vendre »", "Remise en état avant photos et visites : peinture, extérieurs, abords, remise en eau de la piscine.", "Vendeurs")}
    {mini("doc", "Fiche « Potentiel travaux »", "Une page jointe à l’annonce : travaux possibles, fourchettes de prix, délais indicatifs.", "Annonces")}
    {mini("calendar", "Visite technique express", "Une visite avec l’acquéreur avant l’offre et un devis détaillé pour le financement.", "Acquéreurs")}
    {mini("key", "Offre « Bienvenue chez vous »", "Pour les clients de l’agence : visite et devis offerts, conditions préférentielles.", "Nouveaux propriétaires")}
    {mini("pool", "Biens en gestion", "Remise en service des piscines avant la saison, interventions rapides, rapport photo au propriétaire.", "Gestion locative")}
    {mini("mega", "Co-marketing", "Contenus avant/après, réunion « Rénover avant de vendre », supports en vitrine.", "Visibilité")}
  </div>
  <div class="sec" style="gap:10px">
    <div class="eyebrow">Un pilote de 90 jours</div>
    <div class="band">
      <div><em>Mois 1 · Cadrer</em><b>2 ou 3 offres à tester</b><span>Un référent de chaque côté, modèle de fiche travaux, présentation aux négociateurs.</span></div>
      <div><em>Mois 2 · Lancer</em><b>Premiers biens accompagnés</b><span>Visites acquéreurs, premiers contenus avant/après, point mensuel.</span></div>
      <div><em>Mois 3 · Mesurer</em><b>Bilan chiffré partagé</b><span>Dossiers transmis, délais de devis, signatures, satisfaction. Suite et convention.</span></div>
    </div>
    <p class="small">Rémunération et réciprocité (apport d’affaires, conditions clients, visibilité croisée) à définir ensemble et à formaliser par écrit.</p>
  </div>
  <div class="sec" style="gap:8px">
    <div class="eyebrow">À trancher ensemble</div>
    <ul class="qs2"><li>Quelles offres tester en priorité ?</li><li>Qui sont les référents de chaque côté ?</li><li>Quel modèle de rémunération et quels avantages pour les clients ?</li><li>Un premier bien à accompagner dès maintenant ?</li></ul>
  </div>
  {contactbar()}
  {foot(L1, 3)}
</section>''',
])

# ---------------------------------------------------------------- ROYAN
L2 = "Ville de Royan"
royan = document("ABK × Ville de Royan · plaquette", [
 cover("Ville de Royan", "Un partenaire local pour <span>un territoire sûr et bien bâti.</span>",
       "Présentation d’ABK Bâti &amp; Piscine et pistes de collaboration avec la Ville : défense incendie, bâti communal, prévention autour de l’eau et emploi local.",
       "vue-mer_01", "Réalisation ABK · piscine face à l’océan", "Ville de Royan"),
 page_abk(L2, "Pour une collectivité, ABK apporte une expertise technique de proximité sur trois sujets qui la concernent directement : la défense extérieure contre l’incendie, l’entretien du bâti et la sécurité autour de l’eau.",
          ["vue-mer_05", "transformation-bassin_oct-29-02", "terrassement-local_oct-29-03"]),
 f'''<section class="page">
  <div class="sec">
    <div class="eyebrow">Les enjeux du territoire</div>
    <h2>Une ville littorale, <em>des besoins très concrets.</em></h2>
  </div>
  <div class="two">
    {mini("drop", "Défense incendie (DECI)", "Le maire est responsable de la défense extérieure contre l’incendie. Là où le réseau ne suffit pas, une réserve d’eau se met en place rapidement.")}
    {mini("hall", "Patrimoine et bâti", "Un patrimoine des années 1950 qui demande des interventions soignées, planifiées hors saison.")}
    {mini("pool", "Sécurité autour de l’eau", "Piscines privées, résidences secondaires, location saisonnière : la prévention des noyades revient chaque été.")}
    {mini("users", "Économie et emploi local", "Les travaux du bâtiment font vivre les entreprises du bassin royannais toute l’année.")}
  </div>
  <div class="sec" style="gap:10px">
    <div class="eyebrow">Expertise phare · réserves incendie</div>
    <h2 style="font-size:22px">La citerne souple : <em>une réponse rapide aux zones mal défendues.</em></h2>
    <div class="feat">
      <img src="{photo('service-deci')}" alt="Réserve incendie souple raccordée à un poteau d’aspiration" style="height:280px;min-height:0">
      <div class="mini" style="justify-content:center;gap:10px">
        <p>Conçues pour répondre aux exigences des services de secours, nos réserves s’adaptent au terrain et se posent en quelques jours.</p>
        <ul class="ticks" style="font-size:12.5px"><li>Citernes souples Q.B.-CSTB, volume adapté au risque</li><li>Sortie latérale ou enterrée hors gel</li><li>Kit de sectionnement, poteau d’aspiration, signalisation</li><li>Pose clé en main, terrassement et mise en eau</li><li>Dossier technique remis pour la réception</li></ul>
      </div>
    </div>
  </div>
  <div class="band">
    <div><em>Méthode</em><b>Écouter &amp; cadrer</b><span>Visite, besoins, contraintes et enveloppe avant tout chiffrage.</span></div>
    <div><em>Méthode</em><b>Concevoir &amp; planifier</b><span>Un dossier lisible et un planning partagé avec les services.</span></div>
    <div><em>Méthode</em><b>Réaliser &amp; suivre</b><span>Comptes rendus, photos et documents de réception en ligne.</span></div>
  </div>
  {foot(L2, 2)}
</section>''',
 f'''<section class="page">
  <div class="sec">
    <div class="eyebrow">Idées de collaboration</div>
    <h2>Six pistes <em>pour agir ensemble.</em></h2>
  </div>
  <div class="two">
    {mini("drop", "Diagnostic DECI des secteurs sensibles", "Avec les services techniques et le SDIS, repérer les zones à compléter et équiper un site pilote.", "Sécurité")}
    {mini("calendar", "Réserves pour l’été et les événements", "Réserves d’eau pour les sites saisonniers et les grands rassemblements, posées avant la saison.", "Saison")}
    {mini("hall", "Entretien du bâti communal", "Maçonnerie et rénovation des bâtiments communaux, chantiers programmés hors saison.", "Patrimoine")}
    {mini("shield", "Campagne « Piscine en sécurité »", "Avant l’été, information des propriétaires et loueurs : fiche pratique, stand, réunion publique.", "Prévention")}
    {mini("cap", "Apprentissage et emploi local", "Accueil d’apprentis et de stagiaires, forums emploi, artisans et fournisseurs du bassin.", "Emploi")}
    {mini("leaf", "Charte chantier responsable", "Propreté, déchets, gestion des eaux, horaires adaptés, nuisances réduites.", "Environnement")}
  </div>
  <div class="sec" style="gap:10px">
    <div class="eyebrow">Feuille de route jusqu’à l’été 2027</div>
    <div class="band">
      <div><em>Déc. – janv.</em><b>Rencontrer</b><span>Échange avec les services techniques, 1 ou 2 sites pilotes DECI, consultations à venir.</span></div>
      <div><em>Févr. – avril</em><b>Préparer</b><span>Visite technique des sites, étude et chiffrage, supports de prévention.</span></div>
      <div><em>Mai – juin</em><b>Agir avant l’été</b><span>Installations réalisées, campagne lancée, bilan partagé avec la Ville.</span></div>
    </div>
    <p class="small">Toute commande de la Ville passera par les procédures de la commande publique. ABK se propose comme ressource technique et candidat aux consultations, dans le respect de ces règles.</p>
  </div>
  <div class="sec" style="gap:8px">
    <div class="eyebrow">À trancher ensemble</div>
    <ul class="qs2"><li>Quels secteurs sont aujourd’hui les moins bien couverts en défense incendie ?</li><li>Quel interlocuteur côté services techniques pour un premier diagnostic ?</li><li>Une action de prévention autour des piscines pour l’été 2027 ?</li></ul>
  </div>
  {contactbar()}
  {foot(L2, 3)}
</section>''',
])

if __name__ == "__main__":
    for name, html in (("abk-x-orpi-plaquette", orpi), ("abk-x-ville-de-royan-plaquette", royan)):
        (OUT / f"{name}.html").write_text(html)
        print("écrit", OUT / f"{name}.html")
