'use client'

import { AlertCircle, Loader2, MailPlus, RefreshCw, UserMinus, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { authClient } from '~/lib/auth-client'
import {
  getOrganizationRoleLabel,
  type OrganizationRoleOption,
  organizationRoleOptions,
} from '~/lib/organization-roles'
import { getUserInitials } from '~/lib/user-display'

type Organization = {
  id: string
  name?: string | null
}

type Member = {
  id: string
  role: string
  user?: {
    email?: string | null
    image?: string | null
    name?: string | null
  } | null
}

type OrganizationState = {
  canInvite: boolean
  canUpdateMembers: boolean
  error: string | null
  isLoading: boolean
  members: Member[]
  organization: Organization | null
  pendingInvitations: Invitation[]
}

type AuthFetchError = {
  message?: string | null
}

type AuthFetchResult<T> = {
  data: T | null
  error?: AuthFetchError | null
}

type FullOrganizationResponse = Organization & {
  members?: Member[]
}

type Invitation = {
  email?: string | null
  expiresAt?: string | Date | null
  id: string
  role?: string | null
  status?: string | null
}

type HasPermissionResponse = {
  success: boolean
}

const initialState: OrganizationState = {
  canInvite: false,
  canUpdateMembers: false,
  error: null,
  isLoading: true,
  members: [],
  organization: null,
  pendingInvitations: [],
}

function getRoleLabel(role: string) {
  return getOrganizationRoleLabel(role)
}

function getInitials(name?: string | null, email?: string | null) {
  if (!name?.trim() && !email?.trim()) {
    return '?'
  }

  return getUserInitials(name, email)
}

async function authGet<T>(path: string, fallbackMessage: string): Promise<T> {
  const result = (await authClient.$fetch(path)) as AuthFetchResult<T>

  if (result.error) {
    throw new Error(fallbackMessage)
  }

  if (!result.data) {
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

  if (result.error) {
    throw new Error(fallbackMessage)
  }

  if (!result.data) {
    throw new Error(fallbackMessage)
  }

  return result.data
}

async function fetchOrganizationState(): Promise<Omit<OrganizationState, 'error' | 'isLoading'>> {
  const organization = await authGet<FullOrganizationResponse>(
    '/organization/get-full-organization',
    'Unable to load organization.'
  )

  if (!organization?.id) {
    throw new Error('No active organization found.')
  }

  const [invitePermissionResult, updateMemberPermissionResult] = await Promise.all([
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
          member: ['update'],
        },
      },
      'Unable to load member permissions.'
    ),
  ])

  let pendingInvitations: Invitation[] = []
  try {
    const invitations = await authGet<Invitation[]>(
      '/organization/list-invitations',
      'Unable to load organization invitations.'
    )
    pendingInvitations = invitations.filter((invitation) => invitation.status === 'pending')
  } catch {
    pendingInvitations = []
  }

  return {
    canInvite: !!invitePermissionResult.success,
    canUpdateMembers: !!updateMemberPermissionResult.success,
    members: organization.members ?? [],
    organization,
    pendingInvitations,
  }
}

