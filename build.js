#!/usr/bin/env node
// content.json + template.html -> index.html
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const content = JSON.parse(fs.readFileSync(path.join(ROOT, 'content.json'), 'utf8'));
const template = fs.readFileSync(path.join(ROOT, 'template.html'), 'utf8');

function renderMark(prefix, suffixHtml) {
  return `<div class="chapter-mark">${prefix} <span>${suffixHtml}</span></div>`;
}

function renderNav(chapters) {
  return chapters
    .map((c) => {
      const navText = c.numeral.replace(/\.$/, '');
      return `  <a href="#${c.id}" class="toc-item" data-label="${c.tocLabel}">${navText}</a>`;
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

function renderChapter(chapter) {
  return [
    `  <section class="chapter" id="${chapter.id}">`,
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

function renderContact(contact) {
  const links = contact.links
    .map(
      (l) =>
        `      <a href="${l.href}"${l.external ? ' target="_blank" rel="noreferrer"' : ''}>${l.label}</a>`
    )
    .join('\n');
  return [
    `  <section class="contact" id="contact">`,
    `    ${renderMark(contact.label, contact.labelSub)}`,
    `    <div class="contact-links" aria-label="연락처">`,
    links,
    `    </div>`,
    `  </section>`,
    '',
  ].join('\n');
}

const html = template
  .replace('{{TITLE}}', content.meta.title)
  .replace('{{NAV}}', renderNav(content.chapters))
  .replace('{{HERO}}', renderHero(content.hero))
  .replace('{{CHAPTERS}}', content.chapters.map(renderChapter).join('\n'))
  .replace('{{EPILOGUE_QUOTE}}', content.epilogueQuote)
  .replace('{{PRIOR_ROLES}}', renderPriorRoles(content.priorRoles))
  .replace('{{CONTACT}}', renderContact(content.contact))
  .replace('{{FOOTER}}', content.footer);

fs.writeFileSync(path.join(ROOT, 'index.html'), html);
console.log('Built index.html from content.json');
