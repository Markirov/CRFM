import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "Wiki CFRM",
  description: "Manuales de reglas y juego",
  base: '/wiki/',
  outDir: '../dist/wiki',
  cleanUrls: true,
  themeConfig: {
    nav: [
      { text: 'Inicio', link: '/' },
      { text: 'Volver a la App', link: '/' }
    ],

    sidebar: [
      {
        text: 'Manuales',
        items: [
          { text: 'Total Warfare', link: '/total-warfare' },
          { text: 'Campaign Operations', link: '/campaign-operations' },
          { text: 'TechManual', link: '/techmanual' }
        ]
      }
    ],

    search: {
      provider: 'local'
    }
  }
})
