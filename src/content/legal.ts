// DRAFT legal texts (Spanish only). Must be reviewed by a lawyer in Bolivia before accepting real payments.
// Placeholders in [BRACKETS] must be completed once the company and the payment model are defined.
import type { Dictionary } from "@/i18n/dictionaries/es";

export type LegalDoc = {
  titleKey: keyof Pick<Dictionary["legal"], "terms" | "privacy" | "cookies" | "bookingConditions" | "cancellation" | "refunds">;
  updated: string;
  sections: { heading: string; paragraphs: string[] }[];
};

const COMPANY = "[RAZÓN SOCIAL], con NIT [NIT] y domicilio en [DOMICILIO], Tarija, Bolivia (en adelante, «Tripya»)";

export const legalDocs: Record<string, LegalDoc> = {
  terminos: {
    titleKey: "terms",
    updated: "2026-10-05",
    sections: [
      { heading: "1. Quiénes somos", paragraphs: [`Este sitio web es operado por ${COMPANY}.`, "Puedes contactarnos por WhatsApp o por email a través de la página de Ayuda."] },
      { heading: "2. Qué hace Tripya", paragraphs: [
        "Tripya es una plataforma que publica ofertas de alojamientos, escapadas y experiencias ofrecidas por proveedores turísticos (hoteles, lodges, propietarios de departamentos, operadores, etc.).",
        "[PENDIENTE DE DEFINIR: indicar si Tripya actúa como intermediario/agente del proveedor o como vendedor (merchant of record), quién cobra el precio y quién emite la factura.]",
        "El servicio de alojamiento o la experiencia es prestado por el proveedor indicado en cada oferta, que es responsable de su prestación conforme a lo publicado."
      ] },
      { heading: "3. Uso del sitio", paragraphs: [
        "Te comprometes a proporcionar información verdadera y a no usar el sitio con fines fraudulentos.",
        "Podemos rechazar o cancelar solicitudes de reserva que detectemos como fraudulentas o abusivas."
      ] },
      { heading: "4. Precios y ofertas", paragraphs: [
        "Los precios se muestran en bolivianos (Bs) e incluyen lo indicado en cada oferta. El «precio habitual» es el precio que el proveedor declara cobrar normalmente por el mismo servicio.",
        "Las Ofertas Flash tienen una vigencia y unos cupos limitados. Una vez terminada la vigencia o agotados los cupos, la oferta deja de estar disponible.",
        "[PENDIENTE: impuestos incluidos, emisión de factura.]"
      ] },
      { heading: "5. Reservas", paragraphs: ["Las reservas se rigen por las Condiciones de reserva y la Política de cancelación, que forman parte de estos términos."] },
      { heading: "6. Responsabilidad", paragraphs: [
        "Tripya verifica a los proveedores antes de publicarlos (ver «Verificado por Tripya»), pero no es propietario ni operador de los alojamientos.",
        "[PENDIENTE: límites de responsabilidad conforme a la normativa boliviana de protección al consumidor.]"
      ] },
      { heading: "7. Reclamos", paragraphs: ["Si tienes un problema, escríbenos con tu número de reserva. Responderemos y gestionaremos el reclamo con el proveedor. [PENDIENTE: plazos y procedimiento formal de reclamos.]"] },
      { heading: "8. Ley aplicable", paragraphs: ["Estos términos se rigen por las leyes del Estado Plurinacional de Bolivia. [PENDIENTE: jurisdicción.]"] }
    ]
  },
  "condiciones-reserva": {
    titleKey: "bookingConditions",
    updated: "2026-10-05",
    sections: [
      { heading: "1. Solicitud de reserva", paragraphs: [
        "Al enviar el formulario de reserva realizas una solicitud. Recibes un número de reserva (por ejemplo OFZ-7K3M2P) que identifica tu reserva en todas las comunicaciones.",
        "La solicitud no es una reserva confirmada hasta que Tripya confirme la disponibilidad con el proveedor y se complete el pago según las instrucciones enviadas."
      ] },
      { heading: "2. Precio", paragraphs: [
        "El precio final se calcula en nuestro sistema según la oferta, las fechas, el número de personas y los servicios adicionales elegidos. No se aplican cargos ocultos.",
        "Los precios mostrados en la oferta son válidos durante la vigencia de la oferta y hasta agotar cupos."
      ] },
      { heading: "3. Pago", paragraphs: [
        "[PENDIENTE DE DEFINIR: métodos de pago aceptados, quién recibe el pago, plazos para pagar y qué pasa si no se paga a tiempo.]",
        "Tripya nunca te pedirá los datos de tu tarjeta por WhatsApp, teléfono ni email."
      ] },
      { heading: "4. Datos de los viajeros", paragraphs: ["Debes indicar datos de contacto correctos. El proveedor puede solicitar un documento de identidad al momento del check-in."] },
      { heading: "5. Modificaciones", paragraphs: ["Para modificar una reserva escríbenos con tu número de reserva. Las modificaciones dependen de la disponibilidad y de las condiciones de cada oferta."] },
      { heading: "6. Durante la estadía", paragraphs: ["Si lo que encuentras no coincide con lo publicado, contáctanos de inmediato por WhatsApp para que podamos gestionar una solución con el proveedor."] }
    ]
  },
  cancelacion: {
    titleKey: "cancellation",
    updated: "2026-10-05",
    sections: [
      { heading: "1. Política de cada oferta", paragraphs: ["Cada oferta muestra su propia política de cancelación antes de reservar. Si la oferta indica condiciones específicas, prevalecen sobre esta política general."] },
      { heading: "2. Política general (si la oferta no indica otra)", paragraphs: [
        "[PROPUESTA A VALIDAR CON LOS PROVEEDORES]",
        "Cancelación gratuita hasta 7 días antes de la fecha de llegada.",
        "Entre 7 días y 48 horas antes de la llegada: se retiene el 50% del importe.",
        "Menos de 48 horas antes de la llegada o no presentarse: no hay reembolso.",
        "Las Ofertas Flash pueden ser no reembolsables; en ese caso se indica claramente en la oferta."
      ] },
      { heading: "3. Cómo cancelar", paragraphs: ["Escríbenos por WhatsApp o email indicando tu número de reserva. La fecha de cancelación es la de recepción de tu mensaje."] },
      { heading: "4. Cancelación por parte del proveedor", paragraphs: ["Si el proveedor no puede prestar el servicio, te ofreceremos una alternativa equivalente o el reembolso total de lo pagado."] }
    ]
  },
  reembolsos: {
    titleKey: "refunds",
    updated: "2026-10-05",
    sections: [
      { heading: "1. Cuándo corresponde un reembolso", paragraphs: ["Cuando cancelas dentro de los plazos de la política aplicable, cuando el proveedor cancela, o cuando el servicio prestado difiere de forma sustancial de lo publicado."] },
      { heading: "2. Cómo se realiza", paragraphs: [
        "[PENDIENTE DE DEFINIR según el método de pago: el reembolso se realiza por el mismo medio utilizado para pagar, en un plazo de [X] días hábiles.]",
        "Te informaremos por WhatsApp o email cuando el reembolso haya sido procesado, indicando tu número de reserva."
      ] },
      { heading: "3. Reclamos por diferencias", paragraphs: ["Para evaluar un reclamo por diferencias entre lo publicado y lo encontrado, envíanos fotos y una descripción durante la estadía o dentro de las 48 horas posteriores al check-out."] }
    ]
  },
  privacidad: {
    titleKey: "privacy",
    updated: "2026-10-05",
    sections: [
      { heading: "1. Responsable", paragraphs: [`El responsable del tratamiento de tus datos es ${COMPANY}.`] },
      { heading: "2. Qué datos recogemos", paragraphs: [
        "Datos que nos das: nombre, email, teléfono/WhatsApp, fechas de viaje, número de personas y comentarios.",
        "Datos de proveedores: datos del alojamiento, contacto y fotos enviadas en el formulario «Publica tu alojamiento».",
        "Datos de navegación: si aceptas las cookies de analítica, datos anónimos sobre las páginas visitadas y el origen de la visita (por ejemplo, un enlace de TikTok o Instagram).",
        "No recogemos ni almacenamos datos de tarjetas bancarias."
      ] },
      { heading: "3. Para qué los usamos", paragraphs: [
        "Gestionar tu solicitud de reserva y comunicarnos contigo sobre ella.",
        "Compartir con el proveedor los datos necesarios para prestar el servicio (nombre, fechas, número de personas).",
        "Atender consultas y reclamos.",
        "Mejorar el sitio con estadísticas agregadas.",
        "Enviarte ofertas solo si nos das tu consentimiento expreso."
      ] },
      { heading: "4. Dónde se guardan y cómo se protegen", paragraphs: [
        "Los datos se almacenan en Supabase (infraestructura en la nube) con cifrado en tránsito y en reposo, y con reglas de acceso que impiden que un usuario vea datos de otro. Solo el personal autorizado de Tripya accede a las reservas.",
        "Las contraseñas de las cuentas se almacenan cifradas por el proveedor de autenticación; Tripya no puede verlas."
      ] },
      { heading: "5. Cuánto tiempo", paragraphs: ["[PENDIENTE: plazos de conservación, por ejemplo durante la relación comercial y los plazos legales contables/tributarios.]"] },
      { heading: "6. Tus derechos", paragraphs: ["Puedes pedir acceso, rectificación o eliminación de tus datos escribiéndonos por email. [PENDIENTE: revisar normativa boliviana aplicable y, para visitantes de la Unión Europea, el RGPD.]"] }
    ]
  },
  cookies: {
    titleKey: "cookies",
    updated: "2026-10-05",
    sections: [
      { heading: "1. Qué usamos", paragraphs: [
        "Almacenamiento técnico necesario: guardamos en tu navegador el idioma elegido, tu decisión sobre cookies y el enlace por el que llegaste (por ejemplo, un video de TikTok) para asociarlo a tu reserva. No se usa para publicidad.",
        "Cookies de analítica (Google Analytics 4): solo si las aceptas. Nos permiten saber cuántas personas visitan el sitio, qué ofertas miran y qué botones pulsan, de forma agregada."
      ] },
      { heading: "2. Cómo cambiar tu decisión", paragraphs: ["Puedes borrar los datos del sitio en tu navegador; el aviso de cookies volverá a aparecer y podrás elegir de nuevo."] },
      { heading: "3. Terceros", paragraphs: ["Google Analytics es un servicio de Google LLC. [PENDIENTE: si se añaden píxeles de TikTok o Meta, listarlos aquí y pedir consentimiento.]"] }
    ]
  }
};
