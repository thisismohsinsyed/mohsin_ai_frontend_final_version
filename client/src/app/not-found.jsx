export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600">
      <div className="text-center space-y-4">
        <p className="text-sm uppercase tracking-wide text-slate-400">Nothing to see</p>
        <h1 className="text-3xl font-semibold">Page not found</h1>
        <p className="text-sm text-slate-500">The page you're looking for doesn't exist or has moved.</p>
      </div>
    </div>
  );
}
