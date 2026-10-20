import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Workspace } from "~/components/workspace/Workspace";
import { lessons } from "~/lib/lessons";

export const dynamicParams = false;

export function generateStaticParams() {
  return lessons.map((_, i) => ({ id: String(i + 1) }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const lesson = lessons[Number(id) - 1];
  return { title: lesson ? `Mission ${id}: ${lesson.title} — Linux Mastery` : "Linux Mastery" };
}

export default async function MissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const index = Number(id) - 1;
  if (!Number.isInteger(index) || index < 0 || index >= lessons.length) notFound();
  return <Workspace key={index} index={index} />;
}
