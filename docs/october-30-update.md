# Mise à jour du 30 octobre 2026

- Les 16 photos et 2 vidéos fournies sont référencées une fois dans october-media-inventory.json avec leur groupe et leur empreinte SHA-256. Les 4 vues de l’espace aquatique et sa vidéo rejoignent le projet existant, dont les éléments distinctifs correspondent (toboggan vert, champignon, plots et clôture). Les autres ensembles restent distincts quand un rattachement ne peut pas être confirmé visuellement. Un visuel de bassin dans un jardin est explicitement présenté comme inspiration.
- La galerie piscine comporte 23 groupes, avec une navigation qui reste dans le même projet. Les vidéos de piscines restent sur la page piscine ; la galerie de maçonnerie n’est pas modifiée. Les photos gardent leur résolution fournie et sont exportées sans EXIF. Les vidéos sont publiées sans piste audio ni métadonnées de localisation. La première vidéo fournie est nativement en 176 × 144 : sa définition n’est pas présentée comme haute résolution.
- Le bandeau montrant une pose de margelles sur une piscine carrelée est remplacé sur la page piscine par la photo du chantier de bassin transmis par ABK. L’ancien fichier reste disponible pour les autres usages existants du dépôt.
- Le bouton Contact est ajouté dans les en-têtes publics. Il affiche le téléphone 05 46 05 72 92, l’e-mail info@abk-piscine.fr et l’adresse 62 ter rue François Arago, 17200 Royan, repris de la documentation ABK. Les actions tel/mailto sont cliquables ; la navigation reste centrée.
- La couverture d’accueil joue automatiquement la séquence des 50 images, silencieuse, en boucle et en ligne sur mobile. Le défilement normal n’est plus intercepté et le grand espace réservé au scroll est supprimé. Un bouton de pause permet l’arrêt manuel. L’animation s’arrête hors écran et quand l’onglet est masqué. Une image fixe remplace la vidéo pour la préférence de réduction des animations.

Les vidéos de couverture sont encodées depuis les séquences originales à 7 images par seconde, sortie H.264 30 fps, sans supprimer les 50 images d’entrée :

```powershell
ffmpeg -y -framerate 7 -i public/home-frames/frame_%03d.webp -c:v libx264 -preset slow -crf 23 -maxrate 18M -bufsize 36M -pix_fmt yuv420p -r 30 -an -map_metadata -1 -movflags +faststart public/home-animation-desktop.mp4
ffmpeg -y -framerate 7 -i public/home-frames/mobile/frame_%03d.webp -c:v libx264 -preset slow -crf 24 -maxrate 4M -bufsize 8M -pix_fmt yuv420p -r 30 -an -map_metadata -1 -movflags +faststart public/home-animation-mobile.mp4
```

Durée : 7,13 secondes. Résolutions : 3840 × 2160 sur ordinateur, 1080 × 1920 sur mobile. Contrôles : 17 tests serveur, galerie existante, 18 fichiers importés, lecture automatique sans interaction, pause, préférence de mouvement réduit, absence de blocage du scroll, coordonnées et absence de débordement horizontal à 390 px.
