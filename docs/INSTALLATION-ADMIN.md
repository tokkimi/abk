# Administration ABK

## Fonctionnement livré

Une connexion commune à `/gestion/`, puis un affichage selon le rôle serveur :
administrateur ABK, client, sous-traitant. Le navigateur ne décide jamais des droits.

- Tableau de bord : demandes nouvelles, projets ouverts, tâches à effectuer et retards.
- Demandes : recherche, consultation des questionnaires, statuts, notes internes et
  conversion en projet avec fiche client. L'historique confidentiel reste dans la demande.
- Clients et chantiers : plusieurs projets par client, dates, états, archivage,
  adresse, itinéraire, GPS facultatif, contact sur place, accès, stationnement,
  horaires, réseaux, occupation, travaux, contraintes et autorisations. Le budget
  et les notes privées sont retirés des réponses serveur hors administration.
- Partenaires : fiche avec société, métier, coordonnées, notes privées et projets
  attribués ; agenda des interventions et indisponibilités, contrôle des
  chevauchements, consultation de son propre agenda par le sous-traitant.
- Tâches : responsable, échéance, description, avancement et visibilité. Un
  sous-traitant autorisé peut seulement modifier le statut de ses propres tâches partagées.
- Documents : glisser-déposer PDF/PNG/JPEG, 3 Mo maximum par fichier, stockage privé
  en PostgreSQL `bytea`, contrôle d'accès à chaque téléchargement. Jamais de fichier
  client dans `public/`, GitHub ou le stockage du navigateur.
- Messages : internes, ABK/client, ou partagés avec tous les membres du projet.
  Vue globale par conversations, derniers messages et non-lus, fil détaillé et
  cinq pièces jointes par message (dont les factures PDF existantes). Le serveur
  interdit de joindre un document interne à une conversation partagée.
  Aucune génération de factures ni lien de paiement.
- Accès : invitation personnelle de 48 heures à usage unique, lien à copier dans
  WhatsApp ou e-mail ; un compte existant conserve son mot de passe. Révocation et
  désactivation. Réinitialisation par e-mail sur un lien d'une heure.
- Comptabilité interne : recettes/dépenses, prévisionnel/facturé/payé, HT/TVA/TTC,
  affectation à un chantier, filtres de dates, rapports PDF et CSV.
- Journal des actions : connexions, accès, invitations, changements, documents et exports.

## Configuration réelle avant ouverture

1. Choisir un projet Supabase dédié à ABK et inspecter ses tables. La migration
   `server/schema.sql` est additive ; elle ne supprime aucune table existante.
2. Configurer côté Vercel, pour l'environnement voulu : `DATABASE_URL` (connexion
   PostgreSQL Supabase via pooler avec TLS vérifié), `SUPABASE_URL`,
   `SUPABASE_SERVICE_ROLE_KEY` et `APP_ORIGIN` (origine exacte, sans chemin).
   Aucune clé serveur ne doit être injectée dans le JavaScript public.
3. Exécuter `npm run db:migrate` dans un environnement privé possédant la connexion.
   Les tables ont RLS activé sans politique publique et les rôles `anon` et
   `authenticated` ne possèdent aucun droit. L'API Vercel réalise toutes les lectures
   après vérification de la session et de l'attribution au projet.
4. Pour créer le premier administrateur, définir temporairement `ADMIN_EMAIL`,
   `ADMIN_PASSWORD` (12 caractères minimum), éventuellement `ADMIN_NAME`, puis
   exécuter `npm run admin:create`. Le script refuse si un administrateur existe.
   Ne jamais mettre ces variables dans GitHub ni utiliser une adresse d'essai en réel.
5. Pour envoyer invitations et réinitialisations, configurer `RESEND_API_KEY` et
   `EMAIL_FROM` avec un domaine vérifié. Sans cela, les invitations sont partageables
   par copie du lien et le formulaire de réinitialisation n'annonce aucun envoi confirmé.
6. Les demandes publiques disposent d'une limite de débit par IP et d'une validation
   serveur. Une protection Turnstile peut être ajoutée : `TURNSTILE_SECRET_KEY` côté
   serveur et `TURNSTILE_SITE_KEY` au build, avec domaine autorisé et action `quote`.
7. Déployer d'abord un aperçu Vercel, définir son `APP_ORIGIN`, puis vérifier avec
   de vrais comptes de test Supabase les trois rôles, l'invitation, la révocation,
   l'envoi d'une demande, les documents et les exports avant promotion en production.

Supabase Auth conserve les mots de passe de production. L'API vérifie le compte
Supabase puis émet une session ABK opaque, stockée sous forme hachée côté serveur,
avec cookie HttpOnly/Secure/SameSite et protection CSRF. Les rôles applicatifs sont
dans les tables privées, jamais dans des métadonnées utilisateur modifiables.

## Vérifications et aperçu local

`npm ci`, `npm test`, `npm run build`. Le build copie seulement HTML/CSS/JS publics,
`public/` et `gestion/` dans `dist/`. Il exclut `.env`, SQL, tests et code serveur.

`node tests/preview-server.mjs` sert un aperçu local à `http://localhost:4317/gestion/`.
Il utilise uniquement une base PostgreSQL éphémère en mémoire et des adresses
réservées `.example`. Les identifiants de ce test n'existent pas en production.
Le fournisseur local de mots de passe exige simultanément `NODE_ENV=test` et
`AUTH_PROVIDER=local-test` ; il est réservé aux tests. Arrêter le serveur efface ses données.

Pour le parcours navigateur, utiliser le package Playwright disponible localement
via `PLAYWRIGHT_PACKAGE`, puis `node tests/browser-check.mjs`. Le test contrôle
connexion, création client, dossier chantier, itinéraire, tâches, facture jointe,
invitation, comptabilité, alignements, fiche partenaire, agenda et messagerie mobile.

## Limites explicites

La configuration et les tests Supabase/Vercel réels restent nécessaires avant
utilisation. L'application ne fournit pas de facturation légale certifiée, ni
paiement en ligne, ni synchronisation bancaire, ni antivirus ou MFA. Les fichiers
sont téléchargés en pièce jointe avec `nosniff` ; leur signature est contrôlée,
mais cela ne remplace pas un scanner. Les rapports de gestion ne remplacent pas
les comptes légaux. Prévoir sauvegardes, conservation et suppression des données
avec l'exploitant avant réception de dossiers réels.

La création d'un compte appelle Supabase Auth et PostgreSQL : deux services distincts.
Si l'écriture PostgreSQL échoue après création Auth, contrôler et réconcilier le
compte avant de renouveler l'invitation. Aucun succès n'est annoncé dans ce cas.
La messagerie actuelle est consultable à l'ouverture/actualisation du dossier ;
elle ne promet pas de notification push ni WhatsApp automatique.
