export interface EventDetailStat {
  label: string
  value: string
  caption?: string
}

export interface EventScheduleItem {
  time: string
  title: string
  description: string
}

export interface EventDetailContact {
  label: string
  value: string
  href?: string
}

export type EventDetailSection =
  | {
      type: 'image'
      id: string
      title: string
      description?: string
      image: string
      aspectRatio?: number
    }
  | {
      type: 'text'
      id: string
      title: string
      description?: string
      paragraphs?: string[]
      bullets?: string[]
      contacts?: EventDetailContact[]
      image?: string
    }
  | {
      type: 'gallery'
      id: string
      title: string
      description?: string
      images: string[]
    }

export interface EventDetailContent {
  heroImage: string
  logoImage?: string
  badges: string[]
  stats: EventDetailStat[]
  schedule: EventScheduleItem[]
  highlights: string[]
  amenities: Array<{ title: string; description: string }>
  route: {
    distance: string
    elevation: string
    hydrationPoints: string
    mapImage: string
  }
  raceKit: string[]
  gallery: string[]
  organizerNote: string
  eventTime?: string
  startLocation?: string
  finishLocation?: string
  summary?: string[]
  sections?: EventDetailSection[]
  communityStats?: Array<{ value: string; label: string }>
  newsletterCta?: {
    heading: string
    subheading: string
    placeholder?: string
    buttonLabel?: string
  }
}

const FIGMA_ASSETS = {
  heroMarathon: 'http://localhost:3845/assets/758e40716c21136fbea225c08347430dea16d070.png',
  priceBoard: 'http://localhost:3845/assets/ebba1dd18e4099178ec80d2436a850d9bd0b9de9.png',
  moreInfo1: 'http://localhost:3845/assets/7041f6d83ea225756aa76e29496e67c96249aa49.png',
  moreInfo2: 'http://localhost:3845/assets/fae08dcca275b84e202c760a03eef627765e5f67.png',
  moreInfo3: 'http://localhost:3845/assets/9687b14d3f6db877a3877e3eab2aff024c7f689e.png',
  rulesImage: 'http://localhost:3845/assets/54b55c14e931835519d42fcabfe186488620a6ba.png',
  raceKit: 'http://localhost:3845/assets/46e877495c531aaa7253ce37cff09c138d39a8c1.png',
  awardImage: 'http://localhost:3845/assets/16b0f2abd746ef5ba13751308edf46de072065a5.png'
}

const DEFAULT_EVENT_DETAIL: EventDetailContent = {
  heroImage: '/Image/Event.png',
  badges: ['Official', 'Certified route'],
  stats: [
    { label: 'Số người đã chạy', value: '5.000+' },
    { label: 'Cut-off time', value: '6h00' },
    { label: 'Pacer hỗ trợ', value: '3 nhóm' }
  ],
  schedule: [
    { time: '04:30', title: 'Check-in & warm-up', description: 'Nhận chip, gửi đồ và khởi động cùng huấn luyện viên.' },
    { time: '05:00', title: 'Xuất phát chính thức', description: 'Bắt đầu theo từng nhóm pace 4:30, 5:00, 5:30.' },
    { time: '08:00', title: 'Bế mạc & trao giải', description: 'Tổng kết thành tích, trao kỷ niệm chương và bốc thăm quà tặng.' }
  ],
  highlights: [
    'Cung đường chạy xuyên trung tâm thành phố.',
    'Hệ thống điểm tiếp nước mỗi 2km.',
    'Livestream trực tiếp trên PaceUp Studio.',
    'Gói race-kit thiết kế riêng cho từng nhóm cự ly.'
  ],
  amenities: [
    { title: 'Tiếp nước & dinh dưỡng', description: 'Nước điện giải, gel năng lượng và trái cây tươi.' },
    { title: 'Y tế & hồi phục', description: 'Đội cứu hộ lưu động và khu vực massage băng lạnh.' }
  ],
  route: {
    distance: '42.195 KM',
    elevation: '+240 m tổng độ cao',
    hydrationPoints: '12 trạm',
    mapImage: '/Image/Run 1.png'
  },
  raceKit: ['Áo finisher limited', 'Chip điện tử & số BIB', 'Túi đeo PaceUp', 'Voucher phục hồi 30 phút'],
  gallery: ['/Image/Run 2.png', '/Image/Run 3.png', '/Image/Run 4.png', '/Image/Run 5.png'],
  organizerNote: 'PaceUp phối hợp cùng Sở Văn hóa & Thể thao để bảo đảm an toàn cung đường.',
  summary: [],
  sections: [],
  communityStats: [
    { value: '50,000+', label: 'Thành viên cộng đồng' },
    { value: '200+', label: 'Sự kiện mỗi năm' },
    { value: '63', label: 'Tỉnh thành' }
  ],
  newsletterCta: {
    heading: 'Tham Gia Cộng Đồng Runner Việt Nam',
    subheading: 'Nhận thông tin sự kiện mới nhất và ưu đãi race-kit độc quyền.',
    placeholder: 'Email của bạn',
    buttonLabel: 'Đăng kí ngay'
  }
}

