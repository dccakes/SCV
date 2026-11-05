'use client'

import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink, loggerLink } from '@trpc/client'
import { createTRPCReact } from '@trpc/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

import type { AppRouter } from '~/server/api/root'
import { getUrl, transformer } from '~/trpc/shared'

export const api = createTRPCReact<AppRouter>()

function isForbiddenError(error: unknown): boolean {
  const code = (error as { data?: { code?: string } } | null)?.data?.code
  return code === 'FORBIDDEN'
}

// Safety net: write controls are hidden for view-only users, but if any write is still
// rejected for permissions, explain why instead of failing silently.
export const VIEW_ONLY_ERROR_MESSAGE =
  "You don't have permission to make this change. Ask a wedding owner or admin."

export function TRPCReactProvider(props: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        mutationCache: new MutationCache({
          onError: (error) => {
            if (isForbiddenError(error)) {
              toast.error(VIEW_ONLY_ERROR_MESSAGE, { id: 'forbidden-mutation' })
            }
          },
        }),
      })
  )

  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        loggerLink({
          enabled: (op) =>
            process.env.NODE_ENV === 'development' ||
            (op.direction === 'down' && op.result instanceof Error),
        }),
        httpBatchLink({
          url: getUrl(),
          transformer,
        }),
      ],
    })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <api.Provider client={trpcClient} queryClient={queryClient}>
        {props.children}
      </api.Provider>
    </QueryClientProvider>
  )
}
