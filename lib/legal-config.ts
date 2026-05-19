// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURACIÓN LEGAL BENOT — edita este fichero para actualizar
// todas las páginas legales a la vez.
// ─────────────────────────────────────────────────────────────────────────────

export const LEGAL = {
  // ── Identidad del responsable ─────────────────────────────────────────────
  // TODO: rellena los datos reales del titular antes de publicar
  empresa:   "BENOT",
  titular:   "BENOT",                  // Nombre completo / razón social
  nif:       "PENDIENTE",              // NIF o CIF
  domicilio: "PENDIENTE",              // Dirección postal completa
  ciudad:    "España",

  // ── Contacto ─────────────────────────────────────────────────────────────
  // Cambia el email aquí y se actualiza en aviso legal, privacidad y cookies
  email:      "benotstore@gmail.com",
  emailRGPD:  "benotstore@gmail.com",  // Para solicitudes de derechos RGPD
  telegram:   "@Benotpedidosbot",
  instagram:  "https://instagram.com/benotstore",
  web:        "https://benot.store",

  // ── Fecha de última actualización ────────────────────────────────────────
  fechaActualizacion: "Mayo 2026",

  // ── Servicios externos ───────────────────────────────────────────────────
  // Añade o elimina entradas según los servicios que uses.
  // Cada entrada aparece automáticamente en Política de Privacidad y Cookies.
  serviciosExternos: [
    {
      nombre:      "Stripe",
      descripcion: "Pasarela de pago seguro. Procesa los datos de tarjeta y dirección de facturación.",
      privacidad:  "https://stripe.com/es/privacy",
      datos:       "Nombre, email, dirección postal, datos de pago (gestionados por Stripe, nunca almacenados en nuestros servidores).",
    },
    {
      nombre:      "Telegram",
      descripcion: "Canal de comunicación y atención al cliente para gestión de pedidos.",
      privacidad:  "https://telegram.org/privacy",
      datos:       "Mensajes de texto relacionados con tu pedido y consultas.",
    },
    {
      nombre:      "Hetzner Online GmbH",
      descripcion: "Proveedor de VPS/hosting donde se aloja esta web y sus servicios.",
      privacidad:  "https://www.hetzner.com/legal/privacy-policy",
      datos:       "Logs de acceso del servidor (IP, fecha, URL solicitada).",
    },
    // Ejemplo para añadir Google Analytics en el futuro:
    // {
    //   nombre:      "Google Analytics",
    //   descripcion: "Análisis de tráfico web.",
    //   privacidad:  "https://policies.google.com/privacy",
    //   datos:       "Datos de navegación anonimizados (páginas vistas, origen del tráfico).",
    // },
  ],

  // ── Cookies ───────────────────────────────────────────────────────────────
  // Define las categorías de cookies que usa la web.
  // Añade/elimina aquí y se refleja en el banner y en la política de cookies.
  cookiesCategorias: [
    {
      id:          "necesarias",
      nombre:      "Cookies necesarias",
      descripcion: "Imprescindibles para el funcionamiento básico de la web (sesión, carrito). No pueden desactivarse.",
      obligatoria: true,
      cookies: [
        { nombre: "benot_cookies", duracion: "1 año",  finalidad: "Guarda tus preferencias de cookies." },
      ],
    },
    {
      id:          "funcionales",
      nombre:      "Cookies funcionales",
      descripcion: "Permiten el pago seguro y la comunicación con servicios externos.",
      obligatoria: false,
      cookies: [
        { nombre: "__stripe_*", duracion: "Sesión",  finalidad: "Necesarias para el procesamiento seguro del pago con Stripe." },
        { nombre: "sn_*",       duracion: "Sesión",  finalidad: "Cookies de sesión de Stripe para prevención de fraude." },
      ],
    },
    // Ejemplo para analytics:
    // {
    //   id:          "analiticas",
    //   nombre:      "Cookies analíticas",
    //   descripcion: "Nos ayudan a entender cómo se usa la web (páginas vistas, etc.).",
    //   obligatoria: false,
    //   cookies: [
    //     { nombre: "_ga, _gid", duracion: "2 años", finalidad: "Google Analytics — análisis anónimo del tráfico." },
    //   ],
    // },
  ],
};
