import React, { useState, useEffect, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Copy, CheckCircle, Clock, X, RefreshCw, AlertCircle, ShieldCheck } from '../../../lib/icons'
import Button from '../../ui/Button'
import Modal from '../../ui/Modal'
import { formatCurrency } from '../../../utils/formatters'
import { supabase } from '../../../lib/supabase'

const generatePixLocally = (amount, description, saleId) => {
  const PIX_KEY      = "65182624000112"
  const MERCHANT_NAME = "65.182.624 VINICIUS CUNHA MARTINS"
  const MERCHANT_CITY = "NOVA IGUACU"

  const gui       = "BR.GOV.BCB.PIX"
  const guiField  = `00${gui.length.toString().padStart(2, '0')}${gui}`
  const keyField  = `01${PIX_KEY.length.toString().padStart(2, '0')}${PIX_KEY}`
  const field26Body = guiField + keyField
  const field26   = `26${field26Body.length.toString().padStart(2, '0')}${field26Body}`

  const amountStr = amount.toFixed(2)
  const field54   = `54${amountStr.length.toString().padStart(2, '0')}${amountStr}`

  const nameClean = MERCHANT_NAME.substring(0, 25).toUpperCase()
  const cityClean = MERCHANT_CITY.substring(0, 15).toUpperCase()
  const field59   = `59${nameClean.length.toString().padStart(2, '0')}${nameClean}`
  const field60   = `60${cityClean.length.toString().padStart(2, '0')}${cityClean}`

  const txid    = `SALE${saleId}`.replace(/[^A-Za-z0-9]/g, '').substring(0, 25)
  const field05 = `05${txid.length.toString().padStart(2, '0')}${txid}`
  const field62 = `62${field05.length.toString().padStart(2, '0')}${field05}`

  const payload =
    '000201' + field26 + '52040000' + '5303986' +
    field54  + '5802BR' + field59   + field60   +
    field62  + '6304'

  let crc = 0xFFFF
  for (let i = 0; i < payload.length; i++) {
    crc ^= (payload.charCodeAt(i) << 8) & 0xFFFF
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000)
        ? ((crc << 1) ^ 0x1021) & 0xFFFF
        : (crc << 1) & 0xFFFF
    }
  }

  return {
    txid,
    qrcode_text: payload + crc.toString(16).toUpperCase().padStart(4, '0'),
    expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString()
  }
}

