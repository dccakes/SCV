"use client";

import { SignOutButton, useUser } from "@clerk/nextjs";
import { useState } from "react";
import { api } from "~/trpc/react";
import { LoadingSpinner } from "../loaders";
import { sharedStyles } from "../../utils/shared-styles";

export default function NamesForm() {
  const { isLoaded, isSignedIn, user } = useUser();

  const createWebsite = api.website.create.useMutation({
    onSuccess: () => (window.location.href = "/dashboard"),
    // onError: (e) => {
    //       const errorMessage = e.data?.zodError?.fieldErrors.content;
    //       if (errorMessage && errorMessage[0]) {
    //         toast.error(errorMessage[0]);
    //       } else {
    //         toast.error("Failed to post! Please try again later.");
    //       }
    //     },
  });

  const [nameData, setNameData] = useState({
    firstName: "",
    lastName: "",
    partnerFirstName: "",
    partnerLastName: "",
  });

  const handleOnChange = (field: string, input: string) => {
    setNameData((prev) => {
      return {
        ...prev,
        [field]: input,
      };
    });
  };

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  return (
    <main>
      <div className="flex justify-between bg-pink-300 p-4">
        <h1>{user.firstName}</h1>
        <SignOutButton />
      </div>
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="container flex flex-col items-center justify-center gap-6 px-4 py-16 ">
          {createWebsite.isPending && (
            <div className="flex items-center justify-center">
              <LoadingSpinner />
            </div>
          )}
          <h1 className="text-3xl">Welcome ya love birds! Enter your names</h1>
          <input
            placeholder="First name"
            className="w-64 rounded-md border-2 border-slate-400 p-4"
            value={nameData.firstName}
            onChange={(e) => handleOnChange("firstName", e.target.value)}
          />
          <input
            placeholder="Last name"
            className="w-64 rounded-md border-2 border-slate-400 p-4"
            value={nameData.lastName}
            onChange={(e) => handleOnChange("lastName", e.target.value)}
          />
          <input
            placeholder="Partner's first name"
            className="w-64 rounded-md border-2 border-slate-400 p-4"
            value={nameData.partnerFirstName}
            onChange={(e) => handleOnChange("partnerFirstName", e.target.value)}
          />
          <input
            placeholder="Partner's last name"
            className="w-64 rounded-md border-2 border-slate-400 p-4"
            value={nameData.partnerLastName}
            onChange={(e) => handleOnChange("partnerLastName", e.target.value)}
          />
          <button
            type="button"
            disabled={createWebsite.isPending}
            onClick={() =>
              createWebsite.mutate({
                ...nameData,
                basePath: window.location.origin,
                email: user.primaryEmailAddress?.emailAddress ?? "",
              })
            }
            className={`rounded-full bg-${sharedStyles.primaryColor} px-16 py-4 text-white`}
          >
            Create our website!
          </button>
        </div>
      </div>
    </main>
  );
}
