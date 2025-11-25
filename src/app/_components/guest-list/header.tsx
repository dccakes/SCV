import { sharedStyles } from '~/app/utils/shared-styles'

export default function GuestHeader() {
  return (
    <section>
      <div className={`pb-5 pt-10 ${sharedStyles.desktopPaddingSidesGuestList}`}>
        <div className="flex justify-between">
          <h1 className="text-3xl font-bold">Your Guest List</h1>
          <div>
            <h3 className="pb-3 text-sm">SIMPLIFY GUEST COMMUNICATION</h3>
            <div className="flex gap-5">
              <div className="w-72 cursor-pointer rounded-md p-5 shadow-[0_3px_10px_rgb(0,0,0,0.2)]">
                <h4 className="pb-3 font-bold">
                  See invitations & paper <span className="pl-2">--{'>'}</span>
                </h4>
                <p>Share the most important details with designs that feel like you.</p>
              </div>
              <div className="w-72 cursor-pointer rounded-md p-5 shadow-[0_3px_10px_rgb(0,0,0,0.2)]">
                <h4 className="pb-3 font-bold">
                  Message guests <span className="pl-2">--{'>'}</span>
                </h4>
                <p>Share your website, remind guests to RSVP and more.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
