import { sharedStyles } from '~/app/utils/shared-styles'

export default function DashboardSkeleton() {
  return (
    <div className="pt-10">
      <div
        role="status"
        className="flex animate-pulse flex-col space-y-8 md:space-y-0 rtl:space-x-reverse"
      >
        {/* header  */}
        <section className="border-b pb-10">
          <div
            className={`${sharedStyles.desktopPaddingSides} ${sharedStyles.minPageWidth} flex items-center justify-between`}
          >
            <div>
              <div className="mb-4 h-10 w-40 bg-gray-200 dark:bg-gray-700"></div>
              <div className="mt-2 flex gap-5">
                <div className="mb-2.5 h-4 w-80 bg-gray-200 dark:bg-gray-700"></div>
                <div className="mb-2.5 h-4 w-16 bg-gray-200 dark:bg-gray-700"></div>
                <div className="mb-2.5 h-4 w-16 bg-gray-200 dark:bg-gray-700"></div>
              </div>
            </div>
            <div className="flex gap-5">
              <div className="mb-2.5 h-12 w-56 rounded-full bg-gray-200 dark:bg-gray-700"></div>
              <div className="mb-2.5 h-12 w-44 rounded-full bg-gray-200 dark:bg-gray-700"></div>
            </div>
          </div>
        </section>

        {/* registry setup */}
        <section className="border-b py-10">
          <div className={`${sharedStyles.desktopPaddingSides} ${sharedStyles.minPageWidth} flex`}>
            <div className="flex h-32 w-32 items-center justify-center rounded bg-gray-300 dark:bg-gray-700">
              <svg
                className="w-18 h-8 text-gray-200 dark:text-gray-600"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 20 18"
              >
                <path d="M18 0H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2Zm-5.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm4.376 10.481A1 1 0 0 1 16 15H4a1 1 0 0 1-.895-1.447l3.5-7A1 1 0 0 1 7.468 6a.965.965 0 0 1 .9.5l2.775 4.757 1.546-1.887a1 1 0 0 1 1.618.1l2.541 4a1 1 0 0 1 .028 1.011Z" />
              </svg>
            </div>
            <div className="ml-10 flex flex-col gap-3">
              <div className="mb-4 h-7 w-80 bg-gray-200 dark:bg-gray-700"></div>
              <div className="mb-2.5 h-4 w-[500px] bg-gray-200 dark:bg-gray-700"></div>
              <div>
                <div className="flex gap-5">
                  <div className="mb-2.5 h-7 w-32 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                  <div className="mb-2.5 h-7 w-32 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* top of home section */}
        <section
          className={`grid grid-cols-[3fr_275px] gap-7 pt-14 ${sharedStyles.desktopPaddingSides} ${sharedStyles.minPageWidth}`}
        >
          <div>
            <div className="flex justify-between pb-3">
              <div className="mb-4 h-7 w-16 bg-gray-200 dark:bg-gray-700"></div>
              {/* dashboard controls */}
              <div className="flex gap-3">
                <div className="mb-4 h-7 w-16 bg-gray-200 dark:bg-gray-700"></div>
                <div className="mb-4 h-7 w-16 bg-gray-200 dark:bg-gray-700"></div>
              </div>
            </div>
            {/* home content */}
            <div className="w-full border p-7">
              <div className="flex justify-between py-2">
                <div className="flex gap-3">
                  <div className="mb-4 h-7 w-7 bg-gray-200 dark:bg-gray-700"></div>
                  <div className="mb-4 h-7 w-16 bg-gray-200 dark:bg-gray-700"></div>
                </div>
                <div className="mb-4 h-7 w-24 bg-gray-200 dark:bg-gray-700"></div>
              </div>
              <div className="flex h-40 w-full items-center justify-center rounded bg-gray-300 dark:bg-gray-700">
                <svg
                  className="h-12 w-24 text-gray-200 dark:text-gray-600"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 20 18"
                >
                  <path d="M18 0H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2Zm-5.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm4.376 10.481A1 1 0 0 1 16 15H4a1 1 0 0 1-.895-1.447l3.5-7A1 1 0 0 1 7.468 6a.965.965 0 0 1 .9.5l2.775 4.757 1.546-1.887a1 1 0 0 1 1.618.1l2.541 4a1 1 0 0 1 .028 1.011Z" />
                </svg>
              </div>
            </div>
          </div>

          {/* sidebar panel */}
          <section className="px-3">
            <div className="flex items-end justify-between gap-5 border-b pb-8">
              <div className="mb-4 h-7 w-32 bg-gray-200 dark:bg-gray-700"></div>
              <div className="mb-4 h-7 w-32 bg-gray-200 dark:bg-gray-700"></div>
            </div>
            <div className="flex items-end justify-between gap-5 border-b py-8">
              <div className="mb-4 h-7 w-32 bg-gray-200 dark:bg-gray-700"></div>
              <div className="mb-4 h-7 w-32 bg-gray-200 dark:bg-gray-700"></div>
            </div>
          </section>
        </section>
      </div>
    </div>
  )
}
