import React, { useState } from 'react'
import { Camera, Upload, AlertCircle } from '../../lib/icons'
import { compressAvatar, isImageFile, validateImageSize } from '../../utils/imageCompression'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import LazyImage from '../ui/LazyImage'
import { supabase } from '../../lib/supabase'

const AvatarUploader = ({ user, avatarUrl, fullName, displayName, onAvatarUpdate }) => {
  const [showModal, setShowModal] = useState(false)
  const [tempAvatarUrl, setTempAvatarUrl] = useState(avatarUrl || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const getUserInitial = () => {
    if (displayName) return displayName.charAt(0).toUpperCase()
    if (fullName) return fullName.charAt(0).toUpperCase()
    return 'U'
  }

  const userInitial = getUserInitial()
  const nameForAvatar = displayName || fullName || 'Usuário'

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError('')

    // Validar tipo
    if (!isImageFile(file)) {
      setError('Apenas imagens são permitidas')
      return
    }

    // Validar tamanho
    try {
      validateImageSize(file, 5) // Máximo 5MB
    } catch (err) {
      setError(err.message)
      return
    }

    setSaving(true)
    try {
      const compressedFile = await compressAvatar(file)
      
      const fileExt = compressedFile.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, compressedFile, { cacheControl: '3600', upsert: false })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      await saveAvatarUrl(publicUrl)
    } catch (error) {
      console.error('Erro ao fazer upload:', error)
      setError('Erro ao enviar imagem: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const saveAvatarUrl = async (url) => {
    setSaving(true)
    setError('')
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: url })
        .eq('id', user?.id)

      if (error) throw error

      setTempAvatarUrl(url)
      onAvatarUpdate?.(url)
      setShowModal(false)
    } catch (error) {
      console.error('Erro ao salvar avatar:', error)
      setError('Erro ao salvar avatar: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    setShowModal(false)
    setError('')
    setTempAvatarUrl(avatarUrl || '')
  }

  return (
    <>
      <div className="relative inline-block">
        <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 border-4 border-white dark:border-gray-800 shadow-md mx-auto">
          {avatarUrl ? (
            <LazyImage
              src={avatarUrl}
              alt={nameForAvatar}
              className="w-full h-full"
              fallback={
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-4xl font-bold text-white">{userInitial}</span>
                </div>
              }
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-4xl font-bold text-white">{userInitial}</span>
            </div>
          )}
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="absolute bottom-0 right-0 p-2 bg-blue-600 dark:bg-blue-700 text-white rounded-full hover:bg-blue-700 dark:hover:bg-blue-600 shadow-lg transition-all hover:scale-105"
          title="Alterar avatar"
        >
          <Camera size={16} />
        </button>
      </div>

      <Modal
        isOpen={showModal}
        onClose={handleClose}
        title="Alterar Avatar"
        size="md"
      >
        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle size={18} className="text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <div className="flex justify-center">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
              {tempAvatarUrl ? (
                <LazyImage
                  src={tempAvatarUrl}
                  alt="Avatar Preview"
                  className="w-full h-full"
                  fallback={
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-4xl font-bold text-white">{userInitial}</span>
                    </div>
                  }
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-4xl font-bold text-white">{userInitial}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              URL do Avatar
            </label>
            <input
              type="text"
              value={tempAvatarUrl}
              onChange={(e) => setTempAvatarUrl(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="https://exemplo.com/avatar.jpg"
              disabled={saving}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Cole o link de uma imagem ou faça upload abaixo
            </p>
          </div>

          <div className="relative">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                className="hidden"
                id="avatar-upload"
                disabled={saving}
              />
              <label 
                htmlFor="avatar-upload" 
                className={`cursor-pointer flex flex-col items-center ${saving ? 'opacity-50' : ''}`}
              >
                <Upload size={32} className="text-gray-400 dark:text-gray-500 mb-2" />
                <span className="text-sm text-gray-600 dark:text-gray-300">Clique para selecionar uma imagem</span>
                <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">PNG, JPG, GIF até 2MB</span>
              </label>
            </div>
            {saving && (
              <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center rounded-lg">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 dark:border-blue-400" />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={() => saveAvatarUrl(tempAvatarUrl)} loading={saving}>
            Salvar Avatar
          </Button>
        </div>
      </Modal>
    </>
  )
}

export default AvatarUploader