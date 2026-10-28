// Tripya's policies in Spanish, English and French (other site languages fall back to English). "{email}" is replaced by the support email (and linked) when rendered.
// Recommended: have a lawyer in Bolivia review these texts and add the company's legal name and NIT once registered.
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/es";

export type LegalSection = { heading: string; paragraphs: string[] };

export type LegalDoc = {
  titleKey: keyof Pick<Dictionary["legal"], "terms" | "privacy" | "cookies" | "bookingConditions" | "cancellation" | "refunds">;
  updated: string;
  /** Languages without their own text (pt, de, zh, ja, ko) show the English version. */
  content: Partial<Record<Locale, LegalSection[]>> & Record<"es" | "en", LegalSection[]>;
};

const UPDATED = "2026-10-15";

export const legalDocs: Record<string, LegalDoc> = {
  terminos: {
    titleKey: "terms",
    updated: UPDATED,
    content: {
      es: [
        { heading: "1. Quiénes somos", paragraphs: [
          "Tripya es una plataforma de viajes con base en Tarija, Bolivia, que publica ofertas de alojamientos, escapadas y experiencias en el país.",
          "Para cualquier consulta, reclamo o solicitud puedes escribirnos a {email} o por WhatsApp desde la página de Ayuda."
        ] },
        { heading: "2. Qué hace Tripya", paragraphs: [
          "Tripya actúa como intermediario entre los viajeros y los socios turísticos (hoteles, alojamientos, propietarios y empresas de turismo) que ofrecen sus servicios en la plataforma.",
          "El alojamiento o la experiencia es prestado por el socio indicado en cada oferta, que es responsable de prestarlo tal como fue publicado. Tripya gestiona la reserva, coordina el pago con el socio y te acompaña antes, durante y después del viaje.",
          "Todo el contenido del sitio es publicado y revisado por el equipo de Tripya. Los socios no publican directamente."
        ] },
        { heading: "3. Uso del sitio", paragraphs: [
          "Al usar Tripya te comprometes a dar información verdadera y a no usar el sitio con fines fraudulentos, ilegales o que perjudiquen a otros usuarios o a los socios.",
          "Podemos rechazar o cancelar solicitudes de reserva que detectemos como fraudulentas o abusivas."
        ] },
        { heading: "4. Precios y ofertas", paragraphs: [
          "Los precios se muestran en bolivianos (Bs) e incluyen lo detallado en cada oferta. El «precio habitual» es el que el socio declara cobrar normalmente por el mismo servicio.",
          "Las ofertas tienen una vigencia y cupos limitados. Cuando termina la vigencia o se agotan los cupos, la oferta deja de estar disponible.",
          "El precio final de tu reserva es el que ves en el resumen antes de enviarla. No se agregan cargos ocultos."
        ] },
        { heading: "5. Reservas y pagos", paragraphs: [
          "Las reservas y los pagos se rigen por las Condiciones de reserva, la Política de cancelación y la Política de reembolsos, que forman parte de estos términos.",
          "Por ahora Tripya no procesa pagos con tarjeta. El pago se realiza mediante QR bancario que te envía nuestro agente de ventas por WhatsApp."
        ] },
        { heading: "6. Responsabilidad", paragraphs: [
          "Tripya verifica a sus socios antes de publicar sus ofertas, pero no es propietario ni operador de los alojamientos o experiencias.",
          "Si el servicio no coincide con lo publicado, Tripya gestionará el reclamo con el socio y buscará una solución, que puede ser una alternativa equivalente o un reembolso según nuestras políticas.",
          "Tripya no se responsabiliza por pérdidas, daños o retrasos causados por fuerza mayor, como fenómenos naturales, bloqueos, conflictos sociales o decisiones de autoridades."
        ] },
        { heading: "7. Reclamos", paragraphs: [
          "Si tienes un problema, escríbenos a {email} o por WhatsApp indicando tu número de reserva. Te responderemos en un máximo de 48 horas y te informaremos de cada paso.",
          "Si no quedas conforme con la solución, puedes acudir a las instancias de defensa del consumidor previstas en la Ley N.º 453 de Bolivia."
        ] },
        { heading: "8. Cambios en estos términos", paragraphs: ["Podemos actualizar estos términos. La versión vigente es siempre la publicada en esta página, con su fecha de actualización. Las reservas ya confirmadas se rigen por los términos vigentes al momento de reservar."] },
        { heading: "9. Ley aplicable", paragraphs: ["Estos términos se rigen por las leyes del Estado Plurinacional de Bolivia. Cualquier controversia se someterá a los tribunales de la ciudad de Tarija, sin perjuicio de los derechos que la ley reconoce a los consumidores."] }
      ],
      en: [
        { heading: "1. Who we are", paragraphs: [
          "Tripya is a travel platform based in Tarija, Bolivia, that publishes deals on accommodation, getaways and experiences across the country.",
          "For any question, complaint or request you can write to us at {email} or on WhatsApp from the Help page."
        ] },
        { heading: "2. What Tripya does", paragraphs: [
          "Tripya acts as an intermediary between travelers and the tourism partners (hotels, properties, owners and tour companies) that offer their services on the platform.",
          "The accommodation or experience is provided by the partner named in each deal, who is responsible for delivering it as published. Tripya manages the booking, coordinates the payment with the partner and supports you before, during and after your trip.",
          "All content on the site is published and reviewed by the Tripya team. Partners do not publish directly."
        ] },
        { heading: "3. Using the site", paragraphs: [
          "By using Tripya you agree to provide truthful information and not to use the site for fraudulent or illegal purposes, or in ways that harm other users or partners.",
          "We may reject or cancel booking requests that we identify as fraudulent or abusive."
        ] },
        { heading: "4. Prices and deals", paragraphs: [
          "Prices are shown in bolivianos (Bs) and include what is described in each deal. The \"usual price\" is the one the partner states it normally charges for the same service.",
          "Deals have a limited validity and a limited number of spots. When the validity ends or the spots run out, the deal is no longer available.",
          "The final price of your booking is the one shown in the summary before you send it. No hidden fees are added."
        ] },
        { heading: "5. Bookings and payments", paragraphs: [
          "Bookings and payments are governed by the Booking conditions, the Cancellation policy and the Refund policy, which are part of these terms.",
          "For now Tripya does not process card payments. Payment is made with a bank QR code that our sales agent sends you on WhatsApp."
        ] },
        { heading: "6. Liability", paragraphs: [
          "Tripya verifies its partners before publishing their deals, but does not own or operate the accommodation or experiences.",
          "If the service does not match what was published, Tripya will handle the complaint with the partner and look for a solution, which may be an equivalent alternative or a refund under our policies.",
          "Tripya is not liable for losses, damage or delays caused by force majeure, such as natural events, road blockades, social unrest or decisions by the authorities."
        ] },
        { heading: "7. Complaints", paragraphs: [
          "If you have a problem, write to us at {email} or on WhatsApp with your booking number. We will reply within 48 hours and keep you informed at every step.",
          "If you are not satisfied with the solution, you may turn to the consumer protection bodies established by Bolivian Law No. 453."
        ] },
        { heading: "8. Changes to these terms", paragraphs: ["We may update these terms. The current version is always the one published on this page, with its update date. Confirmed bookings are governed by the terms in force at the time of booking."] },
        { heading: "9. Governing law", paragraphs: ["These terms are governed by the laws of the Plurinational State of Bolivia. Any dispute will be submitted to the courts of the city of Tarija, without prejudice to the rights the law grants to consumers."] }
      ],
      fr: [
        { heading: "1. Qui sommes-nous", paragraphs: [
          "Tripya est une plateforme de voyage basée à Tarija, en Bolivie, qui publie des offres d'hébergements, d'escapades et d'expériences dans tout le pays.",
          "Pour toute question, réclamation ou demande, écrivez-nous à {email} ou sur WhatsApp depuis la page Aide."
        ] },
        { heading: "2. Ce que fait Tripya", paragraphs: [
          "Tripya agit comme intermédiaire entre les voyageurs et les partenaires touristiques (hôtels, hébergements, propriétaires et agences) qui proposent leurs services sur la plateforme.",
          "L'hébergement ou l'expérience est fourni par le partenaire indiqué dans chaque offre, qui est responsable de le fournir tel que publié. Tripya gère la réservation, coordonne le paiement avec le partenaire et vous accompagne avant, pendant et après votre voyage.",
          "Tout le contenu du site est publié et vérifié par l'équipe Tripya. Les partenaires ne publient pas directement."
        ] },
        { heading: "3. Utilisation du site", paragraphs: [
          "En utilisant Tripya, vous vous engagez à fournir des informations exactes et à ne pas utiliser le site à des fins frauduleuses ou illégales, ni d'une manière qui nuise à d'autres utilisateurs ou aux partenaires.",
          "Nous pouvons refuser ou annuler les demandes de réservation que nous identifions comme frauduleuses ou abusives."
        ] },
        { heading: "4. Prix et offres", paragraphs: [
          "Les prix sont affichés en bolivianos (Bs) et comprennent ce qui est décrit dans chaque offre. Le « prix habituel » est celui que le partenaire déclare pratiquer normalement pour le même service.",
          "Les offres ont une durée et un nombre de places limités. À la fin de la période ou une fois les places épuisées, l'offre n'est plus disponible.",
          "Le prix final de votre réservation est celui affiché dans le récapitulatif avant l'envoi. Aucun frais caché n'est ajouté."
        ] },
        { heading: "5. Réservations et paiements", paragraphs: [
          "Les réservations et les paiements sont régis par les Conditions de réservation, la Politique d'annulation et la Politique de remboursement, qui font partie de ces conditions.",
          "Pour l'instant, Tripya ne traite pas les paiements par carte. Le paiement se fait par QR bancaire, envoyé par notre agent commercial sur WhatsApp."
        ] },
        { heading: "6. Responsabilité", paragraphs: [
          "Tripya vérifie ses partenaires avant de publier leurs offres, mais n'est ni propriétaire ni exploitant des hébergements ou des expériences.",
          "Si le service ne correspond pas à ce qui a été publié, Tripya traitera la réclamation avec le partenaire et cherchera une solution, qui peut être une alternative équivalente ou un remboursement selon nos politiques.",
          "Tripya n'est pas responsable des pertes, dommages ou retards causés par un cas de force majeure, comme des phénomènes naturels, des blocages routiers, des conflits sociaux ou des décisions des autorités."
        ] },
        { heading: "7. Réclamations", paragraphs: [
          "En cas de problème, écrivez-nous à {email} ou sur WhatsApp en indiquant votre numéro de réservation. Nous vous répondrons sous 48 heures maximum et vous tiendrons informé à chaque étape.",
          "Si la solution ne vous satisfait pas, vous pouvez saisir les instances de protection des consommateurs prévues par la loi bolivienne n° 453."
        ] },
        { heading: "8. Modifications", paragraphs: ["Nous pouvons mettre à jour ces conditions. La version en vigueur est toujours celle publiée sur cette page, avec sa date de mise à jour. Les réservations confirmées sont régies par les conditions en vigueur au moment de la réservation."] },
        { heading: "9. Droit applicable", paragraphs: ["Ces conditions sont régies par les lois de l'État plurinational de Bolivie. Tout litige sera soumis aux tribunaux de la ville de Tarija, sans préjudice des droits que la loi reconnaît aux consommateurs."] }
      ]
    }
  },
  "condiciones-reserva": {
    titleKey: "bookingConditions",
    updated: UPDATED,
    content: {
      es: [
        { heading: "1. Solicitud de reserva", paragraphs: [
          "Al enviar el formulario de reserva realizas una solicitud y recibes un número de reserva (por ejemplo TYA-7K3M2P) que identifica tu reserva en todas las comunicaciones.",
          "La solicitud no es una reserva confirmada hasta que Tripya confirme la disponibilidad con el socio y recibamos tu pago."
        ] },
        { heading: "2. Precio", paragraphs: [
          "El precio final se calcula según la oferta, las fechas, el número de personas y los servicios adicionales elegidos, y lo ves antes de enviar la reserva.",
          "El precio de la oferta se respeta durante su vigencia y mientras queden cupos."
        ] },
        { heading: "3. Pago", paragraphs: [
          "Al enviar tu reserva te llevamos a WhatsApp con nuestro agente de ventas. El agente confirma la disponibilidad y te envía el QR bancario del alojamiento o empresa para que pagues desde la app de tu banco.",
          "Envía el comprobante de pago por el mismo chat. Cuando lo verifiquemos, tu reserva queda confirmada y te lo avisamos.",
          "Si el pago no se realiza dentro de las 24 horas siguientes a recibir el QR, o antes si la oferta está por agotarse, podemos liberar el cupo.",
          "Tripya nunca te pedirá los datos de tu tarjeta ni tus contraseñas bancarias por WhatsApp, teléfono ni email. Ante cualquier duda, escríbenos a {email}."
        ] },
        { heading: "4. Datos de los viajeros", paragraphs: ["Debes indicar datos de contacto correctos. El socio puede pedir un documento de identidad al momento del check-in."] },
        { heading: "5. Modificaciones", paragraphs: ["Para cambiar fechas o personas escríbenos con tu número de reserva. Los cambios dependen de la disponibilidad y de las condiciones de cada oferta, y pueden tener una diferencia de precio."] },
        { heading: "6. Durante la estadía", paragraphs: ["Si lo que encuentras no coincide con lo publicado, avísanos de inmediato por WhatsApp o a {email}, con fotos si es posible, para gestionar una solución con el socio."] }
      ],
      en: [
        { heading: "1. Booking request", paragraphs: [
          "When you send the booking form you make a request and receive a booking number (for example TYA-7K3M2P) that identifies your booking in all communications.",
          "The request is not a confirmed booking until Tripya confirms availability with the partner and we receive your payment."
        ] },
        { heading: "2. Price", paragraphs: [
          "The final price is calculated from the deal, dates, number of guests and extras chosen, and you see it before sending the booking.",
          "The deal price is honored while the deal is valid and spots remain."
        ] },
        { heading: "3. Payment", paragraphs: [
          "When you send your booking we take you to WhatsApp with our sales agent. The agent confirms availability and sends you the bank QR code of the property or company so you can pay from your banking app.",
          "Send the payment receipt in the same chat. Once we verify it, your booking is confirmed and we let you know.",
          "If payment is not made within 24 hours of receiving the QR code, or sooner if the deal is about to sell out, we may release the spot.",
          "Tripya will never ask for your card details or bank passwords on WhatsApp, by phone or by email. If in doubt, write to {email}."
        ] },
        { heading: "4. Traveler details", paragraphs: ["You must provide correct contact details. The partner may ask for an ID document at check-in."] },
        { heading: "5. Changes", paragraphs: ["To change dates or guests, write to us with your booking number. Changes depend on availability and each deal's conditions, and may involve a price difference."] },
        { heading: "6. During your stay", paragraphs: ["If what you find does not match what was published, let us know right away on WhatsApp or at {email}, with photos if possible, so we can arrange a solution with the partner."] }
      ],
      fr: [
        { heading: "1. Demande de réservation", paragraphs: [
          "En envoyant le formulaire de réservation, vous faites une demande et recevez un numéro de réservation (par exemple TYA-7K3M2P) qui l'identifie dans toutes les communications.",
          "La demande n'est pas une réservation confirmée tant que Tripya n'a pas confirmé la disponibilité avec le partenaire et reçu votre paiement."
        ] },
        { heading: "2. Prix", paragraphs: [
          "Le prix final est calculé selon l'offre, les dates, le nombre de personnes et les services supplémentaires choisis, et vous le voyez avant d'envoyer la réservation.",
          "Le prix de l'offre est garanti pendant sa période de validité et tant qu'il reste des places."
        ] },
        { heading: "3. Paiement", paragraphs: [
          "À l'envoi de votre réservation, nous vous emmenons sur WhatsApp avec notre agent commercial. Il confirme la disponibilité et vous envoie le QR bancaire de l'hébergement ou de l'agence pour payer depuis l'application de votre banque.",
          "Envoyez le justificatif de paiement dans la même conversation. Une fois vérifié, votre réservation est confirmée et nous vous prévenons.",
          "Si le paiement n'est pas effectué dans les 24 heures suivant la réception du QR, ou avant si l'offre est sur le point d'être épuisée, nous pouvons libérer la place.",
          "Tripya ne vous demandera jamais vos données de carte ni vos mots de passe bancaires par WhatsApp, téléphone ou email. En cas de doute, écrivez à {email}."
        ] },
        { heading: "4. Données des voyageurs", paragraphs: ["Vous devez indiquer des coordonnées exactes. Le partenaire peut demander une pièce d'identité à l'arrivée."] },
        { heading: "5. Modifications", paragraphs: ["Pour changer les dates ou le nombre de personnes, écrivez-nous avec votre numéro de réservation. Les changements dépendent des disponibilités et des conditions de chaque offre, et peuvent entraîner une différence de prix."] },
        { heading: "6. Pendant le séjour", paragraphs: ["Si ce que vous trouvez ne correspond pas à ce qui a été publié, prévenez-nous immédiatement sur WhatsApp ou à {email}, avec des photos si possible, pour trouver une solution avec le partenaire."] }
      ]
    }
  },
  cancelacion: {
    titleKey: "cancellation",
    updated: UPDATED,
    content: {
      es: [
        { heading: "1. Política de cada oferta", paragraphs: ["Cada oferta muestra su política de cancelación antes de reservar. Si la oferta indica condiciones propias, esas condiciones prevalecen sobre esta política general."] },
        { heading: "2. Política general", paragraphs: [
          "Si la oferta no indica otra cosa, se aplica lo siguiente:",
          "Cancelación gratuita hasta 7 días antes de la fecha de llegada: se reembolsa el 100% de lo pagado.",
          "Entre 7 días y 48 horas antes de la llegada: se reembolsa el 50% de lo pagado.",
          "Con menos de 48 horas de anticipación o si no te presentas: no corresponde reembolso.",
          "Algunas ofertas especiales pueden ser no reembolsables; en ese caso se indica claramente en la oferta antes de reservar."
        ] },
        { heading: "3. Cómo cancelar", paragraphs: ["Escríbenos por WhatsApp o a {email} indicando tu número de reserva. Se toma como fecha de cancelación la de recepción de tu mensaje, y te confirmamos la cancelación por escrito."] },
        { heading: "4. Cancelación por el socio o por Tripya", paragraphs: ["Si el socio no puede prestar el servicio, o si tenemos que cancelar por fuerza mayor, te ofreceremos una alternativa equivalente o el reembolso total de lo pagado, a tu elección."] }
      ],
      en: [
        { heading: "1. Each deal's policy", paragraphs: ["Each deal shows its cancellation policy before you book. If the deal states its own conditions, they prevail over this general policy."] },
        { heading: "2. General policy", paragraphs: [
          "Unless the deal says otherwise, the following applies:",
          "Free cancellation up to 7 days before the arrival date: 100% of the amount paid is refunded.",
          "Between 7 days and 48 hours before arrival: 50% of the amount paid is refunded.",
          "Less than 48 hours before arrival, or no-show: no refund.",
          "Some special deals may be non-refundable; if so, this is clearly stated in the deal before you book."
        ] },
        { heading: "3. How to cancel", paragraphs: ["Write to us on WhatsApp or at {email} with your booking number. The cancellation date is the date we receive your message, and we confirm the cancellation in writing."] },
        { heading: "4. Cancellation by the partner or by Tripya", paragraphs: ["If the partner cannot provide the service, or if we have to cancel due to force majeure, we will offer you an equivalent alternative or a full refund of the amount paid, at your choice."] }
      ],
      fr: [
        { heading: "1. Politique de chaque offre", paragraphs: ["Chaque offre affiche sa politique d'annulation avant la réservation. Si l'offre indique ses propres conditions, celles-ci prévalent sur cette politique générale."] },
        { heading: "2. Politique générale", paragraphs: [
          "Sauf indication contraire dans l'offre, les règles suivantes s'appliquent :",
          "Annulation gratuite jusqu'à 7 jours avant la date d'arrivée : 100 % du montant payé est remboursé.",
          "Entre 7 jours et 48 heures avant l'arrivée : 50 % du montant payé est remboursé.",
          "Moins de 48 heures avant l'arrivée ou non-présentation : aucun remboursement.",
          "Certaines offres spéciales peuvent être non remboursables ; dans ce cas, c'est clairement indiqué dans l'offre avant de réserver."
        ] },
        { heading: "3. Comment annuler", paragraphs: ["Écrivez-nous sur WhatsApp ou à {email} en indiquant votre numéro de réservation. La date d'annulation est celle de réception de votre message, et nous vous confirmons l'annulation par écrit."] },
        { heading: "4. Annulation par le partenaire ou par Tripya", paragraphs: ["Si le partenaire ne peut pas fournir le service, ou si nous devons annuler pour cas de force majeure, nous vous proposerons une alternative équivalente ou le remboursement intégral, à votre choix."] }
      ]
    }
  },
  reembolsos: {
    titleKey: "refunds",
    updated: UPDATED,
    content: {
      es: [
        { heading: "1. Cuándo corresponde un reembolso", paragraphs: ["Cuando cancelas dentro de los plazos de la política aplicable, cuando el socio o Tripya cancelan la reserva, o cuando el servicio prestado es sustancialmente distinto de lo publicado."] },
        { heading: "2. Cómo se realiza", paragraphs: [
          "Para gestionar el reembolso te pediremos los datos de una cuenta bancaria a tu nombre (o el QR de cobro de tu banco).",
          "El reembolso se realiza por transferencia bancaria en un plazo máximo de 10 días hábiles desde que se aprueba.",
          "Te avisamos por WhatsApp o email cuando el reembolso esté hecho, indicando tu número de reserva y el monto."
        ] },
        { heading: "3. Reclamos por diferencias", paragraphs: ["Para evaluar un reclamo por diferencias entre lo publicado y lo encontrado, envíanos fotos y una descripción durante la estadía o dentro de las 48 horas posteriores al check-out, a {email} o por WhatsApp."] },
        { heading: "4. Dudas", paragraphs: ["Si tienes preguntas sobre un reembolso, escríbenos a {email} con tu número de reserva."] }
      ],
      en: [
        { heading: "1. When a refund applies", paragraphs: ["When you cancel within the deadlines of the applicable policy, when the partner or Tripya cancels the booking, or when the service provided is substantially different from what was published."] },
        { heading: "2. How it is made", paragraphs: [
          "To process the refund we will ask for the details of a bank account in your name (or your bank's payment QR code).",
          "The refund is made by bank transfer within a maximum of 10 business days from approval.",
          "We let you know on WhatsApp or by email when the refund has been made, with your booking number and the amount."
        ] },
        { heading: "3. Claims about differences", paragraphs: ["To assess a claim about differences between what was published and what you found, send us photos and a description during your stay or within 48 hours after check-out, at {email} or on WhatsApp."] },
        { heading: "4. Questions", paragraphs: ["If you have questions about a refund, write to {email} with your booking number."] }
      ],
      fr: [
        { heading: "1. Quand un remboursement s'applique", paragraphs: ["Lorsque vous annulez dans les délais de la politique applicable, lorsque le partenaire ou Tripya annule la réservation, ou lorsque le service fourni est sensiblement différent de ce qui a été publié."] },
        { heading: "2. Comment il est effectué", paragraphs: [
          "Pour traiter le remboursement, nous vous demanderons les coordonnées d'un compte bancaire à votre nom (ou le QR d'encaissement de votre banque).",
          "Le remboursement est effectué par virement bancaire dans un délai maximum de 10 jours ouvrables après son approbation.",
          "Nous vous prévenons sur WhatsApp ou par email lorsque le remboursement est effectué, avec votre numéro de réservation et le montant."
        ] },
        { heading: "3. Réclamations pour différences", paragraphs: ["Pour évaluer une réclamation concernant des différences entre ce qui a été publié et ce que vous avez trouvé, envoyez-nous des photos et une description pendant le séjour ou dans les 48 heures suivant le départ, à {email} ou sur WhatsApp."] },
        { heading: "4. Questions", paragraphs: ["Pour toute question sur un remboursement, écrivez à {email} avec votre numéro de réservation."] }
      ]
    }
  },
  privacidad: {
    titleKey: "privacy",
    updated: UPDATED,
    content: {
      es: [
        { heading: "1. Responsable", paragraphs: ["Tripya, con base en Tarija, Bolivia, es responsable del tratamiento de tus datos personales. Puedes contactarnos sobre privacidad en {email}."] },
        { heading: "2. Qué datos recogemos", paragraphs: [
          "Datos que nos das: nombre, email, teléfono o WhatsApp, fechas de viaje, número de personas y comentarios de tu reserva.",
          "Datos de socios: datos del alojamiento o la empresa, de contacto y fotos que nos envían para publicar sus ofertas.",
          "Estadísticas propias: contamos visitas y clics (página, oferta, origen de la visita, tipo de dispositivo y país) sin usar cookies y sin guardar tu dirección IP. Usamos un código temporal que cambia cada día y no permite identificarte.",
          "Analítica de terceros: solo si aceptas las cookies, datos agregados de navegación mediante Google Analytics.",
          "No recogemos ni guardamos datos de tarjetas bancarias."
        ] },
        { heading: "3. Para qué los usamos", paragraphs: [
          "Gestionar tu reserva y comunicarnos contigo sobre ella.",
          "Compartir con el socio los datos necesarios para prestarte el servicio (nombre, fechas y número de personas).",
          "Atender consultas, reclamos y reembolsos.",
          "Mejorar el sitio con estadísticas agregadas.",
          "Enviarte ofertas solo si nos das tu consentimiento expreso."
        ] },
        { heading: "4. Con quién los compartimos", paragraphs: ["Solo con el socio de tu reserva y con proveedores tecnológicos que nos ayudan a operar el sitio (alojamiento web y base de datos). No vendemos ni alquilamos tus datos."] },
        { heading: "5. Cómo los protegemos", paragraphs: [
          "Tus datos se guardan en una base de datos en la nube con cifrado y con reglas de acceso que impiden que un usuario vea datos de otro. Solo el personal autorizado de Tripya accede a las reservas.",
          "Las contraseñas de las cuentas se guardan cifradas por el servicio de autenticación; Tripya no puede verlas."
        ] },
        { heading: "6. Cuánto tiempo", paragraphs: ["Conservamos los datos de las reservas mientras sean necesarios para prestar el servicio y atender reclamos, y durante los plazos que exige la normativa contable y tributaria boliviana. Después los eliminamos o anonimizamos."] },
        { heading: "7. Tus derechos", paragraphs: ["Puedes pedir acceder a tus datos, corregirlos o eliminarlos, y retirar tu consentimiento para recibir ofertas, escribiéndonos a {email}. Respondemos en un máximo de 15 días hábiles."] }
      ],
      en: [
        { heading: "1. Data controller", paragraphs: ["Tripya, based in Tarija, Bolivia, is responsible for processing your personal data. You can contact us about privacy at {email}."] },
        { heading: "2. What data we collect", paragraphs: [
          "Data you give us: name, email, phone or WhatsApp number, travel dates, number of guests and comments on your booking.",
          "Partner data: details of the property or company, contact details and photos they send us to publish their deals.",
          "Our own statistics: we count visits and clicks (page, deal, visit source, device type and country) without cookies and without storing your IP address. We use a temporary code that changes every day and cannot identify you.",
          "Third-party analytics: only if you accept cookies, aggregated browsing data through Google Analytics.",
          "We do not collect or store bank card data."
        ] },
        { heading: "3. What we use it for", paragraphs: [
          "Managing your booking and contacting you about it.",
          "Sharing with the partner the details needed to provide the service (name, dates and number of guests).",
          "Handling questions, complaints and refunds.",
          "Improving the site with aggregated statistics.",
          "Sending you deals only if you give us your express consent."
        ] },
        { heading: "4. Who we share it with", paragraphs: ["Only with the partner of your booking and with technology providers that help us run the site (web hosting and database). We do not sell or rent your data."] },
        { heading: "5. How we protect it", paragraphs: [
          "Your data is stored in a cloud database with encryption and access rules that prevent one user from seeing another's data. Only authorized Tripya staff can access bookings.",
          "Account passwords are stored encrypted by the authentication service; Tripya cannot see them."
        ] },
        { heading: "6. How long", paragraphs: ["We keep booking data for as long as needed to provide the service and handle complaints, and for the periods required by Bolivian accounting and tax rules. After that we delete or anonymize it."] },
        { heading: "7. Your rights", paragraphs: ["You can ask to access, correct or delete your data, and withdraw your consent to receive deals, by writing to {email}. We reply within 15 business days."] }
      ],
      fr: [
        { heading: "1. Responsable du traitement", paragraphs: ["Tripya, basée à Tarija, en Bolivie, est responsable du traitement de vos données personnelles. Vous pouvez nous contacter à ce sujet à {email}."] },
        { heading: "2. Données collectées", paragraphs: [
          "Données que vous nous fournissez : nom, email, téléphone ou WhatsApp, dates de voyage, nombre de personnes et commentaires de votre réservation.",
          "Données des partenaires : informations sur l'hébergement ou l'agence, coordonnées et photos envoyées pour publier leurs offres.",
          "Nos propres statistiques : nous comptons les visites et les clics (page, offre, origine de la visite, type d'appareil et pays) sans cookies et sans enregistrer votre adresse IP. Nous utilisons un code temporaire qui change chaque jour et ne permet pas de vous identifier.",
          "Analyse par des tiers : uniquement si vous acceptez les cookies, données de navigation agrégées via Google Analytics.",
          "Nous ne collectons ni ne conservons de données de carte bancaire."
        ] },
        { heading: "3. Utilisation", paragraphs: [
          "Gérer votre réservation et vous contacter à son sujet.",
          "Transmettre au partenaire les données nécessaires pour fournir le service (nom, dates et nombre de personnes).",
          "Traiter les questions, réclamations et remboursements.",
          "Améliorer le site grâce à des statistiques agrégées.",
          "Vous envoyer des offres uniquement avec votre consentement exprès."
        ] },
        { heading: "4. Partage", paragraphs: ["Uniquement avec le partenaire de votre réservation et avec les prestataires techniques qui nous aident à faire fonctionner le site (hébergement web et base de données). Nous ne vendons ni ne louons vos données."] },
        { heading: "5. Protection", paragraphs: [
          "Vos données sont stockées dans une base de données en ligne chiffrée, avec des règles d'accès qui empêchent un utilisateur de voir les données d'un autre. Seul le personnel autorisé de Tripya accède aux réservations.",
          "Les mots de passe des comptes sont stockés chiffrés par le service d'authentification ; Tripya ne peut pas les voir."
        ] },
        { heading: "6. Durée de conservation", paragraphs: ["Nous conservons les données de réservation le temps nécessaire pour fournir le service et traiter les réclamations, ainsi que pendant les délais exigés par la réglementation comptable et fiscale bolivienne. Ensuite, nous les supprimons ou les anonymisons."] },
        { heading: "7. Vos droits", paragraphs: ["Vous pouvez demander à accéder à vos données, les corriger ou les supprimer, et retirer votre consentement à recevoir des offres, en écrivant à {email}. Nous répondons sous 15 jours ouvrables maximum."] }
      ]
    }
  },
  cookies: {
    titleKey: "cookies",
    updated: UPDATED,
    content: {
      es: [
        { heading: "1. Qué usamos", paragraphs: [
          "Almacenamiento técnico necesario: guardamos en tu navegador el idioma elegido, tu decisión sobre cookies y el enlace por el que llegaste (por ejemplo, un video de TikTok) para asociarlo a tu reserva. No se usa para publicidad.",
          "Estadísticas propias: no usan cookies ni guardan tu dirección IP.",
          "Cookies de analítica (Google Analytics): solo si las aceptas. Nos permiten saber de forma agregada cuántas personas visitan el sitio y qué ofertas miran."
        ] },
        { heading: "2. Cómo cambiar tu decisión", paragraphs: ["Puedes borrar los datos de este sitio en tu navegador; el aviso de cookies volverá a aparecer y podrás elegir de nuevo."] },
        { heading: "3. Terceros", paragraphs: ["Google Analytics es un servicio de Google LLC. No usamos píxeles publicitarios. Si en el futuro los usamos, los listaremos aquí y te pediremos consentimiento antes de activarlos."] },
        { heading: "4. Contacto", paragraphs: ["Si tienes preguntas sobre cookies, escríbenos a {email}."] }
      ],
      en: [
        { heading: "1. What we use", paragraphs: [
          "Necessary technical storage: we save in your browser the language you chose, your cookie choice and the link you came from (for example, a TikTok video) to associate it with your booking. It is not used for advertising.",
          "Our own statistics: they use no cookies and do not store your IP address.",
          "Analytics cookies (Google Analytics): only if you accept them. They let us know, in aggregate, how many people visit the site and which deals they view."
        ] },
        { heading: "2. Changing your choice", paragraphs: ["You can clear this site's data in your browser; the cookie notice will appear again and you can choose again."] },
        { heading: "3. Third parties", paragraphs: ["Google Analytics is a service of Google LLC. We do not use advertising pixels. If we ever do, we will list them here and ask for your consent before enabling them."] },
        { heading: "4. Contact", paragraphs: ["If you have questions about cookies, write to {email}."] }
      ],
      fr: [
        { heading: "1. Ce que nous utilisons", paragraphs: [
          "Stockage technique nécessaire : nous enregistrons dans votre navigateur la langue choisie, votre choix concernant les cookies et le lien par lequel vous êtes arrivé (par exemple, une vidéo TikTok) pour l'associer à votre réservation. Il n'est pas utilisé à des fins publicitaires.",
          "Nos propres statistiques : elles n'utilisent pas de cookies et n'enregistrent pas votre adresse IP.",
          "Cookies d'analyse (Google Analytics) : uniquement si vous les acceptez. Ils nous indiquent, de façon agrégée, combien de personnes visitent le site et quelles offres elles consultent."
        ] },
        { heading: "2. Modifier votre choix", paragraphs: ["Vous pouvez effacer les données de ce site dans votre navigateur ; le bandeau cookies réapparaîtra et vous pourrez choisir à nouveau."] },
        { heading: "3. Tiers", paragraphs: ["Google Analytics est un service de Google LLC. Nous n'utilisons pas de pixels publicitaires. Si nous le faisons un jour, nous les listerons ici et demanderons votre consentement avant de les activer."] },
        { heading: "4. Contact", paragraphs: ["Pour toute question sur les cookies, écrivez à {email}."] }
      ]
    }
  }
};
