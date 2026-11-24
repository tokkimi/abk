from pathlib import Path
from PIL import Image, ImageOps
import fitz, json, hashlib, subprocess, shutil
root=Path(__file__).resolve().parents[1]
out=root/'public'/'realisations'; out.mkdir(parents=True,exist_ok=True)
temp=Path('C:/Users/bello/AppData/Local/Temp')
# Each source is assigned once, using visible architecture and finishes, never filename proximity.
groups=[
 ('terrasse-bois','Piscine et terrasse bois','Couverture intégrée et abords en bois.', ['9b0b9146-a8ca-4b75-81f2-95a7bc72b0dc','6da42d8b-9787-420e-a6e4-a7aeb35726e9']),
 ('cour-pierre','Un bassin dans la cour','Bassin rectangulaire et terrasse en pierre.', ['6ada5583-f53b-4fe6-afeb-485272f15105','de0f2500-ccde-4ed9-bdbe-de9e2d1dcc69']),
 ('vue-mer','Une piscine ouverte sur le paysage','Les différentes vues d’un même bassin et de sa terrasse.', ['60d263d7-5aab-48e3-b542-37ec9f4d1d01','034f51aa-7a90-4aa0-a9c6-e00e31fd7047','e2609711-cd63-49c2-949e-f48865eb336a','f99cff47-551e-4e0f-a752-d65f8adc7c12','ffdaf4d6-a530-4769-bdc9-a9badc0a412c']),
 ('jardin-couverture','Bassin et jardin','Couverture et terrasse autour d’une piscine de jardin.', ['f4307af1-23c1-4693-a7f1-9fe26cf9fdb1']),
 ('maison-contemporaine','Lignes contemporaines','Bassin au pied d’une maison aux façades claires.', ['7642f9f8-7d29-4be3-9963-7f0a2f6332b5']),
 ('renovation-marches','La rénovation, étape par étape','Préparation du support et travail autour des marches du bassin.', ['6e5b536d-c661-4e74-b02a-ae828a7a422b','1fd86e8d-5297-42ba-925f-c554315dc989','2aeefe9c-8d80-42c7-bf8c-7b527bf4d26f','bfea4c1d-1b84-47a3-b926-d417f2367763','5a2ef180-99fd-456c-950f-ef7de112dffb']),
 ('espace-aquatique','Un espace aquatique collectif','Bassin, zone ludique et abords du même espace aquatique.', ['76064715-3dc1-4daa-9026-2b841ce6a18e','463cb8ae-c9c0-44ab-a7b9-3b5509e4c9e5','7c792221-72a6-41d8-a6f0-fa8871df1d39','b8642005-1702-483f-8831-37a73daa1d12']),
 ('volet-jardin','Une couverture au fil de l’eau','Le même bassin, couverture ouverte puis fermée.', ['98bd7c52-a223-495a-8f04-25702e2af678','3c0855ec-8e33-4457-9a07-aac277043777']),
 ('vue-hauteur','Piscine et aménagement du jardin','Une vue d’ensemble sur le bassin et ses plages.', ['1a535dc5-3ec8-4a0a-9db1-fd569bfa2443']),
 ('membrane-bleue','Une nouvelle finition pour le bassin','Pose d’un revêtement à motif bleu.', ['abe67213-e92d-405a-a65a-ffd3dfe0576b']),
 ('jardin-mediterraneen','Une piscine dans son jardin','Mise en eau et vues du bassin avec ses abords paysagers.', ['86ac429a-ae7b-419e-9857-2cd9eb95dfda','70d2e883-2bad-41a2-96ab-f6c0637ce65e','2f148422-34d8-4dd6-82cc-a317c55a5dc2','e450bd87-8a64-4ceb-9ff3-47c6054ebddd']),
 ('maison-bois','Le bois et l’eau','Piscine, terrasse bois et maison tournées vers le jardin.', ['a3a4450d-86eb-43a3-96cf-607326627b90','ccad3e46-786d-466c-b973-766e80ad435a']),
 ('bassin-compact','Une piscine dans un espace compact','Bassin rectangulaire et couverture entre la maison et la clôture.', ['bbd290fe-ee5e-4ee2-b1a6-bdf24834fb57','2e3b1e4f-8295-48ca-98eb-2b6f4b64716d']),
 ('espace-detente','Un espace de détente','Détail d’un bassin avec marches et assises.', ['47cbc9c6-4108-41e6-9647-7f22a36ce49c']),
 ('terrasse-minerale','Une terrasse autour du bassin','Une piscine et ses abords minéraux.', ['fdfb9d4b-5c60-4e13-9b3a-bdf8b6a3e908']),
 ('jardin-arbore','Bassin dans un jardin arboré','Un bassin rectangulaire bordé de larges dalles.', ['76e0bffa-f805-42ef-b3c8-27083d3194fa'])]
