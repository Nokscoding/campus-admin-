# CAMPUS ERP — Gestion des commandes et agents

ERP distinct de la marketplace étudiante. Next.js + Supabase, déployé sur Vercel.

URL : https://campus-erp-nks16.vercel.app

## Rôles (CAMPUS uniquement)
- `admin` : modération, affectations, collaborateurs et finances.
- `operations` : modération, affectation d'agent, fixation des frais de livraison.
- `agent` : voit ses commandes, organise la récupération, inspecte avec photos privées et note les espèces réellement collectées.
- `finance` : registre cash et justificatifs de versement vendeur.

Les comptes doivent être créés via CAMPUS (Supabase Auth) avant qu'un administrateur les habilite. Les agents n'ont pas accès aux données NKS Services.

## Initialiser le PREMIER administrateur
La base n'a aucun membre du personnel CAMPUS initialement. Ce premier rôle doit être attribué **manuellement, au bon compte** :

1. Créer un compte sur https://campus-marketplace-smoky-one.vercel.app/compte et confirmer l'email si demandé.
2. Dans le projet Supabase **hdsjpsrvoiwqfjuehdkt**, exécuter la requête SQL suivante en remplaçant l'email par celui du propriétaire légitime :

```sql
insert into public.campus_staff(user_id,role,active)
select id, 'admin', true
from auth.users
where lower(email) = lower('VOTRE_EMAIL_CONFIRME')
on conflict (user_id)
do update set role = 'admin', active = true;
```

3. Vérifier que exactement un compte est autorisé, puis se connecter à l'ERP.
4. Créer/habiliter ensuite les agents dans la section « Agents & équipes ». Ne jamais attribuer `admin` à des personnes non autorisées.

## Flux transactionnel
1. Annonce soumise avec photos, puis approuvée ou refusée.
2. Acheteur demande le produit (réservé, paiement non requis).
3. Opérations définit le coût de livraison et affecte un agent.
4. Acheteur accepte le devis.
5. Agent retire le produit, enregistre une inspection documentée **avec photos**, et prend en charge la livraison.
6. Agent enregistre **uniquement les espèces effectivement reçues**, avec un numéro de reçu unique.
7. Acheteur confirme la réception et peut imprimer son reçu.
8. Finance enregistre le reversement réel au vendeur, déduction faite de la commission.

Aucune transaction fictive. Les opérations cash ne doivent pas être testées sur de vrais encaissements sans protocole de contrôle physique.

## Sécurité
- Tables CAMPUS en RLS ; opérations sensibles autorisées par des fonctions SQL contrôlant le rôle.
- Les rôles sont dans `campus_staff` (non dans les `user_metadata`).
- Journal immuable des événements et reçus uniques.
- Bucket `campus-inspection-proof` privé et protégé par autorisation agent / administration.
- Vercel SSO appliqué aux prévisualisations ; l'URL de production est accessible, mais protégée par login Supabase + rôle.

## Limites avant lancement
Un compte administrateur valide et des agents formés sont indispensables. Prévoir une validation juridique des conditions de remise, litiges, remboursement, fiscalité et responsabilité avant un lancement public.