const PixPaymentModal = ({
  isOpen,
  onClose,
  saleId,
  amount,
  description,
  onPaymentConfirmed
}) => {
  const [qrcodeText, setQrcodeText]   = useState('')
  const [expiresAt, setExpiresAt]     = useState(null)
  const [status, setStatus]           = useState('loading')
  const [timeLeft, setTimeLeft]       = useState('')
  const [copied, setCopied]           = useState(false)
  const [error, setError]             = useState('')
  const [confirming, setConfirming]   = useState(false)

  const intervalRef = useRef(null)
  const mountedRef  = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    if (isOpen && saleId && amount) generatePixQrCode()
    return () => {
      mountedRef.current = false
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isOpen, saleId, amount])

  useEffect(() => {
    if (!expiresAt || status !== 'pending') return
    updateTimeLeft()
    intervalRef.current = setInterval(updateTimeLeft, 1000)
    return () => clearInterval(intervalRef.current)
  }, [expiresAt, status])

  const generatePixQrCode = async () => {
    setStatus('loading')
    setError('')

    try {
      const pixData = generatePixLocally(amount, description, saleId)

      await supabase.from('pix_charges').upsert({
        sale_id:     saleId,
        txid:        pixData.txid,
        qrcode_text: pixData.qrcode_text,
        amount,
        status:      'pending',
        expires_at:  pixData.expires_at
      }, { onConflict: 'sale_id' })

      setQrcodeText(pixData.qrcode_text)
      setExpiresAt(new Date(pixData.expires_at))
      setStatus('pending')
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  const updateTimeLeft = () => {
    if (!expiresAt) return
    const diff = expiresAt - new Date()
    if (diff <= 0) {
      setTimeLeft('Expirado')
      setStatus('expired')
      clearInterval(intervalRef.current)
      return
    }
    const m = Math.floor(diff / 60000)
    const s = Math.floor((diff % 60000) / 1000)
    setTimeLeft(`${m}:${s.toString().padStart(2, '0')}`)
  }

  const copyToClipboard = () => {
    if (!qrcodeText) return
    navigator.clipboard?.writeText(qrcodeText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleConfirmPayment = async () => {
    setConfirming(true)

    try {
      const { error: pixError } = await supabase
        .from('pix_charges')
        .update({
          status:   'paid',
          paid_at:  new Date().toISOString()
        })
        .eq('sale_id', saleId)

      if (pixError) throw pixError

      const { error: saleError } = await supabase
        .from('sales')
        .update({
          payment_status: 'paid',
          payment_method: 'pix',
          updated_at:     new Date().toISOString()
        })
        .eq('id', saleId)

      if (saleError) throw saleError

      clearInterval(intervalRef.current)
      setStatus('paid')

      setTimeout(() => {
        if (mountedRef.current) onPaymentConfirmed?.()
      }, 2000)

    } catch (err) {
      setError(err.message || 'Erro ao confirmar pagamento')
      setConfirming(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pagamento via PIX"
      size="md"
      showCloseButton={status !== 'pending'}
    >
      <div className="space-y-6">

        {status === 'loading' && (
          <div className="text-center py-8">
            <RefreshCw size={32} className="animate-spin mx-auto text-blue-600 mb-4 dark:text-blue-400" />
            <p className="text-gray-600 dark:text-gray-400">Gerando QR Code...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 dark:bg-red-900/30">
              <AlertCircle size={32} className="text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 dark:text-white">Erro</h3>
            <p className="text-gray-600 mb-4 dark:text-gray-400">{error || 'Tente novamente'}</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={generatePixQrCode}>Tentar novamente</Button>
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
            </div>
          </div>
        )}

        {status === 'pending' && (
          <>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1 dark:text-gray-400">Valor a pagar</p>
              <p className="text-4xl font-bold text-gray-900 dark:text-white">{formatCurrency(amount)}</p>
            </div>

            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-xl border-2 border-gray-200 dark:bg-gray-900 dark:border-gray-700">
                {qrcodeText && (
                  <QRCodeSVG
                    value={qrcodeText}
                    size={220}
                    level="M"
                    includeMargin={true}
                    bgColor="transparent"
                    fgColor="currentColor"
                    className="dark:text-white"
                  />
                )}
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400">
              <Clock size={18} />
              <span className="font-medium">Expira em {timeLeft}</span>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2 dark:text-gray-400">PIX Copia e Cola:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={qrcodeText}
                  readOnly
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono truncate dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
                <Button
                  variant="outline"
                  onClick={copyToClipboard}
                  icon={copied ? CheckCircle : Copy}
                >
                  {copied ? 'Copiado!' : 'Copiar'}
                </Button>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 dark:bg-blue-900/20 dark:border dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>📱 Como pagar:</strong><br />
                1. Abra o app do seu banco<br />
                2. Escolha PIX e escaneie o QR Code<br />
                3. Confirme o pagamento<br />
                4. Informe ao operador para confirmar abaixo
              </p>
            </div>

            <div className="border-t pt-4 dark:border-gray-700">
              <p className="text-xs text-gray-500 mb-3 text-center dark:text-gray-400">
                Após o cliente realizar o pagamento, confirme para dar baixa na venda.
              </p>
              <Button
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 text-base dark:bg-green-700 dark:hover:bg-green-600"
                onClick={handleConfirmPayment}
                disabled={confirming}
              >
                {confirming
                  ? <><RefreshCw size={18} className="animate-spin" /> Confirmando...</>
                  : <><ShieldCheck size={18} /> Confirmar Recebimento e Concluir Venda</>
                }
              </Button>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={generatePixQrCode}
                className="flex-1"
              >
                Gerar novo QR Code
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </>
        )}

        {status === 'paid' && (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 dark:bg-green-900/30">
              <CheckCircle size={40} className="text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1 dark:text-white">Venda Concluída!</h3>
            <p className="text-gray-500 text-sm dark:text-gray-400">Pagamento PIX confirmado com sucesso.</p>
            <div className="mt-4 bg-green-50 rounded-lg p-3 text-sm text-green-800 font-medium dark:bg-green-900/20 dark:text-green-300">
              {formatCurrency(amount)} recebido ✅
            </div>
          </div>
        )}

        {status === 'expired' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 dark:bg-amber-900/30">
              <Clock size={32} className="text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2 dark:text-white">QR Code Expirado</h3>
            <p className="text-gray-600 mb-4 dark:text-gray-400">O tempo para pagamento expirou.</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={generatePixQrCode}>Gerar novo QR Code</Button>
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
            </div>
          </div>
        )}

      </div>
    </Modal>
  )
}

export default PixPaymentModal