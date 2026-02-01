// app/sign-in/page.tsx
import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Optional decorative background circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-blue-600/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 p-10 rounded-2xl bg-black/30 backdrop-blur-xl shadow-2xl border border-white/10">
        <SignIn 
          appearance={{
            elements: {
              formButtonPrimary:
                "bg-purple-600 hover:bg-purple-700 transition-all",
              card: "shadow-none bg-transparent",
            },
          }}
        />
      </div>
    </div>
  );
}
