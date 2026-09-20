import { redirect } from "next/navigation";

export default function LegacyV2Page() {
  redirect("/copilot");
  return null;
}
