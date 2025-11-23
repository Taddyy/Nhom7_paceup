export interface FallbackEventDetail {
  id: string
  title: string
  description: string
  fullDescription: string
  date: string
  time: string
  location: string
  address: string
  image: string
  participants: number
  maxParticipants: number
  distance: string
  status: 'open' | 'closed'
  categories: string[]
  registrationDeadline: string
}

const baseDescription = `Đường chạy được thiết kế theo chuẩn IAAF với khu vực check-in, gửi đồ và chăm sóc hậu cần đầy đủ. Runner sẽ đi qua các điểm biểu tượng của thành phố với sự hỗ trợ của đội cổ vũ địa phương.`

export const FALLBACK_EVENT_DETAILS_MAP: Record<string, FallbackEventDetail> = {
  'fallback-1': {
    id: 'fallback-1',
    title: 'Marathon Thành Phố HCM',
    description: 'Đường chạy iconic giữa lòng Sài Gòn với hơn 10.000 vận động viên.',
    fullDescription: `${baseDescription}\n\nCự ly 42K băng qua các trục đường trung tâm như Nguyễn Huệ, Lê Duẩn và cầu Thủ Thiêm. Các nhóm pacer 4:30 - 6:30 sẽ dẫn runner về đích đúng target.`,
    date: '15 Tháng 12, 2024',
    time: '05:00 - 11:30',
    location: 'TP. Hồ Chí Minh',
    address: 'Phố đi bộ Nguyễn Huệ, Quận 1',
    image: '/Image/Event.png',
    participants: 5000,
    maxParticipants: 8000,
    distance: '42K',
    status: 'open',
    categories: ['5K', '10K', '21K', '42K'],
    registrationDeadline: '01 Tháng 12, 2024'
  },
  'fallback-2': {
    id: 'fallback-2',
    title: 'Run To The Light Đà Nẵng',
    description: 'Giải chạy đêm ven sông Hàn với hiệu ứng ánh sáng đặc biệt.',
    fullDescription: `${baseDescription}\n\nRunner sẽ xuất phát lúc 20:00 và tận hưởng show ánh sáng tương tác trên cầu Rồng sau khi về đích.`,
    date: '05 Tháng 01, 2025',
    time: '20:00 - 23:30',
    location: 'Đà Nẵng',
    address: 'Công viên APEC, Quận Hải Châu',
    image: '/Image/Run 2.png',
    participants: 2200,
    maxParticipants: 4000,
    distance: '21K',
    status: 'open',
    categories: ['5K', '10K', '21K'],
    registrationDeadline: '20 Tháng 12, 2024'
  },
  'fallback-3': {
    id: 'fallback-3',
    title: 'Hue Ancient Run',
    description: 'Khám phá Hoàng thành Huế qua từng bước chạy.',
    fullDescription: `${baseDescription}\n\nĐiểm nhấn là đoạn đường xuyên Hoàng thành và khu Phu Văn Lâu khi bình minh lên.`,
    date: '19 Tháng 01, 2025',
    time: '05:30 - 09:30',
    location: 'Huế',
    address: 'Quảng trường Ngọ Môn',
    image: '/Image/Run 3.png',
    participants: 1800,
    maxParticipants: 3000,
    distance: '10K',
    status: 'open',
    categories: ['5K', '10K', '21K'],
    registrationDeadline: '03 Tháng 01, 2025'
  },
  'fallback-4': {
    id: 'fallback-4',
    title: 'Sa Pa Trail Challenge',
    description: 'Đường trail đầy thử thách với khí hậu mát lạnh vùng cao.',
    fullDescription: `${baseDescription}\n\nRunner băng qua các bản làng và ruộng bậc thang với checkpoint tiếp nước cách nhau 5km.`,
    date: '26 Tháng 01, 2025',
    time: '04:00 - 15:00',
    location: 'Sa Pa',
    address: 'Quảng trường trung tâm Sa Pa',
    image: '/Image/Run 4.png',
    participants: 1200,
    maxParticipants: 2500,
    distance: '42K',
    status: 'open',
    categories: ['12K', '21K', '42K'],
    registrationDeadline: '10 Tháng 01, 2025'
  },
  'fallback-5': {
    id: 'fallback-5',
    title: 'Tech Run Hà Nội',
    description: 'Giải chạy công nghệ với nhiều hoạt động tương tác.',
    fullDescription: `${baseDescription}\n\nChip NFC tích hợp trong BIB cho phép live-tracking và nhận quà tại các booth công nghệ.`,
    date: '02 Tháng 02, 2025',
    time: '06:00 - 10:00',
    location: 'Hà Nội',
    address: 'SVĐ Mỹ Đình',
    image: '/Image/Run 5.png',
    participants: 2600,
    maxParticipants: 5000,
    distance: '5K',
    status: 'open',
    categories: ['3K', '5K', '10K'],
    registrationDeadline: '20 Tháng 01, 2025'
  },
  'fallback-6': {
    id: 'fallback-6',
    title: 'Mekong Delta Run',
    description: 'Chạy dọc bờ sông, thưởng thức đặc sản miền Tây.',
    fullDescription: `${baseDescription}\n\nRunner được sắp xếp đội chèo ghe hỗ trợ tại các đoạn ven sông dài.`,
    date: '09 Tháng 02, 2025',
    time: '05:00 - 09:30',
    location: 'Cần Thơ',
    address: 'Bến Ninh Kiều',
    image: '/Image/Run 6.png',
    participants: 1500,
    maxParticipants: 3500,
    distance: '10K',
    status: 'open',
    categories: ['5K', '10K', '21K'],
    registrationDeadline: '25 Tháng 01, 2025'
  },
  'fallback-7': {
    id: 'fallback-7',
    title: 'Night Run Nha Trang',
    description: 'Đường chạy ven biển về đêm với hoạt động âm nhạc biển.',
    fullDescription: `${baseDescription}\n\nChặng đường 10K dọc biển Trần Phú kết hợp beach party ngay vạch đích.`,
    date: '16 Tháng 02, 2025',
    time: '19:30 - 23:00',
    location: 'Nha Trang',
    address: 'Quảng trường 2/4',
    image: '/Image/Run 1.png',
    participants: 2100,
    maxParticipants: 3200,
    distance: '10K',
    status: 'open',
    categories: ['5K', '10K'],
    registrationDeadline: '01 Tháng 02, 2025'
  },
  'fallback-8': {
    id: 'fallback-8',
    title: 'Long Biên Half Marathon',
    description: 'Giải bán marathon phủ kín cầu Long Biên lịch sử.',
    fullDescription: `${baseDescription}\n\nRunner trải nghiệm khoảnh khắc mặt trời mọc trên cầu Long Biên với hệ thống đèn dây cổ điển.`,
    date: '02 Tháng 03, 2025',
    time: '05:00 - 10:30',
    location: 'Hà Nội',
    address: 'Cầu Long Biên',
    image: '/Image/Run 6.png',
    participants: 3100,
    maxParticipants: 4500,
    distance: '21K',
    status: 'open',
    categories: ['10K', '21K'],
    registrationDeadline: '15 Tháng 02, 2025'
  }
}

export const FALLBACK_EVENT_LIST = Object.values(FALLBACK_EVENT_DETAILS_MAP).map((event) => ({
  id: event.id,
  title: event.title,
  description: event.description,
  date: event.date,
  location: event.location,
  image: event.image,
  participants: event.participants,
  maxParticipants: event.maxParticipants,
  distance: event.distance,
  status: event.status
}))

