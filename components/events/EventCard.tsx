import Image from 'next/image'
import Link from 'next/link'

/**
 * Event Card component matching Figma design
 *
 * Displays event card with image, badges, title, and details.
 */
export interface EventCardProps {
  id: string
  title: string
  image?: string
  date: string
  location: string
  participants: number
  distance?: string
  status?: 'open' | 'closed'
}

export default function EventCard({
  id,
  title,
  image = '/Image/Event.png',
  date,
  location,
  participants,
  distance = '42K',
  status = 'open'
}: EventCardProps) {
  return (
    <Link href={`/events/${id}`} className="bg-white border border-[#cbcbcb] rounded-[24px] p-4 flex flex-col gap-4 relative shadow-[inset_-4px_-4px_12px_0px_rgba(132,132,132,0.25),inset_5px_4px_4px_0px_rgba(255,255,255,0.25)] hover:shadow-lg transition-shadow">
      {/* Event Image */}
      <div className="h-[150px] relative rounded-[16px] overflow-hidden w-full">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover"
        />
      </div>

      {/* Badges */}
      <div className="flex items-center justify-between w-full">
        {distance && (
          <div className="bg-[#030213] rounded px-2.5 py-1">
            <span className="font-normal text-xs text-white whitespace-nowrap">
              {distance}
            </span>
          </div>
        )}
        {status === 'open' && (
          <div className="bg-[#d1fec6] border border-[#388512] rounded px-2.5 py-1">
            <span className="font-normal text-xs text-[#388512] whitespace-nowrap">
              Đang mở
            </span>
          </div>
        )}
      </div>

      {/* Title */}
      <h3 className="font-normal text-base leading-6 text-neutral-950 line-clamp-1">
        {title}
      </h3>

      {/* Details */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-2 items-center">
          <svg className="w-4 h-4 text-[#4a5565]" viewBox="0 0 16 16" fill="none">
            <path d="M8 0C3.6 0 0 3.6 0 8C0 12.4 8 16 8 16C8 16 16 12.4 16 8C16 3.6 12.4 0 8 0Z" fill="#4a5565"/>
            <circle cx="8" cy="8" r="2" fill="white"/>
          </svg>
          <span className="font-normal text-base text-[#4a5565] whitespace-nowrap">
            {date}
          </span>
        </div>
        <div className="flex gap-2 items-center">
          <svg className="w-4 h-4 text-[#4a5565]" viewBox="0 0 16 16" fill="none">
            <path d="M0 2L2 0L8 6L14 0L16 2L10 8L16 14L14 16L8 10L2 16L0 14L6 8L0 2Z" fill="#4a5565"/>
          </svg>
          <span className="font-normal text-base text-[#4a5565] whitespace-nowrap">
            {location}
          </span>
        </div>
        <div className="flex gap-2 items-center">
          <svg className="w-4 h-4 text-[#4a5565]" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" stroke="#4a5565" strokeWidth="2"/>
            <path d="M8 4V8L11 11" stroke="#4a5565" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span className="font-normal text-base text-[#4a5565] whitespace-nowrap">
            {participants.toLocaleString('vi-VN')} người tham gia
          </span>
        </div>
      </div>

      {/* CTA Button */}
      <button className="bg-[#1c1c1c] flex items-center justify-center px-4 py-2 rounded-lg relative shadow-[inset_-4px_-4px_4px_0px_rgba(0,0,0,0.4),inset_4px_4px_6px_0px_rgba(255,255,255,0.15)] w-full">
        <span className="font-medium text-sm text-white uppercase whitespace-nowrap">
          Đăng kí ngay
        </span>
      </button>
    </Link>
  )
}

