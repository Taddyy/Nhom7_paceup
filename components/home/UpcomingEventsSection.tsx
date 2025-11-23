import EventCard, { type EventCardProps } from '@/components/events/EventCard'

interface UpcomingEventsSectionProps {
  events: EventCardProps[]
}

/**
 * Upcoming events grid for the next 90 days.
 *
 * Renders cards in a responsive grid that mirrors the Figma layout (two rows of four).
 */
export default function UpcomingEventsSection({ events }: UpcomingEventsSectionProps) {
  return (
    <section className="w-full flex justify-center bg-white">
      <div className="w-full max-w-[1200px] px-4 md:px-0 py-10 flex flex-col gap-6 items-center">
        <div className="flex flex-col gap-4 items-center">
          <h2 className="font-semibold text-[32px] leading-[30px] text-center text-neutral-950 whitespace-nowrap">
            Lịch Sự Kiện 90 Ngày Tới
          </h2>
          <p className="font-normal text-base leading-6 text-center text-[#4a5565] max-w-[672px]">
            Khám phá và đăng ký tham gia các sự kiện chạy bộ hấp dẫn trên khắp Việt Nam
          </p>
        </div>

        <div className="w-full flex flex-col gap-10">
          {Array.from({ length: Math.ceil(events.length / 4) }).map((_, rowIndex) => (
            <div
              key={rowIndex}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6"
            >
              {events
                .slice(rowIndex * 4, (rowIndex + 1) * 4)
                .map((event) => (
                  <EventCard key={`${event.id}-${rowIndex}`} {...event} />
                ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}


