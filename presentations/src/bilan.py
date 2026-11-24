"""Bilan du premier mois ABK (24 octobre – 24 novembre 2026) et plan d'action de décembre.

Usage : python3 presentations/src/bilan.py   (depuis la racine du dépôt)
"""
from build import CSS, LOGO, photo, ico, card, foot, number, OUT

L = "Bilan du premier mois"

EXTRA = """
.kpis6{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:12px}
.big{background:var(--white);border:1px solid var(--line);border-radius:16px;padding:16px 16px 14px;display:flex;flex-direction:column;gap:4px;min-width:0}
.big b{font:800 30px/1.05 var(--display);font-variant-numeric:tabular-nums}
.big span{font-size:12.5px;color:var(--muted)}
.big em{font-style:normal;font-size:11.5px;font-weight:700;color:#1a9b5a}
.win{background:linear-gradient(135deg,#0d3a75,var(--ink));color:#fff;border-radius:20px;padding:24px 26px;display:grid;grid-template-columns:auto 1fr 1fr;gap:26px;align-items:center}
.win h3{font-size:22px}
.win .w{display:flex;gap:14px;align-items:center}
.win .w b{display:block;font:800 17px var(--display)}
.win .w span{font-size:13.5px;color:#c5d6e6}
.medal{width:54px;height:54px;border-radius:50%;background:var(--orange);display:grid;place-items:center;flex:none}
.medal svg{width:28px;height:28px;fill:none;stroke:#fff;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.shots{display:grid;grid-template-columns:1fr 1fr .62fr .62fr;gap:12px}
.shots figure{margin:0;position:relative;border-radius:14px;overflow:hidden;border:1px solid var(--line);background:#fff}
.shots img{width:100%;height:100%;object-fit:cover;object-position:top center;display:block}
.shots .d{aspect-ratio:1440/900}
.shots figcaption{position:absolute;left:10px;bottom:10px;background:#ffffffeb;color:var(--ink);font-size:11.5px;font-weight:700;border-radius:99px;padding:5px 11px}
.shots .tall{grid-row:span 2}
.bars{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:14px;align-items:end;height:210px;border-bottom:1px solid var(--line);padding:0 6px}
.bar{display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:6px;height:100%}
.bar .pair{display:flex;gap:6px;align-items:flex-end;height:170px}
.bar i{display:block;width:26px;border-radius:6px 6px 0 0}
.bar .c{background:var(--blue)}.bar .d{background:var(--orange)}
.bar small{font:700 12px var(--display);color:var(--ink);font-variant-numeric:tabular-nums}
.wk{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:14px;padding:8px 6px 0;font-size:12px;color:var(--muted);text-align:center}
.legend{display:flex;gap:18px;font-size:12.5px;color:var(--muted)}
.legend i{display:inline-block;width:11px;height:11px;border-radius:3px;margin-right:6px;vertical-align:-1px}
.miles{display:flex;flex-direction:column;gap:7px;font-size:13.5px}
.miles div{display:grid;grid-template-columns:62px 1fr;gap:10px}
.miles b{font:800 13px var(--display);color:var(--orange-d);font-variant-numeric:tabular-nums}
.top{width:100%;border-collapse:collapse;font-size:13.5px}
.top td{padding:5px 6px;border-bottom:1px solid var(--line)}
.top td:last-child{text-align:right;font:800 15px var(--display);font-variant-numeric:tabular-nums}
.top .barc{width:38%}
.top .barc i{display:block;height:8px;border-radius:4px;background:linear-gradient(90deg,var(--sky),var(--blue))}
.split3{display:grid;grid-template-columns:1.05fr .95fr;gap:28px;flex:1}
.mix{display:flex;flex-direction:column;gap:10px}
.mix div{display:grid;grid-template-columns:96px 1fr 44px;gap:10px;align-items:center;font-size:13.5px}
.mix i{display:block;height:12px;border-radius:6px;background:var(--orange)}
.mix b{font:800 14px var(--display);text-align:right}
.made{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
.mk{background:var(--white);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column}
.mk .vis{height:118px;display:grid;place-items:center;background:var(--mist);position:relative}
.mk .vis img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:top left}
.mk .vis b{font:800 46px var(--display);color:var(--blue)}
.mk .vis svg{width:54px;height:54px;fill:none;stroke:var(--blue);stroke-width:1.4;stroke-linecap:round;stroke-linejoin:round}
.mk .txt{padding:12px 14px 14px;display:flex;flex-direction:column;gap:3px}
.mk .txt b{font:800 15px var(--display)}
.mk .txt span{font-size:12.5px;color:var(--muted)}
.weeks{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
.weeks .phase{padding:18px}
.weeks .phase h3{font-size:17px}
.weeks ul.ticks{font-size:13px}
.goals{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px}
.goal{border:2px solid var(--line);border-radius:14px;padding:12px 14px;background:var(--white)}
.goal b{display:block;font:800 22px var(--display);color:var(--blue)}
.goal span{font-size:12.5px;color:var(--muted)}
.prio{font:700 10.5px var(--text);letter-spacing:.08em;text-transform:uppercase;border-radius:99px;padding:4px 10px;align-self:flex-start}
.p1{background:#ffe9cc;color:#b45d00}.p2{background:#dff1f8;color:#0a6aa6}
.compact .card{padding:13px 15px;gap:4px}.compact .card h3{font-size:16px}.compact .card p{font-size:12.8px}
.meet{display:grid;grid-template-columns:1.3fr 1fr 1fr 1fr;gap:12px;background:var(--ink);color:#fff;border-radius:18px;padding:18px 20px;align-items:center}
.meet h3{font-size:18px;margin:6px 0 4px}
.meet p{font-size:13px;color:#c5d6e6}
.fmt{background:#0d3a75;border-radius:12px;padding:12px 14px;display:flex;flex-direction:column;gap:3px;align-self:stretch}
.fmt b{font:800 14.5px var(--display)}
.fmt span{font-size:12.5px;color:#c5d6e6}
.steps5{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px}
.st5{background:var(--white);border:1px solid var(--line);border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:7px}
.st5 i{font:800 13px var(--display);font-style:normal;width:32px;height:32px;border-radius:50%;display:grid;place-items:center;background:var(--ink);color:#fff}
.st5 h3{font-size:16px}
.st5 ul.ticks{font-size:12.5px}
.cal{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
.cal div{background:var(--mist);border-radius:14px;padding:13px 14px;font-size:13px}
.cal b{display:block;font:800 13px var(--display);color:var(--orange-d);margin-bottom:4px}
@media screen and (max-width:820px){
  .kpis6,.goals{grid-template-columns:repeat(2,minmax(0,1fr))}
  .win,.split3,.made,.weeks,.steps5,.cal,.meet{grid-template-columns:1fr}
  .shots{grid-template-columns:1fr 1fr;grid-template-rows:auto}
  .shots figure{height:180px}.shots .tall{grid-row:auto}
  .bar i{width:14px}
}
"""

