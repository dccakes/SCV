import NavItem from '~/components/nav/sidebar-nav-item'

export type SidebarNavItem = {
  label: string
  href: string
  icon: string
}

export type SidebarSection = {
  title: string
  items: readonly SidebarNavItem[]
}

type SidebarNavContentProps = {
  sections: readonly SidebarSection[]
  isCollapsed: boolean
  isActive: (href: string) => boolean
  onNavClick?: () => void
}

export default function SidebarNavContent(props: Readonly<SidebarNavContentProps>) {
  const { sections, isCollapsed, isActive, onNavClick } = props

  return (
    <nav className='flex min-h-0 flex-1 flex-col gap-px overflow-y-auto py-3'>
      {sections.map((section, sectionIndex) => (
        <div key={section.title}>
          {!isCollapsed && (
            <p
              className={`font-mono text-[0.55rem] text-muted-foreground uppercase tracking-[0.18em] ${
                sectionIndex === 0 ? 'px-4 pt-2 pb-1' : 'mt-2 px-4 pt-2 pb-1'
              }`}
            >
              {section.title}
            </p>
          )}

          {section.items.map((item) => (
            <NavItem
              key={`${section.title}-${item.href}-${item.label}`}
              {...item}
              isActive={isActive(item.href)}
              isCollapsed={isCollapsed}
              onClick={onNavClick}
            />
          ))}
        </div>
      ))}
    </nav>
  )
}
