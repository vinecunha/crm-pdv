import React, { useState } from 'react'
import { Camera, Upload, AlertCircle } from 'lucide-react'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import { supabase } from '../../lib/supabase'

const AvatarUploader = ({ user, avatarUrl, fullName, displayName, onAvatarUpdate }) => {
  const [showModal, setShowModal] = useState(false)
  const [tempAvatarUrl, setTempAvatarUrl] = useState(avatarUrl || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Prioridade: display_name > full_name > 'U'
  const getUserInitial = () => {
    if (displayName) {
      return displayName.charAt(0).toUpperCase()
    }
    if (fullName) {
      return fullName.charAt(0).toUpperCase()
    }
    return 'U'
  }

  const userInitial = getUserInitial()

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError('')

    if (!file.type.startsWith('image/')) {
      setError('Apenas imagens são permitidas')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Imagem muito grande (máx 2MB)')
      return
    }

    setSaving(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { cacheControl: '3600', upsert: false })

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
        <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-md mx-auto">
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt="Avatar" 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null
                e.target.style.display = 'none'
                e.target.nextSibling?.classList.remove('hidden')
              }}
            />
          ) : null}
          <div className={`w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center ${avatarUrl ? 'hidden' : ''}`}>
            <span className="text-4xl font-bold text-white">
              {userInitial}
            </span>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-lg transition-all hover:scale-105"
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
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex justify-center">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100">
              {tempAvatarUrl ? (
                <img 
                  src={tempAvatarUrl} 
                  alt="Avatar Preview" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.style.display = 'none'
                    e.target.nextSibling?.classList.remove('hidden')
                  }}
                />
              ) : null}
              <div className={`w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center ${tempAvatarUrl ? 'hidden' : ''}`}>
                <span className="text-4xl font-bold text-white">
                  {userInitial}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL do Avatar
            </label>
            <input
              type="text"
              value={tempAvatarUrl}
              onChange={(e) => setTempAvatarUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="https://exemplo.com/avatar.jpg"
              disabled={saving}
            />
            <p className="text-xs text-gray-500 mt-1">
              Cole o link de uma imagem ou faça upload abaixo
            </p>
          </div>

          <div className="relative">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
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
                <Upload size={32} className="text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">Clique para selecionar uma imagem</span>
                <span className="text-xs text-gray-400 mt-1">PNG, JPG, GIF até 2MB</span>
              </label>
            </div>
            {saving && (
              <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-lg">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
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