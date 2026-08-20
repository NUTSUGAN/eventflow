import type { LegalPageProps } from './LegalPage'

export const legalPages = {
  conditions: {
    title: "Conditions d'utilisation",
    lead: "Ces conditions encadrent l'utilisation de la plateforme EventFlow.",
    sections: [
      {
        title: 'Utilisation du service',
        body: 'EventFlow permet de découvrir des événements, de réserver des billets et de gérer des services organisateur selon les droits associés au compte.',
      },
      {
        title: 'Comptes et sécurité',
        body: 'Chaque utilisateur est responsable de l’exactitude des informations renseignées et de la confidentialité de ses accès.',
      },
      {
        title: 'Réservations et paiements',
        body: 'Les commandes, billets et opérations de paiement sont traités selon les informations affichées au moment de la validation.',
      },
    ],
  },
  mentions: {
    title: 'Mentions légales',
    lead: 'Retrouve ici les informations légales liées à EventFlow.',
    sections: [
      {
        title: 'Éditeur',
        body: 'EventFlow est une plateforme de billetterie et de gestion événementielle développée dans le cadre du projet.',
      },
      {
        title: 'Création digitale',
        body: 'La création de sites web et les solutions digitales sont assurées par NURISEWEB.',
      },
      {
        title: 'Contact',
        body: 'Pour toute demande, utilise la page Contact EventFlow disponible depuis le footer.',
      },
    ],
  },
  privacy: {
    title: 'Politique de confidentialité',
    lead: 'Cette page présente les grands principes de gestion des données sur EventFlow.',
    sections: [
      {
        title: 'Données collectées',
        body: 'EventFlow traite les informations nécessaires à la création de compte, aux commandes, aux billets et aux espaces organisateur.',
      },
      {
        title: 'Finalités',
        body: 'Les données servent à fournir le service, sécuriser les accès, gérer les paiements et améliorer le suivi des événements.',
      },
      {
        title: 'Demandes utilisateur',
        body: 'Un utilisateur peut demander des informations ou une correction via la page Contact EventFlow.',
      },
    ],
  },
  legalHub: {
    title: 'Documents légaux EventFlow',
    lead: 'Ce document regroupe les informations légales, contractuelles et financières utiles aux utilisateurs et aux organisateurs EventFlow.',
    sections: [
      {
        id: 'mentions-legales',
        title: 'Mentions légales',
        body: [
          'EventFlow est une plateforme de billetterie et de gestion événementielle permettant aux utilisateurs de découvrir des événements, de réserver des billets, de consulter leurs commandes et de suivre leurs accès numériques. La plateforme propose également un espace organisateur destiné à la création d’événements, à la gestion des billets, au suivi des ventes, au contrôle d’accès et aux demandes de retrait.',
          'Les informations d’identification de l’éditeur, du responsable de publication, du contact administratif et de l’hébergeur technique doivent être maintenues à jour afin que chaque utilisateur puisse savoir clairement qui exploite le service. Pour la version de production, ces informations doivent inclure les coordonnées de l’exploitant, les identifiants professionnels disponibles, l’adresse de contact officielle et les informations relatives à l’hébergement.',
          'La création digitale et les solutions web associées au projet EventFlow sont présentées comme assurées par NURISEWEB. Toute demande concernant le fonctionnement du site, une commande, un billet, un compte utilisateur, une demande organisateur ou un signalement peut être transmise depuis la page Contact EventFlow, avec le plus de précisions possible pour faciliter le traitement.',
        ],
      },
      {
        id: 'politique-cookies',
        title: 'Politique des cookies',
        body: [
          'EventFlow utilise des cookies et technologies similaires pour faire fonctionner les services essentiels de la plateforme. Ces traceurs peuvent servir à maintenir une session ouverte, sécuriser une authentification, mémoriser certains choix strictement nécessaires, protéger les formulaires, conserver le panier ou permettre le bon déroulement d’une commande. Sans ces traceurs essentiels, certaines fonctionnalités du compte, de la billetterie ou de l’espace organisateur peuvent ne pas fonctionner correctement.',
          'Des cookies optionnels peuvent aussi être utilisés pour améliorer l’expérience, mesurer l’usage de certaines pages, comprendre les parcours de navigation ou préparer des fonctionnalités de personnalisation. Ces cookies optionnels ne doivent pas être déposés sans choix préalable de l’utilisateur lorsque la réglementation exige un consentement. L’utilisateur doit pouvoir accepter, refuser ou modifier ses préférences avec un niveau de simplicité équivalent.',
          'La bannière de cookies EventFlow permet d’exprimer un choix au moment de la visite. Le refus des cookies optionnels n’empêche pas l’accès aux fonctions essentielles du service, mais peut limiter certaines mesures d’audience, statistiques ou améliorations personnalisées. Les préférences peuvent être ajustées lorsque l’interface de gestion des cookies est disponible ou en supprimant les données de navigation depuis le navigateur.',
        ],
      },
      {
        id: 'conditions-generales-utilisation',
        title: 'Conditions générales d’utilisation',
        body: [
          'Les conditions générales d’utilisation encadrent l’accès à EventFlow et l’usage des services proposés aux participants, aux organisateurs, aux membres de staff et aux administrateurs. En créant un compte ou en utilisant la plateforme, l’utilisateur s’engage à fournir des informations exactes, à respecter les règles affichées dans les parcours de réservation et à ne pas détourner le service de son objectif initial.',
          'Chaque compte est personnel. L’utilisateur reste responsable de la confidentialité de son mot de passe, des accès associés à son email, de l’utilisation faite depuis son compte et de toute action réalisée après authentification. En cas de suspicion d’accès non autorisé, de perte d’identifiants ou d’usage anormal du compte, l’utilisateur doit prévenir EventFlow rapidement afin que des mesures de protection puissent être envisagées.',
          'EventFlow peut limiter, suspendre ou retirer l’accès à certaines fonctionnalités en cas de fraude, tentative de contournement du paiement, publication manifestement trompeuse, usage abusif des outils organisateur, atteinte à la sécurité du service ou comportement portant préjudice aux autres utilisateurs. Les contenus publiés doivent rester licites, cohérents avec l’événement annoncé et respectueux des droits des tiers.',
          'Les informations relatives aux événements, aux billets, aux prix, aux horaires, aux lieux et aux conditions particulières sont affichées avant validation des actions importantes. L’utilisateur doit vérifier ces informations avant de confirmer une commande ou une publication. Les modifications ultérieures peuvent dépendre du statut de l’événement, de l’existence de ventes, des règles de retrait ou des contraintes techniques du service.',
        ],
      },
      {
        id: 'politique-remboursement',
        title: 'Politique de remboursement',
        body: [
          'Les demandes de remboursement sont étudiées en fonction du statut de la commande, de la nature du billet, des conditions propres à l’événement, des informations communiquées au moment de l’achat et des règles applicables aux prestations datées. Un billet associé à un événement précis peut être soumis à des conditions différentes d’un produit standard, notamment lorsque l’accès est lié à une date, un lieu ou une prestation organisée par un tiers.',
          'Pour faciliter le traitement, toute demande doit mentionner l’adresse email du compte, la référence de commande, le nom de l’événement, le type de billet concerné et le motif de la demande. EventFlow peut demander des informations complémentaires lorsque la commande est introuvable, lorsque le paiement doit être vérifié ou lorsque la situation nécessite une validation par l’organisateur.',
          'En cas d’annulation officielle d’un événement, de modification majeure ou d’erreur manifeste sur une commande, EventFlow et l’organisateur peuvent définir une procédure de remboursement, d’avoir ou de report. Les délais de remboursement peuvent dépendre du prestataire de paiement, du moyen de paiement utilisé, du statut de la commande et des contrôles nécessaires pour éviter les remboursements multiples ou frauduleux.',
          'Lorsque la réglementation prévoit un droit spécifique pour l’utilisateur, EventFlow s’efforce de l’appliquer dans le cadre du rôle exact de la plateforme et de l’organisateur. Les règles définitives de remboursement doivent être précisées dans les conditions de vente applicables à chaque événement, en particulier lorsque l’organisateur fixe des conditions particulières visibles avant l’achat.',
        ],
      },
      {
        id: 'politique-confidentialite',
        title: 'Politique de confidentialité',
        body: [
          'EventFlow traite les données nécessaires à la création et à la gestion des comptes, à l’authentification, aux commandes, aux billets, aux QR codes, aux demandes organisateur, aux services de promotion, aux paiements, aux retraits, au support et à la sécurité de la plateforme. Ces données peuvent inclure l’identité déclarée, l’adresse email, les informations de commande, l’historique des billets, les informations de suivi organisateur et les éléments nécessaires au contrôle d’accès.',
          'Les données sont utilisées pour fournir le service demandé, sécuriser les accès, prévenir les abus, envoyer les informations nécessaires à l’utilisation des billets, permettre aux organisateurs de gérer leurs événements et répondre aux demandes de support. Certaines informations peuvent être conservées pour répondre à des obligations comptables, contractuelles, de preuve ou de sécurité.',
          'EventFlow limite l’accès aux données aux personnes et services qui en ont besoin pour exploiter la plateforme. Des prestataires techniques peuvent intervenir pour l’hébergement, l’envoi d’emails, le paiement, la maintenance ou l’analyse du fonctionnement du service. Lorsque ces prestataires traitent des données pour le compte d’EventFlow, ils doivent respecter un cadre de confidentialité et de sécurité adapté.',
          'L’utilisateur peut demander l’accès, la correction, la mise à jour ou la suppression de certaines données depuis la page Contact. Certaines suppressions peuvent être différées ou limitées lorsque les données restent nécessaires à la preuve d’une commande, à une obligation légale, à la sécurité du service ou à la gestion d’un litige. Les demandes doivent permettre d’identifier correctement le compte concerné.',
        ],
      },
      {
        id: 'contrat-organisateur',
        title: 'Contrat organisateur',
        body: [
          'L’accès organisateur permet de créer des événements, de gérer des billets, de suivre les ventes, d’utiliser des services de visibilité, de consulter des statistiques, de gérer un staff et de demander des retraits lorsque les conditions sont remplies. Cet accès peut être soumis à validation afin de vérifier que l’activité déclarée est cohérente, identifiable et compatible avec l’usage de la plateforme.',
          'L’organisateur s’engage à publier des informations fiables concernant le titre, la description, le lieu, les horaires, la capacité, les catégories, les visuels, les prix et les conditions particulières de son événement. Il doit éviter les contenus trompeurs, les images non autorisées, les annonces mensongères, les événements fictifs ou toute publication susceptible de créer une confusion pour les participants.',
          'L’organisateur reste responsable de l’organisation réelle de son événement, de l’accueil des participants, de la conformité du lieu, de la gestion des accès, de la validité des informations transmises et du respect des règles applicables à son activité. EventFlow fournit des outils techniques de billetterie, mais ne remplace pas les obligations propres à l’organisateur concernant son événement.',
          'En cas de signalement, d’anomalie de paiement, de litige répété, de suspicion de fraude, d’événement non conforme ou de comportement préjudiciable aux participants, EventFlow peut demander des justificatifs, suspendre une publication, bloquer une fonctionnalité, refuser une demande de retrait ou retirer l’accès organisateur. Ces mesures visent à protéger les utilisateurs, les paiements et la fiabilité de la plateforme.',
        ],
      },
      {
        id: 'regles-commissions',
        title: 'Règles sur les commissions',
        body: [
          'La commission EventFlow correspond au pourcentage affiché à l’organisateur lors de la création de l’événement. Cette information est présentée avant la validation afin que l’organisateur puisse connaître les frais appliqués aux ventes payées de l’événement. Une fois l’événement créé, le pourcentage est conservé sur la fiche événement pour garder une règle stable au moment du calcul des retraits.',
          'La commission est calculée sur les montants payés par les participants pour les billets de l’événement, selon les ventes effectivement prises en compte par le système. Lorsqu’un retrait est préparé, EventFlow calcule un montant brut, applique le pourcentage de commission enregistré, puis présente un montant net estimatif ou définitif selon le statut du retrait et les contrôles effectués.',
          'Les frais peuvent couvrir l’exploitation de la plateforme, la maintenance technique, l’hébergement, la gestion des comptes, les outils organisateur, la sécurisation des commandes, le suivi des billets et les fonctionnalités de contrôle. Les éventuels frais de paiement, promotions, services Booster ou coûts spécifiques peuvent être présentés séparément lorsqu’ils ne sont pas inclus dans la commission standard.',
          'Si le pourcentage général de commission évolue, la nouvelle valeur peut s’appliquer aux nouveaux événements créés après la mise à jour. Les événements déjà créés conservent la valeur enregistrée au moment de leur création, sauf règle particulière affichée ou accord spécifique. L’organisateur doit donc vérifier le pourcentage visible avant de finaliser la création de chaque événement.',
        ],
      },
      {
        id: 'facturation',
        title: 'Facturation',
        body: [
          'Les montants liés aux commandes, aux billets, aux services de visibilité, aux commissions et aux retraits sont affichés dans la devise prévue par la plateforme, principalement en euros. Avant validation d’un paiement, l’utilisateur doit pouvoir consulter les informations essentielles de la commande, notamment l’événement, les billets, les quantités, le prix et le montant total.',
          'Pour les participants, les informations de commande et les billets servent de justificatif d’achat et d’accès à l’événement. Pour les organisateurs, les tableaux de bord, les historiques de ventes, les retraits et les références de paiement permettent de suivre l’activité financière liée à chaque événement. Les organisateurs doivent conserver les éléments nécessaires à leur propre suivi comptable et fiscal.',
          'Les services payants complémentaires, comme les options de visibilité ou campagnes Booster, sont facturés selon les paramètres choisis par l’organisateur, notamment la durée, les canaux ou le tarif affiché avant paiement. Une campagne existante peut conserver le prix validé au moment de sa création, même si la grille tarifaire évolue ensuite.',
          'Les demandes de retrait nécessitent un moyen de paiement ou de versement valide. EventFlow peut vérifier les informations bancaires ou de paiement, calculer les montants dus, appliquer la commission enregistrée et conserver une référence de traitement. En cas d’erreur, d’incohérence, de paiement contesté ou de litige, le traitement d’un retrait peut être retardé le temps des vérifications nécessaires.',
        ],
      },
    ],
  },
  pricing: {
    title: 'Tarifs',
    lead: 'Les tarifs EventFlow présentent les frais appliqués aux organisateurs et les services optionnels disponibles.',
    sections: [
      {
        title: 'Création d’événement',
        body: 'La création d’un événement est préparée depuis l’espace organisateur. Le pourcentage de commission applicable est affiché avant la validation et reste rattaché à l’événement créé.',
      },
      {
        title: 'Commission organisateur',
        body: 'La commission EventFlow est calculée sur les ventes payées de l’événement au moment du retrait organisateur. Le montant net tient compte du pourcentage enregistré sur la fiche événement.',
      },
      {
        title: 'Services Booster',
        body: 'Les options de mise en avant EventFlow sont facturées selon la durée et les canaux choisis. Le tarif final est recalculé avant paiement.',
      },
      {
        title: 'Facturation et retraits',
        body: 'Les informations de facturation, de paiement et de retrait sont consultables depuis les espaces concernés. Les organisateurs doivent renseigner un moyen de retrait valide avant de demander un paiement.',
      },
    ],
  },
  about: {
    title: 'Qui sommes-nous ?',
    lead: 'EventFlow simplifie la découverte, la réservation et la gestion des événements.',
    sections: [
      {
        title: 'Notre mission',
        body: 'EventFlow aide les participants à trouver des événements facilement et donne aux organisateurs des outils simples pour publier, vendre et suivre leurs événements.',
      },
      {
        title: 'Pour les participants',
        body: 'La plateforme centralise la recherche, la réservation, les billets et le suivi des commandes dans une expérience claire.',
      },
      {
        title: 'Pour les organisateurs',
        body: 'EventFlow accompagne les organisateurs avec un espace dédié, la gestion des billets, le suivi des ventes et les services Booster pour donner plus de visibilité aux événements.',
      },
    ],
  },
  help: {
    title: 'Aide',
    lead: 'Les réponses rapides pour utiliser EventFlow plus sereinement.',
    sections: [
      {
        title: 'Billets',
        body: 'Après une commande validée, les billets sont disponibles dans l’espace Mes billets ou depuis le lien reçu par email.',
      },
      {
        title: 'Organisateurs',
        body: 'Les organisateurs peuvent créer des événements, suivre leurs ventes et utiliser les services Booster depuis leur espace dédié.',
      },
      {
        title: 'Support',
        body: 'Si une information manque, contacte EventFlow depuis la page Contact.',
      },
    ],
  },
  contact: {
    title: 'Contact EventFlow',
    lead: 'Une question, un signalement ou une demande liée à ton compte ? Contacte EventFlow.',
    sections: [
      {
        title: 'Support',
        body: 'Écris à l’équipe EventFlow avec le contexte de ta demande, le nom de l’événement concerné et l’adresse email utilisée sur ton compte.',
      },
      {
        title: 'Organisateurs',
        body: 'Pour une demande liée à un événement, au Booster ou à un paiement, ajoute la référence concernée afin de faciliter le traitement.',
      },
      {
        title: 'Réponse',
        body: 'EventFlow revient vers toi dès que les informations nécessaires ont été vérifiées.',
      },
    ],
  },
} satisfies Record<string, LegalPageProps>
