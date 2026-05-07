export default function TelegramBanner() {
  return (
    <section id="contacto" className="bg-black">
      <a
        href="https://t.me/Benotpedidosbot"
        target="_blank"
        rel="noopener noreferrer"
        className="block max-w-[1200px] mx-auto transition-opacity duration-300 hover:opacity-95"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/Webpage%20images/banner%20telegram_v2.png"
          alt="Haz tu pedido por Telegram - @Benotpedidosbot"
          className="w-full h-auto block"
        />
      </a>
    </section>
  );
}
