import { describe, it, expect, vi } from 'vitest'
import {
  isImageFile,
  validateImageSize,
  compressImage,
  compressAvatar,
  compressProductImage,
  compressLogo,
} from '../imageCompression'

// Mock da lib browser-image-compression
vi.mock('browser-image-compression', () => ({
  default: vi.fn(async (file, options) => {
    // Simula compressão: retorna um File menor
    const compressedSize = Math.floor(file.size * 0.4)
    const blob = new Blob([new ArrayBuffer(compressedSize)], { type: file.type })
    return new File([blob], file.name, { type: file.type })
  }),
}))

// ─── helpers ───────────────────────────────────────────────────────────────
const makeFile = (name, type, sizeKB) => {
  const blob = new Blob([new ArrayBuffer(sizeKB * 1024)], { type })
  return new File([blob], name, { type })
}

// ─────────────────────────────────────────────────────────────────────────────
describe('isImageFile', () => {
  it('retorna true para JPEG', () => {
    expect(isImageFile(makeFile('foto.jpg', 'image/jpeg', 100))).toBe(true)
  })

  it('retorna true para PNG', () => {
    expect(isImageFile(makeFile('logo.png', 'image/png', 50))).toBe(true)
  })

  it('retorna true para WebP', () => {
    expect(isImageFile(makeFile('img.webp', 'image/webp', 80))).toBe(true)
  })

  it('retorna false para PDF', () => {
    expect(isImageFile(makeFile('doc.pdf', 'application/pdf', 200))).toBe(false)
  })

  it('retorna false para null', () => {
    expect(isImageFile(null)).toBeFalsy()
  })

  it('retorna false para undefined', () => {
    expect(isImageFile(undefined)).toBeFalsy()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('validateImageSize', () => {
  it('retorna true para arquivo dentro do limite', () => {
    const file = makeFile('ok.jpg', 'image/jpeg', 500) // 500KB
    expect(validateImageSize(file, 10)).toBe(true)     // limite 10MB
  })

  it('lança erro para arquivo acima do limite', () => {
    const file = makeFile('big.jpg', 'image/jpeg', 15_000) // 15MB
    expect(() => validateImageSize(file, 10)).toThrow('muito grande')
  })

  it('usa 10MB como limite padrão', () => {
    const file = makeFile('normal.jpg', 'image/jpeg', 5_000) // 5MB
    expect(() => validateImageSize(file)).not.toThrow()
  })

  it('lança erro com o tamanho máximo na mensagem', () => {
    const file = makeFile('big.jpg', 'image/jpeg', 20_000)
    expect(() => validateImageSize(file, 5)).toThrow('5MB')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('compressImage', () => {
  it('retorna um File', async () => {
    const file = makeFile('foto.jpg', 'image/jpeg', 800)
    const result = await compressImage(file)
    expect(result).toBeInstanceOf(File)
  })

  it('arquivo comprimido é menor que o original', async () => {
    const file = makeFile('foto.jpg', 'image/jpeg', 800)
    const result = await compressImage(file)
    expect(result.size).toBeLessThan(file.size)
  })

  it('mantém o tipo MIME original', async () => {
    const file = makeFile('logo.png', 'image/png', 300)
    const result = await compressImage(file)
    expect(result.type).toBe('image/png')
  })

  it('retorna o arquivo original em caso de erro na compressão', async () => {
    const { default: imageCompression } = await import('browser-image-compression')
    imageCompression.mockRejectedValueOnce(new Error('falha simulada'))

    const file = makeFile('erro.jpg', 'image/jpeg', 500)
    const result = await compressImage(file)
    // Deve devolver o original sem lançar
    expect(result).toBe(file)
  })

  it('aceita opções customizadas', async () => {
    const { default: imageCompression } = await import('browser-image-compression')
    const file = makeFile('foto.jpg', 'image/jpeg', 600)

    await compressImage(file, { maxSizeMB: 0.1, maxWidthOrHeight: 200 })

    expect(imageCompression).toHaveBeenCalledWith(
      file,
      expect.objectContaining({ maxSizeMB: 0.1, maxWidthOrHeight: 200 })
    )
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('compressAvatar', () => {
  it('usa opções menores que compressImage padrão', async () => {
    const { default: imageCompression } = await import('browser-image-compression')
    const file = makeFile('avatar.jpg', 'image/jpeg', 500)

    await compressAvatar(file)

    const callOptions = imageCompression.mock.calls.at(-1)[1]
    expect(callOptions.maxSizeMB).toBeLessThanOrEqual(0.2)
    expect(callOptions.maxWidthOrHeight).toBeLessThanOrEqual(400)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('compressProductImage', () => {
  it('usa maxWidthOrHeight de 800px', async () => {
    const { default: imageCompression } = await import('browser-image-compression')
    const file = makeFile('produto.jpg', 'image/jpeg', 400)

    await compressProductImage(file)

    const callOptions = imageCompression.mock.calls.at(-1)[1]
    expect(callOptions.maxWidthOrHeight).toBe(800)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
describe('compressLogo', () => {
  it('usa qualidade maior (0.9) por ser logo', async () => {
    const { default: imageCompression } = await import('browser-image-compression')
    const file = makeFile('logo.png', 'image/png', 300)

    await compressLogo(file)

    const callOptions = imageCompression.mock.calls.at(-1)[1]
    expect(callOptions.initialQuality).toBeGreaterThanOrEqual(0.9)
  })
})
