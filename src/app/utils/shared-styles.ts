const minPageWidth = ''
const desktopPaddingSides = 'px-6 md:px-12'
const desktopPaddingSidesGuestList = 'px-6 md:px-12'
const verticalDivider = 'px-3 text-neutral-300'
const primaryColor = 'primary'
const primaryColorHex = 'var(--primary)'
const sidebarFormWidth = 'w-[525px]'
const ellipsisOverflow = 'overflow-hidden overflow-ellipsis whitespace-nowrap'
const animatedInput =
  'peer block w-full appearance-none rounded-lg border border-input bg-transparent px-2.5 pb-2.5 pt-4 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-0 dark:text-white'
const animatedLabel =
  'absolute left-2 start-1 top-2 z-10 origin-[0] -translate-y-4 scale-75 transform bg-white px-2 text-sm text-muted-foreground duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-focus:top-2 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:px-2 peer-focus:text-primary dark:bg-gray-900 rtl:peer-focus:left-auto rtl:peer-focus:translate-x-1/4'
const requiredAsterisk = 'before:ml-0.5 before:text-red-500 before:content-["*"]'

type ButtonOptions = {
  px?: string
  py?: string
  isLoading?: boolean
}

const primaryButton = (options?: ButtonOptions) => {
  options = { px: 'px-12', py: 'py-3', isLoading: false, ...options }
  const { px, py, isLoading } = options
  const hover = isLoading ? '' : 'hover:bg-primary/90'
  const bg = isLoading ? 'bg-primary/40' : 'bg-primary'
  const cursor = isLoading ? 'cursor-not-allowed' : ''

  return `rounded-full font-semibold text-primary-foreground ${px} ${py} ${hover} ${bg} ${cursor}`
}

const secondaryButton = (options?: ButtonOptions) => {
  options = { px: 'px-12', py: 'py-3', isLoading: false, ...options }
  const { px, py, isLoading } = options
  const hover = isLoading ? '' : 'hover:bg-primary/10'
  const cursor = isLoading ? 'cursor-not-allowed' : ''
  const border = isLoading ? 'border-primary/40' : 'border-primary'
  const text = isLoading ? 'text-primary/40' : 'text-primary'

  return `rounded-full border font-semibold ${px} ${py} ${hover} ${cursor} ${border} ${text}`
}

const getRSVPcolor = (rsvp: string | null | undefined) => {
  switch (rsvp) {
    case 'Not Invited':
      return 'bg-muted-foreground/30'
    case 'Invited':
      return 'bg-muted-foreground'
    case 'Attending':
      return 'bg-emerald-500'
    case 'Declined':
      return 'bg-destructive'
    default:
      return 'bg-muted-foreground/50'
  }
}

export const sharedStyles = {
  minPageWidth,
  desktopPaddingSides,
  desktopPaddingSidesGuestList,
  verticalDivider,
  primaryColor,
  primaryColorHex,
  sidebarFormWidth,
  ellipsisOverflow,
  animatedInput,
  animatedLabel,
  requiredAsterisk,
  primaryButton,
  secondaryButton,
  getRSVPcolor,
}
