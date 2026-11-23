
import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "@/lib/auth";

const handler = toNextJsHandler(async (request: Request) => {
  const auth = await getAuth();
  return auth.handler(request);
});

export const GET = handler.GET;
export const POST = handler.POST;
export const PATCH = handler.PATCH;
export const PUT = handler.PUT;
export const DELETE = handler.DELETE;
