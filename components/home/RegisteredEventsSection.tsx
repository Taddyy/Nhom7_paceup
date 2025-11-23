import Image from 'next/image'
import type { EventCardProps } from '@/components/events/EventCard'

interface RegisteredEventsSectionProps {
  events: EventCardProps[]
}

/**
 * Highlight section for events the user already registered.
 *
 * Mirrors the hero-adjacent cards in Figma with a horizontal scroll list.
 */
export default function RegisteredEventsSection({ events }: RegisteredEventsSectionProps) {
  return (
    <section className="w-full flex justify-center bg-white">
      <div className="w-full max-w-[1200px] px-4 md:px-0 py-10 flex flex-col gap-6">
        <div className="flex flex-col gap-2 text-left">
          <p className="font-semibold text-[32px] leading-[30px] text-neutral-950">
            Sự kiện bạn đã đăng kí
          </p>
          <p className="font-normal text-base text-[#4a5565]">
            Theo dõi các giải đã tham gia và tiếp tục luyện tập cho thành tích kế tiếp.
          </p>
        </div>

        <div className="w-full overflow-x-auto pb-4">
          <div className="flex gap-6 min-w-full snap-x snap-mandatory">
            {events.map((event) => {
              const eventMeta = [
                {
                  label: event.date,
                  icon: (
                    <svg className="w-4 h-4 text-white" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M8 0C3.6 0 0 3.6 0 8C0 12.4 8 16 8 16C8 16 16 12.4 16 8C16 3.6 12.4 0 8 0Z" fill="currentColor" />
                      <circle cx="8" cy="8" r="2" fill="#424242" />
                    </svg>
                  )
                },
                {
                  label: event.location,
                  icon: (
                    <svg className="w-4 h-4 text-white" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M0 2L2 0L8 6L14 0L16 2L10 8L16 14L14 16L8 10L2 16L0 14L6 8L0 2Z" fill="currentColor" />
                    </svg>
                  )
                },
                {
                  label: `${event.participants.toLocaleString('vi-VN')} người tham gia`,
                  icon: (
                    <svg className="w-4 h-4 text-white" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <circle cx="8" cy="8" r="7" stroke="white" strokeWidth="2" />
                      <path d="M8 4V8L11 11" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  )
                }
              ]

              return (
                <article
                  key={event.id}
                  className="relative h-[320px] min-w-[320px] md:min-w-[520px] lg:min-w-[572px] rounded-[24px] overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.15)] snap-start"
                >
                  <Image
                    src={event.image ?? '/Image/Event.png'}
                    alt={event.title}
                    fill
                    sizes="(max-width: 768px) 320px, 572px"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 backdrop-blur-md bg-gradient-to-b from-[rgba(255,255,255,0.5)] to-[rgba(255,255,255,0.12)] border-t border-[rgba(255,255,255,0.1)] p-6">
                    <h3 className="font-normal text-base leading-6 text-white mb-4">
                      {event.title}
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {eventMeta.map((item) => (
                        <div key={`${event.id}-${item.label}`} className="flex gap-2 items-center text-white">
                          {item.icon}
                          <span className="font-normal text-base whitespace-nowrap">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
