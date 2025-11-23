/**
 * Features section component
 * 
 * Displays key features of the PaceUp platform.
 */
export default function FeaturesSection() {
  const features = [
    {
      title: 'Sự kiện chạy bộ',
      description: 'Tham gia các sự kiện chạy bộ được tổ chức thường xuyên',
      icon: '🏃',
    },
    {
      title: 'Blog chia sẻ',
      description: 'Đọc và chia sẻ kinh nghiệm chạy bộ từ cộng đồng',
      icon: '📝',
    },
    {
      title: 'Cộng đồng',
      description: 'Kết nối với những người yêu thích chạy bộ',
      icon: '👥',
    },
    {
      title: 'Theo dõi tiến độ',
      description: 'Theo dõi và cải thiện thành tích chạy bộ của bạn',
      icon: '📊',
    },
  ]

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Tính năng nổi bật
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

