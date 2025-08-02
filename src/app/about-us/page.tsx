export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f051d] via-[#18122b] to-[#232046] py-12 px-4 flex justify-center items-start">
      <div className="max-w-2xl w-full bg-white/10 rounded-2xl shadow-2xl p-8 border border-fuchsia-700/30">
        <h1 className="text-3xl font-extrabold text-fuchsia-400 mb-6 text-center drop-shadow">About Us</h1>
        <section className="mb-6">
          <h2 className="text-xl font-bold text-fuchsia-300 mb-2">Our Mission</h2>
          <p className="text-fuchsia-100">Zelmu Esports is dedicated to building a vibrant and inclusive esports community. Our mission is to empower gamers, foster competition, and create unforgettable experiences for players and fans alike.</p>
        </section>
        <section className="mb-6">
          <h2 className="text-xl font-bold text-fuchsia-300 mb-2">Who We Are</h2>
          <p className="text-fuchsia-100">Founded by passionate gamers, Zelmu brings together players, organizers, and fans from around the world. We believe in fair play, innovation, and the power of gaming to connect people.</p>
        </section>
        <section className="mb-6">
          <h2 className="text-xl font-bold text-fuchsia-300 mb-2">What We Offer</h2>
          <ul className="list-disc list-inside text-fuchsia-100">
            <li>Online and offline tournaments</li>
            <li>Community events and forums</li>
            <li>Leaderboards and rewards</li>
            <li>Support for players and organizers</li>
          </ul>
        </section>
        <section className="mb-2">
          <h2 className="text-xl font-bold text-fuchsia-300 mb-2">Join Us</h2>
          <p className="text-fuchsia-100">Whether you are a player, organizer, or fan, we invite you to join our growing community. Together, let's shape the future of esports!</p>
        </section>
      </div>
    </div>
  );
} 