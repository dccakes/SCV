const minPageWidth = 'min-w-[1610px]'
const desktopPaddingSides = 'px-48'
const desktopPaddingSidesGuestList = 'px-20'
const verticalDivider = 'px-3 text-neutral-300'
const primaryColor = 'pink-400'
const primaryColorHex = '#f472b6'
const sidebarFormWidth = 'w-[525px]'
const ellipsisOverflow = 'overflow-hidden overflow-ellipsis whitespace-nowrap'
const animatedInput =
  'peer block w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-2.5 pb-2.5 pt-4 text-sm text-gray-900 focus:border-pink-400 focus:outline-none focus:ring-0 dark:border-gray-600 dark:text-white dark:focus:border-pink-500'
const animatedLabel =
  'absolute left-2 start-1 top-2 z-10 origin-[0] -translate-y-4 scale-75 transform bg-white px-2 text-sm text-gray-500 duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-focus:top-2 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:px-2 peer-focus:text-pink-400 dark:bg-gray-900 dark:text-gray-400 peer-focus:dark:text-pink-500 rtl:peer-focus:left-auto rtl:peer-focus:translate-x-1/4'
const requiredAsterisk = 'before:ml-0.5 before:text-red-500 before:content-["*"]'

type ButtonOptions = {
  px?: string
  py?: string
  isLoading?: boolean
}

const primaryButton = (options?: ButtonOptions) => {
  options = { px: 'px-12', py: 'py-3', isLoading: false, ...options }
  const { px, py, isLoading } = options
  const hover = isLoading ? '' : 'hover:bg-[#d700a0]'
  const bg = isLoading ? 'bg-pink-200' : 'bg-pink-400'
  const cursor = isLoading ? 'cursor-not-allowed' : ''

  return `rounded-full font-semibold text-white ${px} ${py} ${hover} ${bg} ${cursor}`
}

const secondaryButton = (options?: ButtonOptions) => {
  options = { px: 'px-12', py: 'py-3', isLoading: false, ...options }
  const { px, py, isLoading } = options
  const hover = isLoading ? '' : 'hover:bg-pink-100'
  const cursor = isLoading ? 'cursor-not-allowed' : ''
  const border = isLoading ? 'border-pink-200' : 'border-pink-400'
  const text = isLoading ? 'text-pink-200' : 'text-pink-400'

  return `rounded-full border font-semibold ${px} ${py} ${hover} ${cursor} ${border} ${text}`
}

const getRSVPcolor = (rsvp: string | null | undefined) => {
  switch (rsvp) {
    case 'Not Invited':
      return 'bg-gray-500'
    case 'Invited':
      return 'bg-gray-300'
    case 'Attending':
      return 'bg-green-400'
    case 'Declined':
      return 'bg-red-400'
    default:
      return 'bg-gray-400'
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
