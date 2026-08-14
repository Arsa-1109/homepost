/**
 * Shared Clerk appearance tokens and styling for Homepost authentication.
 * Tailored to match Homepost's brand aesthetic in both light and dark modes.
 */
export const clerkAuthAppearance = {
  variables: {
    colorPrimary: "rgb(var(--ml-accent))",
    colorBackground: "rgb(var(--ml-bg-secondary))",
    colorText: "rgb(var(--ml-text-primary))",
    colorTextSecondary: "rgb(var(--ml-text-secondary))",
    borderRadius: "1rem",
  },
  elements: {
    rootBox: "w-full max-w-[440px] mx-auto",
    card: "bg-[rgb(var(--ml-bg-secondary))]/80 dark:bg-[rgb(var(--ml-bg-secondary))]/75 backdrop-blur-xl border border-[rgb(var(--ml-border))]/60 shadow-[0_20px_50px_rgba(0,0,0,0.12)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.6)] rounded-2xl p-6 sm:p-8 transition-all duration-300",
    headerTitle: "text-2xl font-bold tracking-tight text-[rgb(var(--ml-text-primary))]",
    headerSubtitle: "text-sm text-[rgb(var(--ml-text-secondary))] mt-1",
    formButtonPrimary:
      "bg-[rgb(var(--ml-accent))] hover:bg-[rgb(var(--ml-accent-light))] text-black font-semibold shadow-lg shadow-[rgb(var(--ml-accent))]/25 hover:shadow-[rgb(var(--ml-accent))]/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all duration-200 py-2.5 rounded-xl border border-transparent",
    socialButtonsBlockButton:
      "border border-[rgb(var(--ml-border))] bg-[rgb(var(--ml-bg-primary))]/60 hover:bg-[rgb(var(--ml-bg-tertiary))] text-[rgb(var(--ml-text-primary))] rounded-xl transition-all duration-200 hover:border-[rgb(var(--ml-border))] hover:shadow-sm",
    socialButtonsBlockButtonText: "font-medium text-[rgb(var(--ml-text-primary))]",
    formFieldInput:
      "border border-[rgb(var(--ml-border))] bg-[rgb(var(--ml-bg-primary))]/60 focus:bg-[rgb(var(--ml-bg-secondary))] focus:border-[rgb(var(--ml-accent))] focus:ring-2 focus:ring-[rgb(var(--ml-accent))]/20 rounded-xl transition-all duration-200 text-[rgb(var(--ml-text-primary))]",
    formFieldLabel: "text-xs font-semibold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]",
    footerActionLink:
      "text-[rgb(var(--ml-accent))] hover:text-[rgb(var(--ml-accent-light))] font-medium transition-colors",
    footerActionText: "text-[rgb(var(--ml-text-secondary))]",
    dividerLine: "bg-[rgb(var(--ml-border))]/60",
    dividerText: "text-xs text-[rgb(var(--ml-text-secondary))] font-medium",
    identityPreviewText: "text-[rgb(var(--ml-text-primary))] font-medium",
    identityPreviewEditButton:
      "text-[rgb(var(--ml-accent))] hover:text-[rgb(var(--ml-accent-light))] transition-colors",
    formFieldSuccessText: "text-xs text-[rgb(var(--ml-accent-dark))] dark:text-[rgb(var(--ml-accent-light))]",
    formFieldErrorText: "text-xs text-red-500 dark:text-red-400 font-medium",
  },
};
