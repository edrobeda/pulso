import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  escapeXml,
  slugifyTag,
  isValidDownloadFile,
  containsBlockedContent,
  cdata,
  blocksToHtml,
} from './validation.js'

test('escapeXml escapa os cinco caracteres especiais de XML', () => {
  assert.equal(escapeXml(`<a href="x">Tom & Jerry's</a>`), '&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&apos;s&lt;/a&gt;')
})

test('escapeXml não altera texto sem caracteres especiais', () => {
  assert.equal(escapeXml('agente autônomo'), 'agente autônomo')
})

test('slugifyTag remove acento e vira minúsculo com hífen', () => {
  assert.equal(slugifyTag('Inteligência Artificial'), 'inteligencia-artificial')
})

test('slugifyTag colapsa pontuação e espaços em um único hífen', () => {
  assert.equal(slugifyTag('C#  &  .NET!!'), 'c-net')
})

test('slugifyTag remove hífen nas pontas', () => {
  assert.equal(slugifyTag('  --agente--  '), 'agente')
})

test('isValidDownloadFile aceita caminho relativo simples', () => {
  assert.equal(isValidDownloadFile('checklist-onboarding.pdf'), true)
  assert.equal(isValidDownloadFile('planilhas/custos-2026.csv'), true)
})

test('isValidDownloadFile rejeita path traversal', () => {
  assert.equal(isValidDownloadFile('../../etc/passwd'), false)
})

test('isValidDownloadFile rejeita barra inicial e caractere fora da allowlist', () => {
  assert.equal(isValidDownloadFile('/etc/passwd'), false)
  assert.equal(isValidDownloadFile('arquivo com espaço.pdf'), false)
})

test('isValidDownloadFile rejeita vazio e string maior que 150 chars', () => {
  assert.equal(isValidDownloadFile(''), false)
  assert.equal(isValidDownloadFile('a'.repeat(151)), false)
})

test('containsBlockedContent detecta link http/https e www', () => {
  assert.equal(containsBlockedContent('olha isso: http://spam.com'), true)
  assert.equal(containsBlockedContent('visita www.spam.com'), true)
})

test('containsBlockedContent detecta termos de spam comuns, acento-insensível', () => {
  assert.equal(containsBlockedContent('empréstimo fácil aprovado na hora'), true)
  assert.equal(containsBlockedContent('CASINO online 24h'), true)
})

test('containsBlockedContent deixa passar comentário legítimo', () => {
  assert.equal(containsBlockedContent('ótimo post, aprendi bastante sobre agentes'), false)
})

test('cdata envolve o texto e quebra a sequência ]]> pra não fechar o bloco cedo', () => {
  assert.equal(cdata('texto simples'), '<![CDATA[texto simples]]>')
  assert.equal(cdata('array[i]]> hack'), '<![CDATA[array[i]]]]><![CDATA[> hack]]>')
  assert.equal(cdata(null), '<![CDATA[]]>')
})

test('blocksToHtml mapeia cada tipo de bloco pra uma tag fixa e escapa o texto', () => {
  const html = blocksToHtml([
    { type: 'h2', text: 'Título & cia' },
    { type: 'quote', text: 'citação' },
    { type: 'code', text: 'a < b' },
    { type: 'paragraph', text: 'corpo' },
  ])
  assert.equal(
    html,
    '<h2>Título &amp; cia</h2>\n<blockquote><p>citação</p></blockquote>\n<pre><code>a &lt; b</code></pre>\n<p>corpo</p>'
  )
})

test('blocksToHtml devolve string vazia pra entrada não-array', () => {
  assert.equal(blocksToHtml(null), '')
  assert.equal(blocksToHtml(undefined), '')
})
