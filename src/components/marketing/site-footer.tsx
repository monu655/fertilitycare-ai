import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export function SiteFooter() {
  return (
    <footer className="bg-navy text-white/80">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid gap-8 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <Logo light />
            <p className="mt-3 max-w-sm text-sm">
              Private, evidence-informed male reproductive health education and care navigation.
            </p>
          </div>
          <nav aria-label="Product" className="space-y-2 text-sm">
            <p className="font-semibold text-white">Product</p>
            <Link href="/#how-it-works" className="block hover:text-white">How It Works</Link>
            <Link href="/resources" className="block hover:text-white">Health Resources</Link>
            <Link href="/sign-up" className="block hover:text-white">Get Started</Link>
          </nav>
          <nav aria-label="Legal" className="space-y-2 text-sm">
            <p className="font-semibold text-white">Privacy</p>
            <Link href="/privacy-policy" className="block hover:text-white">Privacy Policy</Link>
            <Link href="/#privacy" className="block hover:text-white">How your data is handled</Link>
          </nav>
        </div>
        <p className="mt-10 border-t border-white/15 pt-6 text-xs leading-relaxed">
          <strong className="text-white">Medical disclaimer:</strong> FertilityCare AI provides general health
          education and care-navigation support. It does not diagnose infertility or any other condition, does not
          predict fertility outcomes, and does not replace advice from a qualified healthcare professional. If you
          have urgent symptoms such as severe testicular pain, sudden swelling, or fever, seek urgent medical care.
        </p>
      </div>
    </footer>
  );
}
