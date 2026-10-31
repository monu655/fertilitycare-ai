import { BookOpenCheck, Lock, Sparkles } from "lucide-react";
import { Logo } from "@/components/brand/logo";

const points = [
  { icon: Lock, title: "Private and secure", text: "Your answers stay in your account. Nothing is shared unless you choose." },
  { icon: BookOpenCheck, title: "Source-linked", text: "Education links to named public-health and medical sources." },
  { icon: Sparkles, title: "AI-assisted, not a diagnosis", text: "Clear, explainable guidance that never replaces a clinician." },
];

// Split-screen layout from the reference image: brand panel (left) + form (right).
export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen md:grid-cols-[1fr_1.1fr]">
      <aside className="hidden bg-navy p-10 text-white md:flex md:flex-col">
        <Logo light />
        <p className="mt-10 text-xl font-semibold">Your health. Your privacy. Our priority.</p>
        <ul className="mt-8 space-y-6">
          {points.map(({ icon: Icon, title: t, text }) => (
            <li key={t} className="flex gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy-2">
                <Icon className="h-5 w-5 text-teal" aria-hidden="true" />
              </span>
              <span>
                <strong className="block text-sm">{t}</strong>
                <span className="text-sm text-white/75">{text}</span>
              </span>
            </li>
          ))}
        </ul>
      </aside>

      <main id="main" className="flex items-center justify-center bg-white px-5 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 md:hidden">
            <Logo />
          </div>
          <h1 className="text-2xl font-bold text-navy">{title}</h1>
          <p className="mt-1 text-sm text-muted">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </main>
    </div>
  );
}
