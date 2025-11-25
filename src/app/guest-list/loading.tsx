import { sharedStyles } from '~/app/utils/shared-styles'

export default function GuestListSkeleton() {
  return (
    <div className={`pt-10 ${sharedStyles.desktopPaddingSidesGuestList}`}>
      <div
        role="status"
        className="flex animate-pulse flex-col space-y-8 md:space-y-0 rtl:space-x-reverse"
      >
        {/* EventTabs */}
        <div className="border-b">
          <ul className="flex gap-5">
            <div className="mb-4 h-7 w-20 bg-gray-200 dark:bg-gray-700"></div>
            <div className="mb-4 h-7 w-28 bg-gray-200 dark:bg-gray-700"></div>
            <div className="mb-4 h-7 w-24 bg-gray-200 dark:bg-gray-700"></div>
            <div className="mb-4 h-7 w-32 bg-gray-200 dark:bg-gray-700"></div>
          </ul>
        </div>

        {/* GuestTable */}
        <section>
          {/* DefaultTableHeader */}
          <div className="flex gap-7 py-8">
            <div className="mb-4 h-5 w-48 bg-gray-200 dark:bg-gray-700"></div>
            <div className="mb-4 h-5 w-40 bg-gray-200 dark:bg-gray-700"></div>
            <div className="mb-4 h-5 w-40 bg-gray-200 dark:bg-gray-700"></div>
          </div>

          {/* GuestSearchFilter */}
          <div className="flex justify-between">
            <div className="flex items-center gap-8">
              <div className="mb-4 h-12 w-80 bg-gray-200 dark:bg-gray-700"></div>
              <div className="mb-4 h-12 w-56 bg-gray-200 dark:bg-gray-700"></div>
            </div>
            <div className="flex gap-5">
              <div className="mb-2.5 h-12 w-44 rounded-full bg-gray-200 dark:bg-gray-700"></div>
              <div className="mb-2.5 h-12 w-36 rounded-full bg-gray-200 dark:bg-gray-700"></div>
            </div>
          </div>

          <div className="max-h-[75vh] overflow-auto">
            <div>
              <div>
                {/* TableHeadings */}
                <div
                  className="sticky top-0 grid min-w-fit items-center gap-12 border-b bg-white px-8 py-6 italic text-gray-600"
                  style={{
                    gridTemplateColumns: '40px 240px 100px 125px repeat(2, 175px) 175px',
                  }}
                >
                  <div className="h-7 w-7 bg-gray-200 dark:bg-gray-700"></div>
                  <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700"></div>
                  <div className="h-5 w-28 bg-gray-200 dark:bg-gray-700"></div>
                  <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700"></div>
                  <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700"></div>
                  <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700"></div>
                  <div className="h-5 w-28 bg-gray-200 dark:bg-gray-700"></div>
                </div>

                {/* TableRows */}
                {[1, 2, 3, 4, 5].map((count, i) => {
                  return (
                    <div
                      key={i}
                      className="box-border grid min-w-fit items-center gap-12 border-b border-l border-r px-8 py-5"
                      style={{
                        gridTemplateColumns: `40px 240px 100px 125px repeat(2, 175px) 175px`,
                      }}
                    >
                      <div className="h-7 w-7 bg-gray-200 dark:bg-gray-700"></div>
                      <div className="h-5 w-36 bg-gray-200 dark:bg-gray-700"></div>
                      <div className="h-5 w-3 bg-gray-200 dark:bg-gray-700"></div>

                      <div className="flex gap-2">
                        <div className="h-7 w-7 bg-gray-200 dark:bg-gray-700"></div>
                        <div className="h-7 w-7 bg-gray-200 dark:bg-gray-700"></div>
                        <div className="h-7 w-7 bg-gray-200 dark:bg-gray-700"></div>
                      </div>

                      <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700"></div>
                      <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700"></div>
                      <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700"></div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
