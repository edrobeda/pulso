import { useEffect } from 'react'
import { lessons } from '../content/lab/lessons'
import { setDocumentMeta } from '../lib/seo'

const TAG_LABEL = {
  deploy: 'deploy',
  frontend: 'frontend',
  infra: 'infra',
  agentes: 'agentes',
}

// Contagem própria (sem terceiro): dispara junto do clique, sem bloquear o
// download nativo do navegador (sem preventDefault, best-effort).
function trackDownload(file) {
  fetch('/api/downloads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file }),
  }).catch(() => {})
}

export default function Laboratorio() {
  useEffect(() => {
    setDocumentMeta({
      title: 'Laboratório',
      description:
        'Lições reais tiradas da operação dos agentes autônomos do Pulso, com templates pra download — o que quebrou, por quê, e como evitamos de novo.',
      path: '/laboratorio',
    })
  }, [])

  return (
    <section className="laboratorio">
      <div className="intro">
        <p className="intro__eyebrow">problemas reais, resolvidos em produção</p>
        <h1>Laboratório.</h1>
        <p>
          Os agentes que escrevem e cuidam do Pulso encontram problemas de
          verdade no caminho — aqui ficam registrados como lições, cada uma
          com um template genérico pra download, sem depender do nosso
          ambiente específico.
        </p>
      </div>

      <div className="lab-disclaimer">
        <strong>Aviso legal:</strong> todo material disponível aqui é
        fornecido &ldquo;como está&rdquo;, sem garantias de qualquer tipo,
        extraído e adaptado de casos reais pra uso genérico. Não foi testado
        no seu ambiente. Leia, entenda e avalie antes de rodar em produção —
        não nos responsabilizamos por qualquer dano, perda de dados ou mau
        funcionamento decorrente do uso deste conteúdo.
      </div>

      <ul className="lab-list">
        {lessons.map((item) => (
          <li className="lab-item" key={item.slug}>
            <div className="lab-item__head">
              <span className="lab-badge">{TAG_LABEL[item.tag] || item.tag}</span>
            </div>
            <h2 className="lab-item__title">{item.title}</h2>
            <p className="lab-item__label">o que aconteceu</p>
            <p className="lab-item__text">{item.problem}</p>
            <p className="lab-item__label">a lição</p>
            <p className="lab-item__text">{item.lesson}</p>
            <div className="lab-download-list">
              {item.downloads.map((d) => (
                <a
                  className="lab-download"
                  href={`/downloads/${d.file}`}
                  download
                  key={d.file}
                  onClick={() => trackDownload(d.file)}
                >
                  <span className="lab-download__icon" aria-hidden="true">↓</span>
                  {d.label}
                </a>
              ))}
            </div>
          </li>
        ))}
      </ul>

      <p className="lab-footnote">
        Cada download tem o mesmo aviso legal no próprio cabeçalho do
        arquivo. Avalie, teste e adapte antes de usar — a responsabilidade
        de validar num ambiente real é sempre de quem executa.
      </p>
    </section>
  )
}
