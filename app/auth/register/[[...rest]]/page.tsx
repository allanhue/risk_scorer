import { SignUp } from "@clerk/nextjs";

export default function RegisterPage() {
  return (
    <div className="bg-[#f7faf8] px-4 py-12 sm:px-6">
      <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-sm font-medium text-emerald-700">Create account</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            Start using the scoring workspace
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Create an account to protect dashboard access and connect scoring
            activity to your user profile.
          </p>
        </div>

        <div className="flex justify-center rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <SignUp
            appearance={{
              elements: {
                cardBox: "shadow-none",
                card: "shadow-none border-0",
                headerTitle: "text-slate-950",
                headerSubtitle: "text-slate-600",
                formButtonPrimary:
                  "bg-emerald-700 hover:bg-emerald-800 text-sm normal-case",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
