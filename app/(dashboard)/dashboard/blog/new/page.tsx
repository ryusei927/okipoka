import { redirect } from "next/navigation";

export default function NewBlogPostDisabledPage() {
  redirect("/dashboard");
}
