import { Nav, NavLogo, NavLinks, NavLink } from '../styled';

export default function Navigation() {
  return (
    <Nav>
      <NavLogo>SH.DEV</NavLogo>
      <NavLinks>
        <NavLink href="#about">About</NavLink>
        <NavLink href="#stack">Stack</NavLink>
        <NavLink href="#work">Work</NavLink>
        <NavLink href="#contact">Contact</NavLink>
      </NavLinks>
    </Nav>
  );
}
