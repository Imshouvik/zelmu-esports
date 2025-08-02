import React from 'react';

export default function DataDeletionPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0f051d] via-[#18122b] to-[#232046] py-12 px-4">
      <div className="max-w-2xl w-full bg-white/10 rounded-2xl shadow-2xl p-8 border border-fuchsia-700/30">
        <h1 className="text-3xl font-extrabold text-fuchsia-400 mb-6 text-center drop-shadow">Data Deletion Instructions</h1>
        <p className="text-fuchsia-100 mb-6 text-center">Last updated: June 2024</p>
        <section className="mb-6">
          <h2 className="text-xl font-bold text-fuchsia-300 mb-2">How to Delete Your Account & Data</h2>
          <ul className="list-disc list-inside text-fuchsia-100 mb-4">
            <li>Log in to your Zelmu Esports account.</li>
            <li>Go to your dashboard and open <b>Settings</b> &gt; <b>Edit Profile</b>.</li>
            <li>Click the <b>Delete Account</b> button at the bottom of the page.</li>
            <li>For security, you will be asked to confirm your Zelmu Name before deletion.</li>
            <li>Once confirmed, your account and all associated data will be permanently deleted within 7 days.</li>
          </ul>
          <p className="text-fuchsia-100">If you have trouble deleting your account or need urgent removal, please contact <a href="mailto:support@zelmu.com" className="text-fuchsia-400 underline">support@zelmu.com</a>.</p>
        </section>
        <section className="mb-2">
          <h2 className="text-xl font-bold text-fuchsia-300 mb-2">What Data Will Be Deleted?</h2>
          <ul className="list-disc list-inside text-fuchsia-100">
            <li>Your profile and personal information</li>
            <li>Your posts, comments, and community activity</li>
            <li>Your club/team memberships and tournament registrations</li>
            <li>Your uploaded files and profile picture</li>
            <li>Any other data associated with your account</li>
          </ul>
        </section>
      </div>
    </div>
  );
} 