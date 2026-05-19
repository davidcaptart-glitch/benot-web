import { redirect } from "next/navigation";

/* Redirige de vuelta al configurador — Stripe llega aquí si el usuario cancela */
export default function CancelPage() {
  redirect("/configurador");
}
