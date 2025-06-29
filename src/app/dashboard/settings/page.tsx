import PageGuard from '@/components/PageGuard';

export default function SettingsPage() {
  return (
    <PageGuard pageKey="settings">
      <div className="p-8">
        <h1 className="text-2xl font-bold text-white mb-4">Settings</h1>
        <p className="text-fuchsia-200">Settings page content will be implemented here.</p>
      </div>
    </PageGuard>
  );
} 