TROPHY = '<svg viewBox="0 0 24 24"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4"/></svg>'
CARD_ICO = '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h6M7 13h4"/></svg>'
SIGN_ICO = '<svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="11" rx="1.5"/><path d="M8 14v7M16 14v7M8 7h8M8 10h5"/></svg>'

# ---------------------------------------------------------------- chiffres
WEEKS = [("20–26 oct.", 12, 6), ("27 oct.–2 nov.", 5, 9), ("3–9 nov.", 11, 4),
         ("10–16 nov.", 2, 2), ("17–23 nov.", 0, 0), ("24 nov.", 6, 1)]
TOP = [("Reel chantier piscine", "10 nov.", 738), ("Publication #rénovationroyan", "9 nov.", 732),
       ("Reel chantier", "10 nov.", 75), ("Reel chantier", "10 nov.", 29),
       ("Publication #royanpiscine", "9 nov.", 14), ("Reel « Vous représentez une collectivité »", "9 nov.", 14),
]


def bars():
    mx = max(max(c, d) for _, c, d in WEEKS)
    cols = "".join(
        f'<div class="bar"><div class="pair"><i class="c" style="height:{max(2, c / mx * 160):.0f}px" title="{c}"></i>'
        f'<i class="d" style="height:{max(2, d / mx * 160):.0f}px" title="{d}"></i></div><small>{c} · {d}</small></div>'
        for _, c, d in WEEKS)
    labels = "".join(f"<span>{w}</span>" for w, _, _ in WEEKS)
    return f'<div class="bars">{cols}</div><div class="wk">{labels}</div>'