export function OrganizationMembersSettingsCard() {
  const [state, setState] = useState<OrganizationState>(initialState)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [roleDialogMember, setRoleDialogMember] = useState<Member | null>(null)

  const loadOrganizationState = useCallback(() => {
    let isActive = true

    setState((current) => ({
      ...current,
      error: null,
      isLoading: true,
    }))

    void fetchOrganizationState()
      .then((nextState) => {
        if (!isActive) return
        setState({
          ...nextState,
          error: null,
          isLoading: false,
        })
      })
      .catch((error: unknown) => {
        if (!isActive) return
        setState({
          canInvite: false,
          canUpdateMembers: false,
          error: error instanceof Error ? error.message : 'Unable to load organization members.',
          isLoading: false,
          members: [],
          organization: null,
          pendingInvitations: [],
        })
      })

    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => loadOrganizationState(), [loadOrganizationState])

  return (
    <div className='rounded-xl border border-border/90 bg-card/85 p-1'>
      <Card className='border-0 bg-transparent shadow-none'>
        <CardHeader className='pb-2'>
          <div className='flex items-start justify-between gap-3'>
            <div className='space-y-1'>
              <CardTitle className='font-serif text-foreground text-xl'>Members</CardTitle>
              <CardDescription className='text-foreground/70'>
                Invite collaborators and manage who can access this wedding workspace.
              </CardDescription>
            </div>
            <div className='flex items-center gap-2'>
              {state.error ? (
                <Button
                  className='gap-2'
                  onClick={loadOrganizationState}
                  size='sm'
                  type='button'
                  variant='outline'
                >
                  <RefreshCw className='h-4 w-4' />
                  Retry
                </Button>
              ) : null}
              <Button
                className='gap-2'
                disabled={!state.organization || !state.canInvite || state.isLoading}
                onClick={() => setInviteDialogOpen(true)}
                size='sm'
                type='button'
              >
                <MailPlus className='h-4 w-4' />
                Invite Member
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className='pt-2'>
          {state.isLoading ? <OrganizationMembersLoadingState /> : null}
          {!state.isLoading && state.error ? (
            <OrganizationMembersErrorState error={state.error} onRetry={loadOrganizationState} />
          ) : null}
          {!state.isLoading && !state.error ? (
            <div className='space-y-3'>
              <OrganizationMembersList
                canRemoveMembers={state.canUpdateMembers}
                canUpdateMembers={state.canUpdateMembers}
                members={state.members}
                onEditRole={setRoleDialogMember}
                onRemoveMember={async (member) => {
                  if (!state.organization) return

                  try {
                    await authPost(
                      '/organization/remove-member',
                      {
                        memberIdOrEmail: member.id,
                        organizationId: state.organization.id,
                      },
                      'Unable to remove member.'
                    )
                    toast.success('Member removed')
                    loadOrganizationState()
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : 'Unable to remove member.')
                  }
                }}
              />
              <PendingInvitationsList
                canCancelInvitations={state.canInvite}
                invitations={state.pendingInvitations}
                onCancelInvitation={async (invitationId) => {
                  try {
                    await authPost(
                      '/organization/cancel-invitation',
                      { invitationId },
                      'Unable to cancel invitation.'
                    )
                    toast.success('Invitation canceled')
                    loadOrganizationState()
                  } catch (error) {
                    toast.error(
                      error instanceof Error ? error.message : 'Unable to cancel invitation.'
                    )
                  }
                }}
              />
              <OrganizationPermissionsHint
                canInvite={state.canInvite}
                canUpdateMembers={state.canUpdateMembers}
              />
            </div>
          ) : null}
        </CardContent>
      </Card>
      {state.organization ? (
        <InviteMemberDialog
          onInviteSent={() => {
            setInviteDialogOpen(false)
          }}
          open={inviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
          organizationId={state.organization.id}
        />
      ) : null}
      {state.organization && roleDialogMember ? (
        <EditMemberRoleDialog
          member={roleDialogMember}
          onRoleUpdated={() => {
            setRoleDialogMember(null)
            loadOrganizationState()
          }}
          open={!!roleDialogMember}
          onOpenChange={(open) => {
            if (!open) {
              setRoleDialogMember(null)
            }
          }}
          organizationId={state.organization.id}
        />
      ) : null}
    </div>
  )
}

function OrganizationMembersLoadingState() {
  return (
    <div
      className='flex min-h-32 items-center justify-center rounded-lg border border-border/70 border-dashed bg-background/40'
      role='status'
    >
      <div className='flex items-center gap-2 text-foreground/70 text-sm'>
        <Loader2 className='h-4 w-4 animate-spin' />
        Loading organization members...
      </div>
    </div>
  )
}

function OrganizationMembersErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className='rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-foreground/80 text-sm'>
      <div className='flex items-start gap-3'>
        <AlertCircle className='mt-0.5 h-4 w-4 shrink-0 text-destructive' />
        <div className='space-y-3'>
          <p>Unable to load organization members.</p>
          <p className='text-foreground/60'>{error}</p>
          <Button onClick={onRetry} size='sm' type='button' variant='outline'>
            Retry
          </Button>
        </div>
      </div>
    </div>
  )
}

