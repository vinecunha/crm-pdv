const IdentifyCustomerModal = ({ 
  isOpen, 
  onClose, 
  phone, 
  onPhoneChange,
  onSearch,
  isLoading 
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Identificar Cliente" size="sm">
    <div className="space-y-4">
      <CustomerSearchIllustration />
      <PhoneInput 
        value={phone} 
        onChange={onPhoneChange}
        onEnter={onSearch}
        disabled={isLoading}
        autoFocus
      />
      <ModalActions 
        onCancel={onClose}
        onConfirm={onSearch}
        confirmText="Buscar"
        isLoading={isLoading}
      />
    </div>
  </Modal>
)