import React from 'react'
import { FileText } from '../../lib/icons'
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
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
                    ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
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
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Mensagem
          </label>
          <textarea
            value={messageForm.message}
            onChange={(e) => setMessageForm(prev => ({ ...prev, message: e.target.value }))}
            placeholder="Digite sua mensagem..."
            rows={6}
            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 resize-none placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>

        {messageForm.message && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Preview:</p>
            <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
              {messageForm.message.replace(/{nome}/g, customer?.name || '[NOME]')}
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
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