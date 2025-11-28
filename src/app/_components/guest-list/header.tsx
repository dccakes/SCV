import { sharedStyles } from '~/app/utils/shared-styles'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'

export default function GuestHeader() {
  return (
    <section>
      <div className={`pb-5 pt-10 ${sharedStyles.desktopPaddingSidesGuestList}`}>
        <div className="flex justify-between">
          <h1 className="text-3xl font-bold">Your Guest List</h1>
          <div>
            <h3 className="mb-4 text-sm uppercase tracking-wide text-muted-foreground">
              Simplify Guest Communication
            </h3>
            <div className="flex gap-5">
              <Card className="w-72 cursor-pointer transition-all hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base">
                    See invitations & paper
                    <span className="text-primary">→</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Share the most important details with designs that feel like you.
                  </p>
                </CardContent>
              </Card>
              <Card className="w-72 cursor-pointer transition-all hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base">
                    Message guests
                    <span className="text-primary">→</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Share your website, remind guests to RSVP and more.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
