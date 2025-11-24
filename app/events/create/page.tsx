'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray, Control } from 'react-hook-form'
import Link from 'next/link'
import Toast from '@/components/ui/Toast'
import { type CreateEventRequest, createEvent } from '@/lib/api/events'

import RouteSelector from '@/components/events/RouteSelector'

// Component to manage dynamic schedule list
function ScheduleFields({ control, register, errors }: { control: Control<CreateEventRequest>; register: any; errors: any }) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'schedule' as any
  })

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-neutral-700">Lịch trình sự kiện</label>
      {fields.map((field, index) => (
        <div key={field.id} className="flex gap-3">
          <div className="w-1/4">
            <input
              {...register(`schedule.${index}.time` as const)}
              placeholder="05:00"
              className="w-full rounded-[12px] border border-neutral-200 px-4 py-3 outline-none text-[#000] focus:text-[#212121] focus:border-[#1c1c1c] focus:ring-1 focus:ring-[#1c1c1c] transition-all"
            />
          </div>
          <div className="flex-1">
            <input
              {...register(`schedule.${index}.activity` as const)}
              placeholder="Hoạt động (VD: Xuất phát)"
              className="w-full rounded-[12px] border border-neutral-200 px-4 py-3 outline-none text-[#000] focus:text-[#212121] focus:border-[#1c1c1c] focus:ring-1 focus:ring-[#1c1c1c] transition-all"
            />
          </div>
          <button
            type="button"
            onClick={() => remove(index)}
            className="flex items-center justify-center px-2 text-red-500 hover:text-red-700"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => append({ time: '', activity: '' })}
        className="text-sm font-medium text-[#1c1c1c] hover:underline"
      >
        + Thêm mốc thời gian
      </button>
    </div>
  )
}

