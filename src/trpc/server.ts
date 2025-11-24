import "server-only";

import {
  createTRPCClient,
  httpBatchLink,
  loggerLink,
  TRPCClientError,
} from "@trpc/client";
import { headers } from "next/headers";

import { type AppRouter } from "~/server/api/root";
import { transformer, getUrl } from "./shared";

export const api = createTRPCClient<AppRouter>({
  links: [
    loggerLink({
      enabled: (opts) =>
        process.env.NODE_ENV === "development" ||
        (opts.direction === "down" && opts.result instanceof Error),
    }),
    httpBatchLink({
      transformer,
      url: getUrl(),
      headers: async () => {
        const heads = new Headers(await headers());
        heads.set("x-trpc-source", "rsc");
        return Object.fromEntries(heads);
      },
    }),
  ],
});
