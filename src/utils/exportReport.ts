export const exportSellerReport = (data, goals) => {
  const { profile: seller, metrics, topProducts } = data
  
  const reportContent = `
RELATÓRIO DE DESEMPENHO - ${seller.full_name || seller.email}
Gerado em: ${new Date().toLocaleString('pt-BR')}

==========================================
MÉTRICAS PRINCIPAIS
==========================================
Total de Vendas: ${metrics.totalSales}
Faturamento Total: R$ ${metrics.totalRevenue.toFixed(2)}
Ticket Médio: R$ ${metrics.averageTicket.toFixed(2)}
Clientes Atendidos: ${data.customersServed.length}

Vendas (30 dias): ${metrics.salesLast30Days}
Faturamento (30 dias): R$ ${metrics.revenueLast30Days.toFixed(2)}
Faturamento (ano): R$ ${metrics.revenueThisYear.toFixed(2)}

==========================================
METAS
==========================================
Meta Diária: R$ ${goals?.daily?.target_amount || 1000}
Meta Mensal: R$ ${goals?.monthly?.target_amount || 20000}
Meta Anual: R$ ${goals?.yearly?.target_amount || 240000}

Progresso Mensal: ${((metrics.revenueLast30Days / (goals?.monthly?.target_amount || 20000)) * 100).toFixed(1)}%
Progresso Anual: ${((metrics.revenueThisYear / (goals?.yearly?.target_amount || 240000)) * 100).toFixed(1)}%

==========================================
TOP 5 PRODUTOS
==========================================
${topProducts.slice(0, 5).map((p, i) => 
  `${i + 1}. ${p.name} - ${p.quantity} un - R$ ${p.revenue.toFixed(2)}`
).join('\n')}

==========================================
CONQUISTAS
==========================================
${metrics.largestSale ? `Maior Venda: R$ ${metrics.largestSale.amount.toFixed(2)} (Venda #${metrics.largestSale.sale_number})` : ''}
${metrics.bestDay ? `Melhor Dia: R$ ${metrics.bestDay.value.toFixed(2)} em ${new Date(metrics.bestDay.date).toLocaleDateString('pt-BR')}` : ''}
Performance Score: ${Math.round(metrics.performanceScore || 0)} pontos
`

  const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `relatorio_${seller.full_name?.replace(/\s/g, '_') || 'vendedor'}_${new Date().toISOString().split('T')[0]}.txt`
  link.click()
  URL.revokeObjectURL(url)
}
