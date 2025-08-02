export default function ContactUsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f051d] via-[#18122b] to-[#232046] py-12 px-4 flex justify-center items-start">
      <div className="max-w-2xl w-full bg-white/10 rounded-2xl shadow-2xl p-8 border border-fuchsia-700/30">
        <h1 className="text-3xl font-extrabold text-fuchsia-400 mb-6 text-center drop-shadow">Contact Us</h1>
        <section className="mb-6">
          <h2 className="text-xl font-bold text-fuchsia-300 mb-2">Get in Touch</h2>
          <p className="text-fuchsia-100">We'd love to hear from you! For any questions, feedback, or support, please reach out to us using the information below.</p>
        </section>
        <section className="mb-6">
          <h2 className="text-xl font-bold text-fuchsia-300 mb-2">Contact Information</h2>
          <ul className="list-disc list-inside text-fuchsia-100">
            <li>Email: <a href="mailto:support@zelmu.com" className="text-fuchsia-400 underline">support@zelmu.com</a></li>
            <li>Twitter: <a href="https://twitter.com/zelmu" className="text-fuchsia-400 underline" target="_blank" rel="noopener noreferrer">@zelmu</a></li>
            <li>Discord: <a href="https://discord.gg/zelmu" className="text-fuchsia-400 underline" target="_blank" rel="noopener noreferrer">Join our server</a></li>
          </ul>
        </section>
        <section className="mb-2">
          <h2 className="text-xl font-bold text-fuchsia-300 mb-2">Contact Form</h2>
          <p className="text-fuchsia-100">(A contact form can be added here in the future.)</p>
        </section>
      </div>
    </div>
  );
} 