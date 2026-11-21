import { useEffect, useState } from 'react'
import { createPet } from '../api/pets'

type PetFormProps = {
  reportType: 'lost' | 'found'
}

function PetForm({ reportType }: PetFormProps) {
  const [species, setSpecies] = useState('cat')
  const [name, setName] = useState('')
  const [comment, setComment] = useState('')
  const [street, setStreet] = useState('')
  const [contactEmail, setContactEmail] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPublished, setIsPublished] = useState(false)
  const [photoPreview, setPhotoPreview] = useState('')
  const [photoError, setPhotoError] = useState('')

  useEffect(() => {
    return () => {
        if (photoPreview) {
        URL.revokeObjectURL(photoPreview)
        }
    }
    }, [photoPreview])
  async function submit() {
    if (isSubmitting) {
      return
    }

    setError(null)

    if (!street.trim() || !comment.trim() || !contactEmail.trim()) {
      setError('Заполните место, описание и почту для связи.')
      return
    }

    setIsSubmitting(true)

    try {
      await createPet({
        name: name.trim() || null,
        species: species,
        street: street.trim(),
        report_type: reportType,
        comment: comment.trim(),
        contact_email: contactEmail.trim(),
      })

      setIsPublished(true)
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError('Ошибка отправки. Попробуйте снова.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isPublished) {
    return (
      <div className="pet-form" role="status">
        <h2>Объявление опубликовано</h2>
        <p>Сервер подтвердил успешное создание объявления.</p>
      </div>
    )
  }

  return (
    <form
      className="pet-form"
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
    >
      <fieldset disabled={isSubmitting}>
        <label>
          Вид животного
          <select
            value={species}
            onChange={(event) => setSpecies(event.target.value)}
          >
            <option value="cat">Кошка</option>
            <option value="dog">Собака</option>
          </select>
        </label>

        <label>
          Кличка — необязательно
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Если известна"
          />
        </label>

        <label>
          Описание — обязательно
          <textarea
            required
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            onInvalid={(event) => {
                event.currentTarget.setCustomValidity('Добавьте описание.')
            }}
            onInput={(event) => {
                event.currentTarget.setCustomValidity('')
            }}
            placeholder="Приметы животного и обстоятельства"
            rows={5}
          />
        </label>

        <label>
          Место — обязательно
          <input
            required
            type="text"
            value={street}
            onChange={(event) => setStreet(event.target.value)}
            onInvalid={(event) => {
                event.currentTarget.setCustomValidity('Укажите место.')
            }}
            onInput={(event) => {
                event.currentTarget.setCustomValidity('')
            }}
            placeholder="Улица, дом или ориентир"
          />
        </label>

        <label>
          Почта для связи — обязательно
          <input
            required
            type="email"
            value={contactEmail}
            onChange={(event) => setContactEmail(event.target.value)}
            onInvalid={(event) => {
                const input = event.currentTarget

                if (input.validity.valueMissing) {
                input.setCustomValidity('Укажите почту для связи.')
                } else if (input.validity.typeMismatch) {
                input.setCustomValidity('Введите почту в формате name@example.com.')
                }
            }}
            onInput={(event) => {
                event.currentTarget.setCustomValidity('')
            }}
            placeholder="name@example.com"
          />
        </label>
        <label className="photo-picker">
            <span>Фотография — необязательно</span>
            <span className="photo-picker-button">Выбрать фотографию</span>

            <input
                className="photo-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                const file = event.target.files?.[0]

                setPhotoError('')

                if (!file) {
                    return
                }

                const allowedTypes = [
                    'image/jpeg',
                    'image/png',
                    'image/webp',
                ]

                if (!allowedTypes.includes(file.type)) {
                    setPhotoError('Выберите изображение JPEG, PNG или WebP.')
                    event.target.value = ''
                    return
                }

                if (file.size > 5 * 1024 * 1024) {
                    setPhotoError('Выберите фотографию размером до 5 МБ.')
                    event.target.value = ''
                    return
                }

                setPhotoPreview(URL.createObjectURL(file))
                }}
            />
            <span className="photo-picker-status">
                {photoPreview ? 'Фотография выбрана' : 'Фотография не выбрана'}
            </span>
        </label>

        {photoError && (
        <p className="form-error" role="alert">
            {photoError}
        </p>
        )}

        {photoPreview && (
        <img
            className="photo-preview"
            src={photoPreview}
            alt="Предпросмотр выбранной фотографии"
        />
        )}

        <p>
        Фотография доступна только для предпросмотра.
        На сервер она пока не отправляется.
        </p>
        <button type="submit">
          {isSubmitting ? 'Отправляем...' : 'Опубликовать'}
        </button>
      </fieldset>

      {error && <p className="form-error" role="alert">{error}</p>}
    </form>
  )
}

export default PetForm