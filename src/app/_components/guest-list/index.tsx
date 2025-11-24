"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useGuestForm } from "../contexts/guest-form-context";
import { useEventForm } from "../contexts/event-form-context";

import GuestForm from "../forms/guest-form";
import EventForm from "../forms/event-form";
import EventsTabs from "./event-tabs";
import NoGuestsView from "./no-guests-view";
import GuestsView from "./guests-view";

import {
  type DashboardData,
  type EventFormData,
  type Household,
  type HouseholdFormData,
} from "../../utils/shared-types";

export default function GuestList({
  dashboardData,
}: {
  dashboardData: DashboardData;
}) {
  const isEventFormOpen = useEventForm();
  const isGuestFormOpen = useGuestForm();
  const searchParams = useSearchParams();
  const selectedEventId = searchParams.get("event") ?? "all";

  const [prefillEvent, setPrefillEvent] = useState<EventFormData | undefined>();
  const [prefillHousehold, setPrefillHousehold] = useState<
    HouseholdFormData | undefined
  >();

  const filteredHouseholdsByEvent = useMemo(
    () =>
      selectedEventId === "all"
        ? dashboardData?.households ?? []
        : dashboardData?.households?.map((household: Household) => {
            return {
              ...household,
              guests: household.guests.filter((guest) => {
                if (!guest.invitations) return false;
                const matchingInvitation = guest.invitations.find(
                  (guest) => guest.eventId === selectedEventId,
                );
                if (matchingInvitation === undefined) return false;
                return matchingInvitation?.rsvp !== "Not Invited";
              }),
            };
          }) ?? [],
    [selectedEventId, dashboardData?.households],
  );

  const totalGuests =
    useMemo(
      () =>
        filteredHouseholdsByEvent?.reduce(
          (acc: number, household: Household) => acc + household.guests.length,
          0,
        ),
      [filteredHouseholdsByEvent],
    ) ?? 0;

  if (dashboardData === null) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <div className="flex flex-col gap-5 text-center">
          <h1 className="text-3xl">Something went wrong!</h1>
          <p>Sorry about that. Please refresh the page in a moment.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {isGuestFormOpen && (
        <GuestForm
          events={dashboardData?.events}
          prefillFormData={prefillHousehold}
        />
      )}
      {isEventFormOpen && <EventForm prefillFormData={prefillEvent} />}
      <EventsTabs
        events={dashboardData?.events}
        selectedEventId={selectedEventId}
      />
      {totalGuests > 0 ? (
        <GuestsView
          events={dashboardData.events}
          households={filteredHouseholdsByEvent}
          selectedEventId={selectedEventId}
          setPrefillHousehold={setPrefillHousehold}
          setPrefillEvent={setPrefillEvent}
        />
      ) : (
        <NoGuestsView setPrefillHousehold={setPrefillHousehold} />
      )}
    </>
  );
}
