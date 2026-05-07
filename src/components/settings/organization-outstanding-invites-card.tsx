'use client'

import { AlertCircle, Loader2, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  getOutstandingInvitations,
  type OrganizationInvitation,
} from '~/components/settings/organization-outstanding-invites'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { authClient } from '~/lib/auth-client'
import { getOrganizationRoleLabel } from '~/lib/organization-roles'

type AuthFetchError = {
  message?: string | null
}

type AuthFetchResult<T> = {
  data: T | null
  error?: AuthFetchError | null
}

type FullOrganizationResponse = {
  id: string
}

type HasPermissionResponse = {
  success: boolean
}

type OutstandingInvitesState = {
  canCancel: boolean
  canCreate: boolean
  error: string | null
  invitations: OrganizationInvitation[]
  isLoading: boolean
  organizationId: string | null
}

const initialState: OutstandingInvitesState = {
  canCancel: false,
  canCreate: false,
  error: null,
  invitations: [],
  isLoading: true,
  organizationId: null,
}

async function authGet<T>(path: string, fallbackMessage: string): Promise<T> {
  const result = (await authClient.$fetch(path)) as AuthFetchResult<T>

  if (result.error || !result.data) {
    throw new Error(fallbackMessage)
  }

  return result.data
}

async function authPost<T>(
  path: string,
  body: Record<string, unknown>,
  fallbackMessage: string
): Promise<T> {
  const result = (await authClient.$fetch(path, {
    body,
    method: 'POST',
  })) as AuthFetchResult<T>

  if (result.error || !result.data) {
    throw new Error(fallbackMessage)
  }

  return result.data
}

async function fetchOutstandingInvitesState(): Promise<
  Omit<OutstandingInvitesState, 'error' | 'isLoading'>
> {
  const organization = await authGet<FullOrganizationResponse>(
    '/organization/get-full-organization',
    'Unable to load organization.'
  )

  if (!organization.id) {
    throw new Error('No active organization found.')
  }

  const [createPermission, cancelPermission] = await Promise.all([
    authPost<HasPermissionResponse>(
      '/organization/has-permission',
      {
        organizationId: organization.id,
        permissions: {
          invitation: ['create'],
        },
      },
      'Unable to load invitation permissions.'
    ),
    authPost<HasPermissionResponse>(
      '/organization/has-permission',
      {
        organizationId: organization.id,
        permissions: {
          invitation: ['cancel'],
        },
      },
      'Unable to load invitation permissions.'
    ),
  ])

  const canCreate = !!createPermission.success
  const invitations = canCreate
    ? await authGet<OrganizationInvitation[]>(
        '/organization/list-invitations',
        'Unable to load outstanding invitations.'
      )
    : []

  return {
    canCancel: !!cancelPermission.success,
    canCreate,
    invitations,
    organizationId: organization.id,
  }
}

function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatRoleLabel(role: string): string {
  return getOrganizationRoleLabel(role) ?? role
}

