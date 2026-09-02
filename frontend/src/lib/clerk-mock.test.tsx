import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { UserButton } from "./clerk-mock";

function setMockCookies() {
  const expiry = "; path=/; max-age=600";
  document.cookie = `mock_user_id=user_demo_landlord_001${expiry}`;
  document.cookie = `mock_user_email=landlord@homepost.demo${expiry}`;
  document.cookie = `mock_user_name=Marcus Vance (Demo Landlord)${expiry}`;
  document.cookie = `mock_user_role=landlord${expiry}`;
}

function cookieValue(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

describe("mock UserButton", () => {
  let originalLocation: Location;

  beforeEach(() => {
    originalLocation = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: { href: "http://localhost/dashboard" },
    });
    setMockCookies();
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: originalLocation,
    });
    for (const name of ["mock_user_id", "mock_user_email", "mock_user_name", "mock_user_role"]) {
      document.cookie = `${name}=; path=/; max-age=0`;
    }
  });

  it("opens a menu instead of signing out when clicked", async () => {
    const user = userEvent.setup();
    render(<UserButton />);

    await user.click(screen.getByTestId("mock-user-button"));

    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(window.location.href).not.toBe("/");
    expect(cookieValue("mock_user_id")).toBe("user_demo_landlord_001");
  });

  it("shows the current persona name and email in the menu header", async () => {
    const user = userEvent.setup();
    render(<UserButton />);

    await user.click(screen.getByTestId("mock-user-button"));

    expect(screen.getByText("Marcus Vance (Demo Landlord)")).toBeInTheDocument();
    expect(screen.getByText("landlord@homepost.demo")).toBeInTheDocument();
  });

  it("exposes an Account item linking to /user", async () => {
    const user = userEvent.setup();
    render(<UserButton />);

    await user.click(screen.getByTestId("mock-user-button"));

    const accountItem = screen.getByRole("menuitem", { name: /account/i });
    expect(accountItem).toHaveAttribute("href", "/user");
  });

  it("signs out only when Sign out is explicitly clicked", async () => {
    const user = userEvent.setup();
    render(<UserButton />);

    await user.click(screen.getByTestId("mock-user-button"));
    expect(window.location.href).not.toBe("/");

    await user.click(screen.getByRole("menuitem", { name: /sign out/i }));

    expect(cookieValue("mock_user_id")).toBeNull();
    expect(window.location.href).toBe("/");
  });

  it("closes the menu on Escape without signing out", async () => {
    const user = userEvent.setup();
    render(<UserButton />);

    await user.click(screen.getByTestId("mock-user-button"));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(cookieValue("mock_user_id")).toBe("user_demo_landlord_001");
    expect(window.location.href).not.toBe("/");
  });

  it("closes the menu on outside click without signing out", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <div data-testid="outside">outside</div>
        <UserButton />
      </div>
    );

    await user.click(screen.getByTestId("mock-user-button"));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await user.click(screen.getByTestId("outside"));

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(cookieValue("mock_user_id")).toBe("user_demo_landlord_001");
  });

  it("toggles aria-expanded and declares menu semantics on the trigger", async () => {
    const user = userEvent.setup();
    render(<UserButton />);
    const trigger = screen.getByTestId("mock-user-button");

    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });
});

import { SignIn, SignUp } from "./clerk-mock";