def top_rows():
    mx = TOP[0][2]
    return "".join(f'<tr><td>{t} <small style="color:var(--muted)">· {d}</small></td><td class="barc"><i style="width:{v / mx * 100:.0f}%"></i></td><td>{v}</td></tr>' for t, d, v in TOP)


pages = [
 # 1 · couverture
 f'''<section class="page cover">
  <div class="left">
    <img class="logo" src="{LOGO}" alt="ABK Bâti &amp; Piscine">
    <div style="display:flex;flex-direction:column;gap:18px">
      <div class="x">Bilan <b>·</b> mois 1</div>
      <h1>Un premier mois <span>en ligne et sur le terrain.</span></h1>
      <p class="lead">Site internet, réseaux sociaux, supports imprimés et premiers rendez-vous partenaires : ce qui a été construit depuis le lancement, ce que disent les chiffres et la feuille de route de décembre.</p>
    </div>
    <div class="meta"><div><strong>Période</strong>23 octobre – 24 novembre 2026</div><div><strong>Site</strong>www.abk-bati.com</div><div><strong>Édition</strong>24 novembre 2026</div></div>
  </div>
  <div class="right"><img class="cover-photo" style="object-position:center top" src="{photo('site/mobile')}" alt="Page d’accueil du site ABK sur mobile"><span class="cover-cap">www.abk-bati.com sur mobile</span></div>
</section>''',

 # 2 · le mois en bref
 f'''<section class="page">
  <div class="eyebrow">Le mois en bref</div>
  <h2>Une présence en ligne lancée, <em>deux portes ouvertes à Royan.</em></h2>
  <div class="kpis6">
    <div class="big"><b>23/10</b><span>mise en ligne du site</span></div>
    <div class="big"><b>36</b><span>lots de modifications sur le site</span></div>
    <div class="big"><b>22</b><span>mises en ligne successives</span></div>
    <div class="big"><b>1 721</b><span>vues Instagram sur 30 jours</span><em>+100 %</em></div>
    <div class="big"><b>16</b><span>supports graphiques créés</span></div>
    <div class="big"><b>2</b><span>rendez-vous partenaires obtenus</span></div>
  </div>
  <div class="win">
    <div class="medal">{TROPHY}</div>
    <div class="w"><div><b>Mairie de Royan</b><span>Rendez-vous en décembre : défense incendie, bâti communal, prévention autour des piscines.</span></div></div>
    <div class="w"><div><b>Agence Orpi Royan</b><span>Rendez-vous en décembre : partenariat travaux pour vendeurs et acquéreurs.</span></div></div>
  </div>
  <div class="grid g3">
    {card("house", "Site internet", "Six pages publiques, un espace client, un espace de gestion pour les demandes et les chantiers, et une animation d’accueil qui montre le métier en quelques secondes.")}
    {card("mega", "Réseaux sociaux", "Premier pic à plus de 1 600 vues autour du 9 novembre. Les contenus chantier et les hashtags locaux touchent surtout des personnes qui ne suivent pas encore le compte.")}
    {card("users", "Partenariats", "Deux dossiers de rendez-vous prêts, huit marques partenaires présentées sur le site et un formulaire « Devenir partenaire » en place. Dès décembre, une rencontre entre pros chaque mois.")}
  </div>
  {foot(L)}
</section>''',

 # 3 · site : ce qui est en ligne
 f'''<section class="page">
  <div class="eyebrow">Le site internet</div>
  <div class="split" style="flex:0;align-items:end">
    <h2>www.abk-bati.com, <em>en ligne depuis le 23 octobre.</em></h2>
    <p class="lead">Trois métiers présentés chacun sur sa page, avec un questionnaire de devis adapté, les réalisations en photos et l’histoire de l’entreprise depuis 1986.</p>
  </div>
  <div class="shots">
    <figure class="d"><img src="{photo('site/accueil')}" alt="Accueil"><figcaption>Accueil</figcaption></figure>
    <figure class="d"><img src="{photo('site/piscines')}" alt="Piscines &amp; extérieurs"><figcaption>Piscines &amp; extérieurs</figcaption></figure>
    <figure class="tall"><img src="{photo('site/mobile')}" alt="Version mobile"><figcaption>Mobile</figcaption></figure>
    <div class="card tall" style="gap:6px;padding:16px;justify-content:center">
      <ul class="ticks" style="margin:0">
        <li>27 réalisations, 56 photos</li><li>Demandes de devis par métier</li><li>Espace client et espace de gestion</li><li>Article Vidici en ligne</li><li>8 partenaires sur l’accueil</li>
      </ul>
    </div>
    <figure class="d"><img src="{photo('site/incendie')}" alt="Pack incendie"><figcaption>Pack incendie</figcaption></figure>
    <figure class="d"><img src="{photo('site/a-propos')}" alt="À propos"><figcaption>Notre histoire</figcaption></figure>
  </div>
  {foot(L)}
</section>''',

 # 4 · site : rythme
 f'''<section class="page">
  <div class="eyebrow">Le site internet · suivi des modifications</div>
  <h2>36 lots de modifications, <em>22 mises en ligne.</em></h2>
  <div class="split3">
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="legend"><span><i style="background:var(--blue)"></i>Lots de modifications</span><span><i style="background:var(--orange)"></i>Mises en ligne</span></div>
      {bars()}
      <p class="note">L’essentiel du travail s’est fait sur les trois premières semaines : construction des pages, espace de gestion, nom de domaine et réalisations. La suite a porté sur les réglages, les partenaires et la version mobile.</p>
    </div>
    <div class="card" style="gap:12px">
      <h3>Les étapes clés</h3>
      <div class="miles">
        <div><b>23 oct.</b><span>Mise en ligne du site et de l’identité visuelle</span></div>
        <div><b>24 oct.</b><span>Animation de la piscine sur l’accueil</span></div>
        <div><b>25 oct.</b><span>Espace de gestion : comptes, projets, documents, messages</span></div>
        <div><b>28 oct.</b><span>Nom de domaine abk-bati.com, galeries, histoire d’ABK</span></div>
        <div><b>30 oct.</b><span>Réalisations d’octobre et bouton Contact</span></div>
        <div><b>3 nov.</b><span>Demandes de devis reçues dans l’espace de gestion</span></div>
        <div><b>15 nov.</b><span>Logos partenaires sur l’accueil</span></div>
        <div><b>24 nov.</b><span>Animation mobile corrigée et fluide sur iPhone</span></div>
      </div>
      <p class="note" style="margin-top:auto">Visites du site : le compteur n’était pas encore branché. Il est activé en décembre pour suivre les visites, les pages vues et les demandes de devis dans le prochain bilan.</p>
    </div>
  </div>
  {foot(L)}
</section>''',

 # 5 · instagram
 f'''<section class="page">
  <div class="eyebrow">Réseaux sociaux · Instagram, 24 oct. – 22 nov.</div>
  <h2>1 721 vues en 30 jours, <em>portées par les contenus chantier.</em></h2>
  <div class="kpis6">
    <div class="big"><b>1 721</b><span>vues</span><em>+100 %</em></div>
    <div class="big"><b>1 005</b><span>comptes touchés</span><em>+100 %</em></div>
    <div class="big"><b>97 %</b><span>des vues par des non-abonnés</span></div>
    <div class="big"><b>35</b><span>visites du profil</span></div>
    <div class="big"><b>30</b><span>interactions</span></div>
    <div class="big"><b>8</b><span>abonnés</span></div>
  </div>
  <div class="split3">
    <div class="card" style="gap:6px">
      <h3>Les contenus les plus vus</h3>
      <table class="top">{top_rows()}</table>
    </div>
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="card" style="gap:10px">
        <h3>Répartition des vues</h3>
        <div class="mix">
          <div><span>Reels</span><i style="width:100%"></i><b>57 %</b></div>
          <div><span>Publications</span><i style="width:64%;background:var(--blue)"></i><b>36 %</b></div>
          <div><span>Stories</span><i style="width:12%;background:var(--sky)"></i><b>7 %</b></div>
        </div>
      </div>
      <div class="card" style="background:var(--ink);color:#fff;border:0;gap:8px">
        <h3>Ce qu’on retient</h3>
        <ul class="ticks" style="color:#dbe7f2">
          <li>Deux contenus font 85 % des vues : le format chantier marche.</li>
          <li>Les hashtags locaux (#rénovationroyan, #royanpiscine) amènent un public nouveau.</li>
          <li>35 visites du profil pour 4 clics sur le lien : le profil doit mieux convertir.</li>
          <li>0 clic sur l’adresse : elle n’est pas encore visible sur le profil.</li>
        </ul>
      </div>
    </div>
  </div>
  {foot(L)}
</section>''',

 # 6 · créations
 f'''<section class="page">
  <div class="eyebrow">Créations graphiques</div>
  <h2>Une image cohérente <em>du chantier jusqu’au portail.</em></h2>
  <p class="lead">Tous les supports reprennent la même identité : logo, bleu marine et orange, typographies du site. Un client qui voit un flyer, une carte ou le panneau reconnaît ABK.</p>
  <div class="made">
    <div class="mk"><div class="vis">{CARD_ICO}</div><div class="txt"><b>Cartes de visite</b><span>Recto verso aux couleurs ABK, coordonnées et site.</span></div></div>
    <div class="mk"><div class="vis"><b>12</b></div><div class="txt"><b>Flyers</b><span>Piscine, rénovation et pack incendie, pour particuliers et professionnels.</span></div></div>
    <div class="mk"><div class="vis">{SIGN_ICO}</div><div class="txt"><b>PLV portail</b><span>Panneau de chantier pour signaler les réalisations en cours.</span></div></div>
    <div class="mk"><div class="vis" style="background:#0d3a75"><b style="color:#fff;font-size:22px;text-align:center;padding:0 14px">Visuels<br>réseaux sociaux</b></div><div class="txt"><b>Publications &amp; reels</b><span>Modèles de publication, couvertures de reels, stories.</span></div></div>
    <div class="mk"><div class="vis"><img src="{photo('cover-abk-x-orpi-01')}" alt="Dossier ABK × Orpi"></div><div class="txt"><b>Dossier ABK × Orpi</b><span>10 pages, présentation et offres de partenariat.</span></div></div>
    <div class="mk"><div class="vis"><img src="{photo('cover-abk-x-ville-de-royan-01')}" alt="Dossier ABK × Ville de Royan"></div><div class="txt"><b>Dossier ABK × Ville de Royan</b><span>10 pages, enjeux de la ville et pistes d’action.</span></div></div>
    <div class="mk"><div class="vis"><img src="{photo('site/accueil-animation')}" alt="Animation d’accueil"></div><div class="txt"><b>Animation d’accueil</b><span>La piscine se construit au fil du scroll, sur ordinateur et mobile.</span></div></div>
    <div class="mk"><div class="vis"><img src="{photo('transformation-bassin_oct-29-02')}" alt="Photos de réalisations"></div><div class="txt"><b>56 photos de réalisations</b><span>Triées par chantier, recadrées et optimisées pour le site.</span></div></div>
  </div>
  {foot(L)}
</section>''',

 # 7 · victoires
 f'''<section class="page dark">
  <div class="eyebrow">Nos victoires du mois</div>
  <h2>Deux rendez-vous décrochés <em>pour décembre.</em></h2>
  <div class="grid g2" style="flex:1">
    <div class="card" style="background:#0d3a75;border:0;color:#fff;gap:16px;justify-content:center;padding:30px">
      <div style="display:grid;grid-template-columns:240px 1fr;gap:22px;align-items:start">
        <img src="{photo('cover-abk-x-ville-de-royan-01')}" alt="" style="width:100%;border-radius:10px">
        <div style="display:flex;flex-direction:column;gap:8px"><span class="prio p1">Décembre</span><h3 style="font-size:22px">Mairie de Royan</h3><p style="color:#c5d6e6;font-size:15.5px">Présenter ABK comme ressource technique locale et poser les bases d’un premier diagnostic.</p></div>
      </div>
      <ul class="ticks" style="color:#dbe7f2;font-size:16px;gap:12px;margin-top:10px">
        <li>Défense incendie : secteurs à couvrir, site pilote</li>
        <li>Entretien du bâti communal hors saison</li>
        <li>Campagne « Piscine en sécurité » avant l’été 2027</li>
        <li>Apprentissage et emploi local</li>
      </ul>
    </div>
    <div class="card" style="background:#0d3a75;border:0;color:#fff;gap:16px;justify-content:center;padding:30px">
      <div style="display:grid;grid-template-columns:240px 1fr;gap:22px;align-items:start">
        <img src="{photo('cover-abk-x-orpi-01')}" alt="" style="width:100%;border-radius:10px">
        <div style="display:flex;flex-direction:column;gap:8px"><span class="prio p1">Décembre</span><h3 style="font-size:22px">Agence Orpi Royan</h3><p style="color:#c5d6e6;font-size:15.5px">Devenir le relais travaux de l’agence, du mandat jusqu’à l’installation des acquéreurs.</p></div>
      </div>
      <ul class="ticks" style="color:#dbe7f2;font-size:16px;gap:12px;margin-top:10px">
        <li>Pack « Prêt à vendre » et fiche « Potentiel travaux »</li>
        <li>Visite technique avec l’acquéreur avant l’offre</li>
        <li>Biens en gestion et résidences secondaires</li>
        <li>Pilote de 90 jours avec bilan chiffré</li>
      </ul>
    </div>
  </div>
  {foot(L)}
</section>''',

 # 8 · plan décembre
 f'''<section class="page">
  <div class="eyebrow">Plan d’action · décembre 2026</div>
  <h2>Transformer les rendez-vous <em>et installer un rythme.</em></h2>
  <div class="weeks">
    <div class="phase"><span class="when">1 – 7 déc.</span><h3>Préparer</h3><ul class="ticks"><li>Caler les dates Mairie et Orpi</li><li>Imprimer les deux dossiers</li><li>Brancher le compteur de visites du site</li><li>Adresse, horaires et lien devis sur Instagram</li><li>Créer ou compléter la fiche Google de l’entreprise</li></ul></div>
    <div class="phase"><span class="when">8 – 14 déc.</span><h3>Rencontrer</h3><ul class="ticks"><li>Rendez-vous Mairie et Orpi</li><li>Compte rendu et proposition écrite sous 48 h</li><li>Distribuer les flyers aux agences et commerces</li><li>Reel « hivernage de la piscine »</li></ul></div>
    <div class="phase"><span class="when">15 – 21 déc.</span><h3>Concrétiser</h3><ul class="ticks"><li>Relances et choix des premières actions</li><li>Premier bien Orpi ou site pilote Mairie</li><li>Contacter deux nouveaux partenaires de la liste</li><li>Premier café entre pros, avant les fêtes</li><li>Reel avant/après d’un chantier</li></ul></div>
    <div class="phase"><span class="when">22 – 31 déc.</span><h3>Préparer 2027</h3><ul class="ticks"><li>Vœux aux clients et partenaires</li><li>Reel « 2026 en images »</li><li>Offre printemps : étude piscine avant mars</li><li>Bilan du deuxième mois</li><li>Fixer la rencontre pros de janvier</li></ul></div>
  </div>
  <div class="goals">
    <div class="goal"><b>2</b><span>propositions écrites envoyées (Mairie, Orpi)</span></div>
    <div class="goal"><b>12</b><span>publications dont 6 reels</span></div>
    <div class="goal"><b>40</b><span>abonnés Instagram</span></div>
    <div class="goal"><b>2 500</b><span>vues sur le mois</span></div>
    <div class="goal"><b>1</b><span>rencontre entre pros, puis une par mois</span></div>
  </div>
  {foot(L)}
</section>''',

 # 9 · partenariats
 f'''<section class="page">
  <div class="eyebrow">Développement des partenariats</div>
  <h2>Après Orpi et la Mairie, <em>les prochaines portes à ouvrir.</em></h2>
  <div class="grid g3 compact" style="grid-template-columns:repeat(4,minmax(0,1fr));gap:12px">
    <div class="card"><span class="prio p1">Priorité</span><h3>Autres agences immobilières</h3><p>Le même modèle que celui d’Orpi, une fois le pilote rodé : fiche travaux, visite acquéreur.</p></div>
    <div class="card"><span class="prio p1">Priorité</span><h3>Conciergeries &amp; locations saisonnières</h3><p>Remise en service des piscines avant la saison, dépannages rapides, entretien à l’année.</p></div>
    <div class="card"><span class="prio p1">Priorité</span><h3>Campings &amp; hôtels de la côte</h3><p>Bassins à rénover et réserves incendie pour les sites qui accueillent du public.</p></div>
    <div class="card"><span class="prio p1">Priorité</span><h3>Communes voisines</h3><p>Proposer le diagnostic défense incendie déjà présenté à Royan aux communes alentour.</p></div>
    <div class="card"><span class="prio p2">Ensuite</span><h3>Notaires &amp; courtiers</h3><p>Un devis travaux clair au moment du financement : utile à l’acquéreur et au dossier de prêt.</p></div>
    <div class="card"><span class="prio p2">Ensuite</span><h3>Architectes &amp; paysagistes</h3><p>ABK réalise la piscine et le bâti de leurs projets, eux gardent la conception.</p></div>
    <div class="card"><span class="prio p2">Ensuite</span><h3>Syndics de copropriété</h3><p>Entretien des piscines de résidence, travaux de maçonnerie et mises en conformité.</p></div>
    <div class="card"><span class="prio p2">Ensuite</span><h3>Fournisseurs partenaires</h3><p>Chantiers vitrines avec Camarol ou AstralPool : contenus communs et visibilité croisée.</p></div>
  </div>
  <div class="meet push">
    <div><span class="prio p1">Chaque mois</span><h3>Une rencontre entre pros</h3><p>Un moment simple pour se faire connaître et entretenir le réseau : chaque partenaire rencontré invite un contact de son côté.</p></div>
    <div class="fmt"><b>Café du matin</b><span>Petit-déjeuner à l’atelier ou sur un chantier en cours, 6 à 8 invités.</span></div>
    <div class="fmt"><b>Dîner partenaires</b><span>Agents, notaires, architectes, conciergeries : une table, un sujet.</span></div>
    <div class="fmt"><b>Afterwork réseau</b><span>Clubs d’entreprises et associations de commerçants du secteur.</span></div>
  </div>
  {foot(L)}
</section>''',

 # 10 · réseaux sociaux
 f'''<section class="page">
  <div class="eyebrow">Plan d’action · réseaux sociaux</div>
  <h2>Garder le public touché <em>et le transformer en demandes.</em></h2>
  <div class="steps5">
    <div class="st5"><i>1</i><h3>Profil</h3><ul class="ticks"><li>Adresse et zone d’intervention</li><li>Lien direct vers le devis</li><li>Stories à la une : Piscines, Rénovation, Incendie, Avis</li></ul></div>
    <div class="st5"><i>2</i><h3>Ligne éditoriale</h3><ul class="ticks"><li>Chantiers avant/après</li><li>Coulisses avec Karine, Benjamin et l’équipe</li><li>Conseils de saison</li><li>Sécurité incendie pour les pros</li></ul></div>
    <div class="st5"><i>3</i><h3>Rythme</h3><ul class="ticks"><li>3 publications par semaine</li><li>2 reels + 1 carrousel</li><li>Stories chantier chaque jour ouvré</li><li>Même contenu sur Facebook</li></ul></div>
    <div class="st5"><i>4</i><h3>Ancrage local</h3><ul class="ticks"><li>Hashtags Royan et côte de Beauté</li><li>Localisation sur chaque post</li><li>Partenaires identifiés</li><li>Groupes Facebook locaux</li></ul></div>
    <div class="st5"><i>5</i><h3>Mesure</h3><ul class="ticks"><li>Vues, abonnés, clics sur le lien</li><li>Demandes venues d’Instagram</li><li>Bilan à chaque fin de mois</li></ul></div>
  </div>
  <div class="cal">
    <div><b>Semaine 1</b>Reel chantier en cours · carrousel « 3 erreurs avant d’hiverner sa piscine »</div>
    <div><b>Semaine 2</b>Reel hivernage · publication sur les rendez-vous partenaires (si accord)</div>
    <div><b>Semaine 3</b>Reel avant/après · carrousel pack incendie pour les pros</div>
    <div><b>Semaine 4</b>Vœux de l’équipe · reel « 2026 en images »</div>
  </div>
  {foot(L)}
</section>''',
]

html = f'''<title>Bilan ABK · mois 1</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Manrope:wght@600;700;800&display=swap">
<style>{CSS}{EXTRA}</style>
<main class="deck">
{number("".join(pages))}
</main>
'''

if __name__ == "__main__":
    (OUT / "bilan-mois-1.html").write_text(html)
    print("écrit", OUT / "bilan-mois-1.html")
