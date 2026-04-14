import React, { useState } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { compressLogo, isImageFile, validateImageSize } from '../../utils/imageCompression'
import LazyImage from '../ui/LazyImage'

const LogoUploader = ({ currentLogo, onLogoChange, disabled }) => {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(null)

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError('')

    if (!isImageFile(file)) {
      setError('Apenas imagens são permitidas')
      return
    }

    try {
      validateImageSize(file, 5)
    } catch (err) {
      setError(err.message)
      return
    }

    // Preview local
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target.result)
    reader.readAsDataURL(file)

    setUploading(true)
    try {
      // ✅ COMPRIMIR LOGO
      const compressedFile = await compressLogo(file)
      
      // Converter para base64 ou fazer upload
      const reader = new FileReader()
      reader.onload = (e) => {
        onLogoChange(e.target.result)
        setUploading(false)
        setPreview(null)
      }
      reader.readAsDataURL(compressedFile)
      
    } catch (error) {
      console.error('Erro ao processar logo:', error)
      setError('Erro ao processar imagem')
      setUploading(false)
      setPreview(null)
    }
  }

  const handleClear = () => {
    onLogoChange('')
    setPreview(null)
    setError('')
  }

  const displayImage = preview || currentLogo

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-4">
        <div className="w-24 h-24 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
          {displayImage ? (
            <LazyImage
              src={displayImage}
              alt="Logo"
              className="w-full h-full object-contain"
              fallback={
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>
              }
            />
          ) : (
            <ImageIcon className="w-8 h-8 text-gray-400" />
          )}
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <label className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={disabled || uploading}
                className="hidden"
              />
              <span className={`
                inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                ${disabled || uploading 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer'
                }
              `}>
                <Upload size={16} />
                {uploading ? 'Processando...' : 'Upload Logo'}
              </span>
            </label>

            {currentLogo && (
              <button
                onClick={handleClear}
                disabled={disabled || uploading}
                className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}

          <p className="text-xs text-gray-500">
            PNG, JPG ou SVG. Será comprimida automaticamente.
          </p>
        </div>
      </div>
    </div>
  )
}

export default LogoUploader