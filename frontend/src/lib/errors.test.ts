import { describe, expect, it } from "vitest";
import { errorMessage, errorStatus, formatInviteError } from "./errors";

describe("errorMessage", () => {
  it("extracts message from an Error instance", () => {
    const err = new Error("Something went wrong");
    expect(errorMessage(err)).toBe("Something went wrong");
  });

  it("extracts message from a custom Error subclass", () => {
    class CustomError extends Error {}
    const err = new CustomError("Custom error message");
    expect(errorMessage(err)).toBe("Custom error message");
  });

  it("extracts message from a plain object with message property", () => {
    const obj = { message: "Object error message" };
    expect(errorMessage(obj)).toBe("Object error message");
  });

  it("returns empty string when message property is not a string", () => {
    expect(errorMessage({ message: 123 })).toBe("");
    expect(errorMessage({ message: null })).toBe("");
    expect(errorMessage({ message: undefined })).toBe("");
    expect(errorMessage({ message: {} })).toBe("");
  });

  it("returns empty string for objects without message property", () => {
    expect(errorMessage({})).toBe("");
    expect(errorMessage({ status: 500 })).toBe("");
    expect(errorMessage({ error: "failed" })).toBe("");
  });

  it("returns empty string for primitives, null, and undefined", () => {
    expect(errorMessage(null)).toBe("");
    expect(errorMessage(undefined)).toBe("");
    expect(errorMessage("a string error")).toBe("");
    expect(errorMessage(404)).toBe("");
    expect(errorMessage(true)).toBe("");
  });
});

describe("errorStatus", () => {
  it("extracts direct status number from an error object", () => {
    expect(errorStatus({ status: 404 })).toBe(404);
    expect(errorStatus({ status: 500 })).toBe(500);
    expect(errorStatus({ status: 200 })).toBe(200);
  });

  it("extracts nested response.status number from an error object", () => {
    expect(errorStatus({ response: { status: 401 } })).toBe(401);
    expect(errorStatus({ response: { status: 403 } })).toBe(403);
  });

  it("prioritizes direct status over nested response.status if both are present", () => {
    expect(errorStatus({ status: 400, response: { status: 500 } })).toBe(400);
  });

  it("falls back to nested response.status when direct status is not a number", () => {
    expect(errorStatus({ status: "invalid", response: { status: 422 } })).toBe(422);
    expect(errorStatus({ status: null, response: { status: 409 } })).toBe(409);
  });

  it("returns null when status is not a number", () => {
    expect(errorStatus({ status: "404" })).toBeNull();
    expect(errorStatus({ response: { status: "500" } })).toBeNull();
    expect(errorStatus({ status: null })).toBeNull();
  });

  it("returns null for objects without status or response.status", () => {
    expect(errorStatus({})).toBeNull();
    expect(errorStatus(new Error("Generic"))).toBeNull();
    expect(errorStatus({ message: "Not found" })).toBeNull();
  });

  it("returns null for null, undefined, and primitives", () => {
    expect(errorStatus(null)).toBeNull();
    expect(errorStatus(undefined)).toBeNull();
    expect(errorStatus("error string")).toBeNull();
    expect(errorStatus(500)).toBeNull();
    expect(errorStatus(false)).toBeNull();
  });
});

describe("formatInviteError", () => {
  it("formats unit_already_occupied", () => {
    expect(formatInviteError("unit_already_occupied")).toBe(
      "This unit is already occupied by another resident. Please contact your property owner if you believe this is an error."
    );
    expect(formatInviteError("Error: UNIT_ALREADY_OCCUPIED in database")).toBe(
      "This unit is already occupied by another resident. Please contact your property owner if you believe this is an error."
    );
  });

  it("formats invite_not_found", () => {
    expect(formatInviteError("invite_not_found")).toBe(
      "This invite link is invalid or doesn't exist."
    );
    expect(formatInviteError("INVITE_NOT_FOUND")).toBe(
      "This invite link is invalid or doesn't exist."
    );
  });

  it("formats invite_expired", () => {
    expect(formatInviteError("invite_expired")).toBe(
      "This invite link has expired. Please ask your landlord for a new one."
    );
  });

  it("formats invite_already_used", () => {
    expect(formatInviteError("invite_already_used")).toBe(
      "This invite link has already been used."
    );
  });

  it("formats invite_inactive", () => {
    expect(formatInviteError("invite_inactive")).toBe(
      "This invite link is no longer active."
    );
  });

  it("formats rate_limit_exceeded and too_many_requests", () => {
    expect(formatInviteError("rate_limit_exceeded")).toBe(
      "Too many requests. Please wait a moment and try again."
    );
    expect(formatInviteError("TOO_MANY_REQUESTS")).toBe(
      "Too many requests. Please wait a moment and try again."
    );
  });

  it("formats unauthorized and forbidden", () => {
    expect(formatInviteError("unauthorized")).toBe(
      "You do not have permission to join this unit."
    );
    expect(formatInviteError("403 Forbidden")).toBe(
      "You do not have permission to join this unit."
    );
  });

  it("returns the original code or message when no specific rule matches", () => {
    expect(formatInviteError("Server database connection timeout")).toBe(
      "Server database connection timeout"
    );
    expect(formatInviteError("Unexpected error 500")).toBe(
      "Unexpected error 500"
    );
  });

  it("returns generic fallback for empty input", () => {
    expect(formatInviteError("")).toBe(
      "Failed to process invitation. Please try again."
    );
  });
});
