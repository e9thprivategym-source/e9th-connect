import type { Request } from "express";
import type { CookieOptions } from "express";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isIpAddress(host: string) {
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}

function isSecureRequest(req: Request) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : (forwardedProto as string).split(",");

  return protoList.some((proto) => {
    const p = typeof proto === "string" ? proto.trim().toLowerCase() : "";
    return p === "https";
  });
}

export function getSessionCookieOptions(req: Request): CookieOptions {
  const hostname = req.hostname;
  const shouldSetDomain =
    hostname &&
    !LOCAL_HOSTS.has(hostname) &&
    !isIpAddress(hostname) &&
    hostname !== "127.0.0.1" &&
    hostname !== "::1";

  const domain =
    shouldSetDomain && !hostname.startsWith(".")
      ? `.${hostname}`
      : shouldSetDomain
        ? hostname
        : undefined;

  return {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: isSecureRequest(req),
    domain,
  };
}
