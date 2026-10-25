# Administration ABK

## Instance activée le 25 octobre 2026

Projet Supabase dédié : `abk-gestion` (`fggifjjivbwdxfzesjpq`), organisation
choisie par le propriétaire, région Paris. Coût annoncé à la création : 0 USD/mois.
Accès réel : `https://abk-ten.vercel.app/gestion/`, depuis le petit bonhomme du
site `https://abk-ten.vercel.app`. Le raccordement a été publié en production à la
demande du propriétaire. Un administrateur Direction ABK
a été provisionné dans Supabase Auth ; aucun mot de passe n'est stocké dans ce dépôt.
Le compte peut changer son mot de passe depuis son espace ; les autres sessions
sont alors révoquées. Les jeux d'essai ont été supprimés de la base réelle.

Architecture déployée : Vercel sert le site et `/api/gestion` relaie les requêtes
vers l'Edge Function Supabase `abk-management`. Un jeton serveur aléatoire
authentifie ce relais ; seule son empreinte figure dans le bundle déployé.
La fonction contrôle ensuite la session ABK, le rôle, l'origine et les permissions
sur chaque dossier. Les identifiants PostgreSQL et les clés Supabase restent dans
les variables privées fournies par Supabase aux fonctions, jamais dans le navigateur.
Les tables sont accessibles uniquement côté serveur. `verify_jwt=false` concerne
le contrôle du relais : la fonction effectue elle-même son authentification avant
toute opération ; elle n'autorise pas les appels publics sans jeton.

Les variables Vercel de production sont `ABK_BACKEND_URL`,
`ABK_BACKEND_TOKEN` et `APP_ORIGIN` (https://abk-ten.vercel.app). Les secrets sont ajoutés par entrée standard,
sans argument de commande. `/server/`, `/edge/`, `/scripts/` et `.env*` ne sont pas
servis par le build. Le point de provisionnement `abk-initialize` a été fermé et
redéployé avec vérification JWT après création du premier compte.

Vérification réelle réalisée : connexion Supabase, cookie sécurisé et persistance
de session, chantier/tâche/document et pièce jointe en base, invitation générée,
écriture comptable, téléchargement PDF et déconnexion. Les tests de contrôle d'accès
locaux restent nécessaires avant une évolution. Les e-mails automatiques ne sont
pas configurés : les invitations sont partageables par copie du lien personnel.
La réinitialisation par e-mail nécessite toujours un expéditeur vérifié.

`edge/index.ts` est la source du relais. Le script `scripts/edge-bundle.mjs`
remplace les marqueurs de configuration avec un fichier local privé ignoré par Git.
Après une modification du serveur, redéployer cette fonction avant le frontend.
Ne pas activer le fournisseur de mots de passe local en ligne.

## Présentation publique

`/demo/` est un aperçu public en lecture seule pour présenter les écrans aux
directeurs. Toutes les données sont fictives et signalées par un bandeau permanent.
Aucun compte, document réel, envoi ni enregistrement serveur n'est utilisé.
Cet aperçu ne signifie pas que Supabase ou les comptes de production sont activés.
Les tests `tests/demo-check.mjs` vérifient les écrans, le blocage des écritures et
l'absence d'appel à l'API de gestion. Ne pas y saisir d'informations personnelles.

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
