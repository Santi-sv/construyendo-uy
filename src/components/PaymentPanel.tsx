import { Icon } from './Icons'
import { NextArrow } from './NextArrow'
import { PaymentMethodIcon } from './PaymentMethodIcon'

export function PaymentPanel() {
  return <article id="formas-de-pago" className="payment-panel payment-panel--clarity" data-reveal="up" aria-labelledby="payment-title">
    <div className="payment-heading-row"><span className="eyebrow"><span className="small-line" />FORMAS DE PAGO</span><span className="payment-heading-tag">A TU MEDIDA</span></div>
    <h2 id="payment-title">Tu obra.<br /><span>Cuentas claras.</span></h2>
    <p className="payment-intro">Efectivo o transferencia. Definimos la forma de pago y los plazos al preparar tu presupuesto.</p>

    <ul className="payment-options" aria-label="Medios de pago disponibles">
      <li className="payment-option payment-option--cash"><div className="payment-option-top"><span className="payment-option-icon"><PaymentMethodIcon method="cash" /></span><span className="payment-option-index">01</span></div><h3>Efectivo</h3><span className="payment-option-caption">PAGO EN EFECTIVO</span></li>
      <li className="payment-option payment-option--transfer"><div className="payment-option-top"><span className="payment-option-icon"><PaymentMethodIcon method="transfer" /></span><span className="payment-option-index">02</span></div><h3>Transferencia</h3><span className="payment-option-caption">BANCARIA</span></li>
    </ul>

    <div className="payment-agreement-box"><span className="payment-agreement-symbol"><Icon name="estimate" size={28} /></span><div><strong>Todo acordado antes de empezar.</strong><p>Los detalles de tu obra quedan definidos en el presupuesto.</p></div></div>
    <ul className="payment-terms" aria-label="Condiciones a definir en el presupuesto"><li><Icon name="check" size={15} />Importe</li><li><Icon name="check" size={15} />Forma de pago</li><li><Icon name="check" size={15} />Plazos</li></ul>

    <div className="payment-footer"><a className="button payment-visit-button next-cta next-cta--payment" href="#presupuesto"><svg className="cta-outline" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true"><rect x=".5" y=".5" width="99" height="39" pathLength="1" /></svg><Icon name="visit" size={21} /><span className="next-label">Preparar pedido de presupuesto</span><NextArrow /></a><p className="payment-footer-note">Coordinamos una visita para preparar tu presupuesto.</p></div>
  </article>
}
