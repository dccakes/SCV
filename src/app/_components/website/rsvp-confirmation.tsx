"use client";

import { useRsvpForm } from "../contexts/rsvp-form-context";
import { FaCircleCheck } from "react-icons/fa6";
import { RxCrossCircled } from "react-icons/rx";
import Link from "next/link";

import { type Dispatch, type SetStateAction } from "react";
import { type Event, type RsvpFormResponse } from "~/app/utils/shared-types";

type RsvpConfirmationProps = {
  basePath: string;
  setCurrentStep: Dispatch<SetStateAction<number>>;
};

export default function RsvpConfirmation({
  basePath,
  setCurrentStep,
}: RsvpConfirmationProps) {
  const rsvpFormData = useRsvpForm();
  return (
    <div className="flex flex-col pb-8 pt-5">
      <h2 className="text-2xl tracking-widest">
        all set! here&apos;s what we sent{" "}
        {rsvpFormData.weddingData.groomFirstName} &{" "}
        {rsvpFormData.weddingData.brideFirstName}
      </h2>
      <Link
        className={`my-5 bg-gray-700 py-3 text-center text-xl tracking-wide text-white`}
        href={basePath}
      >
        BACK TO HOMEPAGE
      </Link>
      <div className="flex justify-between border-b-2 py-4">
        <h2 className="text-xl">Your RSVP Response</h2>
        <button
          type="button"
          className="border-b-2 py-1"
          onClick={() => setCurrentStep(3)}
        >
          Update Response
        </button>
      </div>
      <ul>
        {rsvpFormData.weddingData.events?.map((event: Event) => {
          const eventHasInvitedGuests = !!rsvpFormData.rsvpResponses.find(
            (response) => event.id === response.eventId,
          );
          if (!eventHasInvitedGuests) return null;
          return (
            <ConfirmationListItem
              key={event.id}
              event={event}
              rsvpResponses={rsvpFormData.rsvpResponses}
            />
          );
        })}
      </ul>
    </div>
  );
}

const ConfirmationListItem = ({
  event,
  rsvpResponses,
}: {
  event: Event;
  rsvpResponses: RsvpFormResponse[];
}) => {
  return (
    <li className="flex flex-col gap-3 border-b-2 py-6">
      <div className="flex items-start justify-between">
        <h3 className="text-lg font-bold">{event.name}</h3>
        <button type="button" className="border-b-2 py-1">
          + Add to Calendar
        </button>
      </div>
      {rsvpResponses.map((response) => {
        if (response.eventId === event.id) {
          return (
            <div
              key={`${event.id}_${response.guestId}`}
              className="flex items-center gap-3"
            >
              {response.rsvp === "Attending" ? (
                <FaCircleCheck size={22} />
              ) : (
                <RxCrossCircled size={22} />
              )}
              {response.guestName}
            </div>
          );
        }
      })}
    </li>
  );
};
