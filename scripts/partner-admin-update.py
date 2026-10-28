from pathlib import Path
p=Path(__file__).resolve().parents[1]/'gestion/app.js';s=p.read_text(encoding='utf8')
s=s.replace('["requests", "Demandes"],','["requests", "Demandes"],\n        ["partnerships", "Partenariats & affiliation"],')
s=s.replace('requestRows(state.requests)','requestRows(state.requests.filter(r=>!isPartnership(r)))')
anchor='  if (view === "people")'
block='''  if(view === "partnerships") content=heading('Partenariats & affiliation.','Propositions professionnelles, apport d’affaires, affiliation et collaborations.')+`<label class="search">Rechercher une proposition<input id="request-search" type="search" placeholder="Nom, société, proposition…"></label><div id="request-list">${requestRows(state.requests.filter(isPartnership))}</div>`;
'''
if 'if(view === "partnerships")' not in s:s=s.replace(anchor,block+anchor)
s=s.replace('const requestRows = (rows) =>','const isPartnership=r=>String(r.source||\'\').startsWith(\'partnership:\');\nconst requestRows = (rows) =>')
s=s.replace('e(label(r.category)),','e(isPartnership(r)?"Partenariat / affiliation":label(r.category)),')
s=s.replace('${badge(r.category)} ${badge(r.status)}','${isPartnership(r)?\'<span class="badge">Partenariat / affiliation</span>\':badge(r.category)} ${badge(r.status)}')
s=s.replace('${r.project_id ? btn("Ouvrir le projet", "project", r.project_id) : btn("Créer un projet depuis la demande", "convert", r.id, "primary")}','${isPartnership(r)?\'\':r.project_id ? btn("Ouvrir le projet", "project", r.project_id) : btn("Créer un projet depuis la demande", "convert", r.id, "primary")}')
s=s.replace('state.requests.filter((r) =>\n        `${r.name} ${r.email} ${label(r.category)} ${label(r.status)}`','state.requests.filter(r=>view===\'partnerships\'?isPartnership(r):!isPartnership(r)).filter((r) =>\n        `${r.name} ${r.email} ${r.content} ${label(r.category)} ${label(r.status)}`')
p.write_text(s,encoding='utf8')
print('Partnership inbox added without a database migration; source field identifies submissions.')