export default function CreateEventPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showToast, setShowToast] = useState(false)
  
  const { register, handleSubmit, control, setValue, watch, formState: { errors } } = useForm<CreateEventRequest>({
    defaultValues: {
      schedule: [{ time: '05:00', activity: '' }]
    }
  })

  const routeMapUrl = watch('route_map_url')

  const handleRouteSelect = (start: {lat: number, lng: number} | null, end: {lat: number, lng: number} | null) => {
    if (start) {
      // Lưu tọa độ start vào form, ví dụ field 'address' hoặc một field hidden mới
      // Ở đây tạm thời gán vào address để user thấy
      setValue('address', `Lat: ${start.lat.toFixed(5)}, Lng: ${start.lng.toFixed(5)}`) 
    }
    if (end) {
      setValue('finish_location', `Lat: ${end.lat.toFixed(5)}, Lng: ${end.lng.toFixed(5)}`)
    }
  }

  const onSubmit = async (data: CreateEventRequest) => {
    try {
      setIsSubmitting(true)
      
      const formattedData: CreateEventRequest = {
        ...data,
        categories: Array.isArray(data.categories) ? data.categories : (data.categories as unknown as string).split(',').map(s => s.trim()),
        badges: data.badges ? (data.badges as unknown as string).split(',').map(s => s.trim()) : [],
        highlights: data.highlights ? (data.highlights as unknown as string).split(',').map(s => s.trim()) : [],
        race_kit_items: data.race_kit_items ? (data.race_kit_items as unknown as string).split(',').map(s => s.trim()) : [],
        max_participants: Number(data.max_participants),
        hydration_points: data.hydration_points ? Number(data.hydration_points) : 0,
      }

      // Call API to create event
      await createEvent(formattedData)
      
      setShowToast(true)
      setTimeout(() => {
        router.push('/events')
      }, 1500)
      
    } catch (error: any) {
      console.error('Failed to create event', error)
      setShowToast(true)
      alert(error?.response?.data?.detail || 'Có lỗi xảy ra khi tạo sự kiện. Vui lòng thử lại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] pt-[120px] pb-20">
      <Toast 
        message={showToast ? 'Tạo sự kiện thành công!' : ''}
        type="success"
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
      <div className="mx-auto max-w-[800px] px-4">
        <div className="mb-8">
          <Link 
            href="/events" 
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Quay lại danh sách
          </Link>
          <h1 className="text-3xl font-bold text-[#1c1c1c]">Tạo giải chạy mới</h1>
          <p className="mt-2 text-neutral-600">Điền đầy đủ thông tin để tạo trang chi tiết sự kiện hấp dẫn.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="rounded-[24px] bg-white p-6 shadow-sm md:p-8">
          <div className="space-y-8">
            
            {/* 1. Basic Info */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-[#1c1c1c] flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-sm">1</span>
                Thông tin cơ bản
              </h2>
              
              <div className="grid gap-6 md:grid-cols-2">
                <div className="col-span-2">
                  <label className="mb-2 block text-sm font-medium text-neutral-700">Tên giải chạy</label>
                  <input
                    {...register('title', { required: 'Vui lòng nhập tên giải chạy' })}
                    className="w-full rounded-[12px] border border-neutral-200 px-4 py-3 outline-none text-[#000] placeholder:text-neutral-400 focus:text-[#212121] focus:border-[#1c1c1c] focus:ring-1 focus:ring-[#1c1c1c] transition-all"
                    placeholder="Ví dụ: Techcombank Ho Chi Minh City International Marathon"
                  />
                  {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700">Ngày diễn ra</label>
                  <input
                    type="date"
                    {...register('date', { required: 'Vui lòng chọn ngày' })}
                    className="w-full rounded-[12px] border border-neutral-200 px-4 py-3 outline-none text-[#000] focus:text-[#212121] focus:border-[#1c1c1c] focus:ring-1 focus:ring-[#1c1c1c] transition-all"
                  />
                  {errors.date && <p className="mt-1 text-sm text-red-500">{errors.date.message}</p>}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700">Giờ xuất phát</label>
                  <input
                    type="time"
                    {...register('time', { required: 'Vui lòng chọn giờ' })}
                    className="w-full rounded-[12px] border border-neutral-200 px-4 py-3 outline-none text-[#000] focus:text-[#212121] focus:border-[#1c1c1c] focus:ring-1 focus:ring-[#1c1c1c] transition-all"
                  />
                  {errors.time && <p className="mt-1 text-sm text-red-500">{errors.time.message}</p>}
                </div>

                <div className="col-span-2">
                  <label className="mb-2 block text-sm font-medium text-neutral-700">Tags (Badges)</label>
                  <input
                    {...register('badges')}
                    className="w-full rounded-[12px] border border-neutral-200 px-4 py-3 outline-none text-[#000] placeholder:text-neutral-400 focus:text-[#212121] focus:border-[#1c1c1c] focus:ring-1 focus:ring-[#1c1c1c] transition-all"
                    placeholder="Ví dụ: Official, Marathon, City Run (phân cách bằng dấu phẩy)"
                  />
                </div>

                <div className="col-span-2">
                  <label className="mb-2 block text-sm font-medium text-neutral-700">Mô tả ngắn</label>
                  <textarea
                    {...register('description', { required: 'Vui lòng nhập mô tả ngắn' })}
                    rows={3}
                    className="w-full rounded-[12px] border border-neutral-200 px-4 py-3 outline-none text-[#000] placeholder:text-neutral-400 focus:text-[#212121] focus:border-[#1c1c1c] focus:ring-1 focus:ring-[#1c1c1c] transition-all"
                    placeholder="Mô tả ngắn gọn về sự kiện (hiển thị trên thẻ sự kiện)"
                  />
                  {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>}
                </div>

                <div className="col-span-2">
                  <label className="mb-2 block text-sm font-medium text-neutral-700">Mô tả chi tiết</label>
                  <textarea
                    {...register('full_description', { required: 'Vui lòng nhập mô tả chi tiết' })}
                    rows={6}
                    className="w-full rounded-[12px] border border-neutral-200 px-4 py-3 outline-none text-[#000] placeholder:text-neutral-400 focus:text-[#212121] focus:border-[#1c1c1c] focus:ring-1 focus:ring-[#1c1c1c] transition-all"
                    placeholder="Thông tin chi tiết về giải chạy, lịch trình, giải thưởng..."
                  />
                  {errors.full_description && <p className="mt-1 text-sm text-red-500">{errors.full_description.message}</p>}
                </div>
              </div>
            </div>

            <hr className="border-neutral-100" />

            {/* 2. Location & Logistics */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-[#1c1c1c] flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-sm">2</span>
                Địa điểm & Logistics
              </h2>
              
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700">Thành phố / Tỉnh</label>
                  <select
                    {...register('location', { required: 'Vui lòng chọn địa điểm' })}
                    className="w-full rounded-[12px] border border-neutral-200 px-4 py-3 outline-none text-[#000] focus:text-[#212121] focus:border-[#1c1c1c] focus:ring-1 focus:ring-[#1c1c1c] transition-all bg-white"
                  >
                    <option value="">Chọn thành phố</option>
                    <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                    <option value="Hà Nội">Hà Nội</option>
                    <option value="Đà Nẵng">Đà Nẵng</option>
                    <option value="Cần Thơ">Cần Thơ</option>
                    <option value="Khác">Khác</option>
                  </select>
                  {errors.location && <p className="mt-1 text-sm text-red-500">{errors.location.message}</p>}
                </div>

                <div className="col-span-2">
                  <label className="mb-2 block text-sm font-medium text-neutral-700">
                    Thiết lập đường chạy (Chọn điểm Xuất phát và Về đích)
                  </label>
                  <RouteSelector onPointsChange={handleRouteSelect} />
                  {/* <p className="mt-2 text-xs text-neutral-500">
                    Click lần 1 để chọn điểm Xuất phát (Xanh), click lần 2 để chọn điểm Về đích (Đỏ).
                  </p> */}
                </div>

                <div className="col-span-2">
                  <label className="mb-2 block text-sm font-medium text-neutral-700">Bản đồ thiết kế riêng (Tùy chọn)</label>
                  <div className="flex flex-col gap-3">
                    {!routeMapUrl ? (
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-neutral-300 rounded-[12px] cursor-pointer bg-neutral-50 hover:bg-neutral-100 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <svg className="w-8 h-8 mb-3 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <p className="mb-1 text-sm text-neutral-500"><span className="font-semibold text-[#1c1c1c]">Tải lên hình ảnh</span> hoặc kéo thả vào đây</p>
                          <p className="text-xs text-neutral-400">PNG, JPG, WEBP (Max 5MB)</p>
                        </div>
                        <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                          if (e.target.files?.[0]) {
                            const file = e.target.files[0]
                            const formData = new FormData()
                            formData.append('file', file)

                            try {
                              const response = await fetch('/api/upload', {
                                method: 'POST',
                                body: formData
                              })
                              
                              if (!response.ok) throw new Error('Upload failed')
                              
                              const data = await response.json()
                              setValue('route_map_url', data.url)
                              // alert('Upload thành công!') // Removed alert for better UX with preview
                            } catch (error) {
                              console.error('Upload error:', error)
                              alert('Có lỗi xảy ra khi upload ảnh')
                            }
                          }
                        }} />
                      </label>
                    ) : (
                      <div className="relative w-full h-48 rounded-[12px] overflow-hidden border border-neutral-200 group">
                        <Image 
                          src={routeMapUrl} 
                          alt="Map preview" 
                          fill 
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                          <label className="px-4 py-2 bg-[#1c1c1c] text-white rounded-[12px] cursor-pointer shadow-[inset_-4px_-4px_4px_rgba(0,0,0,0.4),inset_4px_4px_6px_rgba(255,255,255,0.15)] hover:bg-neutral-800 transition-all text-sm font-medium">
                            Thay đổi
                            <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                              if (e.target.files?.[0]) {
                                const file = e.target.files[0]
                                const formData = new FormData()
                                formData.append('file', file)
                                try {
                                  const response = await fetch('/api/upload', { method: 'POST', body: formData })
                                  if (!response.ok) throw new Error('Upload failed')
                                  const data = await response.json()
                                  setValue('route_map_url', data.url)
                                } catch (error) {
                                  console.error('Upload error:', error)
                                  alert('Có lỗi xảy ra khi upload ảnh')
                                }
                              }
                            }} />
                          </label>
                          <button 
                            type="button"
                            onClick={() => setValue('route_map_url', '')}
                            className="px-4 py-2 bg-red-500 text-white rounded-[12px] hover:bg-red-600 transition-all text-sm font-medium shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.2)]"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <div className="relative flex items-center py-1">
                      <div className="flex-grow border-t border-neutral-200"></div>
                      <span className="mx-4 flex-shrink-0 text-xs font-medium text-neutral-400 uppercase">Hoặc nhập đường dẫn</span>
                      <div className="flex-grow border-t border-neutral-200"></div>
                    </div>

                    <input
                      {...register('route_map_url')}
                      className="w-full rounded-[12px] border border-neutral-200 px-4 py-3 outline-none text-[#000] placeholder:text-neutral-400 focus:text-[#212121] focus:border-[#1c1c1c] focus:ring-1 focus:ring-[#1c1c1c] transition-all"
                      placeholder="https://example.com/map-design.png"
                    />
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-neutral-100" />

            {/* 3. Registration Info */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-[#1c1c1c] flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-sm">3</span>
                Thông tin đăng ký
              </h2>
              
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700">Số lượng tham gia tối đa</label>
                  <input
                    type="number"
                    {...register('max_participants', { required: 'Vui lòng nhập số lượng', min: 1 })}
                    className="w-full rounded-[12px] border border-neutral-200 px-4 py-3 outline-none text-[#000] placeholder:text-neutral-400 focus:text-[#212121] focus:border-[#1c1c1c] focus:ring-1 focus:ring-[#1c1c1c] transition-all"
                    placeholder="5000"
                  />
                  {errors.max_participants && <p className="mt-1 text-sm text-red-500">{errors.max_participants.message}</p>}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700">Hạn chót đăng ký</label>
                  <input
                    type="date"
                    {...register('registration_deadline', { required: 'Vui lòng chọn hạn chót' })}
                    className="w-full rounded-[12px] border border-neutral-200 px-4 py-3 outline-none text-[#000] focus:text-[#212121] focus:border-[#1c1c1c] focus:ring-1 focus:ring-[#1c1c1c] transition-all"
                  />
                  {errors.registration_deadline && <p className="mt-1 text-sm text-red-500">{errors.registration_deadline.message}</p>}
                </div>

                <div className="col-span-2">
                  <label className="mb-2 block text-sm font-medium text-neutral-700">Cự ly (ngăn cách bằng dấu phẩy)</label>
                  <input
                    {...register('categories', { required: 'Vui lòng nhập các cự ly' })}
                    className="w-full rounded-[12px] border border-neutral-200 px-4 py-3 outline-none text-[#000] placeholder:text-neutral-400 focus:text-[#212121] focus:border-[#1c1c1c] focus:ring-1 focus:ring-[#1c1c1c] transition-all"
                    placeholder="5K, 10K, 21K, 42K"
                  />
                  <p className="mt-1 text-xs text-neutral-500">Ví dụ: 5K, 10K, 21K</p>
                  {errors.categories && <p className="mt-1 text-sm text-red-500">{errors.categories.message}</p>}
                </div>

                <div className="col-span-2">
                  <label className="mb-2 block text-sm font-medium text-neutral-700">Vật phẩm Race Kit (ngăn cách bằng dấu phẩy)</label>
                  <textarea
                    {...register('race_kit_items')}
                    rows={2}
                    className="w-full rounded-[12px] border border-neutral-200 px-4 py-3 outline-none text-[#000] placeholder:text-neutral-400 focus:text-[#212121] focus:border-[#1c1c1c] focus:ring-1 focus:ring-[#1c1c1c] transition-all"
                    placeholder="Áo đấu, BIB, Huy chương, Nước uống..."
                  />
                </div>
              </div>
            </div>

            <hr className="border-neutral-100" />

            {/* 4. Experience & Schedule */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-[#1c1c1c] flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-sm">4</span>
                Trải nghiệm & Lịch trình
              </h2>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="col-span-2">
                  <label className="mb-2 block text-sm font-medium text-neutral-700">Link hình ảnh banner chính</label>
                  <input
                    {...register('image_url')}
                    className="w-full rounded-[12px] border border-neutral-200 px-4 py-3 outline-none text-[#000] placeholder:text-neutral-400 focus:text-[#212121] focus:border-[#1c1c1c] focus:ring-1 focus:ring-[#1c1c1c] transition-all"
                    placeholder="https://example.com/image.png"
                  />
                </div>

                <div className="col-span-2">
                  <label className="mb-2 block text-sm font-medium text-neutral-700">Điểm nổi bật (Highlights - phân cách bằng dấu phẩy)</label>
                  <textarea
                    {...register('highlights')}
                    rows={2}
                    className="w-full rounded-[12px] border border-neutral-200 px-4 py-3 outline-none text-[#000] placeholder:text-neutral-400 focus:text-[#212121] focus:border-[#1c1c1c] focus:ring-1 focus:ring-[#1c1c1c] transition-all"
                    placeholder="Cung đường đẹp, Có pacer dẫn tốc, Âm nhạc sôi động..."
                  />
                </div>

                <div className="col-span-2">
                  <ScheduleFields control={control} register={register} errors={errors} />
                </div>

                <div className="col-span-2">
                  <label className="mb-2 block text-sm font-medium text-neutral-700">Ghi chú từ BTC</label>
                  <textarea
                    {...register('organizer_note')}
                    rows={3}
                    className="w-full rounded-[12px] border border-neutral-200 px-4 py-3 outline-none text-[#000] placeholder:text-neutral-400 focus:text-[#212121] focus:border-[#1c1c1c] focus:ring-1 focus:ring-[#1c1c1c] transition-all"
                    placeholder="Lưu ý quan trọng về an toàn, y tế hoặc quy định chung..."
                  />
                </div>
              </div>
            </div>

            <hr className="border-neutral-100" />

            {/* 5. Payment & Revenue Info */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-[#1c1c1c] flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-sm">5</span>
                Thông tin Thanh toán & Doanh thu
              </h2>
              
              <div className="grid gap-6 md:grid-cols-2">
                <div className="col-span-2 bg-blue-50 p-4 rounded-[16px] border border-blue-100">
                  <p className="text-sm text-blue-800 font-medium mb-2">Mô hình Thu Hộ (Centralized Payment)</p>
                  <p className="text-sm text-blue-700/80 leading-relaxed">
                    Doanh thu bán vé sẽ được chuyển về tài khoản của PaceUp. Sau khi kết thúc giải chạy hoặc định kỳ hàng tháng, hệ thống sẽ đối soát và chuyển khoản lại cho bạn (sau khi trừ phí nền tảng 5%).
                  </p>
                </div>

                <div className="col-span-2">
                  <label className="mb-2 block text-sm font-medium text-neutral-700">Thông tin tài khoản thụ hưởng (Của bạn)</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <input
                        {...register('bank_name')}
                        placeholder="Tên ngân hàng"
                        className="w-full rounded-[12px] border border-neutral-200 px-4 py-3 outline-none text-[#000] placeholder:text-neutral-400 focus:text-[#212121] focus:border-[#1c1c1c] focus:ring-1 focus:ring-[#1c1c1c] transition-all"
                      />
                      {errors.bank_name && <p className="mt-1 text-sm text-red-500">{errors.bank_name.message}</p>}
                    </div>
                    <div>
                      <input
                        {...register('account_number')}
                        placeholder="Số tài khoản"
                        className="w-full rounded-[12px] border border-neutral-200 px-4 py-3 outline-none text-[#000] placeholder:text-neutral-400 focus:text-[#212121] focus:border-[#1c1c1c] focus:ring-1 focus:ring-[#1c1c1c] transition-all"
                      />
                      {errors.account_number && <p className="mt-1 text-sm text-red-500">{errors.account_number.message}</p>}
                    </div>
                    <div>
                      <input
                        {...register('account_holder_name')}
                        placeholder="Tên chủ tài khoản"
                        className="w-full rounded-[12px] border border-neutral-200 px-4 py-3 outline-none text-[#000] placeholder:text-neutral-400 focus:text-[#212121] focus:border-[#1c1c1c] focus:ring-1 focus:ring-[#1c1c1c] transition-all"
                      />
                      {errors.account_holder_name && <p className="mt-1 text-sm text-red-500">{errors.account_holder_name.message}</p>}
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-neutral-500">
                    * Nhập thông tin tài khoản ngân hàng của bạn để nhận tiền thanh toán từ người tham gia.
                    <br/>
                    * Thông tin này sẽ được lưu cùng với sự kiện và admin sẽ sử dụng để chuyển khoản sau khi kết thúc giải chạy.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex items-center justify-end gap-4 pt-4">
              <Link
                href="/events"
                className="rounded-[12px] px-6 py-3 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors"
              >
                Hủy bỏ
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-[12px] bg-[#1c1c1c] px-8 py-3 text-sm font-semibold text-white shadow-[inset_-4px_-4px_4px_rgba(0,0,0,0.4),inset_4px_4px_6px_rgba(255,255,255,0.15)] hover:bg-neutral-800 transition-all disabled:opacity-70"
              >
                {isSubmitting ? 'Đang xử lý...' : 'Tạo giải chạy'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
