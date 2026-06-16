import { useAuth } from "@/contexts/AuthContext";

const WelcomeBanner = () => {
  const { user } = useAuth();

  // Real logged-in user, not a hardcoded name. Educators are addressed as "Dr."
  // e.g. scarlett (first_name Scarlett, last_name Miller) -> "Dr. Scarlett Miller".
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim();
  const displayName = fullName || user?.username || "Doctor";

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-primary/90 to-primary/70 p-6 sm:p-8 shadow-card animate-fade-in">
      <div className="relative z-10">
        <h2 className="text-2xl sm:text-3xl font-bold text-primary-foreground mb-1.5">
          Welcome back, Dr. {displayName}
        </h2>
        <p className="text-sm text-primary-foreground/80 max-w-lg">
          You have students needing attention. Review their progress and assign practice where needed.
        </p>
      </div>
      {/* Decorative shapes */}
      <div className="absolute top-0 right-0 h-full w-1/3 opacity-10">
        <div className="absolute top-4 right-8 h-24 w-24 rounded-full bg-primary-foreground" />
        <div className="absolute bottom-2 right-32 h-16 w-16 rounded-full bg-primary-foreground" />
        <div className="absolute top-8 right-48 h-12 w-12 rounded-full bg-primary-foreground" />
      </div>
    </div>
  );
};

export default WelcomeBanner;
