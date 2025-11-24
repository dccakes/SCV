import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import { useToggleEventForm } from "../../contexts/event-form-context";

const useEventFormActions = () => {
  const router = useRouter();
  const toggleEventForm = useToggleEventForm();

  const createEvent = api.event.create.useMutation({
    onSuccess: () => {
      toggleEventForm();
      router.refresh();
    },
    onError: (err) => {
      const errorMessage = err.data?.zodError?.fieldErrors?.eventName;
      if (errorMessage?.[0]) window.alert(errorMessage);
      else window.alert("Failed to create event! Please try again later.");
    },
  });

  const updateEvent = api.event.update.useMutation({
    onSuccess: () => {
      toggleEventForm();
      router.refresh();
    },
    onError: (err) => {
      const errorMessage = err.data?.zodError?.fieldErrors?.eventName;
      if (errorMessage?.[0]) window.alert(errorMessage);
      else window.alert("Failed to update event! Please try again later.");
    },
  });

  const deleteEvent = api.event.delete.useMutation({
    onSuccess: () => {
      toggleEventForm();
      router.refresh();
    },
    onError: (err) => {
      const errorMessage = err.data?.zodError?.fieldErrors?.eventName;
      if (errorMessage?.[0]) window.alert(errorMessage);
      else window.alert("Failed to delete event! Please try again later.");
    },
  });

  return {
    createEvent: createEvent.mutate,
    updateEvent: updateEvent.mutate,
    deleteEvent: deleteEvent.mutate,
    isCreatingEvent: createEvent.isPending,
    isUpdatingEvent: updateEvent.isPending,
    isDeletingEvent: deleteEvent.isPending,
  };
};

export { useEventFormActions };
