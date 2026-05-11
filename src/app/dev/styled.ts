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

const orbFloat = keyframes`
  0%, 100% { transform: translateY(0) scale(1); }
  50%       { transform: translateY(-28px) scale(1.04); }
`;

const codeFloat = keyframes`
  0%, 100% { transform: translateY(-50%) rotate(-1.5deg); }
  50%       { transform: translateY(calc(-50% - 14px)) rotate(1deg); }
`;

const slideIn = keyframes`
  from { opacity: 0; transform: translateX(-20px); }
  to   { opacity: 1; transform: translateX(0); }
`;

const dotGlow = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5); }
  50%       { box-shadow: 0 0 0 5px rgba(16, 185, 129, 0); }
`;

// === Page ===
export const PageWrapper = styled.div`
  background-color: #f0f4ff;
  background-image: radial-gradient(rgba(79, 70, 229, 0.07) 1px, transparent 1px);
  background-size: 32px 32px;
  min-height: 100vh;
  color: #0f172a;
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
  padding: 1.25rem 3rem;
  background: rgba(240, 244, 255, 0.88);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(79, 70, 229, 0.1);

  @media (max-width: 768px) {
    padding: 1rem 1.5rem;
  }
`;

export const NavLogo = styled.div`
  font-family: var(--font-mono), monospace;
  font-size: 0.88rem;
  font-weight: 700;
  background: linear-gradient(135deg, #4f46e5, #06b6d4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 0.15em;
  text-transform: uppercase;
`;

export const NavLinks = styled.div`
  display: flex;
  gap: 2.5rem;
  align-items: center;

  @media (max-width: 768px) {
    gap: 1rem;
  }

  @media (max-width: 420px) {
    gap: 0.75rem;
  }
`;

export const NavLink = styled.a`
  font-family: var(--font-mono), monospace;
  font-size: 0.75rem;
  color: #64748b;
  text-decoration: none;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  transition: color 0.2s ease;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: -3px;
    left: 0;
    width: 0;
    height: 1.5px;
    background: linear-gradient(90deg, #4f46e5, #06b6d4);
    transition: width 0.25s ease;
  }

  &:hover {
    color: #4f46e5;

    &::after {
      width: 100%;
    }
  }

  @media (max-width: 480px) {
    font-size: 0.68rem;
  }
`;

// === Hero ===
export const HeroSection = styled.section`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 6rem 3rem;
  position: relative;
  overflow: hidden;

  @media (max-width: 768px) {
    padding: 6rem 1.5rem 4rem;
  }
`;

export const HeroOrbA = styled.div`
  position: absolute;
  width: 700px;
  height: 700px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(79, 70, 229, 0.18) 0%, transparent 70%);
  top: -200px;
  right: -150px;
  animation: ${orbFloat} 9s ease-in-out infinite;
  pointer-events: none;

  @media (max-width: 768px) {
    width: 380px;
    height: 380px;
    top: -100px;
    right: -80px;
  }
`;

export const HeroOrbB = styled.div`
  position: absolute;
  width: 500px;
  height: 500px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(6, 182, 212, 0.14) 0%, transparent 70%);
  bottom: -80px;
  left: -80px;
  animation: ${orbFloat} 13s ease-in-out infinite reverse;
  pointer-events: none;

  @media (max-width: 768px) {
    width: 280px;
    height: 280px;
  }
