'use client'

const INPUT_CLASS =
  'h-[62px] w-full rounded-[12px] border border-black/25 px-6 text-base text-[#1c1c1c] placeholder-black/40 focus:border-black focus:ring-2 focus:ring-black/10 focus:outline-none transition-all'

interface Step2Props {
  formData: {
    fullName: string
    phone: string
    dateOfBirth: string
    gender: string
  }
  updateFormData: (data: Partial<Step2Props['formData']>) => void
  onNext: () => void
  onBack: () => void
}

/**
 * Step 2: Personal Information
 *
 * Collects personal details of the user.
 */
export default function Step2({ formData, updateFormData, onNext, onBack }: Step2Props) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    updateFormData({ [e.target.name]: e.target.value })
  }

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault()
    onNext()
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-black/40">Bước 2</p>
        <h2 className="text-2xl font-bold text-[#1c1c1c]">Thông tin cá nhân</h2>
      </div>
      <form onSubmit={handleNext} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="fullName" className="text-base text-black/60">
            Họ và tên *
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            required
            value={formData.fullName}
            onChange={handleChange}
            className={INPUT_CLASS}
            placeholder="Nguyễn Văn A"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="phone" className="text-base text-black/60">
            Số điện thoại *
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            value={formData.phone}
            onChange={handleChange}
            className={INPUT_CLASS}
            placeholder="0123456789"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="dateOfBirth" className="text-base text-black/60">
              Ngày sinh *
            </label>
            <input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              required
              value={formData.dateOfBirth}
              onChange={handleChange}
              className={INPUT_CLASS}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="gender" className="text-base text-black/60">
              Giới tính *
            </label>
            <select
              id="gender"
              name="gender"
              required
              value={formData.gender}
              onChange={handleChange}
              className={`${INPUT_CLASS} bg-white`}
            >
              <option value="">Chọn giới tính</option>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
              <option value="other">Khác</option>
            </select>
          </div>
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
            Tiếp theo
          </button>
        </div>
      </form>
    </div>
  )
}

