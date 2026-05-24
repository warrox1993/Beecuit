import { describe, it, expect } from "vitest";
import {
  CreateB2BQuoteSchema,
  AdminSetQuoteSchema,
  AdminRejectQuoteSchema,
} from "@/lib/validators/b2b";

describe("CreateB2BQuoteSchema", () => {
  const valid = {
    companyName: "Acme SA",
    contactName: "Jean Dupont",
    email: "jean@acme.be",
    phone: "+32 470 12 34 56",
    vatNumber: "BE0123456789",
    requestedProducts: "100 coffrets Découverte pour fin d'année",
    targetQuantity: 100,
    targetDeliveryDate: "2026-12-15",
    budgetRange: "500-2000€",
    message: "Pour nos clients premium",
    locale: "fr" as const,
    _hp: "",
  };

  it("accepts a complete valid payload", () => {
    expect(CreateB2BQuoteSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects missing required field companyName", () => {
    expect(CreateB2BQuoteSchema.safeParse({ ...valid, companyName: "" }).success).toBe(false);
  });

  it("rejects invalid email", () => {
    expect(CreateB2BQuoteSchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(false);
  });

  it("accepts missing optional fields", () => {
    expect(
      CreateB2BQuoteSchema.safeParse({
        companyName: "X",
        contactName: "Y",
        email: "y@x.fr",
        requestedProducts: "Quelques biscuits svp",
        locale: "fr",
        _hp: "",
      }).success,
    ).toBe(true);
  });

  it("rejects requestedProducts too short", () => {
    expect(CreateB2BQuoteSchema.safeParse({ ...valid, requestedProducts: "a" }).success).toBe(false);
  });
});

describe("AdminSetQuoteSchema", () => {
  it("requires positive amount and non-empty description", () => {
    expect(
      AdminSetQuoteSchema.safeParse({
        quoteId: "abc-123",
        quotedAmountCents: 50000,
        quoteDescription: "100 coffrets Découverte livrés au siège",
        shippingAddress: {
          line1: "Rue de la Loi 1",
          postalCode: "1000",
          city: "Bruxelles",
          country: "BE",
        },
      }).success,
    ).toBe(true);
  });

  it("rejects negative amount", () => {
    expect(
      AdminSetQuoteSchema.safeParse({
        quoteId: "abc",
        quotedAmountCents: -1,
        quoteDescription: "x",
        shippingAddress: { line1: "x", postalCode: "x", city: "x", country: "BE" },
      }).success,
    ).toBe(false);
  });
});

describe("AdminRejectQuoteSchema", () => {
  it("requires non-empty reason", () => {
    expect(
      AdminRejectQuoteSchema.safeParse({ quoteId: "abc", reason: "Hors zone" }).success,
    ).toBe(true);
    expect(
      AdminRejectQuoteSchema.safeParse({ quoteId: "abc", reason: "" }).success,
    ).toBe(false);
  });
});