describe("mock SignIn and SignUp with Custom Account Maker", () => {
  let originalLocation: Location;

  beforeEach(() => {
    originalLocation = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: {
        href: "http://localhost/sign-in",
        search: "",
        protocol: "http:",
        hostname: "localhost",
      },
    });
    vi.spyOn(global, "fetch").mockImplementation(() =>
      Promise.resolve({
        ok: true,
        text: async () => JSON.stringify({ status: "success" }),
      } as Response)
    );
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: originalLocation,
    });
    for (const name of [
      "mock_user_id",
      "mock_user_email",
      "mock_user_name",
      "mock_user_role",
      "mock_user_onboarding_complete",
    ]) {
      document.cookie = `${name}=; path=/; max-age=0`;
    }
  });

  it("renders SignIn with Demo Personas by default and switches to Custom Account Maker", async () => {
    const user = userEvent.setup();
    render(<SignIn />);

    // Demo personas are rendered
    expect(screen.getByText("Marcus Vance (Owner)")).toBeInTheDocument();
    expect(screen.getByText("Sarah Jenkins (Resident)")).toBeInTheDocument();

    // Click Custom Account tab
    const customTab = screen.getByTestId("mock-tab-custom");
    await user.click(customTab);

    // Now Custom Account Maker is rendered
    expect(screen.getByTestId("own-account-form")).toBeInTheDocument();
    expect(screen.getByTestId("own-account-name")).toBeInTheDocument();
    expect(screen.getByTestId("own-account-email")).toBeInTheDocument();
  });

  it("renders SignUp with Custom Account Maker by default", async () => {
    render(<SignUp />);

    expect(screen.getByTestId("own-account-form")).toBeInTheDocument();
    expect(screen.getByText(/1-Click.*Launchers/i)).toBeInTheDocument();
  });

  it("creates custom account via form and sets mock session", async () => {
    const user = userEvent.setup();
    render(<SignUp />);

    const nameInput = screen.getByTestId("own-account-name");
    const emailInput = screen.getByTestId("own-account-email");
    const tenantRoleBtn = screen.getByTestId("own-account-role-tenant");
    const submitBtn = screen.getByTestId("own-account-submit");

    await user.type(nameInput, "Custom Resident");
    await user.type(emailInput, "resident@test.local");
    await user.click(tenantRoleBtn);

    await user.click(submitBtn);

    await waitFor(() => {
      expect(cookieValue("mock_user_name")).toBe("Custom Resident");
      expect(cookieValue("mock_user_email")).toBe("resident@test.local");
      expect(cookieValue("mock_user_role")).toBe("tenant");
      expect(cookieValue("mock_user_id")).toMatch(/^user_own_/);
      expect(window.location.href).toBe("/tenant/dashboard");
    });
  });

  it("allows instant 1-click quick landlord account generation", async () => {
    const user = userEvent.setup();
    render(<SignUp />);

    const quickLandlordBtn = screen.getByRole("button", { name: /quick landlord/i });
    await user.click(quickLandlordBtn);

    await waitFor(() => {
      expect(cookieValue("mock_user_role")).toBe("landlord");
      expect(cookieValue("mock_user_id")).toMatch(/^user_own_/);
      expect(window.location.href).toBe("/landlord/dashboard");
    });
  });

  it("sanitizes open redirect attempts to malicious external sites", async () => {
    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: {
        href: "http://localhost/sign-in?redirect_url=https://evil.com",
        search: "?redirect_url=https://evil.com",
        protocol: "http:",
        hostname: "localhost",
        origin: "http://localhost",
      },
    });

    const user = userEvent.setup();
    render(<SignIn />);

    const personaBtn = screen.getByRole("button", { name: /continue as landlord demo/i });
    await user.click(personaBtn);

    await waitFor(() => {
      expect(window.location.href).toBe("/landlord/dashboard");
    });
  });

  it("allows safe relative redirect paths", async () => {
    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: {
        href: "http://localhost/sign-in?redirect_url=/landlord/properties",
        search: "?redirect_url=/landlord/properties",
        protocol: "http:",
        hostname: "localhost",
        origin: "http://localhost",
      },
    });

    const user = userEvent.setup();
    render(<SignIn />);

    const personaBtn = screen.getByRole("button", { name: /continue as landlord demo/i });
    await user.click(personaBtn);

    await waitFor(() => {
      expect(window.location.href).toBe("/landlord/properties");
    });
  });
});

import { getSafeRedirectUrl } from "./clerk-mock";

describe("getSafeRedirectUrl", () => {
  const fallback = "/landlord/dashboard";

  it("returns fallback for null, undefined, empty, or whitespace target", () => {
    expect(getSafeRedirectUrl(null, fallback)).toBe(fallback);
    expect(getSafeRedirectUrl(undefined, fallback)).toBe(fallback);
    expect(getSafeRedirectUrl("", fallback)).toBe(fallback);
    expect(getSafeRedirectUrl("   ", fallback)).toBe(fallback);
  });

  it("allows valid relative paths", () => {
    expect(getSafeRedirectUrl("/landlord/properties", fallback)).toBe("/landlord/properties");
    expect(getSafeRedirectUrl("/tenant/requests?id=123", fallback)).toBe("/tenant/requests?id=123");
    expect(getSafeRedirectUrl("/join/token_abc#section", fallback)).toBe("/join/token_abc#section");
  });

  it("rejects protocol-relative and backslash injection bypasses", () => {
    expect(getSafeRedirectUrl("//evil.com", fallback)).toBe(fallback);
    expect(getSafeRedirectUrl("/\\evil.com", fallback)).toBe(fallback);
    expect(getSafeRedirectUrl("\\evil.com", fallback)).toBe(fallback);
    expect(getSafeRedirectUrl("/\\/evil.com", fallback)).toBe(fallback);
    expect(getSafeRedirectUrl("/path\\with\\backslash", fallback)).toBe(fallback);
  });

  it("rejects cross-origin absolute URLs", () => {
    expect(getSafeRedirectUrl("https://evil.com", fallback)).toBe(fallback);
    expect(getSafeRedirectUrl("http://attacker.com/dashboard", fallback)).toBe(fallback);
    expect(getSafeRedirectUrl("https://homepost.fake.com", fallback)).toBe(fallback);
  });

  it("rejects pseudo-protocols like javascript: or data:", () => {
    expect(getSafeRedirectUrl("javascript:alert(1)", fallback)).toBe(fallback);
    expect(getSafeRedirectUrl("data:text/html,payload", fallback)).toBe(fallback);
    expect(getSafeRedirectUrl("vbscript:msgbox", fallback)).toBe(fallback);
  });
});
