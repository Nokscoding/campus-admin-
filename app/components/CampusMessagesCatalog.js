// Bibliothèque officielle de messages préécrits CAMPUS. Chaque envoi est manuel.
export const CAMPUS_MESSAGE_CATEGORIES=[
  "Accueil",
  "Annonces",
  "Modération",
  "Commandes",
  "Inspection & livraison",
  "Paiement",
  "Assistance",
  "Communauté"
];
export const CAMPUS_MESSAGE_TEMPLATES=[
  {
    "id": "welcome",
    "category": "Accueil",
    "title": "Bienvenue sur CAMPUS",
    "description": "Après inscription",
    "text": "{{salutation}},\n\nBienvenue sur CAMPUS ! Nous sommes heureux de t’accueillir sur notre plateforme de vente entre étudiants.\n\nTu peux découvrir les articles disponibles ou publier tes propres annonces. CAMPUS organise l’inspection et la remise des produits sur le campus.\n\nDécouvre la plateforme : https://www.campus-rdc.com\n\nÀ très bientôt !"
  },
  {
    "id": "welcome-seller",
    "category": "Accueil",
    "title": "Bienvenue à un nouveau vendeur",
    "description": "Après une première annonce",
    "text": "{{salutation}},\n\nBienvenue parmi les vendeurs CAMPUS ! Merci de nous faire confiance pour « {{produit}} ».\n\nNotre équipe examine les annonces avant leur publication. Pour faciliter la vente, veille à proposer des photos nettes et une description précise.\n\nTu seras informé de la décision sur CAMPUS."
  },
  {
    "id": "welcome-university",
    "category": "Accueil",
    "title": "Bienvenue à ton université",
    "description": "Premier contact étudiant",
    "text": "{{salutation}},\n\nNous sommes heureux d’accueillir un étudiant de {{universite}} sur CAMPUS !\n\nIci, tu peux acheter et vendre des produits entre étudiants, avec une inspection et une remise sur le campus organisées par notre équipe.\n\nBienvenue dans la communauté !"
  },
  {
    "id": "seller-thanks",
    "category": "Accueil",
    "title": "Remercier un vendeur actif",
    "description": "Fidélisation",
    "text": "{{salutation}},\n\nMerci de contribuer à la communauté CAMPUS grâce à tes annonces !\n\nNous apprécions ta confiance. Continue à publier des informations claires et des photos de qualité pour aider les acheteurs à choisir sereinement.\n\nBonne continuation sur CAMPUS !"
  },
  {
    "id": "listing-received",
    "category": "Annonces",
    "title": "Annonce reçue pour validation",
    "description": "Accusé de réception",
    "text": "{{salutation}},\n\nNous avons bien reçu ton annonce « {{produit}} ». Notre équipe va vérifier sa description, ses photos et sa conformité aux règles CAMPUS.\n\nTu recevras une notification après l’examen. Merci pour ta confiance !"
  },
  {
    "id": "listing-approved",
    "category": "Annonces",
    "title": "Annonce validée et publiée",
    "description": "Après validation effective",
    "text": "{{salutation}},\n\nBonne nouvelle ! Ton annonce « {{produit}} » a été approuvée et est désormais visible sur CAMPUS.\n\nLes étudiants intéressés peuvent envoyer une demande depuis la plateforme. Pense à surveiller tes notifications.\n\nNous te souhaitons une bonne vente !"
  },
  {
    "id": "listing-admin-edited",
    "category": "Annonces",
    "title": "Annonce modifiée par CAMPUS",
    "description": "Confirmation après édition ERP",
    "text": "{{salutation}},\n\nNous t’informons que l’équipe CAMPUS a apporté une correction à ton annonce « {{produit}} ».\n\nModification : {{details}}\n\nLa version mise à jour est enregistrée dans ton compte. Merci de ta compréhension !"
  },
  {
    "id": "revision-approved",
    "category": "Annonces",
    "title": "Modification approuvée",
    "description": "Après validation de la révision",
    "text": "{{salutation}},\n\nLes modifications que tu as proposées pour « {{produit}} » ont été approuvées.\n\nLa version mise à jour remplace maintenant l’ancienne annonce sur CAMPUS. Merci d’avoir pris le temps de l’améliorer !"
  },
  {
    "id": "revision-rejected",
    "category": "Annonces",
    "title": "Modification refusée",
    "description": "La version d’origine reste en ligne",
    "text": "{{salutation}},\n\nAprès examen, nous n’avons pas pu approuver les modifications proposées pour « {{produit}} ».\n\nMotif : {{details}}\n\nSi ton annonce était déjà publiée, sa version précédente reste visible. Tu peux corriger ta proposition et la soumettre à nouveau."
  },
  {
    "id": "photos-improve",
    "category": "Annonces",
    "title": "Améliorer les photos",
    "description": "Photos floues ou incomplètes",
    "text": "{{salutation}},\n\nLes photos de « {{produit}} » mériteraient d’être améliorées pour mieux présenter l’article.\n\nEssaie de prendre des photos nettes, bien éclairées et sous plusieurs angles, sans filtres trompeurs. Merci !"
  },
  {
    "id": "description-improve",
    "category": "Annonces",
    "title": "Description incomplète",
    "description": "Informations sur le produit",
    "text": "{{salutation}},\n\nPour faciliter la vente de « {{produit}} », merci de préciser les éléments suivants dans la description : {{details}}\n\nCes informations permettent aux acheteurs de mieux comprendre l’état du produit avant son inspection."
  },
  {
    "id": "price-verify",
    "category": "Annonces",
    "title": "Vérification du prix",
    "description": "Prix incorrect ou ambigu",
    "text": "{{salutation}},\n\nPeux-tu vérifier le prix de ton annonce « {{produit}} » ? Nous souhaitons nous assurer que le montant affiché correspond bien à ton prix de vente.\n\nTu peux le corriger depuis ton compte CAMPUS si nécessaire."
  },
  {
    "id": "category-fix",
    "category": "Annonces",
    "title": "Catégorie incorrecte",
    "description": "Réorienter une annonce",
    "text": "{{salutation}},\n\nTon annonce « {{produit}} » pourrait être placée dans une catégorie mieux adaptée.\n\nMerci de vérifier sa catégorie afin que les étudiants intéressés puissent la retrouver plus facilement. Tu peux proposer une catégorie si aucune ne correspond."
  },
  {
    "id": "still-available",
    "category": "Annonces",
    "title": "Produit toujours disponible ?",
    "description": "Ancienne annonce",
    "text": "{{salutation}},\n\nTon produit « {{produit}} » est-il toujours disponible ?\n\nSi oui, pense à maintenir son prix et sa description à jour. Sinon, retire l’annonce afin d’éviter les demandes inutiles.\n\nMerci pour ton retour !"
  },
  {
    "id": "personal-contact",
    "category": "Modération",
    "title": "Retirer le numéro personnel",
    "description": "Numéro WhatsApp ou téléphone dans l’annonce",
    "text": "{{salutation}},\n\nL’équipe CAMPUS a remarqué que ton annonce « {{produit}} » contient un numéro personnel ou un moyen de contact direct.\n\nPour respecter les règles CAMPUS, les transactions doivent passer par la plateforme afin de permettre l’inspection, le suivi et la remise sur le campus.\n\nMerci de retirer ces coordonnées et de soumettre ta modification. En l’absence de correction, l’annonce pourra être masquée."
  },
  {
    "id": "correction-required",
    "category": "Modération",
    "title": "Demande de correction",
    "description": "Motif de modération précis",
    "text": "{{salutation}},\n\nL’équipe CAMPUS demande une correction de ton annonce « {{produit}} ».\n\nProblème constaté : {{details}}\n\nMerci de modifier ton annonce depuis ton compte. Les changements seront examinés avant publication. Si le problème persiste, l’annonce pourra être masquée."
  },
  {
    "id": "correction-reminder",
    "category": "Modération",
    "title": "Rappel de correction",
    "description": "Pas encore de réponse",
    "text": "{{salutation}},\n\nNous revenons vers toi au sujet de la demande de correction de « {{produit}} ».\n\nCorrection attendue : {{details}}\n\nMerci d’effectuer la modification dès que possible. Si tu rencontres une difficulté, notre équipe reste à ta disposition."
  },
  {
    "id": "correction-thanks-submitted",
    "category": "Modération",
    "title": "Remercier après une correction demandée",
    "description": "Le vendeur a modifié son annonce et attend la validation.",
    "text": "{{salutation}},\n\nNous avons bien reçu les modifications que tu as apportées à ton annonce « {{produit}} » à la suite de notre demande.\n\nNous tenons à te remercier d’avoir pris en compte nos remarques et d’avoir respecté les règles de CAMPUS. Ta coopération nous aide à maintenir une plateforme fiable et sécurisée pour tous les étudiants.\n\nNotre équipe va maintenant examiner les changements proposés. Tu recevras une notification dès qu’une décision sera prise.\n\nMerci encore pour ta compréhension et ta confiance !"
  },
  {
    "id": "correction-thanks-approved",
    "category": "Modération",
    "title": "Remercier après une correction validée",
    "description": "Les modifications demandées ont été approuvées.",
    "text": "{{salutation}},\n\nNous avons vérifié les modifications effectuées sur ton annonce « {{produit}} » et nous te confirmons qu’elles ont été approuvées.\n\nMerci d’avoir suivi les recommandations de notre équipe et d’avoir respecté les règles de CAMPUS. Cette collaboration nous permet de protéger les acheteurs comme les vendeurs et de proposer des annonces de meilleure qualité.\n\nTon annonce est maintenant à jour. Nous te souhaitons une excellente vente sur CAMPUS !"
  },
  {
    "id": "listing-hidden",
    "category": "Modération",
    "title": "Annonce masquée",
    "description": "Après masquage effectif",
    "text": "{{salutation}},\n\nTon annonce « {{produit}} » a été temporairement masquée sur CAMPUS.\n\nMotif : {{details}}\n\nElle n’apparaît plus dans le catalogue. Tu peux la corriger puis la soumettre à un nouvel examen. Merci de ta compréhension."
  },
  {
    "id": "listing-rejected",
    "category": "Modération",
    "title": "Annonce refusée",
    "description": "Après refus à validation",
    "text": "{{salutation}},\n\nNous n’avons pas pu valider ton annonce « {{produit}} ».\n\nMotif : {{details}}\n\nTu peux corriger les points signalés puis renvoyer l’annonce en modération depuis ton compte CAMPUS."
  },
  {
    "id": "listing-restored",
    "category": "Modération",
    "title": "Annonce rétablie",
    "description": "Après restauration effective",
    "text": "{{salutation}},\n\nBonne nouvelle ! Après vérification, ton annonce « {{produit}} » est de nouveau publiée sur CAMPUS.\n\nMerci d’avoir pris en compte les recommandations de notre équipe. Bonne vente !"
  },
  {
    "id": "listing-deleted",
    "category": "Modération",
    "title": "Annonce supprimée",
    "description": "Après suppression administrative",
    "text": "{{salutation}},\n\nNous t’informons que l’annonce « {{produit}} » a été supprimée du catalogue CAMPUS.\n\nMotif : {{details}}\n\nSi tu souhaites des explications supplémentaires, tu peux contacter notre équipe d’assistance."
  },
  {
    "id": "rules-reminder",
    "category": "Modération",
    "title": "Rappel du règlement CAMPUS",
    "description": "Prévention des transactions directes",
    "text": "{{salutation}},\n\nRappel important : les transactions initiées sur CAMPUS doivent être organisées par la plateforme.\n\nMerci de ne pas ajouter de coordonnées directes dans les annonces ni de conclure la vente en dehors de CAMPUS. Notre équipe assure l’inspection et la remise du produit sur le campus.\n\nMerci pour ta coopération."
  },
  {
    "id": "buyer-request",
    "category": "Commandes",
    "title": "Demande d’achat reçue — vendeur",
    "description": "Un acheteur a fait une demande",
    "text": "{{salutation}},\n\nUn étudiant a demandé à acheter ton article « {{produit}} » via CAMPUS !\n\nNotre équipe va suivre cette demande et organiser les prochaines étapes. Garde le produit disponible et surveille tes notifications."
  },
  {
    "id": "buyer-confirm",
    "category": "Commandes",
    "title": "Demande d’achat reçue — acheteur",
    "description": "Accusé de réception de commande",
    "text": "{{salutation}},\n\nNous avons bien reçu ta demande concernant « {{produit}} ».\n\nL’équipe CAMPUS va vérifier les éléments nécessaires et te tenir informé de la suite. Merci d’avoir choisi CAMPUS !"
  },
  {
    "id": "availability-check",
    "category": "Commandes",
    "title": "Confirmer la disponibilité",
    "description": "Vérification auprès du vendeur",
    "text": "{{salutation}},\n\nUne demande d’achat concerne ton article « {{produit}} ».\n\nPeux-tu nous confirmer qu’il est toujours disponible et conforme à sa description ? Merci de nous répondre pour que nous puissions organiser la suite."
  },
  {
    "id": "order-confirmed",
    "category": "Commandes",
    "title": "Commande confirmée",
    "description": "Après confirmation réelle",
    "text": "{{salutation}},\n\nTa commande concernant « {{produit}} » a été confirmée dans CAMPUS.\n\nNotre équipe va organiser le retrait, l’inspection et la remise du produit sur le campus. Nous te communiquerons les prochaines étapes."
  },
  {
    "id": "pickup-plan",
    "category": "Commandes",
    "title": "Programmer le retrait",
    "description": "Rendez-vous avec le vendeur",
    "text": "{{salutation}},\n\nNous souhaitons organiser le retrait de « {{produit}} » afin de procéder à son inspection.\n\nDate proposée : {{date}}\nLieu : {{lieu}}\n\nMerci de nous confirmer ta disponibilité et de préparer les accessoires annoncés."
  },
  {
    "id": "order-cancelled",
    "category": "Commandes",
    "title": "Commande annulée",
    "description": "Après annulation réelle",
    "text": "{{salutation}},\n\nLa commande concernant « {{produit}} » a été annulée.\n\nPrécisions : {{details}}\n\nNotre équipe reste disponible si tu as des questions ou souhaites passer une nouvelle demande."
  },
  {
    "id": "picked-up",
    "category": "Inspection & livraison",
    "title": "Produit récupéré",
    "description": "Après retrait confirmé",
    "text": "{{salutation}},\n\nL’équipe CAMPUS a bien récupéré l’article « {{produit}} ».\n\nNous allons maintenant procéder à son inspection. Tu recevras les informations sur la suite de la commande."
  },
  {
    "id": "inspection-started",
    "category": "Inspection & livraison",
    "title": "Inspection en cours",
    "description": "Pendant la vérification",
    "text": "{{salutation}},\n\nTon article « {{produit}} » est en cours d’inspection par CAMPUS.\n\nNous vérifions notamment sa conformité avec l’annonce. Nous te tiendrons informé du résultat."
  },
  {
    "id": "inspection-passed",
    "category": "Inspection & livraison",
    "title": "Inspection conforme",
    "description": "Après un contrôle positif",
    "text": "{{salutation}},\n\nL’inspection de « {{produit}} » est terminée et le résultat est conforme aux vérifications effectuées.\n\nNotre équipe peut désormais organiser la prochaine étape de la remise sur le campus."
  },
  {
    "id": "inspection-problem",
    "category": "Inspection & livraison",
    "title": "Problème découvert à l’inspection",
    "description": "Écart entre produit et annonce",
    "text": "{{salutation}},\n\nLors de l’inspection de « {{produit}} », nous avons constaté un point nécessitant une vérification supplémentaire.\n\nPrécisions : {{details}}\n\nNotre équipe va clarifier la situation avant de poursuivre la transaction."
  },
  {
    "id": "delivery-appointment",
    "category": "Inspection & livraison",
    "title": "Rendez-vous de livraison sur le campus",
    "description": "Heure et lieu confirmés",
    "text": "{{salutation}},\n\nLa remise de « {{produit}} » est prévue :\n\nDate : {{date}}\nPoint de rendez-vous : {{lieu}}\n\nMerci de respecter le créneau prévu. Les remises CAMPUS se font uniquement sur le campus, et non à domicile."
  },
  {
    "id": "delivery-complete",
    "category": "Inspection & livraison",
    "title": "Remise du produit confirmée",
    "description": "Après livraison réelle",
    "text": "{{salutation}},\n\nLa remise de « {{produit}} » a été confirmée par CAMPUS.\n\nMerci de nous avoir fait confiance pour cette transaction entre étudiants. À bientôt !"
  },
  {
    "id": "commission-info",
    "category": "Paiement",
    "title": "Expliquer la commission CAMPUS",
    "description": "Règles de frais",
    "text": "{{salutation}},\n\nLa publication d’une annonce sur CAMPUS est gratuite. Une commission de 10 % est prélevée au vendeur uniquement lorsqu’une vente aboutit.\n\nLes frais de livraison sont supportés par l’acheteur. L’équipe organise l’inspection et la remise sur le campus.\n\nNous restons à ta disposition pour toute question."
  },
  {
    "id": "cash-payment",
    "category": "Paiement",
    "title": "Paiement en espèces",
    "description": "Modalités de règlement",
    "text": "{{salutation}},\n\nPour « {{produit}} », le paiement s’effectue en espèces au moment de la remise, selon les modalités confirmées par CAMPUS.\n\nMerci de ne pas remettre d’argent en dehors du circuit prévu par notre équipe."
  },
  {
    "id": "delivery-fee",
    "category": "Paiement",
    "title": "Confirmation des frais de livraison",
    "description": "Avant accord de l’acheteur",
    "text": "{{salutation}},\n\nLes frais de livraison proposés pour « {{produit}} » sont de {{montant}}.\n\nIls sont distincts du prix du produit et concernent son acheminement sur le campus. Merci de confirmer ton accord avant la suite de la commande."
  },
  {
    "id": "payment-clarification",
    "category": "Paiement",
    "title": "Suivi d’un règlement",
    "description": "Paiement à éclaircir",
    "text": "{{salutation}},\n\nNous faisons le point sur le règlement concernant « {{produit}} ».\n\nPrécisions : {{details}}\n\nNotre équipe vérifie les éléments disponibles. Merci de conserver toute preuve utile et de communiquer uniquement par les canaux officiels CAMPUS."
  },
  {
    "id": "help-received",
    "category": "Assistance",
    "title": "Réception d’une demande d’aide",
    "description": "Accusé de réception",
    "text": "{{salutation}},\n\nNous avons bien reçu ta demande concernant : {{details}}\n\nNotre équipe va examiner la situation et te communiquer les informations utiles. Merci pour ta patience."
  },
  {
    "id": "help-resolved",
    "category": "Assistance",
    "title": "Problème résolu",
    "description": "Après correction d’un bug",
    "text": "{{salutation}},\n\nNous revenons vers toi concernant le problème suivant : {{details}}\n\nIl a été traité par notre équipe. Tu peux réessayer sur https://www.campus-rdc.com et nous signaler si la difficulté persiste."
  },
  {
    "id": "need-details",
    "category": "Assistance",
    "title": "Demander des précisions",
    "description": "Bug ou difficulté",
    "text": "{{salutation}},\n\nMerci de nous avoir signalé cette difficulté.\n\nPour mieux comprendre, pourrais-tu préciser : {{details}}\n\nSi possible, joins une capture d’écran en masquant tes informations personnelles. Merci !"
  },
  {
    "id": "complaint-received",
    "category": "Assistance",
    "title": "Réclamation reçue",
    "description": "Plainte client ou vendeur",
    "text": "{{salutation}},\n\nNous avons bien reçu ta réclamation au sujet de « {{produit}} ».\n\nNous allons examiner les éléments disponibles et te communiquer la suite. Merci de passer par les canaux officiels CAMPUS pendant le traitement."
  },
  {
    "id": "reply-reminder",
    "category": "Assistance",
    "title": "Relance sans réponse",
    "description": "Demande en attente de retour",
    "text": "{{salutation}},\n\nNous revenons vers toi au sujet de « {{produit}} ».\n\nNous attendons encore ton retour concernant : {{details}}\n\nMerci de nous répondre dès que tu en as la possibilité."
  },
  {
    "id": "feedback",
    "category": "Communauté",
    "title": "Demander un avis",
    "description": "Améliorer l’expérience",
    "text": "{{salutation}},\n\nMerci d’avoir utilisé CAMPUS !\n\nTon avis nous aide à améliorer la plateforme. As-tu trouvé le service facile à utiliser ? Qu’est-ce que nous pourrions améliorer ?\n\nN’hésite pas à nous répondre, chaque retour compte."
  },
  {
    "id": "sale-congrats",
    "category": "Communauté",
    "title": "Félicitations pour une vente",
    "description": "Après vente finalisée",
    "text": "{{salutation}},\n\nFélicitations pour la vente de « {{produit}} » sur CAMPUS !\n\nMerci de nous avoir fait confiance pour accompagner cette transaction. Nous te souhaitons beaucoup d’autres belles ventes !"
  },
  {
    "id": "share-platform",
    "category": "Communauté",
    "title": "Inviter à découvrir CAMPUS",
    "description": "Bouche-à-oreille entre étudiants",
    "text": "{{salutation}},\n\nTu connais un étudiant qui souhaite vendre un PC, un téléphone, des livres ou des accessoires ?\n\nParle-lui de CAMPUS, notre plateforme d’achat et de vente entre étudiants, avec inspection et remise sur le campus.\n\nLe site : https://www.campus-rdc.com\n\nMerci de faire grandir notre communauté !"
  },
  {
    "id": "community-reminder",
    "category": "Communauté",
    "title": "Reprendre contact avec un étudiant",
    "description": "Rester en lien",
    "text": "{{salutation}},\n\nComment se passe ta semaine à {{universite}} ?\n\nSi tu recherches un article d’occasion ou si tu souhaites revendre un produit dont tu n’as plus besoin, CAMPUS est là pour t’accompagner.\n\nDécouvre les annonces : https://www.campus-rdc.com"
  }
];
