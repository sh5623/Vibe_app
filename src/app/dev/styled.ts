import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';

// === Keyframes ===
const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(32px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const blink = keyframes`
  0%, 49%  { opacity: 1; }
  50%, 100% { opacity: 0; }
`;

const marquee = keyframes`
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.25; }
`;

const slideIn = keyframes`
  from { opacity: 0; transform: translateX(-20px); }
  to   { opacity: 1; transform: translateX(0); }
`;

// === Page ===
export const PageWrapper = styled.div`
  background: var(--bg-color);
  min-height: 100vh;
  color: #f0ede8;
  font-family: var(--font-syne), sans-serif;
  overflow-x: hidden;
`;

// === Navigation ===
export const Nav = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 3rem;
  background: rgba(10, 10, 10, 0.85);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(240, 237, 232, 0.06);

  @media (max-width: 768px) {
    padding: 1.25rem 1.5rem;
  }
`;

export const NavLogo = styled.div`
  font-family: var(--font-mono), monospace;
  font-size: 0.8rem;
  color: #adff2f;
  letter-spacing: 0.25em;
  text-transform: uppercase;
`;

export const NavLinks = styled.div`
  display: flex;
  gap: 2.5rem;

  @media (max-width: 768px) {
    gap: 1.25rem;
  }
`;

export const NavLink = styled.a`
  font-family: var(--font-mono), monospace;
  font-size: 0.72rem;
  color: rgba(240, 237, 232, 0.4);
  text-decoration: none;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  transition: color 0.2s ease;

  &:hover {
    color: #adff2f;
  }

  @media (max-width: 480px) {
    display: none;

    &:last-child {
      display: block;
    }
  }
`;

// === Hero ===
export const HeroSection = styled.section`
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 3rem;
  position: relative;
  border-bottom: 1px solid rgba(240, 237, 232, 0.07);

  @media (max-width: 768px) {
    padding: 0 1.5rem;
  }
`;

export const StatusBadge = styled.div`
  position: absolute;
  top: 7rem;
  right: 3rem;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-family: var(--font-mono), monospace;
  font-size: 0.7rem;
  color: rgba(240, 237, 232, 0.45);
  letter-spacing: 0.12em;
  animation: ${slideIn} 0.8s ease 0.6s both;

  .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #adff2f;
    animation: ${pulse} 2.2s ease-in-out infinite;
    flex-shrink: 0;
  }

  @media (max-width: 768px) {
    right: 1.5rem;
    top: 6rem;
  }
`;

export const HeroEyebrow = styled.div`
  font-family: var(--font-mono), monospace;
  font-size: 0.72rem;
  letter-spacing: 0.35em;
  color: #adff2f;
  text-transform: uppercase;
  margin-bottom: 2rem;
  animation: ${fadeUp} 0.7s ease both;
  display: flex;
  align-items: center;
  gap: 1rem;

  &::before {
    content: '';
    display: block;
    width: 2.5rem;
    height: 1px;
    background: #adff2f;
    flex-shrink: 0;
  }
`;

export const HeroName = styled.h1`
  font-size: clamp(4.5rem, 13vw, 15rem);
  font-weight: 800;
  line-height: 0.88;
  letter-spacing: -0.025em;
  margin-bottom: 2.5rem;
  animation: ${fadeUp} 0.7s ease 0.1s both;

  .outline {
    -webkit-text-stroke: 1.5px rgba(240, 237, 232, 0.25);
    color: transparent;
  }
`;

export const HeroRole = styled.div`
  font-family: var(--font-mono), monospace;
  font-size: clamp(0.85rem, 2vw, 1.2rem);
  color: rgba(240, 237, 232, 0.55);
  margin-bottom: 3.5rem;
  animation: ${fadeUp} 0.7s ease 0.2s both;
  min-height: 2em;
  display: flex;
  align-items: center;

  @media (max-width: 480px) {
    margin-bottom: 2.5rem;
  }
`;

export const Cursor = styled.span`
  display: inline-block;
  width: 2px;
  height: 1.1em;
  background: #adff2f;
  margin-left: 3px;
  vertical-align: middle;
  animation: ${blink} 1s step-end infinite;
  flex-shrink: 0;
`;

export const HeroCTAs = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  animation: ${fadeUp} 0.7s ease 0.3s both;
`;

