import { defineConfig } from 'vitepress'

import fs from 'fs';
import path from 'path';

// Helper to slugify names matching Python script
function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function generateSidebar() {
  const treePath = path.resolve(__dirname, '../../wiki-tree.json');
  if (!fs.existsSync(treePath)) return [];
  
  const tree = JSON.parse(fs.readFileSync(treePath, 'utf-8'));
  const docsDir = path.resolve(__dirname, '../');
  
  const sidebar = [];
  
  for (const cat of tree) {
    const catSlug = slugify(cat.name);
    const catPath = path.join(docsDir, catSlug);
    
    // Only add category if folder exists
    if (!fs.existsSync(catPath)) continue;
    
    const items = [];
    for (const sub of cat.subcategories) {
      const subSlug = slugify(sub);
      const fileLink = `/${catSlug}/${subSlug}`;
      const filePath = path.join(docsDir, catSlug, `${subSlug}.md`);
      
      // Only add link if markdown file was generated
      if (fs.existsSync(filePath)) {
        items.push({ text: sub, link: fileLink });
      }
    }
    
    if (items.length > 0) {
      sidebar.push({
        text: cat.name,
        collapsed: false,
        items: items
      });
    }
  }
  
  return sidebar;
}

// ── AUTO-LINKER PLUGIN ──────────────────────────────────────
const dictPath = path.resolve(__dirname, 'dictionary.json');
let dictionary: Record<string, string> = {};
if (fs.existsSync(dictPath)) {
  dictionary = JSON.parse(fs.readFileSync(dictPath, 'utf-8'));
}
const terms = Object.keys(dictionary).sort((a, b) => b.length - a.length);

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const regexPattern = terms.map(escapeRegExp).join('|');
// Lookbehind and lookahead to match whole words safely, ignoring case
const regex = terms.length > 0 
  ? new RegExp(`(?<=^|[^a-zA-ZáéíóúÁÉÍÓÚñÑ0-9])(${regexPattern})(?=[^a-zA-ZáéíóúÁÉÍÓÚñÑ0-9]|$)`, 'gi')
  : null;

function autoLinkPlugin(md: any) {
  if (!regex) return;
  
  md.core.ruler.push('autolink_terms', function (state: any) {
    for (const blockToken of state.tokens) {
      if (blockToken.type !== 'inline') continue;
      
      let newTokens = [];
      let insideLink = false;
      
      for (const token of blockToken.children) {
        if (token.type === 'link_open') insideLink = true;
        if (token.type === 'link_close') insideLink = false;
        
        if (token.type === 'text' && !insideLink) {
          const parts = [];
          let lastIndex = 0;
          let match;
          
          regex.lastIndex = 0; // reset regex state
          while ((match = regex.exec(token.content)) !== null) {
             const matchedText = match[1];
             const dictKey = terms.find(t => t.toLowerCase() === matchedText.toLowerCase());
             if (dictKey) {
                 if (match.index > lastIndex) {
                     let textToken = new state.Token('text', '', 0);
                     textToken.content = token.content.substring(lastIndex, match.index);
                     parts.push(textToken);
                 }
                 
                 // Crear link
                 let linkOpen = new state.Token('link_open', 'a', 1);
                 linkOpen.attrs = [['href', dictionary[dictKey]], ['class', 'auto-link']];
                 parts.push(linkOpen);
                 
                 let innerText = new state.Token('text', '', 0);
                 innerText.content = matchedText;
                 parts.push(innerText);
                 
                 let linkClose = new state.Token('link_close', 'a', -1);
                 parts.push(linkClose);
                 
                 lastIndex = match.index + matchedText.length;
             }
          }
          
          if (lastIndex < token.content.length) {
              let textToken = new state.Token('text', '', 0);
              textToken.content = token.content.substring(lastIndex);
              parts.push(textToken);
          }
          
          if (parts.length > 0) {
             newTokens.push(...parts);
          } else {
             newTokens.push(token);
          }
        } else {
           newTokens.push(token);
        }
      }
      blockToken.children = newTokens;
    }
  });
}

export default defineConfig({
  title: "Wiki CFRM",
  description: "Base de Datos de Reglas",
  base: '/wiki/',
  outDir: '../dist/wiki',
  cleanUrls: true,
  ignoreDeadLinks: true,
  themeConfig: {
    nav: [
      { text: 'Inicio', link: '/' },
      { text: 'Volver a la App', link: '/' }
    ],

    sidebar: generateSidebar(),

    search: {
      provider: 'local'
    }
  },

  markdown: {
    config: (md) => {
      md.use(autoLinkPlugin);
    }
  }
})
