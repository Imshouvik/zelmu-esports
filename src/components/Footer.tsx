import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full bg-gray-900 text-gray-200 py-8 border-t border-gray-800 mt-12">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between px-4 gap-4">
        <div className="flex flex-wrap gap-6 text-sm font-medium">
          <Link href="/about-us" className="hover:underline hover:text-white transition">About Us</Link>
          <Link href="/contact-us" className="hover:underline hover:text-white transition">Contact Us</Link>
          <Link href="/terms-and-conditions" className="hover:underline hover:text-white transition">Terms & Conditions</Link>
          <Link href="/privacy-policy" className="hover:underline hover:text-white transition">Privacy Policy</Link>
        </div>
        <div className="text-xs text-gray-400 mt-2 md:mt-0">© {new Date().getFullYear()} Zelmu Esports. All rights reserved.</div>
      </div>
    </footer>
  );
} 