crop={
 '6da42d8b-9787-420e-a6e4-a7aeb35726e9':(0,305,733,1283),'de0f2500-ccde-4ed9-bdbe-de9e2d1dcc69':(0,306,733,1283),
 '034f51aa-7a90-4aa0-a9c6-e00e31fd7047':(0,306,733,1283),'e2609711-cd63-49c2-949e-f48865eb336a':(0,306,733,1283),'f99cff47-551e-4e0f-a752-d65f8adc7c12':(0,306,733,1283),'ffdaf4d6-a530-4769-bdc9-a9badc0a412c':(0,520,733,1069),
 'f4307af1-23c1-4693-a7f1-9fe26cf9fdb1':(0,522,736,1073),'7642f9f8-7d29-4be3-9963-7f0a2f6332b5':(0,520,733,1069)}
manifest=[];seen=set();inventory=[]
for slug,title,description,files in groups:
 media=[];folder=out/slug;folder.mkdir(exist_ok=True)
 for key in files:
  path=temp/f'codex-clipboard-{key}.jpg'
  if not path.exists():raise FileNotFoundError(path)
  original=ImageOps.exif_transpose(Image.open(path)).convert('RGB');im=original.crop(crop[key]) if key in crop else original
  signature=hashlib.sha256(im.tobytes()).hexdigest();duplicate=signature in seen;seen.add(signature)
  inventory.append({'source':path.name,'project':slug,'duplicate':duplicate,'crop':crop.get(key)})
  if duplicate:continue
  number=len(media)+1;name=f'{number:02}.webp';im.thumbnail((1800,1800));im.save(folder/name,'WEBP',quality=88,method=6)
  thumb=ImageOps.fit(im,(640,640),method=Image.Resampling.LANCZOS);thumb.save(folder/f'{number:02}-square.webp','WEBP',quality=85,method=6)
  media.append({'type':'image','src':f'public/realisations/{slug}/{name}','thumbnail':f'public/realisations/{slug}/{number:02}-square.webp','alt':f'{title} — vue {number}','width':im.width,'height':im.height})
 manifest.append({'id':slug,'title':title,'description':description,'media':media})
hero=ImageOps.exif_transpose(Image.open(temp/'codex-clipboard-a3a4450d-86eb-43a3-96cf-607326627b90.jpg')).convert('RGB');hero.save(out/'piscine-terrasse-bois-hero.webp','WEBP',quality=93,method=6)
(out/'projects.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf8')
(root/'docs'/'pool-media-inventory.json').write_text(json.dumps(inventory,ensure_ascii=False,indent=2),encoding='utf8')
press=Path('C:/Users/bello/Downloads/INFOMERCIAL ABK PISCINE RY SEPT 2026.pdf');doc=fitz.open(press);pressout=root/'public'/'presse';pressout.mkdir(exist_ok=True)
for i,page in enumerate(doc):
 pix=page.get_pixmap(matrix=fitz.Matrix(2.7,2.7),alpha=False);im=Image.frombytes('RGB',[pix.width,pix.height],pix.samples);im.save(pressout/f'vidici-septembre-2026-{i+1}.webp','WEBP',quality=94,method=6)
print(f'{len(manifest)} projets, {sum(len(p["media"]) for p in manifest)} photos uniques, {len(inventory)} sources vérifiées. Presse : {len(doc)} page(s). Métadonnées source retirées.')
