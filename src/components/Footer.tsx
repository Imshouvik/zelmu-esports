import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full bg-transparent text-gray-800 py-6 md:py-8 border-t border-gray-200/20 mt-12">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between px-4 gap-4">
        <div className="flex flex-row flex-wrap gap-4 sm:gap-6 text-sm font-medium items-center justify-center w-full md:w-auto">
          <Link href="/about-us" className="hover:underline hover:text-fuchsia-600 transition">About Us</Link>
          <Link href="/contact-us" className="hover:underline hover:text-fuchsia-600 transition">Contact Us</Link>
          <Link href="/terms-and-conditions" className="hover:underline hover:text-fuchsia-600 transition">Terms & Conditions</Link>
          <Link href="/privacy-policy" className="hover:underline hover:text-fuchsia-600 transition">Privacy Policy</Link>
        </div>
        <div className="text-xs text-gray-500 mt-2 md:mt-0 text-center w-full md:w-auto">© {new Date().getFullYear()} Zelmu Esports. All rights reserved.</div>
      </div>
    </footer>
  );
} 