function OrganizationMembersList({
  canRemoveMembers,
  canUpdateMembers,
  members,
  onEditRole,
  onRemoveMember,
}: {
  canRemoveMembers: boolean
  canUpdateMembers: boolean
  members: Member[]
  onEditRole: (member: Member) => void
  onRemoveMember: (member: Member) => Promise<void>
}) {
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null)

  if (members.length === 0) {
    return (
      <div className='rounded-lg border border-border/70 border-dashed bg-background/40 p-4 text-foreground/65 text-sm'>
        No organization members found yet.
      </div>
    )
  }

  return (
    <div className='grid gap-4'>
      {members
        .slice()
        .sort((left, right) => {
          const leftName = left.user?.name || left.user?.email || ''
          const rightName = right.user?.name || right.user?.email || ''
          return leftName.localeCompare(rightName)
        })
        .map((member) => (
          <div
            className='flex items-center gap-3 rounded-lg border border-border/70 bg-background/55 px-4 py-3'
            key={member.id}
          >
            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-mono font-semibold text-primary text-xs uppercase'>
              {getInitials(member.user?.name, member.user?.email)}
            </div>
            <div className='min-w-0 flex-1'>
              <p className='truncate font-medium text-foreground text-sm'>
                {member.user?.name || member.user?.email || 'Unknown member'}
              </p>
              <p className='truncate text-foreground/60 text-sm'>
                {member.user?.email || 'No email address'}
              </p>
            </div>
            <Badge variant='outline'>{getRoleLabel(member.role)}</Badge>
            {canUpdateMembers ? (
              <Button onClick={() => onEditRole(member)} size='sm' type='button' variant='outline'>
                Edit Role
              </Button>
            ) : null}
            {canRemoveMembers ? (
              <Button
                className='gap-2'
                disabled={removingMemberId === member.id}
                onClick={() => {
                  setRemovingMemberId(member.id)
                  void onRemoveMember(member).finally(() =>
                    setRemovingMemberId((current) => (current === member.id ? null : current))
                  )
                }}
                size='sm'
                type='button'
                variant='destructive'
              >
                {removingMemberId === member.id ? (
                  <>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    Removing...
                  </>
                ) : (
                  <>
                    <UserMinus className='h-4 w-4' />
                    Remove Member
                  </>
                )}
              </Button>
            ) : null}
          </div>
        ))}
    </div>
  )
}

