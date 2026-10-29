"""Import the supplied October media without replacing existing project galleries."""
from pathlib import Path
from PIL import Image, ImageOps
import json, subprocess, hashlib

root = Path(__file__).resolve().parents[1]
temp = Path('C:/Users/bello/AppData/Local/Temp')
manifest = root / 'public/realisations/projects.json'
projects = json.loads(manifest.read_text(encoding='utf-8'))
audit = []

def photo(group, stamp, title, index):
    source = temp / f'PHOTO-2026-10-29-{stamp}.jpg'
    folder = root / 'public/realisations' / group
    folder.mkdir(parents=True, exist_ok=True)
    image = ImageOps.exif_transpose(Image.open(source)).convert('RGB')
    full = f'public/realisations/{group}/oct-29-{index:02}.webp'
    thumb = f'public/realisations/{group}/oct-29-{index:02}-square.webp'
    image.save(root / full, 'WEBP', quality=94, method=6)
    ImageOps.fit(image, (640, 640), method=Image.Resampling.LANCZOS).save(root / thumb, 'WEBP', quality=88, method=6)
    audit.append({'source':source.name,'project':group,'asset':full,'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'width':image.width,'height':image.height})
    return {'type':'image','src':full,'thumbnail':thumb,'alt':f'{title} — vue {index}','width':image.width,'height':image.height}

groups = [
    ('transformation-bassin','Transformation d’un bassin','Plusieurs vues du même bassin en cours de reconfiguration.', ['23-21-49','23-21-59','23-22-21','23-25-59']),
    ('inspiration-jardin','Inspiration : un bassin dans le jardin','Un visuel d’inspiration fourni, présenté séparément des chantiers.', ['23-23-32']),
    ('piscine-interieure','Un bassin à l’intérieur','Marches arrondies et mise en eau dans un espace intérieur.', ['23-24-00']),
    ('terrassement-local','Les premières étapes du bassin','Terrassement et préparation du terrain autour du local technique.', ['23-24-22','23-24-32','23-24-42']),
    ('terrasse-couverte','Bassin et terrasse couverte','Mise en eau et abords en bois sous une terrasse couverte.', ['23-25-20']),
    ('bassin-en-construction','Un bassin en construction','Structure, escalier et réseaux du même chantier.', ['23-28-30','23-28-37']),
]
for group,title,description,stamps in groups:
    media=[photo(group,stamp,title,i+1) for i,stamp in enumerate(stamps)]
    if not any(p['id']==group for p in projects):
        projects.append({'id':group,'title':title,'description':description,'media':media})

collective = next(p for p in projects if p['id']=='espace-aquatique')
for i,stamp in enumerate(['23-27-09','23-27-19','23-27-30','23-27-46']):
    item=photo('espace-aquatique',stamp,'Le même espace aquatique, pendant les travaux',i+1)
    if not any(m['src']==item['src'] for m in collective['media']):collective['media'].append(item)

def video(group,stamp,name,title):
    source=temp / f'VIDEO-2026-10-29-{stamp}.mp4'
    dest=f'public/realisations/videos/{name}.mp4'
    poster=f'public/realisations/videos/{name}.webp'
    subprocess.run(['ffmpeg','-y','-i',str(source),'-c:v','libx264','-preset','fast','-crf','22','-pix_fmt','yuv420p','-an','-map_metadata','-1','-movflags','+faststart',str(root/dest),'-loglevel','error'],check=True)
    subprocess.run(['ffmpeg','-y','-ss','2','-i',str(root/dest),'-frames:v','1',str(root/poster),'-loglevel','error'],check=True)
    audit.append({'source':source.name,'project':group,'asset':dest,'sha256':hashlib.sha256(source.read_bytes()).hexdigest()})
    return {'type':'video','src':dest,'thumbnail':poster,'alt':title}

item=video('espace-aquatique','23-26-53','espace-aquatique-octobre','Le même espace aquatique après sa mise en eau')
if not any(m['src']==item['src'] for m in collective['media']):collective['media'].append(item)
item=video('renovation-video','23-19-32','renovation-terrasse-video','Vidéo d’un bassin et de ses abords pendant les travaux')
if not any(p['id']=='renovation-video' for p in projects):projects.append({'id':'renovation-video','title':'Un bassin en rénovation','description':'Vidéo fournie du chantier et des abords. La définition du fichier source est limitée.','media':[item]})
manifest.write_text(json.dumps(projects,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(root/'docs/october-media-inventory.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'Imported {len(audit)} supplied files into {len(projects)} project groups.')
