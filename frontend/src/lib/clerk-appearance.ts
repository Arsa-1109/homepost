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

/**
 * Shared Clerk appearance tokens and styling for Homepost UserProfile settings component.
 * Ensures seamless background, font, and border harmony in both light and dark modes.
 */
export const clerkUserProfileAppearance = {
  variables: {
    colorPrimary: "rgb(var(--ml-accent))",
    colorBackground: "transparent",
    colorText: "rgb(var(--ml-text-primary))",
    colorTextSecondary: "rgb(var(--ml-text-secondary))",
    colorInputBackground: "rgb(var(--ml-bg-primary))",
    colorInputText: "rgb(var(--ml-text-primary))",
    borderRadius: "1rem",
    fontFamily: "var(--font-outfit), system-ui, sans-serif",
  },
  elements: {
    rootBox: "w-full mx-auto font-sans bg-transparent",
    cardBox: "w-full !bg-transparent !shadow-none !border-0 font-sans",
    card: "!bg-transparent !bg-none !border-none !shadow-none rounded-none p-0 font-sans",
    navbar: "!bg-transparent border-r border-border/40 py-4 px-3 font-sans space-y-1.5",
    navbarMobileMenuRow: "!bg-transparent border-b border-border/40 font-sans",
    navbarButton: "text-[rgb(var(--ml-text-secondary))] hover:text-[rgb(var(--ml-text-primary))] hover:!bg-[rgb(var(--ml-bg-primary))]/80 rounded-xl transition-all duration-200 font-semibold text-xs py-2.5 px-3.5 font-sans",
    navbarButtonActive: "!text-[rgb(var(--ml-accent-dark))] dark:!text-[rgb(var(--ml-accent))] !bg-[rgb(var(--ml-accent))]/10 font-black shadow-xs",
    navbarMobileMenuButton: "text-[rgb(var(--ml-text-primary))] font-sans",
    pageScrollable: "!bg-transparent p-4 sm:p-7 sm:py-6 font-sans",
    profileSection: "!border-b !border-border/30 py-5 first:pt-0 last:!border-b-0 font-sans",
    profileSectionTitle: "border-b-0 pb-1.5 font-sans",
    profileSectionTitleText: "text-base font-black text-[rgb(var(--ml-text-primary))] tracking-tight font-sans",
    profileSectionSubtitleText: "text-xs font-medium text-[rgb(var(--ml-text-secondary))] font-sans mt-0.5",
    profileSectionContent: "text-[rgb(var(--ml-text-primary))] font-sans",
    profilePage: "!bg-transparent font-sans",
    headerTitle: "text-xl font-black text-[rgb(var(--ml-text-primary))] tracking-tight font-sans",
    headerSubtitle: "text-xs font-medium text-[rgb(var(--ml-text-secondary))] font-sans",
    formButtonPrimary:
      "bg-[rgb(var(--ml-accent))] hover:bg-[rgb(var(--ml-accent-light))] text-black font-extrabold shadow-sm hover:shadow-[0_4px_12px_rgba(var(--ml-accent),0.25)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] py-2 px-4 rounded-xl transition-all font-sans text-xs cursor-pointer",
    formButtonReset:
      "bg-[rgb(var(--ml-bg-primary))] border border-border/60 text-[rgb(var(--ml-text-primary))] hover:bg-[rgb(var(--ml-bg-tertiary))] py-2 px-4 rounded-xl transition-all font-sans text-xs font-bold cursor-pointer",
    formFieldInput:
      "border border-border/60 bg-[rgb(var(--ml-bg-primary))] focus:bg-[rgb(var(--ml-bg-secondary))] focus:border-[rgb(var(--ml-accent))] focus:ring-2 focus:ring-[rgb(var(--ml-accent))]/20 rounded-xl transition-all duration-200 text-[rgb(var(--ml-text-primary))] font-sans text-xs",
    formFieldLabel: "text-xs font-bold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))] font-sans",
    badge: "!bg-emerald-500/10 !text-emerald-600 dark:!text-emerald-400 !border !border-emerald-500/20 font-black text-[10px] uppercase tracking-wider rounded-full px-2.5 py-0.5",
    profileSectionPrimaryButton: "text-xs font-black text-[rgb(var(--ml-accent-dark))] dark:text-[rgb(var(--ml-accent))] hover:underline transition-all cursor-pointer",
    button: "text-xs font-bold font-sans transition-all",
    menuButton: "text-[rgb(var(--ml-text-secondary))] hover:text-[rgb(var(--ml-text-primary))] hover:bg-[rgb(var(--ml-bg-primary))] rounded-lg transition-colors p-1.5",
    menuList: "bg-[rgb(var(--ml-bg-secondary))] border border-border/60 shadow-xl rounded-2xl p-1.5 font-sans backdrop-blur-xl",
    menuItem: "text-xs font-semibold text-[rgb(var(--ml-text-primary))] hover:bg-[rgb(var(--ml-bg-primary))] rounded-xl px-3 py-2 transition-colors font-sans cursor-pointer",
    accordionTriggerButton: "text-[rgb(var(--ml-text-primary))] hover:text-[rgb(var(--ml-accent))] font-sans transition-colors",
    accordionContent: "text-[rgb(var(--ml-text-primary))] font-sans",
    userPreviewMainIdentifier: "text-[rgb(var(--ml-text-primary))] font-extrabold text-sm font-sans",
    userPreviewSecondaryIdentifier: "text-[rgb(var(--ml-text-secondary))] text-xs font-medium font-sans",
    userPreviewAvatarContainer: "ring-2 ring-[rgb(var(--ml-accent))]/20 rounded-full",
    userButtonPopoverCard: "bg-[rgb(var(--ml-bg-secondary))] border border-border/60 shadow-2xl rounded-3xl font-sans backdrop-blur-2xl",
    breadcrumbsItem: "text-xs text-[rgb(var(--ml-text-secondary))] hover:text-[rgb(var(--ml-text-primary))] font-sans transition-colors",
    breadcrumbsItemDivider: "text-[rgb(var(--ml-text-secondary))]/40",
    breadcrumbsItemCurrent: "text-xs font-extrabold text-[rgb(var(--ml-text-primary))] font-sans",
  },
};
