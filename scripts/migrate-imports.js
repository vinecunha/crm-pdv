// scripts/migrate-imports.js - Versão ES Modules
import fs from 'fs'
import path from 'path'
import { globSync } from 'glob'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const mappings = [
  // Components
  { from: /from\s+['"]\.\.\/\.\.\/\.\.\/components\//g, to: 'from \'@components/' },
  { from: /from\s+['"]\.\.\/\.\.\/components\//g, to: 'from \'@components/' },
  { from: /from\s+['"]\.\.\/components\//g, to: 'from \'@components/' },
  { from: /from\s+['"]\.\/components\//g, to: 'from \'@components/' },
  
  // Pages
  { from: /from\s+['"]\.\.\/\.\.\/\.\.\/pages\//g, to: 'from \'@pages/' },
  { from: /from\s+['"]\.\.\/\.\.\/pages\//g, to: 'from \'@pages/' },
  { from: /from\s+['"]\.\.\/pages\//g, to: 'from \'@pages/' },
  { from: /from\s+['"]\.\/pages\//g, to: 'from \'@pages/' },
  
  // Hooks
  { from: /from\s+['"]\.\.\/\.\.\/\.\.\/hooks\//g, to: 'from \'@hooks/' },
  { from: /from\s+['"]\.\.\/\.\.\/hooks\//g, to: 'from \'@hooks/' },
  { from: /from\s+['"]\.\.\/hooks\//g, to: 'from \'@hooks/' },
  { from: /from\s+['"]\.\/hooks\//g, to: 'from \'@hooks/' },
  
  // Utils
  { from: /from\s+['"]\.\.\/\.\.\/\.\.\/utils\//g, to: 'from \'@utils/' },
  { from: /from\s+['"]\.\.\/\.\.\/utils\//g, to: 'from \'@utils/' },
  { from: /from\s+['"]\.\.\/utils\//g, to: 'from \'@utils/' },
  { from: /from\s+['"]\.\/utils\//g, to: 'from \'@utils/' },
  
  // Lib
  { from: /from\s+['"]\.\.\/\.\.\/\.\.\/lib\//g, to: 'from \'@lib/' },
  { from: /from\s+['"]\.\.\/\.\.\/lib\//g, to: 'from \'@lib/' },
  { from: /from\s+['"]\.\.\/lib\//g, to: 'from \'@lib/' },
  { from: /from\s+['"]\.\/lib\//g, to: 'from \'@lib/' },
  
  // Contexts
  { from: /from\s+['"]\.\.\/\.\.\/\.\.\/contexts\//g, to: 'from \'@contexts/' },
  { from: /from\s+['"]\.\.\/\.\.\/contexts\//g, to: 'from \'@contexts/' },
  { from: /from\s+['"]\.\.\/contexts\//g, to: 'from \'@contexts/' },
  
  // Services
  { from: /from\s+['"]\.\.\/\.\.\/\.\.\/services\//g, to: 'from \'@services/' },
  { from: /from\s+['"]\.\.\/\.\.\/services\//g, to: 'from \'@services/' },
  { from: /from\s+['"]\.\.\/services\//g, to: 'from \'@services/' },
  
  // Importações de ícones (caso especial)
  { from: /from\s+['"]\.\.\/\.\.\/\.\.\/lib\/icons['"]/g, to: 'from \'@lib/icons\'' },
  { from: /from\s+['"]\.\.\/\.\.\/lib\/icons['"]/g, to: 'from \'@lib/icons\'' },
  { from: /from\s+['"]\.\.\/lib\/icons['"]/g, to: 'from \'@lib/icons\'' },
]

function migrateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8')
    let modified = false
    
    mappings.forEach(({ from, to }) => {
      if (from.test(content)) {
        content = content.replace(from, to)
        modified = true
      }
    })
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8')
      console.log(`✅ Migrado: ${filePath}`)
    }
  } catch (error) {
    console.error(`❌ Erro em ${filePath}:`, error.message)
  }
}

function migrateAll() {
  const srcPath = path.join(__dirname, '..', 'src')
  
  const files = globSync('**/*.{js,jsx,ts,tsx}', {
    cwd: srcPath,
    absolute: true,
    ignore: ['node_modules/**']
  })
  
  console.log(`📦 Encontrados ${files.length} arquivos`)
  
  files.forEach(migrateFile)
  
  console.log('🎉 Migração concluída!')
}

migrateAll()