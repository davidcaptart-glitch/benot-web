"use client";

export default function ResetCookiesButton() {
  return (
    <button
      onClick={() => {
        localStorage.removeItem("benot_cookies");
        window.location.reload();
      }}
      className="mt-4 font-bebas tracking-widest text-sm border-2 border-gray-300 text-gray-700 px-6 py-2.5 hover:border-black hover:text-black transition-colors"
    >
      CAMBIAR MIS PREFERENCIAS DE COOKIES
    </button>
  );
}
