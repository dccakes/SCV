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
    <div className='flex flex-col gap-1.5 border-white/10 border-t p-3'>
      <div
        className={`flex items-center gap-2 rounded-md px-2 py-1.5 font-mono text-sidebar-cream/70 text-xs ${
          isCollapsed ? 'justify-center' : ''
        }`}
      >
        <span className='flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent font-serif text-white text-xs italic'>
          {initials}
        </span>
        {!isCollapsed && (
          <div>
            <div className='font-serif text-[0.75rem] text-muted-foreground leading-tight'>
              {firstName}
            </div>
            <div className='text-[0.55rem] text-muted-foreground uppercase tracking-wider'>
              {roleLabel}
            </div>
          </div>
        )}
      </div>

      <button
        type='button'
        onClick={onSignOut}
        className={`flex items-center gap-2 rounded-sm border border-white/25 px-2 py-1.5 font-mono text-[0.58rem] text-muted-foreground uppercase tracking-widest transition-all hover:border-white/20 hover:text-sidebar-cream/75 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sidebar-cream/40 ${
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
