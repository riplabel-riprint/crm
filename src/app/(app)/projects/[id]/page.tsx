import { notFound } from "next/navigation";
import { DEMO_PROJECTS } from "@/lib/data/projects";
import { ProjectDetailView } from "@/components/projects/ProjectDetailView";

export function generateStaticParams() {
  return DEMO_PROJECTS.map((p) => ({ id: p.id }));
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = DEMO_PROJECTS.find((p) => p.id === id);
  if (!project) notFound();
  return <ProjectDetailView project={project} />;
}
