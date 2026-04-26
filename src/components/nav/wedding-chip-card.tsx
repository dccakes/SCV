interface WeddingChipCardProps {
  coupleName?: string
  weddingDate?: string
  weddingLocation?: string
}

export default function WeddingChipCard(props: Readonly<WeddingChipCardProps>) {
  const { coupleName, weddingDate, weddingLocation } = props

  return (
    <div className='mx-3 mt-3 mb-1 rounded-md border border-white/8 bg-white/[0.05] px-3 py-2.5'>
      {coupleName && (
        <p className='mb-1 font-display text-[1.02rem] text-sidebar-cream italic leading-tight'>
          {coupleName}
        </p>
      )}
      {weddingDate && (
        <p className='font-mono text-[0.6rem] text-accent uppercase tracking-widest'>
          {weddingDate}
        </p>
      )}
      {weddingLocation && (
        <p className='font-mono text-[0.6rem] text-sidebar-cream/45 uppercase tracking-widest'>
          {weddingLocation}
        </p>
      )}
    </div>
  )
}
