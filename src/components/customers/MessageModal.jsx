import React from 'react'
import { FileText } from 'lucide-react'
import Modal from '../ui/Modal'
import FormInput from '../forms/FormInput'
import Button from '../ui/Button'

const MessageModal = ({ 
  isOpen, 
  onClose, 
  activeChannel, 
  channels, 
  messageForm, 
  setMessageForm, 
  messageTemplates,
  customer,
  onSend,
  isSending 
}) => {
  const channel = channels.find(c => c.id === activeChannel)

  const applyTemplate = (templateKey) => {
    const template = messageTemplates[templateKey]
    if (template) {
      setMessageForm({
        subject: template.subject,
        message: template.message,
        template: templateKey
      })
    }
  }

  if (!channel) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Enviar ${channel.name}`}
      size="lg"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Templates Rápidos
          </label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(messageTemplates).map(([key]) => (
              <button
                key={key}
                onClick={() => applyTemplate(key)}
                className={`
                  px-3 py-1.5 text-xs rounded-full border transition-all
                  ${messageForm.template === key
                    ? 'bg-blue-100 border-blue-300 text-blue-700'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }
                `}
              >
                {key === 'welcome' && 'Boas-vindas'}
                {key === 'promotion' && 'Promoção'}
                {key === 'birthday' && 'Aniversário'}
                {key === 'thankYou' && 'Agradecimento'}
                {key === 'reminder' && 'Lembrete'}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Use {'{nome}'} para inserir o nome do cliente
          </p>
        </div>

        {activeChannel === 'email' && (
          <FormInput
            label="Assunto"
            name="subject"
            value={messageForm.subject}
            onChange={(e) => setMessageForm(prev => ({ ...prev, subject: e.target.value }))}
            placeholder="Assunto do e-mail"
            icon={FileText}
          />
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mensagem
          </label>
          <textarea
            value={messageForm.message}
            onChange={(e) => setMessageForm(prev => ({ ...prev, message: e.target.value }))}
            placeholder="Digite sua mensagem..."
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {messageForm.message && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-600 mb-1">Preview:</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {messageForm.message.replace(/{nome}/g, customer?.name || '[NOME]')}
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={onSend} loading={isSending} icon={channel.icon}>
          Enviar Mensagem
        </Button>
      </div>
    </Modal>
  )
}

export default MessageModal