import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { LEGAL } from "@/lib/legal-config";

export const metadata: Metadata = {
  title: "Política de Cookies | BENOT",
  description: "Política de cookies de BENOT. Qué cookies usamos y cómo gestionarlas.",
  robots: { index: true, follow: false },
};

export default function PoliticaCookiesPage() {
  return (
    <LegalPage title="Política de Cookies" updated={LEGAL.fechaActualizacion}>

      {/* ── 1. QUÉ SON ─────────────────────────────────────────────── */}
      <section>
        <h2>1. ¿Qué son las cookies?</h2>
        <p>
          Las cookies son pequeños archivos de texto que los sitios web almacenan en tu dispositivo.
          Sirven para recordar tus preferencias, permitir el funcionamiento de determinados servicios
          o analizar cómo se usa el sitio.
        </p>
        <p>
          En cumplimiento del artículo 22.2 de la Ley 34/2002 (LSSI) y el Reglamento General de
          Protección de Datos (RGPD), te informamos del uso de cookies en {LEGAL.web}.
        </p>
      </section>

      {/* ── 2. COOKIES QUE USAMOS ──────────────────────────────────── */}
      <section>
        <h2>2. Cookies que utilizamos</h2>
        <p>
          {/* Para añadir una nueva categoría, edita cookiesCategorias en lib/legal-config.ts */}
        </p>
        {LEGAL.cookiesCategorias.map((cat) => (
          <div key={cat.id} className="mb-6">
            <h3>{cat.nombre}</h3>
            <p>{cat.descripcion}</p>
            <table>
              <thead>
                <tr>
                  <th>Cookie</th>
                  <th>Duración</th>
                  <th>Finalidad</th>
                </tr>
              </thead>
              <tbody>
                {cat.cookies.map((c) => (
                  <tr key={c.nombre}>
                    <td><code>{c.nombre}</code></td>
                    <td>{c.duracion}</td>
                    <td>{c.finalidad}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </section>

      {/* ── 3. SERVICIOS TERCEROS ───────────────────────────────────── */}
      <section>
        <h2>3. Cookies de terceros</h2>
        <p>Algunos servicios externos pueden instalar sus propias cookies:</p>
        <table>
          <thead>
            <tr>
              <th>Servicio</th>
              <th>Uso</th>
              <th>Más información</th>
            </tr>
          </thead>
          <tbody>
            {LEGAL.serviciosExternos.map((s) => (
              <tr key={s.nombre}>
                <td><strong>{s.nombre}</strong></td>
                <td>{s.datos}</td>
                <td>
                  <a href={s.privacidad} target="_blank" rel="noopener noreferrer">
                    Política de privacidad
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ── 4. GESTIONAR PREFERENCIAS ──────────────────────────────── */}
      <section>
        <h2>4. Cómo gestionar tus preferencias</h2>
        <p>
          Puedes cambiar tus preferencias de cookies en cualquier momento usando el botón de abajo,
          o eliminando la cookie <code>benot_cookies</code> desde la configuración de tu navegador.
        </p>
        <p>También puedes configurar tu navegador para bloquear o eliminar cookies:</p>
        <ul>
          <li>
            <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">
              Google Chrome
            </a>
          </li>
          <li>
            <a href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias" target="_blank" rel="noopener noreferrer">
              Mozilla Firefox
            </a>
          </li>
          <li>
            <a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">
              Safari
            </a>
          </li>
          <li>
            <a href="https://support.microsoft.com/es-es/windows/eliminar-y-administrar-cookies-168dab11-0753-043d-7c16-ede5947fc64d" target="_blank" rel="noopener noreferrer">
              Microsoft Edge
            </a>
          </li>
        </ul>

        {/* Botón para reabrir el banner de cookies */}
        <ResetCookiesButton />
      </section>

      {/* ── 5. ACTUALIZACIÓN ───────────────────────────────────────── */}
      <section>
        <h2>5. Actualización de esta política</h2>
        <p>
          Podemos actualizar esta política cuando incorporemos nuevos servicios o cambie la normativa aplicable.
          Te recomendamos revisarla periódicamente. La fecha de la última actualización aparece al inicio de
          esta página.
        </p>
        <p>
          Para cualquier consulta: <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>
        </p>
      </section>

    </LegalPage>
  );
}

// Importación dinámica para evitar hidratación SSR en componente client-side
import ResetCookiesButton from "./ResetCookiesButton";
