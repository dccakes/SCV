import { sharedStyles } from '~/app/utils/shared-styles'

export default function Footer() {
  return (
    <footer className={`mt-20 border-t bg-muted/30 py-8 ${sharedStyles.desktopPaddingSides}`}>
      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="font-serif text-sm font-semibold text-foreground">OSWP</p>
        <p className="text-xs text-muted-foreground">
          Open Source Wedding Project — Free and open source.
        </p>
      </div>
    </footer>
  )
}
