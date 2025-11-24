"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import { GoArrowLeft } from "react-icons/go";
import { sharedStyles } from "../../../utils/shared-styles";

import { type Dispatch, type SetStateAction } from "react";

type SetPasswordViewProps = {
  setShowPasswordView: Dispatch<SetStateAction<boolean>>;
  password: string;
};

export default function SetPasswordView({
  setShowPasswordView,
  password,
}: SetPasswordViewProps) {
  const [passwordInput, setPasswordInput] = useState(password ?? "");
  const router = useRouter();

  const updateWebsite = api.website.update.useMutation({
    onSuccess: () => {
      setShowPasswordView(false);
      router.refresh();
    },
    onError: (err) => {
      if (err) window.alert(err);
      else window.alert("Failed to update website! Please try again later.");
    },
  });

  return (
    <div>
      <div className="flex justify-between border-b p-5">
        <div className="flex gap-4">
          <span
            className="cursor-pointer"
            onClick={() => setShowPasswordView(false)}
          >
            <GoArrowLeft size={28} />
          </span>
          <span className="border-r"></span>
          <h1 className="text-2xl font-bold">Set a Password</h1>
        </div>
      </div>
      <div className="px-5 py-7">
        <p className="mb-5 font-thin tracking-tight">
          Know who&apos;s in on your wedding plans by adding a password to your
          site. Make sure it&apos;s easy for guests to remember (and for you to
          share!).
        </p>
        <input
          placeholder="Guest Password"
          className="w-[100%] border p-3"
          value={passwordInput}
          onChange={(e) => setPasswordInput(e.target.value)}
        />
      </div>
      <div
        className={`fixed bottom-0 flex flex-col gap-3 border-t px-8 py-5 ${sharedStyles.sidebarFormWidth}`}
      >
        <button
          disabled={updateWebsite.isPending}
          className={`w-[100%] ${sharedStyles.primaryButton({
            py: "py-2",
            isLoading: updateWebsite.isPending,
          })}`}
          onClick={() =>
            updateWebsite.mutate({
              isPasswordEnabled: true,
              password: passwordInput,
            })
          }
        >
          {updateWebsite.isPending ? "Processing..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
