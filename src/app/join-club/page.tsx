'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function JoinClubPage() {
  const [inviteCode, setInviteCode] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteCode.trim()) {
      router.push(`/join-club/${inviteCode.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Join a Club
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Enter the invite code to join a club
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="inviteCode" className="sr-only">
              Invite Code
            </label>
            <input
              id="inviteCode"
              name="inviteCode"
              type="text"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-gray-800 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Enter invite code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
            />
          </div>
          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Join Club
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
