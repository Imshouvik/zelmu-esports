export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f051d] via-[#18122b] to-[#232046] py-12 px-4 flex justify-center items-start">
      <div className="max-w-2xl w-full bg-white/10 rounded-2xl shadow-2xl p-8 border border-fuchsia-700/30">
        <h1 className="text-3xl font-extrabold text-fuchsia-400 mb-6 text-center drop-shadow">Privacy Policy</h1>
        <p className="text-fuchsia-100 mb-6 text-center">Effective Date: May 2024</p>
        <section className="mb-6">
          <h2 className="text-xl font-bold text-fuchsia-300 mb-2">1. Introduction</h2>
          <p className="text-fuchsia-100">Welcome to Zelmu! Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your information when you use our website and services.</p>
        </section>
        <section className="mb-6">
          <h2 className="text-xl font-bold text-fuchsia-300 mb-2">2. Information We Collect</h2>
          <ul className="list-disc list-inside text-fuchsia-100">
            <li><b>Account Information:</b> Name, email address, and other details you provide when registering.</li>
            <li><b>Usage Data:</b> Pages visited, features used, and actions taken within the app.</li>
            <li><b>Device & Log Data:</b> IP address, browser type, device information, and access times.</li>
            <li><b>Cookies & Tracking:</b> We use cookies and similar technologies to enhance your experience.</li>
          </ul>
        </section>
        <section className="mb-6">
          <h2 className="text-xl font-bold text-fuchsia-300 mb-2">3. How We Use Information</h2>
          <ul className="list-disc list-inside text-fuchsia-100">
            <li>To provide, maintain, and improve our services.</li>
            <li>To personalize your experience and deliver relevant content.</li>
            <li>To communicate with you about updates, features, and support.</li>
            <li>To ensure security and prevent fraud.</li>
          </ul>
        </section>
        <section className="mb-6">
          <h2 className="text-xl font-bold text-fuchsia-300 mb-2">4. Sharing & Disclosure</h2>
          <p className="text-fuchsia-100">We do not sell your personal information. We may share data with trusted service providers who help us operate our platform, or if required by law.</p>
        </section>
        <section className="mb-6">
          <h2 className="text-xl font-bold text-fuchsia-300 mb-2">5. Cookies & Tracking Technologies</h2>
          <p className="text-fuchsia-100">We use cookies and similar technologies to remember your preferences, analyze usage, and improve our services. You can control cookies through your browser settings.</p>
        </section>
        <section className="mb-6">
          <h2 className="text-xl font-bold text-fuchsia-300 mb-2">6. Data Security</h2>
          <p className="text-fuchsia-100">We implement industry-standard security measures to protect your data. However, no method of transmission over the Internet is 100% secure.</p>
        </section>
        <section className="mb-6">
          <h2 className="text-xl font-bold text-fuchsia-300 mb-2">7. Your Rights & Choices</h2>
          <ul className="list-disc list-inside text-fuchsia-100">
            <li>You can access, update, or delete your account information at any time.</li>
            <li>You may opt out of marketing communications.</li>
            <li>Contact us for any privacy-related requests.</li>
          </ul>
        </section>
        <section className="mb-6">
          <h2 className="text-xl font-bold text-fuchsia-300 mb-2">8. Changes to This Policy</h2>
          <p className="text-fuchsia-100">We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new policy on this page.</p>
        </section>
        <section className="mb-2">
          <h2 className="text-xl font-bold text-fuchsia-300 mb-2">9. Contact Us</h2>
          <p className="text-fuchsia-100">If you have any questions or concerns about this Privacy Policy, please contact us at <a href="mailto:support@zelmu.com" className="text-fuchsia-400 underline">support@zelmu.com</a>.</p>
        </section>
      </div>
    </div>
  );
} 