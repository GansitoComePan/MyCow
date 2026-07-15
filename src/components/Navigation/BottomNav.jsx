import { NavLink } from 'react-router-dom';
import './BottomNav.css';

const links = [
  { to: '/', label: 'Resumen', ariaLabel: 'Resumen del rancho' },
  { to: '/animales', label: 'Animales', ariaLabel: 'Lista de animales' },
  { to: '/potreros', label: 'Potreros', ariaLabel: 'Gestión de potreros' },
  { to: '/reportes', label: 'Reportes', ariaLabel: 'Reportes y estadísticas' },
  { to: '/calendario', label: 'Calendario', ariaLabel: 'Calendario de eventos' },
];

export function BottomNav() {
  return (
    <nav className="bottom-nav">
      {links.map(({ to, label, ariaLabel }) => (
        <NavLink key={to} to={to} end={to === '/'} className="bottom-nav__item" aria-label={ariaLabel}>
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
