import { jest } from "@jest/globals";
import type { Request, Response } from "express";
import { authorize } from "../src/middlewares/authorize.js";

function createRes() {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  return { status, json };
}

describe("authorize middleware", () => {
  it("returns 401 when request is unauthenticated", () => {
    const middleware = authorize("OWNER");
    const req = {} as Request;
    const { status, json } = createRes();
    const res = { status } as unknown as Response;
    const next = jest.fn();

    middleware(req, res, next);

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({ error: "Unauthorized" });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 403 when user role is not allowed", () => {
    const middleware = authorize("OWNER", "CFO");
    const req = { user: { sub: "u1", tenantId: "t1", role: "VIEWER", email: "v@example.com" } } as unknown as Request;
    const { status, json } = createRes();
    const res = { status } as unknown as Response;
    const next = jest.fn();

    middleware(req, res, next);

    expect(status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith({ error: "Forbidden" });
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next when role is allowed", () => {
    const middleware = authorize("OWNER", "CFO", "ANALYST");
    const req = { user: { sub: "u1", tenantId: "t1", role: "ANALYST", email: "a@example.com" } } as unknown as Request;
    const { status } = createRes();
    const res = { status } as unknown as Response;
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(status).not.toHaveBeenCalled();
  });
});
