import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
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
