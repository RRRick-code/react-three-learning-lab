import { redirect } from "next/navigation";
import { firstEffectHref } from "./effects/_data/effects";

export default function Home() {
  if (firstEffectHref) {
    redirect(firstEffectHref);
  }

  redirect("/effects");
}
