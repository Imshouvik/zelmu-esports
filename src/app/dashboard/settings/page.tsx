import PageGuard from '@/components/PageGuard';
import Link from 'next/link';

export default function SettingsPage() {
  return (
    <PageGuard pageKey="settings">
      <div className="p-8">
        <h1 className="text-2xl font-bold text-white mb-4">Settings</h1>
        <div className="mb-6">
          <Link href="/dashboard/settings/profile" className="inline-block bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-semibold py-2 px-4 rounded-lg shadow transition-all duration-200">
            Edit Profile
          </Link>
        </div>
        <p className="text-fuchsia-200">Settings page content will be implemented here.</p>
      </div>
    </PageGuard>
  );
} 