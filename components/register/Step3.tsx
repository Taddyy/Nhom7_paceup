'use client'

const INPUT_CLASS =
  'min-h-[62px] w-full rounded-[12px] border border-black/25 px-6 py-3 text-base text-[#1c1c1c] placeholder-black/40 focus:border-black focus:ring-2 focus:ring-black/10 focus:outline-none transition-all'

interface Step3Props {
  formData: {
    address: string
    runningExperience: string
    goals: string
  }
  updateFormData: (data: Partial<Step3Props['formData']>) => void
  onSubmit: () => void
  onBack: () => void
}

/**
 * Step 3: Additional Information
 *
 * Collects running experience and goals.
 */
export default function Step3({ formData, updateFormData, onSubmit, onBack }: Step3Props) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    updateFormData({ [e.target.name]: e.target.value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit()
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-black/40">Bước 3</p>
        <h2 className="text-2xl font-bold text-[#1c1c1c]">Thông tin bổ sung</h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="address" className="text-base text-black/60">
            Địa chỉ
          </label>
          <input
            id="address"
            name="address"
            type="text"
            value={formData.address}
            onChange={handleChange}
            className={INPUT_CLASS}
            placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="runningExperience" className="text-base text-black/60">
            Kinh nghiệm chạy bộ *
          </label>
          <select
            id="runningExperience"
            name="runningExperience"
            required
            value={formData.runningExperience}
            onChange={handleChange}
            className={`${INPUT_CLASS} bg-white`}
          >
            <option value="">Chọn mức độ</option>
            <option value="beginner">Mới bắt đầu</option>
            <option value="intermediate">Có kinh nghiệm</option>
            <option value="advanced">Nâng cao</option>
            <option value="expert">Chuyên nghiệp</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="goals" className="text-base text-black/60">
            Mục tiêu của bạn
          </label>
          <textarea
            id="goals"
            name="goals"
            rows={4}
            value={formData.goals}
            onChange={handleChange}
            className={`${INPUT_CLASS} resize-none`}
            placeholder="Ví dụ: Chạy marathon đầu tiên, giảm cân, cải thiện sức khỏe..."
          />
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onBack}
            className="h-[52px] rounded-[12px] border border-black/15 px-8 text-sm font-semibold uppercase tracking-[0.3em] text-black transition hover:bg-black/5"
          >
            Quay lại
          </button>
          <button
            type="submit"
            className="h-[52px] rounded-[12px] bg-[#1c1c1c] px-10 text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-[inset_-4px_-4px_4px_rgba(0,0,0,0.4),inset_4px_4px_6px_rgba(255,255,255,0.2)]"
          >
            Hoàn tất đăng ký
          </button>
        </div>
      </form>
    </div>
  )
}

