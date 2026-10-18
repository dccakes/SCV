import type { LucideIcon } from 'lucide-react'
import NavItem from '~/components/nav/sidebar-nav-item'

export type SidebarNavItem = {
  label: string
  href: string
  icon: LucideIcon
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
    <nav className='flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto py-3'>
      {sections.map((section, sectionIndex) => (
        <div key={section.title}>
          {!isCollapsed && (
            <p
              className={`font-semibold text-[0.7rem] text-muted-foreground uppercase tracking-[0.1em] ${
                sectionIndex === 0 ? 'px-5 pt-2 pb-1.5' : 'mt-3 px-5 pt-2 pb-1.5'
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
