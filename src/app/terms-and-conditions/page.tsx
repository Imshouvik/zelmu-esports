export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f051d] via-[#18122b] to-[#232046] py-12 px-4 flex justify-center items-start">
      <div className="max-w-2xl w-full bg-white/10 rounded-2xl shadow-2xl p-8 border border-fuchsia-700/30">
        <h1 className="text-3xl font-extrabold text-fuchsia-400 mb-6 text-center drop-shadow">Terms and Conditions</h1>
        <p className="text-fuchsia-100 mb-6 text-center">Effective Date: May 2024</p>
        <section className="mb-6">
          <h2 className="text-xl font-bold text-fuchsia-300 mb-2">1. Acceptance of Terms</h2>
          <p className="text-fuchsia-100">By accessing or using Zelmu Esports, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use our services.</p>
        </section>
        <section className="mb-6">
          <h2 className="text-xl font-bold text-fuchsia-300 mb-2">2. Use of Service</h2>
          <ul className="list-disc list-inside text-fuchsia-100">
            <li>You must comply with all applicable laws and regulations.</li>
            <li>Do not misuse or interfere with the platform or other users.</li>
            <li>Respect the rights and privacy of others.</li>
          </ul>
        </section>
        <section className="mb-6">
          <h2 className="text-xl font-bold text-fuchsia-300 mb-2">3. User Content</h2>
          <p className="text-fuchsia-100">You are responsible for any content you post or share. Do not post anything illegal, offensive, or infringing on others' rights.</p>
        </section>
        <section className="mb-6">
          <h2 className="text-xl font-bold text-fuchsia-300 mb-2">4. Limitation of Liability</h2>
          <p className="text-fuchsia-100">Zelmu Esports is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the platform.</p>
        </section>
        <section className="mb-6">
          <h2 className="text-xl font-bold text-fuchsia-300 mb-2">5. Changes to Terms</h2>
          <p className="text-fuchsia-100">We may update these Terms and Conditions at any time. Continued use of the platform constitutes acceptance of the new terms.</p>
        </section>
        <section className="mb-2">
          <h2 className="text-xl font-bold text-fuchsia-300 mb-2">6. Contact</h2>
          <p className="text-fuchsia-100">For any questions about these Terms and Conditions, please contact us at <a href="mailto:support@zelmu.com" className="text-fuchsia-400 underline">support@zelmu.com</a>.</p>
        </section>
      </div>
    </div>
  );
} 