`;

export const HeroCodeCard = styled.div`
  position: absolute;
  right: 7%;
  top: 50%;
  transform: translateY(-50%) rotate(-1.5deg);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(79, 70, 229, 0.14);
  border-radius: 14px;
  padding: 1.75rem 2rem;
  box-shadow:
    0 24px 60px rgba(79, 70, 229, 0.14),
    0 0 0 1px rgba(255, 255, 255, 0.8);
  font-family: var(--font-mono), monospace;
  font-size: 0.8rem;
  line-height: 1.9;
  animation: ${codeFloat} 7s ease-in-out infinite;
  z-index: 1;
  min-width: 300px;

  .line-num {
    color: rgba(100, 116, 139, 0.35);
    margin-right: 1.25rem;
    user-select: none;
  }
  .kw  { color: #7c3aed; }
  .fn  { color: #0369a1; }
  .str { color: #059669; }
  .vr  { color: #c2410c; }

  @media (max-width: 1100px) {
    display: none;
  }
`;

export const StatusBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  font-family: var(--font-mono), monospace;
  font-size: 0.72rem;
  color: #64748b;
  letter-spacing: 0.1em;
  margin-bottom: 2rem;
  animation: ${fadeUp} 0.7s ease both;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(79, 70, 229, 0.12);
  border-radius: 100px;
  padding: 0.4rem 1rem 0.4rem 0.65rem;
  width: fit-content;
  backdrop-filter: blur(10px);

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #10b981;
    animation: ${dotGlow} 2.2s ease-in-out infinite;
    flex-shrink: 0;
  }
`;

export const HeroEyebrow = styled.div`
  font-family: var(--font-mono), monospace;
  font-size: 0.75rem;
  letter-spacing: 0.3em;
  color: #4f46e5;
  text-transform: uppercase;
  margin-bottom: 1.25rem;
  animation: ${fadeUp} 0.7s ease 0.05s both;
`;

export const HeroName = styled.h1`
  font-size: clamp(2.8rem, 11vw, 13rem);
  font-weight: 800;
  line-height: 0.95;
  letter-spacing: -0.03em;
  margin-bottom: 1.5rem;
  animation: ${fadeUp} 0.7s ease 0.1s both;
  position: relative;
  z-index: 1;

  .gradient {
    background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .outline {
    -webkit-text-stroke: 2px rgba(79, 70, 229, 0.22);
    color: transparent;
  }
`;

export const HeroRole = styled.div`
  font-family: var(--font-mono), monospace;
  font-size: clamp(0.9rem, 2vw, 1.2rem);
  color: #64748b;
  margin-bottom: 3rem;
  animation: ${fadeUp} 0.7s ease 0.2s both;
  min-height: 2em;
  display: flex;
  align-items: center;
  position: relative;
  z-index: 1;
`;

export const Cursor = styled.span`
  display: inline-block;
  width: 2px;
  height: 1.1em;
  background: #4f46e5;
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
  position: relative;
  z-index: 1;
`;

export const CTAPrimary = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.9rem 2.25rem;
  background: linear-gradient(135deg, #4f46e5, #6d28d9);
  color: white;
  font-family: var(--font-mono), monospace;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  text-decoration: none;
  border-radius: 10px;
  transition: all 0.25s ease;
  box-shadow: 0 4px 20px rgba(79, 70, 229, 0.35);
  cursor: pointer;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 32px rgba(79, 70, 229, 0.45);
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
  padding: 0.9rem 2.25rem;
  background: rgba(255, 255, 255, 0.9);
  color: #4f46e5;
  border: 1.5px solid rgba(79, 70, 229, 0.2);
  font-family: var(--font-mono), monospace;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  text-decoration: none;
  border-radius: 10px;
  transition: all 0.25s ease;
  cursor: pointer;
  backdrop-filter: blur(10px);

  &:hover {
    border-color: #4f46e5;
    background: rgba(79, 70, 229, 0.06);
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(79, 70, 229, 0.12);
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
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-mono), monospace;
  font-size: 0.65rem;
  color: #94a3b8;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  animation: ${slideIn} 0.8s ease 0.6s both;

  &::after {
    content: '';
    width: 1px;
    height: 40px;
    background: linear-gradient(to bottom, #4f46e5, transparent);
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

// === Marquee ===
export const MarqueeBand = styled.div`
  overflow: hidden;
  background: linear-gradient(90deg, #4f46e5, #06b6d4, #4f46e5);
  background-size: 200% 100%;
  padding: 0.9rem 0;
`;

export const MarqueeTrack = styled.div`
  display: flex;
  width: max-content;
  animation: ${marquee} 22s linear infinite;
`;

export const MarqueeItem = styled.span`
  font-family: var(--font-mono), monospace;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.92);
  padding: 0 2.5rem;
  white-space: nowrap;
  flex-shrink: 0;
`;

// === Section ===
export const Section = styled.section`
  padding: 8rem 3rem;
  border-bottom: 1px solid rgba(79, 70, 229, 0.07);
  position: relative;

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
  font-size: 0.75rem;
  background: linear-gradient(135deg, #4f46e5, #06b6d4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 0.25em;
  flex-shrink: 0;
  font-weight: 600;
`;

export const SectionTitle = styled.h2`
  font-size: clamp(2.2rem, 5.5vw, 5rem);
  font-weight: 800;
  letter-spacing: -0.025em;
  line-height: 1;
  color: #0f172a;
`;

// === About ===
export const AboutGrid = styled.div`
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 5rem;
  align-items: start;

  @media (max-width: 1024px) {
    gap: 3rem;
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 3rem;
  }
`;

export const AboutText = styled.p`
  font-size: clamp(1rem, 1.4vw, 1.1rem);
  line-height: 1.85;
  color: #64748b;
  margin-bottom: 1.25rem;

  strong {
    color: #0f172a;
    font-weight: 700;
  }
`;

export const StatGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
`;

export const StatCard = styled.div`
  background: #ffffff;
  border: 1px solid rgba(79, 70, 229, 0.12);
  border-radius: 16px;
  padding: 2rem 1.75rem;
  transition: all 0.25s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #4f46e5, #06b6d4);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.35s ease;
    border-radius: 16px 16px 0 0;
  }

  &:hover {
    border-color: rgba(79, 70, 229, 0.25);
    transform: translateY(-5px);
    box-shadow: 0 16px 40px rgba(79, 70, 229, 0.1);

    &::before {
      transform: scaleX(1);
    }
  }

  .num {
    font-size: 2.5rem;
    font-weight: 800;
    background: linear-gradient(135deg, #4f46e5, #06b6d4);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    line-height: 1;
    margin-bottom: 0.5rem;
  }

  .label {
    font-family: var(--font-mono), monospace;
    font-size: 0.68rem;
    letter-spacing: 0.2em;
    color: #94a3b8;
    text-transform: uppercase;
  }
`;

// === Skills ===
export const SkillCategory = styled.div`
  margin-bottom: 2.5rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

export const CategoryLabel = styled.div`
  font-family: var(--font-mono), monospace;
  font-size: 0.7rem;
  letter-spacing: 0.25em;
  color: #4f46e5;
  text-transform: uppercase;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;

  &::after {
    content: '';
    height: 1px;
    background: linear-gradient(90deg, rgba(79, 70, 229, 0.25), transparent);
    flex: 1;
  }
`;

export const SkillsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
`;

export const SkillTag = styled.div<{ accent?: boolean }>`
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1.1rem;
  border-radius: 100px;
  font-family: var(--font-mono), monospace;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  transition: all 0.2s ease;
  cursor: default;
  background: ${({ accent }) => accent
    ? 'linear-gradient(135deg, rgba(79, 70, 229, 0.1), rgba(6, 182, 212, 0.1))'
    : 'rgba(100, 116, 139, 0.07)'};
  border: ${({ accent }) => accent
    ? '1.5px solid rgba(79, 70, 229, 0.25)'
    : '1px solid rgba(100, 116, 139, 0.16)'};
  color: ${({ accent }) => accent ? '#4f46e5' : '#64748b'};
  font-weight: ${({ accent }) => accent ? 600 : 400};

  &:hover {
    background: ${({ accent }) => accent
      ? 'linear-gradient(135deg, rgba(79, 70, 229, 0.18), rgba(6, 182, 212, 0.18))'
      : 'rgba(79, 70, 229, 0.05)'};
    border-color: #4f46e5;
    color: #4f46e5;
    transform: translateY(-2px);
    box-shadow: ${({ accent }) => accent ? '0 4px 14px rgba(79, 70, 229, 0.2)' : 'none'};
  }
`;

// === Projects ===
export const ProjectsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const ProjectCard = styled.div`
  background: #ffffff;
  border: 1px solid rgba(79, 70, 229, 0.1);
  border-radius: 20px;
  padding: 2.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #4f46e5, #06b6d4);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.35s ease;
    border-radius: 20px 20px 0 0;
  }

  &:hover {
    border-color: rgba(79, 70, 229, 0.2);
    transform: translateY(-6px);
    box-shadow: 0 20px 50px rgba(79, 70, 229, 0.12);

    &::before {
      transform: scaleX(1);
    }

    .arrow {
      transform: translate(4px, -4px);
      color: #4f46e5;
    }
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.5rem;
  }

  .arrow {
    color: rgba(100, 116, 139, 0.35);
    transition: all 0.3s ease;
    flex-shrink: 0;
  }
`;

export const ProjectNum = styled.div`
  font-family: var(--font-mono), monospace;
  font-size: 0.72rem;
  background: linear-gradient(135deg, #4f46e5, #06b6d4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 0.2em;
  font-weight: 600;
`;

export const ProjectName = styled.h3`
  font-size: 1.4rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  margin-bottom: 0.75rem;
  line-height: 1.25;
  color: #0f172a;
`;

export const ProjectDesc = styled.p`
  font-size: 0.9rem;
  color: #64748b;
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
  font-size: 0.65rem;
  color: #64748b;
  background: rgba(100, 116, 139, 0.07);
  border: 1px solid rgba(100, 116, 139, 0.14);
  border-radius: 6px;
  padding: 0.25rem 0.65rem;
  letter-spacing: 0.04em;
`;

// === Contact ===
export const ContactSection = styled.section`
  padding: 12rem 3rem 8rem;
  text-align: center;
  position: relative;
  overflow: hidden;
  background: linear-gradient(160deg, rgba(79, 70, 229, 0.05) 0%, rgba(6, 182, 212, 0.04) 100%);

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
  background: radial-gradient(circle, rgba(79, 70, 229, 0.08) 0%, transparent 65%);
  pointer-events: none;
`;

export const ContactTitle = styled.h2`
  font-size: clamp(2.5rem, 9vw, 10rem);
  font-weight: 800;
  line-height: 1;
  margin-bottom: 3.5rem;
  position: relative;
  letter-spacing: -0.025em;
  color: #0f172a;

  .gradient {
    background: linear-gradient(135deg, #4f46e5, #06b6d4);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .outline {
    -webkit-text-stroke: 2px rgba(79, 70, 229, 0.2);
    color: transparent;
  }
`;

export const ContactLinks = styled.div`
  display: flex;
  justify-content: center;
  gap: 1.25rem;
  flex-wrap: wrap;
  position: relative;
`;

export const ContactLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  font-family: var(--font-mono), monospace;
  font-size: 0.82rem;
  letter-spacing: 0.15em;
  color: #64748b;
  text-decoration: none;
  text-transform: uppercase;
  background: #ffffff;
  border: 1.5px solid rgba(79, 70, 229, 0.14);
  border-radius: 10px;
  padding: 0.85rem 2rem;
  transition: all 0.25s ease;
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.06);

  &:hover {
    color: #4f46e5;
    border-color: #4f46e5;
    transform: translateY(-3px);
    box-shadow: 0 10px 28px rgba(79, 70, 229, 0.16);
  }

  @media (max-width: 480px) {
    font-size: 0.75rem;
    padding: 0.75rem 1.5rem;
  }
`;

// === Footer ===
export const Footer = styled.footer`
  padding: 2rem 3rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid rgba(79, 70, 229, 0.08);
  font-family: var(--font-mono), monospace;
  font-size: 0.68rem;
  color: #94a3b8;
  letter-spacing: 0.1em;

  @media (max-width: 768px) {
    padding: 1.5rem;
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
  }
`;
