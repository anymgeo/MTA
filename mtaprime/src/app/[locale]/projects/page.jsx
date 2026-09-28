import View from "@/components/pages/ProjectsPage";
import { pageMetadata } from "@/lib/metadata";

import { getProjects } from "@/services/projects";
export async function generateMetadata({ params }) {
  const { locale } = await params;
  return pageMetadata(locale, "projects", "/projects");
}
export default async function Page({ params }) {
  const { locale } = await params;
  const projects = await getProjects({ locale });
  return <View projects={projects} />;
}