export function OrganizationOutstandingInvitesCard() {
  const [state, setState] = useState<OutstandingInvitesState>(initialState)
  const [resendingId, setResendingId] = useState<string | null>(null)
  const [cancelingId, setCancelingId] = useState<string | null>(null)

  const loadState = useCallback(() => {
    let isActive = true

    setState((current) => ({
      ...current,
      error: null,
      isLoading: true,
    }))

    void fetchOutstandingInvitesState()
      .then((next) => {
        if (!isActive) return
        setState({
          ...next,
          error: null,
          isLoading: false,
        })
      })
      .catch((error: unknown) => {
        if (!isActive) return
        setState({
          canCancel: false,
          canCreate: false,
          error: error instanceof Error ? error.message : 'Unable to load outstanding invitations.',
          invitations: [],
          isLoading: false,
          organizationId: null,
        })
      })

    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => loadState(), [loadState])

  const outstandingInvitations = useMemo(
    () => getOutstandingInvitations(state.invitations),
    [state.invitations]
  )

  const handleResend = useCallback(
    async (invitation: OrganizationInvitation) => {
      if (!state.organizationId || !state.canCreate) return

      setResendingId(invitation.id)

      try {
        await authPost(
          '/organization/invite-member',
          {
            email: invitation.email,
            organizationId: state.organizationId,
            resend: true,
            role: invitation.role,
          },
          'Unable to resend invitation.'
        )
        toast.success('Invitation resent.')
        loadState()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Unable to resend invitation.')
      } finally {
        setResendingId(null)
      }
    },
    [loadState, state.canCreate, state.organizationId]
  )

  const handleCancel = useCallback(
    async (invitationId: string) => {
      if (!state.canCancel) return

      setCancelingId(invitationId)

      try {
        await authPost(
          '/organization/cancel-invitation',
          {
            invitationId,
          },
          'Unable to cancel invitation.'
        )
        toast.success('Invitation canceled.')
        loadState()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Unable to cancel invitation.')
      } finally {
        setCancelingId(null)
      }
    },
    [loadState, state.canCancel]
  )

  if (!state.isLoading && !state.error && !state.canCreate) {
    return null
  }

  return (
    <div className='rounded-xl border border-border/90 bg-card/85 p-1'>
      <Card className='border-0 bg-transparent shadow-none'>
        <CardHeader className='pb-2'>
          <div className='flex items-start justify-between gap-3'>
            <div className='space-y-1'>
              <CardTitle className='font-serif text-foreground text-xl'>
                Outstanding Invites
              </CardTitle>
              <CardDescription className='text-foreground/70'>
                Pending organization invitations that are still active.
              </CardDescription>
            </div>
            <Button className='gap-2' onClick={loadState} size='sm' type='button' variant='outline'>
              <RefreshCw className='h-4 w-4' />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className='pt-2'>
          {state.isLoading ? (
            <div
              className='flex min-h-28 items-center justify-center rounded-lg border border-border/70 border-dashed bg-background/40'
              role='status'
            >
              <div className='flex items-center gap-2 text-foreground/70 text-sm'>
                <Loader2 className='h-4 w-4 animate-spin' />
                Loading outstanding invitations...
              </div>
            </div>
          ) : null}

          {!state.isLoading && state.error ? (
            <div className='rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-foreground/80 text-sm'>
              <div className='flex items-start gap-3'>
                <AlertCircle className='mt-0.5 h-4 w-4 shrink-0 text-destructive' />
                <div className='space-y-2'>
                  <p>Unable to load outstanding invitations.</p>
                  <p className='text-foreground/60'>{state.error}</p>
                </div>
              </div>
            </div>
          ) : null}

          {!state.isLoading && !state.error ? (
            outstandingInvitations.length > 0 ? (
              <div className='grid gap-3'>
                {outstandingInvitations.map((invitation) => (
                  <div
                    className='flex flex-wrap items-center gap-3 rounded-lg border border-border/70 bg-background/55 px-4 py-3'
                    key={invitation.id}
                  >
                    <div className='min-w-0 flex-1'>
                      <p className='truncate font-medium text-foreground text-sm'>
                        {invitation.email}
                      </p>
                      <p className='text-foreground/60 text-xs'>
                        Sent {formatTimestamp(invitation.createdAt)} • Expires{' '}
                        {formatTimestamp(invitation.expiresAt)}
                      </p>
                    </div>
                    <Badge variant='outline'>{formatRoleLabel(invitation.role)}</Badge>
                    <Button
                      disabled={resendingId === invitation.id}
                      onClick={() => void handleResend(invitation)}
                      size='sm'
                      type='button'
                      variant='outline'
                    >
                      {resendingId === invitation.id ? (
                        <>
                          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                          Resending...
                        </>
                      ) : (
                        'Resend'
                      )}
                    </Button>
                    <Button
                      disabled={!state.canCancel || cancelingId === invitation.id}
                      onClick={() => void handleCancel(invitation.id)}
                      size='sm'
                      type='button'
                      variant='outline'
                    >
                      {cancelingId === invitation.id ? (
                        <>
                          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                          Canceling...
                        </>
                      ) : (
                        'Cancel'
                      )}
                    </Button>
                  </div>
                ))}
                {!state.canCancel ? (
                  <p className='text-foreground/60 text-sm'>
                    Your role can resend invitations but cannot cancel them.
                  </p>
                ) : null}
              </div>
            ) : (
              <div className='rounded-lg border border-border/70 border-dashed bg-background/40 p-4 text-foreground/65 text-sm'>
                No outstanding organization invitations.
              </div>
            )
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
