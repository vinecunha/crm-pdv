import imageCompression from 'browser-image-compression'
import { logger } from '@utils/logger'

/**
 * Comprime uma imagem antes do upload
 * @param {File} file - Arquivo de imagem original
 * @param {Object} options - Opções de compressão
 * @returns {Promise<File>} - Arquivo comprimido
 */
export const compressImage = async (file, options = {}) => {
  // Configurações padrão otimizadas para PDV
  const defaultOptions = {
    maxSizeMB: 0.5,              // Máximo 500KB
    maxWidthOrHeight: 1200,      // Redimensiona para no máximo 1200px
    useWebWorker: true,          // Usa Web Worker para não travar UI
    initialQuality: 0.8,         // Qualidade inicial 80%
    alwaysKeepResolution: false, // Permite redimensionar
    fileType: file.type,         // Mantém o tipo original
  }

  const compressionOptions = { ...defaultOptions, ...options }

  try {
    logger.log('🖼️ Comprimindo imagem...', {
      originalSize: (file.size / 1024).toFixed(2) + ' KB',
      originalType: file.type
    })

    const compressedFile = await imageCompression(file, compressionOptions)

    logger.log('✅ Imagem comprimida!', {
      compressedSize: (compressedFile.size / 1024).toFixed(2) + ' KB',
      reduction: ((1 - compressedFile.size / file.size) * 100).toFixed(0) + '%'
    })

    return compressedFile
  } catch (error) {
    console.error('❌ Erro ao comprimir imagem:', error)
    return file // Retorna original em caso de erro
  }
}

/**
 * Comprime uma imagem para avatar (perfil)
 */
export const compressAvatar = async (file) => {
  return compressImage(file, {
    maxSizeMB: 0.2,              // Avatar menor: 200KB
    maxWidthOrHeight: 400,       // 400px é suficiente para avatar
    initialQuality: 0.85
  })
}

/**
 * Comprime uma imagem para produto
 */
export const compressProductImage = async (file) => {
  return compressImage(file, {
    maxSizeMB: 0.3,              // 300KB para produto
    maxWidthOrHeight: 800,       // 800px
    initialQuality: 0.8
  })
}

/**
 * Comprime uma imagem para logo da empresa
 */
export const compressLogo = async (file) => {
  return compressImage(file, {
    maxSizeMB: 0.2,              // 200KB para logo
    maxWidthOrHeight: 600,       // 600px
    initialQuality: 0.9          // Qualidade maior para logo
  })
}

/**
 * Verifica se o arquivo é uma imagem
 */
export const isImageFile = (file) => {
  // Verifica se é realmente um arquivo
  if (!file || !(file instanceof File) && !(file instanceof Blob)) {
    return false
  }
  
  // Verifica se tem type e é imagem
  return typeof file.type === 'string' && file.type.startsWith('image/')
}

/**
 * Valida tamanho máximo antes da compressão
 */
export const validateImageSize = (file, maxSizeMB = 10) => {
  if (!file || !file.size) {
    throw new Error('Arquivo inválido')
  }
  
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  if (file.size > maxSizeBytes) {
    throw new Error(`Imagem muito grande. Máximo: ${maxSizeMB}MB`)
  }
  return true
}

export default {
  compressImage,
  compressAvatar,
  compressProductImage,
  compressLogo,
  isImageFile,
  validateImageSize
}