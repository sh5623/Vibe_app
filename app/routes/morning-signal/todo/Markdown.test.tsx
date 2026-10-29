import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Markdown } from './Markdown'

const html = (text: string) => renderToStaticMarkup(<Markdown text={text} />)

describe('Markdown', () => {
  it('목록·체크·굵게·링크를 렌더한다', () => {
    const out = html('# 제목\n- **a**\n- [x] 끝\n\n[g](https://x.com)')
    expect(out).toContain('<strong>a</strong>')
    expect(out).toContain('md-task')
    expect(out).toContain('href="https://x.com"')
    expect(out).toContain('md-h1')
  })

  it('HTML 과 javascript: 링크는 문자열로 남긴다', () => {
    const out = html('<script>x</script> [a](javascript:alert(1))')
    expect(out).not.toContain('<script>')
    expect(out).not.toContain('href="javascript')
  })

  it('코드블록 안은 해석하지 않는다', () => {
    expect(html('```\n**a**\n```')).toContain('<code>**a**</code>')
  })

  it('문단·인용의 둘째 줄 이후도 인라인 뒤 글자를 남긴다', () => {
    expect(html('a\nb **x** c')).toContain('<p>a<br/>b <strong>x</strong> c</p>')
    expect(html('> a\n> `y` z')).toContain('<code>y</code> z')
  })
})
