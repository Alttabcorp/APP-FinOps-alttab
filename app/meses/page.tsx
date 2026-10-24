import { redirect } from "next/navigation";
import { competenciaAtual } from "@/lib/domain/financeiro/competencia";

export default function PaginaMeses() {
  redirect(`/meses/${competenciaAtual()}`);
}
