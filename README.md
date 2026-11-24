# ABK Bâti & Piscine

Site : https://abk-ten.vercel.app

## Version récupérée le 25 octobre 2026

Les 237 fichiers sources ont été récupérés depuis le déploiement Vercel
`dpl_4RcLXaL8i4WFZnnEjhWfre63bDD4`. Chaque fichier a été vérifié par son SHA-1
contre l'inventaire de ce déploiement, y compris les images des animations.

La récupération n'a ni modifié ni redéployé la production. La branche de
sauvegarde est `recovery/production-20261025`. Examiner le diff avant fusion.
Le projet Vercel est déjà relié à ce dépôt, avec `main` comme branche de production.

## Structure actuelle

Site statique HTML, CSS et JavaScript. Pages d'expertises distinctes, animations
image par image, navigation et questionnaires de devis.

Le suivi illustré sur la home reste une démonstration du site public. La nouvelle
application de gestion est dans `/gestion/`, avec une API Vercel séparée. Sans
configuration serveur, elle refuse les connexions et les écritures. Les formulaires
publics gardent leur récapitulatif e-mail ; lorsque la base est disponible, ils
proposent aussi l'envoi direct dans la boîte interne ABK.

## Espace de gestion demandé

Le périmètre attendu est décrit dans [docs/ESPACE-GESTION.md](docs/ESPACE-GESTION.md).
L'instance réelle de gestion est activée sur Supabase et Vercel, avec connexion
administrateur vérifiée. Les identifiants sont transmis séparément au propriétaire.
Les détails du déploiement et les limites de l'envoi e-mail figurent dans
[docs/INSTALLATION-ADMIN.md](docs/INSTALLATION-ADMIN.md).

L'implémentation et son installation sont décrites dans
[docs/INSTALLATION-ADMIN.md](docs/INSTALLATION-ADMIN.md). Les comptes de production
utilisent Supabase Auth et PostgreSQL ; aucun compte partagé ni mot de passe
administrateur n'est inclus. La branche `feature/abk-management` n'est pas fusionnée
sur `main`. L'espace réel a été publié sur `https://abk-ten.vercel.app/gestion/`
à la demande du propriétaire, accessible par l'icône de connexion du site.
La présentation `/demo/` reste distincte de l'espace réel `/gestion/`.

## Confidentialité et travail collaboratif

Le dépôt est public. Ne jamais y ajouter coordonnées personnelles du propriétaire,
secrets, base de données, documents clients, fichiers téléversés ou exports comptables.
Les paramètres privés doivent être stockés côté serveur. Une adresse d'essai doit
utiliser le domaine réservé `.example`, jamais une adresse tierce réelle.

Pour les évolutions : nouvelle branche, tests, revue puis fusion explicite.
Préserver les modifications d'autres intervenants et les animations du site.
