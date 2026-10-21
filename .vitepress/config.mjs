import { defineConfig } from 'vitepress'
import container from 'markdown-it-container'
import { phases } from './theme/labs.js'

const base = process.env.BASE_PATH || '/'

const sidebar = [
  ...phases.map((phase) => ({
    text: `${phase.icon} ${phase.shortTitle}`,
    collapsed: false,
    items: phase.units.map((unit) => ({
      text: `${String(unit.stepNumber).padStart(2, '0')} · ${unit.short || unit.title}`,
      link: unit.path
    }))
  })),
  {
    text: '📖 Reference & Study Tools',
    collapsed: false,
    items: [
      { text: 'Plain-English Glossary', link: '/glossary/' },
      { text: 'Study Dashboard & Notes', link: '/#progress' }
    ]
  }
]

const stageDropdown = (stageId) => {
  const phase = phases.find((p) => p.id === stageId)
  if (!phase) return { text: stageId, items: [] }
  return {
    text: `${phase.icon} ${phase.shortTitle}`,
    items: phase.units.map((unit) => ({
      text: `${String(unit.stepNumber).padStart(2, '0')} · ${unit.title}`,
      link: unit.path
    }))
  }
}

export default defineConfig({
  lang: 'en-US',
  title: 'Websec Decompiled',
  description:
    'An offline-first, detective-style web security learning path covering all 31 PortSwigger Academy topics and 272 labs in plain English.',
  cleanUrls: false,
  base,
  appearance: 'dark',
  srcExclude: ['README.md'],
  head: [
    ['link', { rel: 'icon', href: `${base}favicon.svg`, type: 'image/svg+xml' }],
    ['meta', { name: 'theme-color', content: '#0b1120' }],
    ['meta', { property: 'og:title', content: 'Websec Decompiled' }],
    [
      'meta',
      {
        property: 'og:description',
        content:
          'Detective-style web security training: 6 guided stages, 35 case files, 272 Academy labs, plain-English explanations, and visual request breakdowns.'
      }
    ]
  ],

  markdown: {
    lineNumbers: true,
    theme: { light: 'github-light', dark: 'github-dark' },
    config(md) {
      md.use(container, 'lab', {
        render(tokens, idx) {
          const token = tokens[idx]
          if (token.nesting === 1) return '<section class="wd-lab">\n'
          return '</section>\n'
        }
      })
    }
  },

  themeConfig: {
    logo: '/favicon.svg',
    siteTitle: 'Websec Decompiled',

    nav: [
      { text: '🗺️ Path', link: '/#syllabus' },
      {
        text: 'Stages 1–3',
        items: [
          stageDropdown('stage-1'),
          stageDropdown('stage-2'),
          stageDropdown('stage-3')
        ]
      },
      {
        text: 'Stages 4–6',
        items: [
          stageDropdown('stage-4'),
          stageDropdown('stage-5'),
          stageDropdown('stage-6')
        ]
      },
      { text: '📖 Glossary', link: '/glossary/' }
    ],

    sidebar,

    outline: { level: [2, 3], label: 'Case File Outline' },

    search: {
      provider: 'local',
      options: {
        detailedView: true,
        miniSearch: {
          options: {
            fuzzy: 0.2,
            prefix: true,
            boost: { title: 4, text: 2, titles: 2 }
          },
          searchOptions: {
            fuzzy: 0.2,
            prefix: true,
            boost: { title: 4, text: 2, titles: 2 }
          }
        },
        translations: {
          button: {
            buttonText: 'Search cases, labs & terms',
            buttonAriaLabel: 'Search cases, labs & terms'
          },
          modal: {
            displayDetails: 'Show detailed list',
            resetButtonTitle: 'Clear search',
            backButtonTitle: 'Back',
            noResultsText: 'No results for',
            footer: {
              selectText: 'to select',
              navigateText: 'to navigate',
              closeText: 'to close'
            }
          }
        }
      }
    },

    docFooter: { prev: '← Previous Case File in Path', next: 'Next Case File in Path →' },
    darkModeSwitchLabel: 'Appearance',
    lightModeSwitchTitle: 'Switch to light mode',
    darkModeSwitchTitle: 'Switch to dark mode',
    returnToTopLabel: 'Back to top',
    sidebarMenuLabel: 'Learning Path',
    externalLinkIcon: true,

    footer: {
      message:
        'Built for offline study. Practice labs open on PortSwigger Web Security Academy.',
      copyright: 'Websec Decompiled · 6-Stage Detective Edition'
    }
  },

  vite: {
    build: {
      emptyOutDir: false
    },
    server: {
      port: Number(process.env.PORT) || 5173
    }
  }
})
