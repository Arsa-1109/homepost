/**
 * Shared Clerk appearance tokens and styling for Homepost authentication.
 * Tailored to match Homepost's brand aesthetic and Outfit typography in both light and dark modes.
 */
export const clerkAuthAppearance = {
  variables: {
    colorPrimary: "rgb(var(--ml-accent))",
    colorBackground: "rgb(var(--ml-bg-secondary))",
    colorText: "rgb(var(--ml-text-primary))",
    colorTextSecondary: "rgb(var(--ml-text-secondary))",
    borderRadius: "1rem",
    fontFamily: "var(--font-outfit), system-ui, sans-serif",
  },
  elements: {
    rootBox: "w-full max-w-[440px] mx-auto flex justify-center items-center font-sans",
    cardBox:
      "w-full max-w-[440px] mx-auto !bg-[rgb(var(--ml-bg-secondary))] backdrop-blur-2xl border border-[rgb(var(--ml-border))]/70 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] rounded-2xl overflow-hidden transition-all duration-300 font-sans",
    card: "!bg-transparent !bg-none !border-none !shadow-none rounded-none p-6 sm:p-8 pb-4 font-sans",
    headerTitle: "text-2xl font-bold tracking-tight text-[rgb(var(--ml-text-primary))] font-sans",
    headerSubtitle: "text-sm text-[rgb(var(--ml-text-secondary))] mt-1 font-sans",
    formButtonPrimary:
      "w-full bg-[rgb(var(--ml-accent))] hover:bg-[rgb(var(--ml-accent-light))] text-black font-semibold shadow-lg shadow-[rgb(var(--ml-accent))]/25 hover:shadow-[rgb(var(--ml-accent))]/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all duration-200 py-2.5 rounded-xl border border-transparent font-sans",
    socialButtonsBlockButton:
      "w-full border border-[rgb(var(--ml-border))] bg-[rgb(var(--ml-bg-primary))]/80 hover:bg-[rgb(var(--ml-bg-tertiary))] text-[rgb(var(--ml-text-primary))] rounded-xl transition-all duration-200 hover:border-[rgb(var(--ml-border))] hover:shadow-sm font-sans",
    socialButtonsBlockButtonText: "font-medium text-[rgb(var(--ml-text-primary))] font-sans",
    formFieldInput:
      "w-full border border-[rgb(var(--ml-border))] bg-[rgb(var(--ml-bg-primary))]/80 focus:bg-[rgb(var(--ml-bg-secondary))] focus:border-[rgb(var(--ml-accent))] focus:ring-2 focus:ring-[rgb(var(--ml-accent))]/20 rounded-xl transition-all duration-200 text-[rgb(var(--ml-text-primary))] font-sans",
    formFieldLabel: "text-xs font-semibold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))] font-sans",
    footer: "!bg-transparent !bg-none border-t border-[rgb(var(--ml-border))]/40 p-4 sm:px-8 font-sans",
    footerAction: "!bg-transparent !bg-none justify-center p-0 font-sans",
    footerActionLink:
      "text-xs text-[rgb(var(--ml-accent))] hover:text-[rgb(var(--ml-accent-light))] font-semibold transition-colors font-sans",
    footerActionText: "text-xs text-[rgb(var(--ml-text-secondary))] font-sans",
    footerPages: "!bg-transparent !bg-none font-sans",
    footerPagesLink:
      "text-xs text-[rgb(var(--ml-text-secondary))] hover:text-[rgb(var(--ml-text-primary))] transition-colors font-sans",
    dividerLine: "bg-[rgb(var(--ml-border))]/60",
    dividerText: "text-xs text-[rgb(var(--ml-text-secondary))] font-medium font-sans",
    identityPreviewText: "text-[rgb(var(--ml-text-primary))] font-medium font-sans",
    identityPreviewEditButton:
      "text-[rgb(var(--ml-accent))] hover:text-[rgb(var(--ml-accent-light))] transition-colors font-sans",
    formFieldSuccessText: "text-xs text-[rgb(var(--ml-accent-dark))] dark:text-[rgb(var(--ml-accent-light))] font-sans",
    formFieldErrorText: "text-xs text-red-500 dark:text-red-400 font-medium font-sans",
  },
};
