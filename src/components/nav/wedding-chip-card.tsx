interface WeddingChipCardProps {
  coupleName?: string
  weddingDate?: string
  weddingLocation?: string
}

export default function WeddingChipCard(props: Readonly<WeddingChipCardProps>) {
  const { coupleName, weddingDate, weddingLocation } = props

  return (
    <div className='mx-3 mt-3 mb-1 rounded-xl bg-sidebar-accent px-3.5 py-3 shadow-sm'>
      {coupleName && (
        <p className='mb-1 font-display text-[1.35rem] text-sidebar-foreground leading-tight'>
          {coupleName}
        </p>
      )}
      {weddingDate && <p className='text-muted-foreground text-xs'>{weddingDate}</p>}
      {weddingLocation && <p className='text-muted-foreground text-xs'>{weddingLocation}</p>}
    </div>
  )
}