export const CTAPrimary = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.9rem 2rem;
  background: #adff2f;
  color: #0a0a0a;
  font-family: var(--font-mono), monospace;
  font-size: 0.78rem;
  font-weight: 500;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  text-decoration: none;
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    background: #f0ede8;
    transform: translateY(-2px);
  }

  @media (max-width: 480px) {
    flex: 1;
    justify-content: center;
    padding: 0.9rem 1.5rem;
  }
`;

export const CTASecondary = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.9rem 2rem;
  background: transparent;
  color: #f0ede8;
  border: 1px solid rgba(240, 237, 232, 0.2);
  font-family: var(--font-mono), monospace;
  font-size: 0.78rem;
  font-weight: 500;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  text-decoration: none;
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    border-color: #adff2f;
    color: #adff2f;
  }

  @media (max-width: 480px) {
    flex: 1;
    justify-content: center;
    padding: 0.9rem 1.5rem;
  }
`;

export const ScrollHint = styled.div`
  position: absolute;
  bottom: 2.5rem;
  right: 3rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-mono), monospace;
  font-size: 0.65rem;
  color: rgba(240, 237, 232, 0.25);
  letter-spacing: 0.25em;
  text-transform: uppercase;
  writing-mode: vertical-rl;
  animation: ${fadeUp} 0.7s ease 0.5s both;

  @media (max-width: 768px) {
    display: none;
  }
`;

// === Marquee ===
export const MarqueeBand = styled.div`
  overflow: hidden;
  border-top: 1px solid #adff2f;
  border-bottom: 1px solid #adff2f;
  background: #adff2f;
  padding: 1rem 0;
`;

export const MarqueeTrack = styled.div`
  display: flex;
  width: max-content;
  animation: ${marquee} 22s linear infinite;
`;

export const MarqueeItem = styled.span`
  font-family: var(--font-syne), sans-serif;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.35em;
  text-transform: uppercase;
  color: #0a0a0a;
  padding: 0 2.5rem;
  white-space: nowrap;
  flex-shrink: 0;
`;

// === Section ===
export const Section = styled.section`
  padding: 8rem 3rem;
  border-bottom: 1px solid rgba(240, 237, 232, 0.07);

  @media (max-width: 768px) {
    padding: 5rem 1.5rem;
  }
`;

export const SectionHeader = styled.div`
  display: flex;
  align-items: baseline;
  gap: 1.5rem;
  margin-bottom: 5rem;

  @media (max-width: 768px) {
    margin-bottom: 3rem;
    flex-direction: column;
    gap: 0.5rem;
  }
`;

export const SectionNumber = styled.span`
  font-family: var(--font-mono), monospace;
  font-size: 0.72rem;
  color: #adff2f;
  letter-spacing: 0.25em;
  flex-shrink: 0;
`;

export const SectionTitle = styled.h2`
  font-size: clamp(2.2rem, 5.5vw, 5rem);
  font-weight: 800;
  letter-spacing: -0.025em;
  line-height: 1;
`;

// === About ===
export const AboutGrid = styled.div`
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 6rem;
  align-items: start;

  @media (max-width: 1024px) {
    gap: 3rem;
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 3.5rem;
  }
`;

export const AboutText = styled.p`
  font-size: clamp(1rem, 1.4vw, 1.15rem);
  line-height: 1.85;
  color: rgba(240, 237, 232, 0.65);
  margin-bottom: 1.5rem;

  strong {
    color: #f0ede8;
    font-weight: 700;
  }
`;

export const StatGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

export const StatCard = styled.div`
  background: rgba(240, 237, 232, 0.02);
  border: 1px solid rgba(240, 237, 232, 0.08);
  padding: 2rem 1.75rem;
  transition: border-color 0.2s ease;

  &:hover {
    border-color: rgba(173, 255, 47, 0.25);
  }

  .num {
    font-size: 2.75rem;
    font-weight: 800;
    color: #adff2f;
    line-height: 1;
    margin-bottom: 0.6rem;
    font-variant-numeric: tabular-nums;
  }

  .label {
    font-family: var(--font-mono), monospace;
    font-size: 0.65rem;
    letter-spacing: 0.22em;
    color: rgba(240, 237, 232, 0.35);
    text-transform: uppercase;
  }
`;

// === Skills ===
export const SkillCategory = styled.div`
  margin-bottom: 3rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

export const CategoryLabel = styled.div`
  font-family: var(--font-mono), monospace;
  font-size: 0.68rem;
  letter-spacing: 0.3em;
  color: rgba(240, 237, 232, 0.28);
  text-transform: uppercase;
  margin-bottom: 1.25rem;
