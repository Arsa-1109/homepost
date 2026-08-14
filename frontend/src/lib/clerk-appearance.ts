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
    borderRadius: "0.875rem",
    fontFamily: "var(--font-outfit), system-ui, sans-serif",
  },
  elements: {
    rootBox: "w-full mx-auto font-sans bg-transparent",
    cardBox: "w-full !bg-transparent !shadow-none !border-0 font-sans",
    card: "!bg-transparent !bg-none !border-none !shadow-none rounded-none p-0 font-sans",
    navbar: "!bg-transparent border-r border-[rgb(var(--ml-border))]/60 py-4 font-sans",
    navbarMobileMenuRow: "!bg-transparent border-b border-[rgb(var(--ml-border))]/60 font-sans",
    navbarButton: "text-[rgb(var(--ml-text-secondary))] hover:text-[rgb(var(--ml-text-primary))] hover:!bg-[rgb(var(--ml-bg-primary))]/80 rounded-xl transition-all duration-200 font-medium text-xs font-sans",
    navbarButtonActive: "!text-[rgb(var(--ml-accent))] !bg-[rgb(var(--ml-accent))]/10 font-bold",
    navbarMobileMenuButton: "text-[rgb(var(--ml-text-primary))] font-sans",
    pageScrollable: "!bg-transparent p-4 sm:p-8 font-sans",
    profileSection: "border-b border-[rgb(var(--ml-border))]/50 py-6 first:pt-0 last:border-b-0 font-sans",
    profileSectionTitle: "border-b-0 pb-2 font-sans",
    profileSectionTitleText: "text-base font-bold text-[rgb(var(--ml-text-primary))] tracking-tight font-sans",
    profileSectionSubtitleText: "text-xs text-[rgb(var(--ml-text-secondary))] font-sans",
    profileSectionContent: "text-[rgb(var(--ml-text-primary))] font-sans",
    profilePage: "!bg-transparent font-sans",
    headerTitle: "text-xl font-extrabold text-[rgb(var(--ml-text-primary))] font-sans",
    headerSubtitle: "text-xs text-[rgb(var(--ml-text-secondary))] font-sans",
    formButtonPrimary:
      "bg-[rgb(var(--ml-accent))] hover:bg-[rgb(var(--ml-accent-light))] text-black font-semibold shadow-md shadow-[rgb(var(--ml-accent))]/20 hover:shadow-[rgb(var(--ml-accent))]/30 py-2 px-4 rounded-xl transition-all font-sans text-xs",
    formButtonReset:
      "bg-[rgb(var(--ml-bg-primary))] border border-[rgb(var(--ml-border))] text-[rgb(var(--ml-text-primary))] hover:bg-[rgb(var(--ml-bg-tertiary))] py-2 px-4 rounded-xl transition-all font-sans text-xs font-semibold",
    formFieldInput:
      "border border-[rgb(var(--ml-border))] bg-[rgb(var(--ml-bg-primary))] focus:bg-[rgb(var(--ml-bg-secondary))] focus:border-[rgb(var(--ml-accent))] focus:ring-2 focus:ring-[rgb(var(--ml-accent))]/20 rounded-xl transition-all duration-200 text-[rgb(var(--ml-text-primary))] font-sans text-xs",
    formFieldLabel: "text-xs font-semibold text-[rgb(var(--ml-text-secondary))] font-sans",
    badge: "bg-[rgb(var(--ml-accent))]/10 text-[rgb(var(--ml-accent-dark))] dark:text-[rgb(var(--ml-accent-light))] border border-[rgb(var(--ml-accent))]/20 font-bold text-[10px] rounded-full px-2.5 py-0.5",
    menuButton: "text-[rgb(var(--ml-text-secondary))] hover:text-[rgb(var(--ml-text-primary))] hover:bg-[rgb(var(--ml-bg-primary))] rounded-lg transition-colors",
    menuList: "bg-[rgb(var(--ml-bg-secondary))] border border-[rgb(var(--ml-border))] shadow-xl rounded-xl p-1 font-sans",
    menuItem: "text-xs text-[rgb(var(--ml-text-primary))] hover:bg-[rgb(var(--ml-bg-primary))] rounded-lg p-2 transition-colors font-sans",
    accordionTriggerButton: "text-[rgb(var(--ml-text-primary))] hover:text-[rgb(var(--ml-accent))] font-sans",
    accordionContent: "text-[rgb(var(--ml-text-primary))] font-sans",
    userPreviewMainIdentifier: "text-[rgb(var(--ml-text-primary))] font-bold text-sm font-sans",
    userPreviewSecondaryIdentifier: "text-[rgb(var(--ml-text-secondary))] text-xs font-sans",
    userButtonPopoverCard: "bg-[rgb(var(--ml-bg-secondary))] border border-[rgb(var(--ml-border))] shadow-2xl rounded-2xl font-sans",
    breadcrumbsItem: "text-xs text-[rgb(var(--ml-text-secondary))] hover:text-[rgb(var(--ml-text-primary))] font-sans",
    breadcrumbsItemDivider: "text-[rgb(var(--ml-text-secondary))]/50",
    breadcrumbsItemCurrent: "text-xs font-bold text-[rgb(var(--ml-text-primary))] font-sans",
  },
};
