import React from 'react'
import { AlertCircle, RefreshCw, ChevronDown, ChevronUp, Copy, Check, Bug } from '../utils/icons'

class SectionErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      showDetails: false,
      copied: false
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })
    console.error('Erro na seção:', error, errorInfo)
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false })
    if (this.props.onRetry) {
      this.props.onRetry()
    } else {
      window.location.reload()
    }
  }

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }))
  }

  copyError = () => {
    const errorText = `
Erro: ${this.state.error?.message || 'Erro desconhecido'}
Stack: ${this.state.error?.stack || 'Não disponível'}
Component Stack: ${this.state.errorInfo?.componentStack || 'Não disponível'}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}
Time: ${new Date().toLocaleString()}
    `.trim()

    navigator.clipboard?.writeText(errorText).then(() => {
      this.setState({ copied: true })
      setTimeout(() => this.setState({ copied: false }), 2000)
    })
  }

  getFriendlyErrorMessage = (error) => {
    const message = error?.message || ''
    
    if (message.includes('Canvas is already in use')) {
      return 'Erro ao renderizar gráfico. Tente recarregar a página.'
    }
    if (message.includes('not a registered scale')) {
      return 'Erro na configuração do gráfico. Atualize a página.'
    }
    if (message.includes('failed to fetch') || message.includes('network')) {
      return 'Erro de conexão. Verifique sua internet.'
    }
    if (message.includes('permission') || message.includes('policy')) {
      return 'Você não tem permissão para acessar este recurso.'
    }
    if (message.includes('timeout')) {
      return 'O servidor demorou para responder. Tente novamente.'
    }
    if (message.includes('duplicate key')) {
      return 'Registro já existe no banco de dados.'
    }
    if (message.includes('foreign key')) {
      return 'Este registro está vinculado a outros dados e não pode ser removido.'
    }
    
    return message || 'Ocorreu um erro inesperado.'
  }

  getErrorHint = (error) => {
    const message = error?.message || ''
    
    if (message.includes('Canvas')) {
      return 'Tente recarregar a página ou limpar o cache do navegador.'
    }
    if (message.includes('network') || message.includes('fetch')) {
      return 'Verifique sua conexão com a internet e tente novamente.'
    }
    if (message.includes('permission')) {
      return 'Contate um administrador para solicitar acesso.'
    }
    
    return 'Se o problema persistir, contate o suporte técnico.'
  }

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, showDetails, copied } = this.state
      const friendlyMessage = this.getFriendlyErrorMessage(error)
      const hint = this.getErrorHint(error)

      return (
        <div className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-xl p-6 mx-8 shadow-lg">
          {/* Ícone e título */}
          <div className="flex items-start gap-4">
            <div className="bg-red-100 rounded-full p-3">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-800 mb-1">
                {this.props.title || 'Erro ao carregar esta seção'}
              </h3>
              <p className="text-sm text-red-600 mb-3">
                {friendlyMessage}
              </p>
              <p className="text-xs text-gray-600 mb-4">
                💡 {hint}
              </p>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              Tentar novamente
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Recarregar página
            </button>

            <button
              onClick={this.toggleDetails}
              className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
            >
              <Bug className="w-4 h-4" />
              {showDetails ? 'Ocultar detalhes' : 'Ver detalhes técnicos'}
              {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {/* Detalhes técnicos expansíveis */}
          {showDetails && (
            <div className="mt-4 space-y-3">
              <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-96">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-400">Detalhes do erro</span>
                  <button
                    onClick={this.copyError}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-green-500" />
                        <span className="text-green-500">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copiar
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div>
                    <span className="text-red-400">Erro:</span>
                    <pre className="text-red-300 mt-1 whitespace-pre-wrap">
                      {error?.toString() || 'Erro desconhecido'}
                    </pre>
                  </div>

                  {error?.stack && (
                    <div>
                      <span className="text-yellow-400">Stack:</span>
                      <pre className="text-yellow-300 mt-1 whitespace-pre-wrap text-[10px] max-h-32 overflow-auto">
                        {error.stack}
                      </pre>
                    </div>
                  )}

                  {errorInfo?.componentStack && (
                    <div>
                      <span className="text-blue-400">Componente:</span>
                      <pre className="text-blue-300 mt-1 whitespace-pre-wrap text-[10px] max-h-32 overflow-auto">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}

                  <div className="border-t border-gray-700 pt-2 mt-2">
                    <span className="text-gray-400">Informações adicionais:</span>
                    <ul className="text-gray-400 mt-1 space-y-1">
                      <li><strong>URL:</strong> {window.location.href}</li>
                      <li><strong>Horário:</strong> {new Date().toLocaleString()}</li>
                      <li><strong>Navegador:</strong> {navigator.userAgent}</li>
                      <li><strong>Plataforma:</strong> {navigator.platform}</li>
                    </ul>
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-500">
                Envie estas informações para o suporte técnico se o problema persistir.
              </p>
            </div>
          )}
        </div>
      )
    }

    return this.props.children
  }
}

export default SectionErrorBoundary