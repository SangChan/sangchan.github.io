#!/usr/bin/env node
// content.ko.json + content.en.json + template.html -> index.html
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const template = fs.readFileSync(path.join(ROOT, 'template.html'), 'utf8');

const LANGS = ['ko', 'en'];

function renderMark(prefix, suffixHtml) {
  return `<div class="chapter-mark">${prefix} <span>${suffixHtml}</span></div>`;
}

function renderNav(chapters, langCode) {
  return chapters
    .map((c) => {
      const navText = c.numeral.replace(/\.$/, '');
      return `  <a href="#${c.id}-${langCode}" class="toc-item" data-label="${c.tocLabel}">${navText}</a>`;
    })
    .join('\n');
}

function renderHero(hero) {
  return [
    `    <div class="byline">${hero.name}<span class="dot-sep">·</span><a href="mailto:${hero.email}">${hero.email}</a></div>`,
    `    <div class="eyebrow">${hero.eyebrow}</div>`,
    `    <h1 class="identity">`,
    `      ${hero.identityHtml}`,
    `    </h1>`,
    `    <div class="role-line">${hero.roleLine}</div>`,
  ].join('\n');
}

function renderBlock(block) {
  switch (block.type) {
    case 'lede':
      return `    <p class="lede">${block.html}</p>`;
    case 'p':
      return `    <p>${block.html}</p>`;
    case 'quote':
      return `    <blockquote>${block.html}</blockquote>`;
    case 'muted':
      return `    <p class="muted">${block.html}</p>`;
    case 'plate':
      return [
        `    <div class="plate">`,
        `      <div class="plate-header">`,
        `        <div class="dot"></div><div class="dot"></div><div class="dot"></div>`,
        `        <span style="margin-left:6px;">${block.label}</span>`,
        `      </div>`,
        `      <div class="plate-body">${block.bodyHtml}</div>`,
        `    </div>`,
      ].join('\n');
    case 'metrics':
      return [
        `    <div class="metric-row">`,
        ...block.items.map(
          (item) =>
            `      <div class="metric-item">\n        <span class="metric-num">${item.num}</span>\n        <span class="metric-label">${item.label}</span>\n      </div>`
        ),
        `    </div>`,
      ].join('\n');
    case 'furtherReading':
      return `    <p class="further-reading"><a href="${block.url}" target="_blank" rel="noreferrer">${block.label}</a></p>`;
    default:
      throw new Error(`Unknown block type: ${block.type}`);
  }
}

function renderChapter(chapter, langCode) {
  return [
    `  <section class="chapter" id="${chapter.id}-${langCode}">`,
    `    ${renderMark('chapter', chapter.numeral)}`,
    `    <h2 class="chapter-title">${chapter.title}</h2>`,
    `    <div class="chapter-sub">${chapter.sub}</div>`,
    '',
    chapter.blocks.map(renderBlock).join('\n\n'),
    `  </section>`,
    '',
  ].join('\n');
}

function renderPriorRoles(priorRoles) {
  return [
    `  <section class="prior-roles">`,
    `    ${renderMark(priorRoles.label, priorRoles.labelSub)}`,
    `    <div class="plate">`,
    `      <div class="plate-header">`,
    `        <div class="dot"></div><div class="dot"></div><div class="dot"></div>`,
    `        <span style="margin-left:6px;">${priorRoles.plateLabel}</span>`,
    `      </div>`,
    `      <div class="plate-body">${priorRoles.bodyHtml}</div>`,
    `    </div>`,
    `  </section>`,
    '',
  ].join('\n');
}

function renderContact(contact, langCode) {
  const links = contact.links
    .map(
      (l) =>
        `      <a href="${l.href}"${l.external ? ' target="_blank" rel="noreferrer"' : ''}>${l.label}</a>`
    )
    .join('\n');
  return [
    `  <section class="contact" id="contact-${langCode}">`,
    `    ${renderMark(contact.label, contact.labelSub)}`,
    `    <div class="contact-links" aria-label="${contact.ariaLabel}">`,
    links,
    `    </div>`,
    `  </section>`,
    '',
  ].join('\n');
}

function renderLangSwitch(contents) {
  return LANGS.map((code, i) => {
    const cls = i === 0 ? 'lang-item active' : 'lang-item';
    return `<button type="button" class="${cls}" data-lang="${code}" data-title="${contents[code].meta.title}">${code.toUpperCase()}</button>`;
  }).join('<span class="lang-sep">/</span>');
}

function renderPanel(content, langCode, isDefault) {
  const nav = [
    `<nav class="toc" aria-label="${content.meta.navAriaLabel}">`,
    renderNav(content.chapters, langCode),
    `  <a href="#contact-${langCode}" class="toc-item" data-label="${content.meta.contactNavLabel}">end</a>`,
    `</nav>`,
  ].join('\n');

  const wrap = [
    `<div class="wrap">`,
    `  <header class="hero">`,
    renderHero(content.hero),
    `  </header>`,
    '',
    content.chapters.map((c) => renderChapter(c, langCode)).join('\n'),
    `  <section class="epilogue">`,
    `    <p class="epilogue-quote">${content.epilogueQuote}</p>`,
    `  </section>`,
    '',
    renderPriorRoles(content.priorRoles),
    renderContact(content.contact, langCode),
    `  <footer>`,
    `    <div class="sign">${content.footer}</div>`,
    `  </footer>`,
    `</div>`,
  ].join('\n');

  return [`<div class="i18n" data-lang="${langCode}"${isDefault ? '' : ' hidden'}>`, nav, wrap, `</div>`].join(
    '\n'
  );
}

const contents = {};
for (const code of LANGS) {
  contents[code] = JSON.parse(fs.readFileSync(path.join(ROOT, `content.${code}.json`), 'utf8'));
}

const html = template
  .replace('{{TITLE}}', contents.ko.meta.title)
  .replace('{{LANG_SWITCH_ARIA}}', contents.ko.meta.langSwitchAriaLabel)
  .replace('{{LANG_SWITCH}}', renderLangSwitch(contents))
  .replace('{{PANELS}}', LANGS.map((code, i) => renderPanel(contents[code], code, i === 0)).join('\n'));

fs.writeFileSync(path.join(ROOT, 'index.html'), html);
console.log('Built index.html from content.ko.json + content.en.json');
