# Domaine principal et mise à jour visuelle

Le domaine principal est https://www.abk-bati.com. Le domaine nu et HTTP redirigent vers HTTPS ; les adresses Vercel redirigent vers le domaine principal avec le chemin conservé. Les balises canonical, Open Graph, Twitter, robots et sitemap utilisent le nouveau domaine. Le favicon reprend le logo fourni et l’aperçu de partage est une image 1200 × 630 centrée sur le logo.

Le relais de gestion valide l’origine publique avant de transmettre au backend authentifié son origine configurée séparément. Seuls les liens de gestion dans les réponses JSON sont adaptés au domaine public ; les fichiers binaires ne sont pas modifiés. Les contrôles CSRF et les cookies Secure, HttpOnly et SameSite=Strict restent actifs. Connexion administrateur testée sur le domaine public, sans modification des données métier.

Le héros piscine conserve l’image en fond et son texte superposé, sans voile bleu nuit. La règle qui remettait l’image sous le texte a été supprimée. Le bandeau « Lignes contemporaines » précède la rénovation, l’ancien bandeau la suit, et l’image carrée des extérieurs reste à sa place. Les flèches et points sous les galeries remplacent la barre de défilement visible.

À propos : histoire, article de presse, puis contenu de présentation. Le bloc « Une exigence concrète » est placé en dernier avant le footer. Les trois liens métiers deviennent des boutons orange. La proposition de partenariat se trouve dans la bulle de contact, sans bouton dans le footer.

## Restauration des images

Outil intégré image_gen, utilisé pour une amélioration visuelle à partir des fichiers basse résolution. Les rendus natifs de l’outil (1448 × 1086 et 1647 × 955) ont ensuite été exportés en WebP de 4096 pixels de large. Il s’agit d’images restaurées et agrandies, pas de prises de vue originales 4K ; certains détails reconstruits peuvent différer de l’original. Les originaux et les médias de la galerie sont conservés.

Fichiers : public/realisations/maison-contemporaine/restauree-4k.webp et public/realisations/piscine-terrasse-bois-hero-4k.webp.

Prompt contemporain : « Edit target: supplied low-resolution photograph of an actual swimming pool installation. Restore this exact photograph at 4096x3072 resolution, maximum photographic fidelity and sharper natural details. This is archival image restoration/upscaling, not redesign. Preserve EXACT camera position, composition, every window, door, shutters, house geometry, furniture count and positions, patio tile joints, pool edges, reflections and overcast lighting. Remove JPEG softness and blockiness without changing the construction or inventing features. No text, no logos, no framing. Output only the restored photograph. »

Prompt héros : « Edit target: actual photograph of pool with timber deck, white timber-clad house on left, glass timber pool house right and trees behind. Faithful archival restoration and high resolution upscaling only. Produce at 4096 pixels wide with original aspect ratio about 1.725:1. Preserve EXACT pool geometry, camera position and framing, facade/windows, deck joints, trees, foliage, patio furniture and white pool cover roller. Restore natural fine texture and remove JPEG artifacts, do not change architecture or invent/remove objects. Keep identical daylight and colors. No tint, overlay, text or frame. Output only restored photograph. »
