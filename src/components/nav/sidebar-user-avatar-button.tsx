import { useWorkspace } from '~/hooks/use-workspace'
import { getOrganizationRoleLabel } from '~/lib/organization-roles'

type SidebarUserAvatarButtonProps = {
  firstName?: string
  initials?: string
  isCollapsed: boolean
  onSignOut: () => void
}

export default function SidebarUserAvatarButton(props: Readonly<SidebarUserAvatarButtonProps>) {
  const { firstName = 'User', initials = 'U', isCollapsed, onSignOut } = props
  const { workspace } = useWorkspace()
  const roleLabel = getOrganizationRoleLabel(workspace.role ?? 'member')

  return (
    <div className='flex flex-col gap-1.5 border-sidebar-border border-t p-3'>
      <div
        className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sidebar-foreground text-sm ${
          isCollapsed ? 'justify-center' : ''
        }`}
      >
        <span className='flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-[0.7rem] text-primary-foreground'>
          {initials}
        </span>
        {!isCollapsed && (
          <div>
            <div className='font-medium text-sidebar-foreground text-sm leading-tight'>
              {firstName}
            </div>
            <div className='text-muted-foreground text-xs'>{roleLabel}</div>
          </div>
        )}
      </div>

      <button
        type='button'
        onClick={onSignOut}
        className={`flex h-9 items-center gap-2 rounded-[10px] px-2 text-muted-foreground text-sm transition-colors hover:bg-sidebar-foreground/[0.06] hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring ${
          isCollapsed ? 'justify-center' : ''
        }`}
        title='Sign out'
        aria-label='Sign out'
      >
        <span className='text-[0.7rem]'>↪</span>
        {!isCollapsed && 'Sign out'}
      </button>
    </div>
  )
}
