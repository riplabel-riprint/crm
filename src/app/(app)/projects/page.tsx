import { DEMO_PROJECTS } from "@/lib/data/projects";
import { ProjectsScreen } from "@/components/projects/ProjectsScreen";

export const metadata = { title: "Projekty | Riprint" };

export default function ProjectsPage() {
  return <ProjectsScreen projects={DEMO_PROJECTS} />;
}
