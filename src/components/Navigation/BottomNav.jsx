import { NavLink } from 'react-router-dom';
import './BottomNav.css';

const links = [
  {
    to: '/',
    label: 'Resumen',
    ariaLabel: 'Resumen del rancho',
    icon: (
      <>
        <path d="M5 12l7-7 7 7" />
        <path d="M7 12v8h10v-8" />
      </>
    ),
  },
  {
    to: '/animales',
    label: 'Animales',
    ariaLabel: 'Lista de animales',
    icon: (
      <>
        <circle cx="12" cy="13" r="6" />
        <path d="M10 8Q3 4 5 1" />
        <path d="M14 8Q21 4 19 1" />
      </>
    ),
  },
  {
    to: '/potreros',
    label: 'Potreros',
    ariaLabel: 'Gestión de potreros',
    icon: (
      <>
        <path d="M5 20V6M12 20V6M19 20V6" />
        <path d="M3 10h18M3 15h18" />
      </>
    ),
  },
  {
    to: '/reportes',
    label: 'Reportes',
    ariaLabel: 'Reportes y estadísticas',
    icon: (
      <>
        <path d="M7 3h7l5 5v13H7V3z" />
        <path d="M14 3v5h5" />
        <path d="M10 12h7" />
        <path d="M10 15.5h5" />
        <path d="M10 19h3" />
      </>
    ),
  },
  {
    to: '/calendario',
    label: 'Calendario',
    ariaLabel: 'Calendario de eventos',
    icon: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="M4 9h16" />
        <path d="M9 2v4M15 2v4" />
      </>
    ),
  },
];

export function BottomNav() {
  return (
    <nav className="bottom-nav">
      {links.map(({ to, label, ariaLabel, icon }) => (
        <NavLink key={to} to={to} end={to === '/'} className="bottom-nav__item" aria-label={ariaLabel}>
          <svg className="bottom-nav__icon" viewBox="0 0 24 24">
            {icon}
          </svg>
          <span className="bottom-nav__label">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
