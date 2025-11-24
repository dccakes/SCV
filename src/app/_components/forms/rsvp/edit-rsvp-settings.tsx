"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import { sharedStyles } from "../../../utils/shared-styles";
import { IoMdClose } from "react-icons/io";
import { useToggleEditRsvpSettingsForm } from "../../contexts/edit-rsvp-settings-form-context";
import { Switch } from "~/components/ui/switch";
import SidePaneWrapper from "../wrapper";

import { type Website } from "~/app/utils/shared-types";

type EditRsvpSettingsFormProps = {
  website: Website | undefined | null;
};

export default function EditRsvpSettingsForm({
  website,
}: EditRsvpSettingsFormProps) {
  const router = useRouter();
  const toggleEditRsvpSettingsForm = useToggleEditRsvpSettingsForm();
  const [pageIsVisible, setPageIsVisible] = useState<boolean>(
    !!website?.isRsvpEnabled,
  );
  const [rsvpAccess, setRsvpAccess] = useState<"Private" | "Public">("Private");
  const [guestListIsVisible, setGuestListIsVisible] = useState<boolean>(false);

  const updateIsRsvpEnabled = api.website.updateIsRsvpEnabled.useMutation({
    onSuccess: () => {
      router.refresh();
      toggleEditRsvpSettingsForm();
    },
    onError: (err) => {
      if (err) window.alert(err);
      else
        window.alert(
          "Failed to update RSVP Settings! Please refresh the page and try again.",
        );
    },
  });

  return (
    <SidePaneWrapper>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          updateIsRsvpEnabled.mutate({
            websiteId: website?.id ?? "",
            isRsvpEnabled: pageIsVisible,
          });
        }}
        className="pb-32"
      >
        <header className="flex justify-between border-b p-5">
          <h1 className="text-xl font-semibold">RSVP Settings</h1>
          <IoMdClose
            size={25}
            className="cursor-pointer"
            onClick={() => toggleEditRsvpSettingsForm()}
          />
        </header>
        <section className="border-b px-5 py-8">
          <div>
            <div className="mb-2 flex justify-between">
              <h2 className="text-xl font-semibold">Page Visibility</h2>
              <div className="flex items-center gap-3">
                <Switch
                  id="rsvp-page-visibility-toggle"
                  checked={pageIsVisible}
                  onClick={() => setPageIsVisible((prev) => !prev)}
                />
                <span>{pageIsVisible ? "Visible" : "Hidden"}</span>
              </div>
            </div>
            <p>No one can RSVP from your Website until this page is visible</p>
          </div>
        </section>
        <section className="border-b px-5 py-8">
          <h2 className="mb-3 text-xl font-semibold">Access</h2>
          <ul className="flex flex-col gap-3">
            <li>
              <div className="flex gap-2">
                <input
                  id="guest-list-only"
                  type="radio"
                  className="h-6 w-6"
                  checked={rsvpAccess === "Private"}
                  onClick={() => setRsvpAccess("Private")}
                />
                <label htmlFor="guest-list-only">
                  Guest List Only (recommended)
                  <p>Only guests on your Guest List can RSVP.</p>
                </label>
              </div>
            </li>
            <li>
              <div className="flex gap-2">
                <input
                  id="public-rsvp"
                  type="radio"
                  className="h-6 w-6"
                  checked={rsvpAccess === "Public"}
                  onClick={() => setRsvpAccess("Public")}
                />
                <label htmlFor="public-rsvp">
                  Public RSVP (not recommended)
                  <p>Anyone with the link to your Wedding Website can RSVP.</p>
                </label>
              </div>
            </li>
          </ul>
        </section>

        <section className="px-5 py-8">
          <h2 className="mb-3 text-xl font-semibold">Guest List Visibility</h2>
          <div className="flex gap-2">
            <input
              id="guest-list-visibility"
              type="checkbox"
              className="h-7 w-7 accent-pink-400"
              checked={guestListIsVisible}
              onChange={() => setGuestListIsVisible((prev) => !prev)}
            />
            <label htmlFor="guest-list-visibility">
              Allow anybody who RSVPs &apos;Yes!&apos; to see who&apos;s
              attending each event
            </label>
          </div>
        </section>

        <div
          className={`fixed bottom-0 z-20 flex ${sharedStyles.sidebarFormWidth} flex-col gap-3 border-t bg-white px-3 py-5`}
        >
          <div className="flex gap-3 text-sm">
            <button
              disabled={updateIsRsvpEnabled.isPending}
              onClick={() => toggleEditRsvpSettingsForm()}
              className={`w-1/2 ${sharedStyles.secondaryButton({
                py: "py-2",
                isLoading: updateIsRsvpEnabled.isPending,
              })}`}
            >
              Cancel
            </button>
            <button
              id="edit-save"
              name="edit-button"
              type="submit"
              disabled={updateIsRsvpEnabled.isPending}
              className={`w-1/2 ${sharedStyles.primaryButton({
                px: "px-2",
                py: "py-2",
                isLoading: updateIsRsvpEnabled.isPending,
              })}`}
            >
              {updateIsRsvpEnabled.isPending ? "Processing..." : "Save"}
            </button>
          </div>
        </div>
      </form>
    </SidePaneWrapper>
  );
}