export const FALLBACK_EVENT_DETAILS: Record<string, EventDetailContent> = {
  'fallback-1': {
    ...DEFAULT_EVENT_DETAIL,
    heroImage: FIGMA_ASSETS.heroMarathon,
    badges: ['Techcombank', 'Nhịp tim Việt'],
    stats: [
      { label: 'Số người đăng kí', value: '200.000+' },
      { label: 'Phí tham gia', value: 'Miễn phí' },
      { label: 'Quyên góp', value: '10.000 VNĐ/km' }
    ],
    eventTime: '03:00 - 13:00, Chủ Nhật, 14/12/2025',
    startLocation: 'Dinh Độc Lập, Quận 1',
    finishLocation: 'Khu đô thị Empire City, TP. Thủ Đức',
    summary: [
      'Giải chạy “Chạy vì Trái tim Việt - Techcombank” 2025 là sự kiện hợp nhất hai giải chạy danh giá nhất Việt Nam, mang tinh thần vượt trội và sứ mệnh nhân văn.',
      'Với mỗi km hoàn thành, Techcombank đóng góp 10.000 VNĐ vào Quỹ Nhịp Tim Việt Nam để tài trợ phẫu thuật tim bẩm sinh cho trẻ em khó khăn.',
      'Cung đường chạy đi qua các biểu tượng của TP.HCM và kết thúc tại trung tâm Thủ Thiêm hiện đại.'
    ],
    route: {
      distance: '42.195 KM',
      elevation: '+180 m',
      hydrationPoints: '15 trạm',
      mapImage: FIGMA_ASSETS.moreInfo1
    },
    gallery: [
      FIGMA_ASSETS.moreInfo1,
      FIGMA_ASSETS.moreInfo2,
      FIGMA_ASSETS.moreInfo3
    ],
    organizerNote: 'Phối hợp cùng Techcombank và Quỹ Nhịp Tim Việt Nam để đảm bảo trải nghiệm an toàn, giàu tính nhân văn.',
    sections: [
      {
        type: 'image',
        id: 'pricing',
        title: 'Bảng giá vé',
        description: 'Thông tin chi tiết về mức phí và quyền lợi của từng cự ly.',
        image: FIGMA_ASSETS.priceBoard,
        aspectRatio: 1900 / 1235
      },
      {
        type: 'text',
        id: 'change-info',
        title: 'Thay đổi thông tin',
        paragraphs: [
          'Sau khi đăng ký, vận động viên không được hoàn phí hoặc chuyển nhượng BIB nếu không thể tham gia.',
          'Mọi yêu cầu thay đổi cự ly cần được gửi trước ngày 25/11/2025 và hoàn toàn miễn phí (chỉ thanh toán phần chênh lệch nếu đổi sang cự ly cao hơn).',
          'Đội ngũ Timve365 và Ban Tổ chức luôn sẵn sàng hỗ trợ vận động viên 24/7.'
        ],
        contacts: [
          { label: 'Hotline Timve365', value: '0977 005 090 (Zalo)' },
          { label: 'Email Timve365', value: 'info@timve365.vn', href: 'mailto:info@timve365.vn' },
          { label: 'Hotline BTC', value: '028 3724 4270 (3334)' },
          { label: 'Email BTC', value: 'oss@hcmiu.edu.vn', href: 'mailto:oss@hcmiu.edu.vn' }
        ]
      },
      {
        type: 'gallery',
        id: 'extended-info',
        title: 'Thông tin mở rộng',
        description: 'Bản đồ đường chạy và các mốc quan trọng cho runner.',
        images: [FIGMA_ASSETS.moreInfo1, FIGMA_ASSETS.moreInfo2, FIGMA_ASSETS.moreInfo3]
      },
      {
        type: 'text',
        id: 'rules',
        title: 'Quy định',
        paragraphs: [
          'Giải chạy dành cho sinh viên, cựu sinh viên, cán bộ viên chức ĐHQG-HCM và cộng đồng runner trên toàn quốc.',
          'Vận động viên phải ký cam kết sức khỏe, tuân thủ hướng dẫn của BTC và các mốc kiểm soát.',
          'Mọi hành vi gian lận, sử dụng chất kích thích, hoặc gây rối sẽ bị loại khỏi giải và không hoàn phí.'
        ],
        bullets: [
          'Đăng ký qua cổng Timve365.vn với thông tin chính xác.',
          'Không sử dụng phương tiện có bánh xe, không chuyển BIB.',
          'Phải đeo BIB trước ngực và chạy đúng lộ trình.',
          'Được nhận thưởng tiền mặt/hiện vật trong vòng 45 ngày sau sự kiện.'
        ],
        image: FIGMA_ASSETS.rulesImage
      },
      {
        type: 'image',
        id: 'racekit',
        title: 'Racekit',
        description: 'Full racekit dành cho các nhóm cự ly.',
        image: FIGMA_ASSETS.raceKit
      },
      {
        type: 'image',
        id: 'awards',
        title: 'Giải thưởng',
        description: 'Cơ cấu giải thưởng cho từng cự ly và nhóm tuổi.',
        image: FIGMA_ASSETS.awardImage,
        aspectRatio: 1900 / 3228
      },
      {
        type: 'text',
        id: 'organizers',
        title: 'Ban tổ chức',
        paragraphs: [
          'Trường Đại học Quốc tế – Đại học Quốc gia TP.HCM',
          'Phòng Công tác Sinh viên – Đoàn Thanh niên – Hội Sinh viên'
        ]
      }
    ],
    communityStats: [
      { value: '50,000+', label: 'Thành viên cộng đồng' },
      { value: '200+', label: 'Sự kiện mỗi năm' },
      { value: '63', label: 'Tỉnh thành' }
    ],
    newsletterCta: {
      heading: 'Tham Gia Cộng Đồng Runner Việt Nam',
      subheading:
        'Kết nối với hàng nghìn vận động viên, nhận thông tin sự kiện mới nhất và tham gia các giải chạy hấp dẫn trên khắp cả nước',
      placeholder: 'Email của bạn',
      buttonLabel: 'Đăng kí ngay'
    }
  },
  'fallback-2': {
    ...DEFAULT_EVENT_DETAIL,
    heroImage: '/Image/Run 2.png',
    badges: ['Night run', 'LED experience'],
    stats: [
      { label: 'Runner tham gia', value: '4.200+' },
      { label: 'Giới hạn thời gian', value: '3h30' },
      { label: 'Check-point ánh sáng', value: '6 điểm' }
    ],
    route: {
      distance: '21 KM',
      elevation: '+60 m',
      hydrationPoints: '10 trạm',
      mapImage: '/Image/Run 3.png'
    },
    gallery: ['/Image/Run 2.png', '/Image/Run 4.png', '/Image/Run 5.png', '/Image/Run 6.png'],
    organizerNote: 'Sử dụng hệ thống đèn LED đổi màu trên toàn bộ cầu Rồng.'
  },
  'fallback-3': {
    ...DEFAULT_EVENT_DETAIL,
    heroImage: '/Image/Run 3.png',
    badges: ['Di sản', 'Sunrise run'],
    stats: [
      { label: 'Runner tham gia', value: '3.000+' },
      { label: 'Địa hình', value: 'Kết hợp cầu & phố cổ' },
      { label: 'Nhiệt độ dự kiến', value: '21°C' }
    ],
    route: {
      distance: '10 KM',
      elevation: '+120 m',
      hydrationPoints: '8 trạm',
      mapImage: '/Image/Run 4.png'
    },
    gallery: ['/Image/Run 3.png', '/Image/Run 2.png', '/Image/Run 5.png', '/Image/Run 6.png'],
    organizerNote: 'Đường chạy đi qua Hoàng thành Huế với dàn nhạc cung đình cổ động.'
  },
  'fallback-4': {
    ...DEFAULT_EVENT_DETAIL,
    heroImage: '/Image/Run 4.png',
    badges: ['Trail 42K', 'Altitude 1.600m'],
    stats: [
      { label: 'Runner tham gia', value: '1.500+' },
      { label: 'Độ cao tích lũy', value: '+1.800 m' },
      { label: 'Checkpoint kỹ thuật', value: '5 đoạn' }
    ],
    route: {
      distance: '42 KM',
      elevation: '+1.800 m',
      hydrationPoints: '9 trạm',
      mapImage: '/Image/Run 5.png'
    },
    gallery: ['/Image/Run 4.png', '/Image/Run 5.png', '/Image/Run 6.png', '/Image/Run 3.png'],
    organizerNote: 'Đội kỹ thuật dựng rope support tại những đoạn dốc trên 25%.'
  },
  'fallback-5': {
    ...DEFAULT_EVENT_DETAIL,
    heroImage: '/Image/Run 5.png',
    badges: ['Tech expo', 'Smart pacing'],
    stats: [
      { label: 'Runner tham gia', value: '5.600+' },
      { label: 'Thiết bị hỗ trợ', value: 'Chip NFC' },
      { label: 'Trải nghiệm AR', value: '3 khu' }
    ],
    route: {
      distance: '5 KM',
      elevation: '+40 m',
      hydrationPoints: '5 trạm',
      mapImage: '/Image/Run 6.png'
    },
    gallery: ['/Image/Run 5.png', '/Image/Run 1.png', '/Image/Run 2.png', '/Image/Run 6.png'],
    organizerNote: 'Khu expo mở cửa 48 giờ trước giờ start để runner trải nghiệm thiết bị mới.'
  },
  'fallback-6': {
    ...DEFAULT_EVENT_DETAIL,
    heroImage: '/Image/Run 6.png',
    badges: ['Song nước', 'Local food fair'],
    stats: [
      { label: 'Runner tham gia', value: '3.500+' },
      { label: 'Thời tiết dự kiến', value: '24-27°C' },
      { label: 'Điểm cổ vũ', value: '8 đội đờn ca tài tử' }
    ],
    route: {
      distance: '10 KM',
      elevation: '+30 m',
      hydrationPoints: '7 trạm',
      mapImage: '/Image/Run 1.png'
    },
    gallery: ['/Image/Run 6.png', '/Image/Run 2.png', '/Image/Run 3.png', '/Image/Run 4.png'],
    organizerNote: 'Hợp tác cùng các lò bánh dân gian phục vụ runner tại vạch đích.'
  },
  'fallback-7': {
    ...DEFAULT_EVENT_DETAIL,
    heroImage: '/Image/Run 1.png',
    badges: ['Beach night', 'Music stage'],
    stats: [
      { label: 'Runner tham gia', value: '4.100+' },
      { label: 'Âm nhạc', value: '3 sân khấu' },
      { label: 'Nhiệt độ', value: '26°C' }
    ],
    route: {
      distance: '10 KM',
      elevation: '+20 m',
      hydrationPoints: '6 trạm',
      mapImage: '/Image/Run 3.png'
    },
    gallery: ['/Image/Run 1.png', '/Image/Run 4.png', '/Image/Run 5.png', '/Image/Run 6.png'],
    organizerNote: 'Kết hợp countdown party ngay sau khi runner hoàn thành cự ly.'
  },
  'fallback-8': {
    ...DEFAULT_EVENT_DETAIL,
    heroImage: '/Image/Run 3.png',
    badges: ['Half marathon', 'Historic bridge'],
    stats: [
      { label: 'Runner tham gia', value: '4.500+' },
      { label: 'Năm tổ chức', value: 'Lần thứ 8' },
      { label: 'Giới hạn giờ', value: '3h00' }
    ],
    route: {
      distance: '21 KM',
      elevation: '+110 m',
      hydrationPoints: '9 trạm',
      mapImage: '/Image/Run 2.png'
    },
    gallery: ['/Image/Run 3.png', '/Image/Run 2.png', '/Image/Run 4.png', '/Image/Run 1.png'],
    organizerNote: 'Kết hợp hoạt động chạy vì môi trường, thu gom rác sau sự kiện.'
  }
}

export function getFallbackEventDetail(eventId: string): EventDetailContent {
  return FALLBACK_EVENT_DETAILS[eventId] ?? DEFAULT_EVENT_DETAIL
}