`;

export const SkillsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
`;

export const SkillTag = styled.div<{ accent?: boolean }>`
  display: inline-flex;
  align-items: center;
  padding: 0.55rem 1.2rem;
  border: 1px solid ${({ accent }) => accent ? '#adff2f' : 'rgba(240, 237, 232, 0.12)'};
  font-family: var(--font-mono), monospace;
  font-size: 0.75rem;
  color: ${({ accent }) => accent ? '#adff2f' : 'rgba(240, 237, 232, 0.55)'};
  letter-spacing: 0.05em;
  transition: all 0.2s ease;
  cursor: default;

  &:hover {
    border-color: #adff2f;
    color: #adff2f;
    background: rgba(173, 255, 47, 0.04);
  }
`;

// === Projects ===
export const ProjectsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const ProjectCard = styled.div`
  background: rgba(240, 237, 232, 0.015);
  border: 1px solid rgba(240, 237, 232, 0.08);
  padding: 2.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(173, 255, 47, 0.03);
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }

  &:hover {
    border-color: rgba(173, 255, 47, 0.28);
    transform: translateY(-3px);

    &::after {
      opacity: 1;
    }

    .arrow {
      transform: translate(4px, -4px);
      color: #adff2f;
    }
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.5rem;
  }

  .arrow {
    color: rgba(240, 237, 232, 0.25);
    transition: all 0.3s ease;
    flex-shrink: 0;
  }
`;

export const ProjectNum = styled.div`
  font-family: var(--font-mono), monospace;
  font-size: 0.68rem;
  color: #adff2f;
  letter-spacing: 0.25em;
`;

export const ProjectName = styled.h3`
  font-size: 1.4rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  margin-bottom: 0.85rem;
  line-height: 1.2;
`;

export const ProjectDesc = styled.p`
  font-size: 0.88rem;
  color: rgba(240, 237, 232, 0.48);
  line-height: 1.75;
  margin-bottom: 1.75rem;
`;

export const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
`;

export const Tag = styled.span`
  font-family: var(--font-mono), monospace;
  font-size: 0.62rem;
  color: rgba(240, 237, 232, 0.35);
  border: 1px solid rgba(240, 237, 232, 0.1);
  padding: 0.25rem 0.6rem;
  letter-spacing: 0.04em;
`;

// === Contact ===
export const ContactSection = styled.section`
  padding: 12rem 3rem 8rem;
  text-align: center;
  position: relative;
  overflow: hidden;

  @media (max-width: 768px) {
    padding: 8rem 1.5rem 5rem;
  }
`;

export const ContactGlow = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60vw;
  height: 60vw;
  background: radial-gradient(circle, rgba(173, 255, 47, 0.04) 0%, transparent 65%);
  pointer-events: none;
`;

export const ContactTitle = styled.h2`
  font-size: clamp(3rem, 9vw, 10.5rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 0.88;
  margin-bottom: 4rem;
  position: relative;

  .outline {
    -webkit-text-stroke: 1.5px rgba(240, 237, 232, 0.18);
    color: transparent;
  }
`;

export const ContactLinks = styled.div`
  display: flex;
  justify-content: center;
  gap: 3rem;
  flex-wrap: wrap;
  position: relative;
`;

export const ContactLink = styled.a`
  font-family: var(--font-mono), monospace;
  font-size: 0.82rem;
  letter-spacing: 0.22em;
  color: rgba(240, 237, 232, 0.45);
  text-decoration: none;
  text-transform: uppercase;
  border-bottom: 1px solid rgba(240, 237, 232, 0.18);
  padding-bottom: 3px;
  transition: all 0.2s ease;

  &:hover {
    color: #adff2f;
    border-color: #adff2f;
  }

  @media (max-width: 480px) {
    font-size: 0.75rem;
    letter-spacing: 0.15em;
  }
`;

// === Footer ===
export const Footer = styled.footer`
  padding: 2rem 3rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid rgba(240, 237, 232, 0.07);
  font-family: var(--font-mono), monospace;
  font-size: 0.68rem;
  color: rgba(240, 237, 232, 0.2);
  letter-spacing: 0.12em;

  @media (max-width: 768px) {
    padding: 1.5rem;
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
  }
`;
