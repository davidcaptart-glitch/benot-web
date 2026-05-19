import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { LEGAL } from "@/lib/legal-config";

export const metadata: Metadata = {
  title: "Política de Privacidad | BENOT",
  description: "Política de privacidad de BENOT. Cómo tratamos y protegemos tus datos personales.",
  robots: { index: true, follow: false },
};

export default function PoliticaPrivacidadPage() {
  return (
    <LegalPage title="Política de Privacidad" updated={LEGAL.fechaActualizacion}>

      {/* ── 1. RESPONSABLE ─────────────────────────────────────────── */}
      <section>
        <h2>1. Responsable del tratamiento</h2>
        <ul>
          <li><strong>Responsable:</strong> {LEGAL.titular}</li>
          <li><strong>NIF/CIF:</strong> {LEGAL.nif}</li>
          <li><strong>Domicilio:</strong> {LEGAL.domicilio}</li>
          {/* Para solicitudes de privacidad usa emailRGPD en lib/legal-config.ts */}
          <li><strong>Email DPO / contacto RGPD:</strong>{" "}
            <a href={`mailto:${LEGAL.emailRGPD}`}>{LEGAL.emailRGPD}</a>
          </li>
        </ul>
      </section>

      {/* ── 2. DATOS QUE RECOGEMOS ─────────────────────────────────── */}
      <section>
        <h2>2. Datos personales que tratamos</h2>
        <p>Tratamos los siguientes datos según el contexto:</p>
        <ul>
          <li>
            <strong>Realización de pedidos:</strong> nombre completo, dirección de envío, email y teléfono,
            proporcionados durante el proceso de pago.
          </li>
          <li>
            <strong>Comunicaciones por Telegram:</strong> nombre de usuario y mensajes relacionados con tu pedido.
          </li>
          <li>
            <strong>Datos técnicos:</strong> dirección IP, navegador y sistema operativo registrados en logs del servidor
            (tratados por Hetzner Online GmbH como encargado del tratamiento).
          </li>
        </ul>
        <p>
          Los datos de pago son procesados íntegramente por <strong>Stripe Payments Europe, Ltd.</strong>,
          que actúa como responsable independiente bajo sus propias políticas. {LEGAL.empresa} nunca almacena
          datos de tarjeta bancaria.
        </p>
      </section>

      {/* ── 3. FINALIDADES Y BASE LEGAL ────────────────────────────── */}
      <section>
        <h2>3. Finalidades y base jurídica del tratamiento</h2>
        <table>
          <thead>
            <tr>
              <th>Finalidad</th>
              <th>Base legal</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Gestión y envío de pedidos</td>
              <td>Ejecución de contrato (art. 6.1.b RGPD)</td>
            </tr>
            <tr>
              <td>Atención al cliente</td>
              <td>Interés legítimo (art. 6.1.f RGPD)</td>
            </tr>
            <tr>
              <td>Obligaciones fiscales y contables</td>
              <td>Obligación legal (art. 6.1.c RGPD)</td>
            </tr>
            <tr>
              <td>Mejora del servicio y análisis de uso</td>
              <td>Interés legítimo (art. 6.1.f RGPD)</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* ── 4. CONSERVACIÓN ────────────────────────────────────────── */}
      <section>
        <h2>4. Plazo de conservación</h2>
        <p>
          Los datos de pedidos se conservan durante <strong>5 años</strong> para cumplir obligaciones
          fiscales y mercantiles (Ley 58/2003 General Tributaria y Código de Comercio).
          Los datos de atención al cliente se eliminan al transcurrir <strong>1 año</strong> desde la
          última comunicación, salvo que exista un procedimiento en curso.
          Los logs del servidor se conservan un máximo de <strong>6 meses</strong>.
        </p>
      </section>

      {/* ── 5. DESTINATARIOS ───────────────────────────────────────── */}
      <section>
        <h2>5. Destinatarios y transferencias internacionales</h2>
        <p>Tus datos pueden ser compartidos con los siguientes proveedores:</p>
        <table>
          <thead>
            <tr>
              <th>Proveedor</th>
              <th>Rol</th>
              <th>Política de privacidad</th>
            </tr>
          </thead>
          <tbody>
            {LEGAL.serviciosExternos.map((s) => (
              <tr key={s.nombre}>
                <td><strong>{s.nombre}</strong></td>
                <td>{s.descripcion}</td>
                <td>
                  <a href={s.privacidad} target="_blank" rel="noopener noreferrer">
                    Ver política
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>
          No se realizan transferencias internacionales fuera del Espacio Económico Europeo salvo las
          inherentes a los servicios anteriores, quienes disponen de garantías adecuadas (cláusulas
          contractuales tipo o decisión de adecuación de la Comisión Europea).
        </p>
      </section>

      {/* ── 6. DERECHOS ────────────────────────────────────────────── */}
      <section>
        <h2>6. Tus derechos</h2>
        <p>
          Puedes ejercer en cualquier momento los siguientes derechos escribiéndonos a{" "}
          <a href={`mailto:${LEGAL.emailRGPD}`}>{LEGAL.emailRGPD}</a>:
        </p>
        <ul>
          <li><strong>Acceso:</strong> conocer qué datos tratamos sobre ti.</li>
          <li><strong>Rectificación:</strong> corregir datos inexactos o incompletos.</li>
          <li><strong>Supresión:</strong> solicitar el borrado de tus datos cuando ya no sean necesarios.</li>
          <li><strong>Oposición:</strong> oponerte al tratamiento basado en interés legítimo.</li>
          <li><strong>Limitación:</strong> restringir el tratamiento en determinadas circunstancias.</li>
          <li><strong>Portabilidad:</strong> recibir tus datos en formato estructurado y legible por máquina.</li>
          <li>
            <strong>Reclamación:</strong> si consideras que tus derechos han sido vulnerados, puedes presentar
            una reclamación ante la Agencia Española de Protección de Datos (
            <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">aepd.es</a>).
          </li>
        </ul>
      </section>

      {/* ── 7. SEGURIDAD ───────────────────────────────────────────── */}
      <section>
        <h2>7. Medidas de seguridad</h2>
        <p>
          {LEGAL.empresa} aplica medidas técnicas y organizativas apropiadas para proteger tus datos:
          comunicaciones cifradas mediante TLS/HTTPS, acceso restringido a los sistemas y revisión periódica
          de los procedimientos de seguridad.
        </p>
      </section>

    </LegalPage>
  );
}
