import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'

interface NavItemProps {
  label: string
  href: string
  icon: LucideIcon
  isActive: boolean
  isCollapsed: boolean
  onClick?: () => void
}

export default function NavItem(props: Readonly<NavItemProps>) {
  const { label, href, icon: Icon, isActive, isCollapsed, onClick } = props

  return (
    <Link
      href={href}
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
      className={`mx-2 flex h-10 items-center rounded-[10px] text-[0.94rem] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring ${
        isCollapsed ? 'justify-center px-2' : 'gap-3 px-3'
      } ${
        isActive
          ? 'bg-sidebar-accent font-semibold text-sidebar-accent-foreground shadow-sm'
          : 'text-sidebar-foreground/75 hover:bg-sidebar-foreground/[0.05] hover:text-sidebar-foreground'
      }`}
    >
      <Icon
        aria-hidden='true'
        className={`h-[18px] w-[18px] flex-shrink-0 ${isActive ? 'text-sidebar-primary' : ''}`}
        strokeWidth={1.8}
      />
      {!isCollapsed && <span>{label}</span>}
    </Link>
  )
}