function PendingInvitationsList({
  canCancelInvitations,
  invitations,
  onCancelInvitation,
}: {
  canCancelInvitations: boolean
  invitations: Invitation[]
  onCancelInvitation: (invitationId: string) => Promise<void>
}) {
  const [cancelingInvitationId, setCancelingInvitationId] = useState<string | null>(null)

  if (invitations.length === 0) {
    return null
  }

  return (
    <div className='space-y-2 rounded-lg border border-border/70 bg-background/35 p-3'>
      <p className='font-mono text-[0.62rem] text-foreground/60 uppercase tracking-wider'>
        Pending Invitations
      </p>
      <div className='space-y-2'>
        {invitations.map((invitation) => (
          <div
            className='flex items-center gap-3 rounded-md border border-border/60 bg-background/50 px-3 py-2'
            key={invitation.id}
          >
            <div className='min-w-0 flex-1'>
              <p className='truncate font-medium text-sm'>{invitation.email || 'Unknown email'}</p>
              <p className='text-foreground/60 text-xs'>
                Expires{' '}
                {invitation.expiresAt
                  ? new Date(invitation.expiresAt).toLocaleDateString()
                  : 'soon'}
              </p>
            </div>
            <Badge variant='outline'>{getRoleLabel(invitation.role || 'member')}</Badge>
            {canCancelInvitations ? (
              <Button
                className='gap-2'
                disabled={cancelingInvitationId === invitation.id}
                onClick={() => {
                  setCancelingInvitationId(invitation.id)
                  void onCancelInvitation(invitation.id).finally(() =>
                    setCancelingInvitationId((current) =>
                      current === invitation.id ? null : current
                    )
                  )
                }}
                size='sm'
                type='button'
                variant='outline'
              >
                {cancelingInvitationId === invitation.id ? (
                  <>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    Canceling...
                  </>
                ) : (
                  <>
                    <X className='h-4 w-4' />
                    Cancel Invite
                  </>
                )}
              </Button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}

function OrganizationPermissionsHint({
  canInvite,
  canUpdateMembers,
}: {
  canInvite: boolean
  canUpdateMembers: boolean
}) {
  if (canInvite && canUpdateMembers) {
    return null
  }

  if (!canInvite && !canUpdateMembers) {
    return (
      <p className='text-foreground/60 text-sm'>
        Your role cannot manage organization members or send member invitations.
      </p>
    )
  }

  if (!canInvite) {
    return (
      <p className='text-foreground/60 text-sm'>
        Your role can edit members but cannot send member invitations.
      </p>
    )
  }

  return (
    <p className='text-foreground/60 text-sm'>
      Your role can invite members but cannot change existing member roles.
    </p>
  )
}

function InviteMemberDialog({
  onInviteSent,
  onOpenChange,
  open,
  organizationId,
}: {
  onInviteSent: () => void
  onOpenChange: (open: boolean) => void
  open: boolean
  organizationId: string
}) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<OrganizationRoleOption>('member')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const reset = useCallback(() => {
    setEmail('')
    setRole('member')
    setIsSubmitting(false)
  }, [])

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      onOpenChange(nextOpen)
      if (!nextOpen) {
        reset()
      }
    },
    [onOpenChange, reset]
  )

  const canSubmit = useMemo(() => email.trim().length > 0 && !isSubmitting, [email, isSubmitting])

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return

    setIsSubmitting(true)

    try {
      await authPost(
        '/organization/invite-member',
        {
          email: email.trim(),
          organizationId,
          role,
        },
        'Unable to send invitation.'
      )

      toast.success('Invitation sent successfully')
      onInviteSent()
      handleOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to send invitation.')
      setIsSubmitting(false)
    }
  }, [canSubmit, email, handleOpenChange, onInviteSent, organizationId, role])

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Invite Member</DialogTitle>
          <DialogDescription>
            Send an organization invitation without reloading the page.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4'>
          <div className='space-y-2'>
            <label
              className='font-medium text-foreground text-sm'
              htmlFor='organization-invite-email'
            >
              Email
            </label>
            <Input
              autoComplete='email'
              id='organization-invite-email'
              onChange={(event) => setEmail(event.target.value)}
              placeholder='name@example.com'
              type='email'
              value={email}
            />
          </div>
          <div className='space-y-2'>
            <label
              className='font-medium text-foreground text-sm'
              htmlFor='organization-invite-role'
            >
              Role
            </label>
            <select
              className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
              id='organization-invite-role'
              onChange={(event) => setRole(event.target.value as OrganizationRoleOption)}
              value={role}
            >
              {organizationRoleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className='flex justify-end gap-2'>
            <Button onClick={() => handleOpenChange(false)} type='button' variant='outline'>
              Cancel
            </Button>
            <Button disabled={!canSubmit} onClick={() => void handleSubmit()} type='button'>
              {isSubmitting ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Sending...
                </>
              ) : (
                'Send Invite'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function EditMemberRoleDialog({
  member,
  onOpenChange,
  onRoleUpdated,
  open,
  organizationId,
}: {
  member: Member
  onOpenChange: (open: boolean) => void
  onRoleUpdated: () => void
  open: boolean
  organizationId: string
}) {
  const [role, setRole] = useState<OrganizationRoleOption>(
    (member.role as OrganizationRoleOption) || 'member'
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setRole((member.role as OrganizationRoleOption) || 'member')
    setIsSubmitting(false)
  }, [member])

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true)

    try {
      await authPost(
        '/organization/update-member-role',
        {
          memberId: member.id,
          organizationId,
          role,
        },
        'Unable to update member role.'
      )

      toast.success('Member role updated')
      onRoleUpdated()
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update member role.')
      setIsSubmitting(false)
    }
  }, [member.id, onOpenChange, onRoleUpdated, organizationId, role])

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Edit Role</DialogTitle>
          <DialogDescription>
            Update the organization role for{' '}
            {member.user?.name || member.user?.email || 'this member'}.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4'>
          <div className='space-y-2'>
            <label
              className='font-medium text-foreground text-sm'
              htmlFor='organization-member-role'
            >
              Member Role
            </label>
            <select
              className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
              id='organization-member-role'
              onChange={(event) => setRole(event.target.value as OrganizationRoleOption)}
              value={role}
            >
              {organizationRoleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className='flex justify-end gap-2'>
            <Button onClick={() => onOpenChange(false)} type='button' variant='outline'>
              Cancel
            </Button>
            <Button disabled={isSubmitting} onClick={() => void handleSubmit()} type='button'>
              {isSubmitting ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Saving...
                </>
              ) : (
                'Save Role'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
