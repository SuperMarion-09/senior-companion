import { Link } from 'react-router-dom';
import { BRAND } from '../content/siteContent';
import logo from '../assets/kaagapay-logo.svg';

/**
 * The Kaagapay logo (the "Magkaagapay" mark and wordmark), linking home.
 * `subtitle` adds a small second line under it (e.g. "Administration").
 *
 * The logo file comes from branding/logos/kaagapay-logo-horizontal.svg; see
 * branding/03-brand-guidelines.html before changing its size or colours.
 */
export default function Brand({ to = '/', subtitle }) {
  return (
    <Link to={to} className={subtitle ? 'brand brand--with-sub' : 'brand'}>
      <img className="brand__logo" src={logo} alt={BRAND.name} width="176" height="40" />
      {subtitle && <span className="brand__sub">{subtitle}</span>}
    </Link>
  );
}
