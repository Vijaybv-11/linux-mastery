import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <div className="lm-panel w-full p-8 font-code text-left text-sm">
        <p><span className="text-lm-orange">explorer@linux</span>:<span className="text-lm-cyan">~</span>$ cd /this/page</p>
        <p className="text-lm-coral">bash: cd: /this/page: No such file or directory</p>
      </div>
      <h1 className="mt-10 font-display text-5xl text-lm-orange">404</h1>
      <p className="mt-3 text-lm-ink-soft">Even Maya couldn&apos;t find this path. Let&apos;s head back to familiar ground.</p>
      <Link href="/" className="btn-arcade btn-arcade-orange mt-8">cd ~ (back home)</Link>
    </main>
  );
}
