// src/components/products/ProductsModalsContainer.jsx
import React from 'react'
import Modal from '@components/ui/Modal'
import ProductForm from '@components/products/ProductForm'
import ProductEntryForm from '@components/products/ProductEntryForm'
import ProductDetailsModal from '@components/products/ProductDetailsModal'
import ProductDeleteModal from '@components/products/ProductDeleteModal'

const ProductsModalsContainer = ({
  // Product Form Modal
  isProductModalOpen,
  onCloseProductModal,
  selectedProduct,
  productForm,
  formErrors,
  onProductChange,
  onSubmitProduct,
  isSubmittingProduct,
  units,
  categories,
  
  // Entry Modal
  isEntryModalOpen,
  onCloseEntryModal,
  entryForm,
  entryFormErrors,
  onEntryChange,
  onSubmitEntry,
  isSubmittingEntry,
  entryModalError,
  showFeedback,
  
  // View Details Modal
  isViewModalOpen,
  onCloseViewModal,
  productDetails,
  isLoadingDetails,
  
  // Delete Modal
  isDeleteModalOpen,
  onCloseDeleteModal,
  onConfirmDelete,
  isSubmittingDelete
}) => {
  return (
    <>
      {/* Modal de Produto */}
      <Modal 
        isOpen={isProductModalOpen} 
        onClose={!isSubmittingProduct ? onCloseProductModal : undefined} 
        title={selectedProduct ? 'Editar Produto' : 'Novo Produto'} 
        size="lg"
      >
        <ProductForm
          formData={productForm}
          formErrors={formErrors}
          onChange={onProductChange}
          onSubmit={onSubmitProduct}
          onCancel={onCloseProductModal}
          isSubmitting={isSubmittingProduct}
          isEditing={!!selectedProduct}
          units={units}
          categories={categories}
        />
      </Modal>

      {/* Modal de Entrada */}
      <Modal 
        isOpen={isEntryModalOpen} 
        onClose={!isSubmittingEntry ? onCloseEntryModal : undefined} 
        title={`Registrar Entrada - ${selectedProduct?.name || ''}`} 
        size="lg" 
        error={entryModalError}
      >
        <ProductEntryForm
          formData={entryForm}
          formErrors={entryFormErrors}
          onChange={onEntryChange}
          onSubmit={onSubmitEntry}
          onCancel={onCloseEntryModal}
          isSubmitting={isSubmittingEntry}
          productName={selectedProduct?.name}
          showFeedback={showFeedback}
        />
      </Modal>

      {/* Modal de Detalhes */}
      <ProductDetailsModal
        isOpen={isViewModalOpen}
        onClose={onCloseViewModal}
        product={selectedProduct}
        entries={productDetails?.entries || []}
        movements={productDetails?.movements || []}
        units={units}
        isLoading={isLoadingDetails}
      />

      {/* Modal de Exclusão */}
      <ProductDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={onCloseDeleteModal}
        product={selectedProduct}
        onConfirm={onConfirmDelete}
        isSubmitting={isSubmittingDelete}
      />
    </>
  )
}

export default ProductsModalsContainer
