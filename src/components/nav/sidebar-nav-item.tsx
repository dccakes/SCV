import Link from 'next/link'

interface NavItemProps {
  label: string
  href: string
  icon: string
  isActive: boolean
  isCollapsed: boolean
  onClick?: () => void
}

export default function NavItem(props: Readonly<NavItemProps>) {
  const { label, href, icon, isActive, isCollapsed, onClick } = props

  return (
    <Link
      href={href}
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`flex items-center border-l-2 py-2.5 font-mono text-xs uppercase tracking-widest transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-cream/80 focus-visible:ring-inset ${
        isCollapsed ? 'justify-center px-2' : 'gap-2.5 px-4'
      } ${
        isActive
          ? 'border-primary bg-primary/25 text-primary-foreground'
          : 'border-transparent text-muted-foreground hover:bg-white/25 hover:text-primary-foreground'
      }`}
    >
      <span className='flex-shrink-0 text-center text-base leading-none'>{icon}</span>
      {!isCollapsed && <span>{label}</span>}
    </Link>
  )
}
