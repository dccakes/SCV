import { AiOutlineHome } from 'react-icons/ai'
import { CiMail } from 'react-icons/ci'
import { HiOutlinePhone } from 'react-icons/hi2'

export default function ExampleTable() {
  return (
    <div>
      <div
        className={`guest-table grid gap-12 border-b py-6 font-extralight`}
        style={{
          gridTemplateColumns: `40px 200px 100px 150px 200px 150px 150px`,
        }}
      >
        <div>
          <input className="h-7 w-7" type="checkbox" id="check-all" disabled={true}></input>
        </div>
        <h5>Name</h5>
        <h5>Contact</h5>
        <h5>RSVP Status</h5>
        <h5>My Notes</h5>
        <h5>Gift</h5>
        <h5>Thank You</h5>
      </div>

      <div>
        <div
          className={`guest-table grid items-center gap-12 border-b py-4 italic text-gray-400`}
          style={{
            gridTemplateColumns: `40px 200px 100px 150px 200px 150px 150px`,
          }}
        >
          <div>
            <input
              className="h-7 w-7"
              type="checkbox"
              id={`check-guest-example`}
              disabled={true}
            ></input>
          </div>
          <h3>Example Guest</h3>
          <div className="flex gap-2">
            <AiOutlineHome size={22} />
            <HiOutlinePhone size={22} />
            <CiMail size={23} />
          </div>
          <div>
            <select name="guestRSVP" className="italic" id={`guest-rsvp-example`}>
              <option value="Not Invited">Not Invited</option>
              <option value="Invited">Invited</option>
              <option value="Attending">Attending</option>
              <option value="Declined">Declined</option>
            </select>
          </div>
          <div>Staying at Highline Hotel ...</div>
          <div>-</div>
          <div>
            <input
              className="h-7 w-7"
              type="checkbox"
              id={`check-guest-example`}
              disabled={true}
            ></input>
          </div>
        </div>
      </div>
    </div>
  )
}
