import type { Metadata } from "next";
import { Workspace } from "~/components/workspace/Workspace";
import { PLAYGROUND } from "~/lib/progress";

export const metadata: Metadata = { title: "Playground — Linux Mastery" };

export default function PlaygroundPage() {
  return <Workspace index={PLAYGROUND} />;
}
