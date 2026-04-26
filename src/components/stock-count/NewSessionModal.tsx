import React from 'react'
import { ClipboardList, User } from '@lib/icons'
import Modal from '@components/ui/Modal'
import FormInput from '@components/forms/FormInput'
import Button from '@components/ui/Button'

const NewSessionModal = ({
  isOpen,
  onClose,
  form,
  setForm,
  errors,
  onSubmit,
  isSubmitting
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Iniciar Novo Balanço"
      size="md"
    >
      <div className="space-y-4">
        <FormInput
          label="Nome do Balanço"
          name="name"
          value={form.name}
          onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Ex: Balanço Mensal - Março 2024"
          required
          error={errors.name}
          icon={ClipboardList}
        />

        <FormInput
          label="Descrição"
          name="description"
          value={form.description}
          onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Detalhes sobre este balanço"
        />

        <FormInput
          label="Local"
          name="location"
          value={form.location}
          onChange={(e) => setForm(prev => ({ ...prev, location: e.target.value }))}
          placeholder="Ex: Depósito Principal, Loja, etc."
        />

        <FormInput
          label="Responsável"
          name="responsible"
          value={form.responsible}
          onChange={(e) => setForm(prev => ({ ...prev, responsible: e.target.value }))}
          placeholder="Nome do responsável"
          icon={User}
        />

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 dark:bg-blue-900/20 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <strong>Importante:</strong> Todos os produtos ativos serão incluídos automaticamente na contagem.
            Você poderá adicionar ou remover itens durante o balanço.
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t dark:border-gray-700">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={onSubmit} loading={isSubmitting}>
          Iniciar Balanço
        </Button>
      </div>
    </Modal>
  )
}

export default NewSessionModal
