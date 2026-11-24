# Espace de gestion ABK - périmètre confirmé

## Demandes et messagerie

- Enregistrer les formulaires publics dans une boîte interne, avec source, date,
  expertise, coordonnées, contenu, statut et responsable.
- Accusé de réception uniquement après persistance confirmée ; protection anti-abus.
- Conversation liée à une demande ou un projet ; séparer notes internes et messages clients.
- Transformer une demande en fiche client et projet sans perdre son historique.

## Clients et projets

- Une fiche client peut posséder plusieurs projets ; chaque projet garde son dossier.
- Admin : créer, modifier, attribuer, archiver et suivre les demandes et les projets.
- Client : ne voir que ses dossiers, leur progression et les éléments partagés.
- Sous-traitant : ne voir que les projets attribués et les éléments nécessaires à sa mission.
- Révocation des accès et réattribution sans fuite de données.

## Tâches et déroulement

- Titre, description, responsable, dates de début et d'échéance, statut à faire / en
  cours / terminé, date de réalisation, pièces associées et visibilité.
- ABK peut cocher une tâche terminée ou la rouvrir ; historique conservé.
- Progression explicite, tâches en retard et calendrier ; client en lecture des
  étapes partagées, sans modifier le planning ou valider un paiement implicitement.
- Autoriser les mises à jour de sous-traitants selon un droit explicite, pas global.

## Documents

- Glisser-déposer plans, photos et documents dans le dossier du projet.
- Stockage privé, autorisations vérifiées à chaque lecture/téléchargement, liens
  temporaires, limites de taille et types autorisés ; traitement des fichiers dangereux.
- Visibilités : interne ABK, client, sous-traitants attribués ; journaliser les changements.
- Ne jamais déposer ces documents dans le répertoire public du site ou dans GitHub.

## Comptabilité de gestion

- Entrées, dépenses, dates, catégories, montants HT/TVA/TTC si pertinents, statut
  prévu / facturé / encaissé ou payé, pièces justificatives et projet associé.
- Séparer chiffre d'affaires facturé, trésorerie encaissée et prévisionnel.
- Rapport détaillé en un clic : période choisie, totaux, détail des écritures,
  ventilation par projet/catégorie et export PDF/CSV protégé.
- Réservé aux admins ; un sous-traitant ne voit pas les marges ni les coûts globaux.
- Il s'agit d'un suivi de gestion, pas d'une comptabilité légale certifiée ni d'une
  promesse de logiciel de facturation conforme sans validation dédiée.

## Tableau de bord et journal admin

- Demandes nouvelles, à rappeler, qualifiées, devis, projets en cours et retards.
- Statistiques par période, expertise, source et responsable ; pas de faux compteurs.
- Journal d'audit : auteur, date, action et objet concerné ; protéger et limiter les données.
- Mesure des demandes et actions enregistrées distincte des statistiques de visites web.

## Invitation et authentification

- Invitation client ou sous-traitant par lien unique, temporaire, révocable et à usage unique.
- Partage possible par e-mail ou par lien copié dans WhatsApp ; pas d'envoi automatisé
  WhatsApp promis sans intégration/configuration spécifique.
- Activation liée à l'adresse invitée et choix du mot de passe ; ne pas autoriser une
  autre adresse à récupérer le dossier. Pas d'inscription publique donnant le rôle admin.
- Mot de passe oublié, sessions sécurisées, déconnexion, limitation des essais et MFA admin.
- Création du premier admin par procédure serveur contrôlée, après confirmation de son e-mail.

## Pré-requis avant activation

1. Choisir et configurer base de données, authentification et stockage privé.
2. Confirmer l'adresse exacte du propriétaire, le service d'e-mail et les domaines autorisés.
3. Prévoir sauvegardes, restauration, limites de stockage et coûts acceptés.
4. Tester l'isolement entre deux clients et entre deux sous-traitants ; refus d'accès
   par identifiants devinés, liens périmés/réutilisés, rôles modifiés et accès révoqués.
5. Tester demande publique → boîte interne → client → plusieurs projets → tâches →
   documents privés → invitation → accès limité → rapport comptable.
6. Déployer en préproduction d'abord, sans modifier l'apparence du site public.
