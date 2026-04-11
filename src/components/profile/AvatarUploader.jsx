import React, { useState } from 'react'
import { Camera, Upload } from 'lucide-react'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import { supabase } from '../../lib/supabase'

const AvatarUploader = ({ user, avatarUrl, fullName, onAvatarUpdate }) => {
  const [showModal, setShowModal] = useState(false)
  const [tempAvatarUrl, setTempAvatarUrl] = useState(avatarUrl || '')
  const [saving, setSaving] = useState(false)

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Apenas imagens são permitidas')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Imagem muito grande (máx 2MB)')
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
      alert('Erro ao enviar imagem: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const saveAvatarUrl = async (url) => {
    setSaving(true)
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
      alert('Erro ao salvar avatar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="relative inline-block">
        <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-md mx-auto">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-4xl font-bold text-white">
                {(fullName || 'U').charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-lg"
        >
          <Camera size={16} />
        </button>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Alterar Avatar"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100">
              {tempAvatarUrl ? (
                <img src={tempAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-4xl font-bold text-white">
                    {(fullName || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="https://exemplo.com/avatar.jpg"
            />
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
              id="avatar-upload"
            />
            <label htmlFor="avatar-upload" className="cursor-pointer flex flex-col items-center">
              <Upload size={32} className="text-gray-400 mb-2" />
              <span className="text-sm text-gray-600">Clique para selecionar</span>
              <span className="text-xs text-gray-400 mt-1">PNG, JPG até 2MB</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => setShowModal(false)}>
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