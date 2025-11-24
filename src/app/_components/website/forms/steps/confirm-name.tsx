"use client";

import { useState } from "react";
import {
  useRsvpForm,
  useUpdateRsvpForm,
} from "~/app/_components/contexts/rsvp-form-context";

import {
  type Guest,
  type HouseholdSearch,
  type StepFormProps,
} from "~/app/utils/shared-types";

export default function ConfirmNameForm({ goNext, goBack }: StepFormProps) {
  const { matchedHouseholds } = useRsvpForm();
  const updateRsvpForm = useUpdateRsvpForm();
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string>();

  const onContinue = () => {
    const selectedHousehold = matchedHouseholds?.find(
      (household: HouseholdSearch[0]) => household.id === selectedHouseholdId,
    );
    const primaryContact = selectedHousehold?.guests.find(
      (guest: Guest) => guest.isPrimaryContact,
    );
    updateRsvpForm({
      selectedHousehold: Object.assign({ primaryContact }, selectedHousehold),
    });
    goNext && goNext();
  };

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-2xl tracking-widest">
        we&apos;ve found you in the guest list. please confirm your name below
        to continue with your rsvp
      </h2>
      {matchedHouseholds?.map((household: HouseholdSearch[0]) => {
        return (
          <div key={household.id} className="flex gap-5">
            <input
              type="radio"
              id={household.id}
              checked={selectedHouseholdId === household.id}
              onChange={() => setSelectedHouseholdId(household.id)}
            />
            <label htmlFor={household.id}>
              {household.guests
                .map((guest: Guest) => `${guest.firstName} ${guest.lastName}`)
                .join(", ")}
            </label>
          </div>
        );
      })}

      <button
        className={`mt-3 bg-stone-400 py-3 text-xl tracking-wide text-white ${selectedHouseholdId === undefined ? "cursor-not-allowed bg-stone-400" : "bg-stone-700"}`}
        type="button"
        disabled={selectedHouseholdId === undefined}
        onClick={onContinue}
      >
        CONTINUE
      </button>
      <button
        className={`mt-3 bg-gray-700 py-3 text-xl tracking-wide text-white`}
        type="button"
        onClick={() => goBack && goBack()}
      >
        SEARCH AGAIN
      </button>
    </div>
  );
}
