import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { LEGAL } from "@/lib/legal-config";

export const metadata: Metadata = {
  title: "Aviso Legal | BENOT",
  description: "Aviso legal de BENOT. Información sobre el titular, condiciones de uso y propiedad intelectual.",
  robots: { index: true, follow: false },
};

export default function AvisoLegalPage() {
  return (
    <LegalPage title="Aviso Legal" updated={LEGAL.fechaActualizacion}>

      {/* ── 1. DATOS IDENTIFICATIVOS ────────────────────────────────── */}
      <section>
        <h2>1. Datos identificativos del titular</h2>
        <p>
          En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la
          Información y Comercio Electrónico (LSSI-CE), se informa de los datos identificativos del titular:
        </p>
        <ul>
          <li><strong>Denominación:</strong> {LEGAL.empresa}</li>
          {/* TODO: rellena titular, NIF y domicilio en lib/legal-config.ts */}
          <li><strong>Titular:</strong> {LEGAL.titular}</li>
          <li><strong>NIF/CIF:</strong> {LEGAL.nif}</li>
          <li><strong>Domicilio:</strong> {LEGAL.domicilio}</li>
          <li><strong>Email de contacto:</strong>{" "}
            <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>
          </li>
          <li><strong>Sitio web:</strong>{" "}
            <a href={LEGAL.web} target="_blank" rel="noopener noreferrer">{LEGAL.web}</a>
          </li>
        </ul>
      </section>

      {/* ── 2. OBJETO Y CONDICIONES DE USO ─────────────────────────── */}
      <section>
        <h2>2. Objeto y condiciones de uso</h2>
        <p>
          {LEGAL.empresa} es una tienda online de camisetas personalizadas. El acceso y uso de este sitio web
          implica la aceptación de las presentes condiciones. El usuario se compromete a hacer un uso lícito,
          sin vulnerar derechos de terceros ni infringir la normativa vigente.
        </p>
        <p>
          {LEGAL.empresa} se reserva el derecho a modificar, sin previo aviso, los contenidos y condiciones del
          sitio web. Las modificaciones serán efectivas desde su publicación.
        </p>
      </section>

      {/* ── 3. PROPIEDAD INTELECTUAL ────────────────────────────────── */}
      <section>
        <h2>3. Propiedad intelectual e industrial</h2>
        <p>
          Todos los contenidos de este sitio web — incluyendo diseños, imágenes, textos, logotipos y código fuente —
          son titularidad de {LEGAL.empresa} o de terceros que han autorizado su uso, y están protegidos por
          la legislación española e internacional sobre propiedad intelectual e industrial.
        </p>
        <p>
          Queda prohibida su reproducción total o parcial, distribución, comunicación pública o transformación
          sin autorización expresa y por escrito del titular.
        </p>
      </section>

      {/* ── 4. RESPONSABILIDAD ─────────────────────────────────────── */}
      <section>
        <h2>4. Exclusión de responsabilidad</h2>
        <p>
          {LEGAL.empresa} no garantiza la disponibilidad continua del sitio web ni se responsabiliza de los daños
          que puedan derivarse de interrupciones, errores técnicos, virus informáticos o accesos no autorizados.
        </p>
        <p>
          Los enlaces a sitios externos son informativos. {LEGAL.empresa} no controla ni se responsabiliza del
          contenido de dichos sitios.
        </p>
      </section>

      {/* ── 5. LEY APLICABLE ────────────────────────────────────────── */}
      <section>
        <h2>5. Ley aplicable y jurisdicción</h2>
        <p>
          Las presentes condiciones se rigen por la legislación española. Para cualquier controversia derivada
          del uso de este sitio web, las partes se someten a los juzgados y tribunales de {LEGAL.ciudad},
          con renuncia expresa a cualquier otro fuero que pudiera corresponderles.
        </p>
      </section>

    </LegalPage>
  );
}
