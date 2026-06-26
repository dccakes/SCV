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
    <div className='flex flex-col gap-1.5 border-white/6 border-t p-3'>
      <div
        className={`flex items-center gap-2 rounded-md px-2 py-1.5 ${
          isCollapsed ? 'justify-center' : ''
        }`}
      >
        <span className='flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent font-serif text-white text-xs italic'>
          {initials}
        </span>
        {!isCollapsed && (
          <div>
            <div className='font-sans text-sidebar-cream/80 text-xs leading-tight'>{firstName}</div>
            <div className='font-mono text-sidebar-cream/35 text-xs uppercase tracking-wider'>
              {roleLabel}
            </div>
          </div>
        )}
      </div>

      <button
        type='button'
        onClick={onSignOut}
        className={`flex items-center gap-2 rounded-sm border border-white/15 px-2 py-1.5 font-mono text-[0.58rem] text-sidebar-cream/55 uppercase tracking-widest transition-colors hover:border-accent/60 hover:bg-white/[0.04] hover:text-sidebar-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-cream/80 focus-visible:ring-offset-1 focus-visible:ring-offset-sidebar-ink ${
          isCollapsed ? 'justify-center' : ''
        }`}
        title='Sign out'
        aria-label='Sign out'
      >
        <span aria-hidden='true' className='text-[0.7rem]'>
          ↪
        </span>
        {!isCollapsed && 'Sign out'}
      </button>
    </div>
  )
}
