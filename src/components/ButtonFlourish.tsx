import type { CSSProperties } from 'react'

const particles = [
  ['7%', '8%', '-17px', '-22px'], ['21%', '0%', '-9px', '-29px'],
  ['40%', '0%', '-4px', '-20px'], ['65%', '0%', '8px', '-25px'],
  ['86%', '5%', '15px', '-22px'], ['100%', '32%', '24px', '-8px'],
  ['100%', '76%', '21px', '14px'], ['81%', '100%', '12px', '25px'],
  ['59%', '100%', '5px', '22px'], ['34%', '100%', '-5px', '26px'],
  ['12%', '95%', '-15px', '22px'], ['0%', '52%', '-24px', '3px'],
]
const bubbles = [
  ['6%', '4%', '-22px', '-20px'], ['10%', '0%', '-12px', '-24px'],
  ['0%', '18%', '-26px', '-10px'], ['94%', '96%', '22px', '20px'],
  ['90%', '100%', '12px', '24px'], ['100%', '82%', '26px', '10px'],
]

export function ButtonFlourish({ kind }: { kind: 'bubble' | 'fizzy' }) {
  return <span className={`button-flourish button-flourish--${kind}`} aria-hidden="true">
    {(kind === 'bubble' ? bubbles : particles).map(([x, y, dx, dy], index) => <i key={index} style={{
      '--x': x, '--y': y, '--dx': dx, '--dy': dy, '--delay': `${(index % 4) * 65}ms`,
    } as CSSProperties} />)}
  </span>
}
