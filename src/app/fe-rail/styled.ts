import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';

const orbFloat = keyframes`
  0%, 100% { transform: translateY(0) scale(1); }
  50%       { transform: translateY(-24px) scale(1.03); }
`;

const pulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(129, 140, 248, 0.5); }
  50%       { box-shadow: 0 0 0 6px rgba(129, 140, 248, 0); }
`;

// ─── Page ─────────────────────────────────────────────────────────────────────
export const PageWrapper = styled.div`
  background-color: #070b1a;
  background-image: radial-gradient(rgba(99, 102, 241, 0.06) 1px, transparent 1px);
  background-size: 32px 32px;
  min-height: 100vh;
  color: #f1f5f9;
  font-family: var(--font-syne), sans-serif;
  overflow-x: hidden;
`;

// ─── Nav ──────────────────────────────────────────────────────────────────────
export const Nav = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 3rem;
  background: rgba(7, 11, 26, 0.88);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(99, 102, 241, 0.12);

  @media (max-width: 768px) {
    padding: 1rem 1.5rem;
  }
`;

export const NavButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-mono), monospace;
  font-size: 0.75rem;
  color: #64748b;
  letter-spacing: 0.1em;
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.2s ease;
  padding: 0;

  &:hover {
    color: #818cf8;
  }
`;

export const NavAnchor = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-mono), monospace;
  font-size: 0.75rem;
  color: #64748b;
  letter-spacing: 0.1em;
  text-decoration: none;
  transition: color 0.2s ease;

  &:hover {
    color: #818cf8;
  }
`;

export const NavLogo = styled.div`
  font-family: var(--font-mono), monospace;
  font-size: 0.9rem;
  font-weight: 700;
  background: linear-gradient(135deg, #818cf8, #67e8f9);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 0.2em;
  text-transform: uppercase;
`;

export const LangToggle = styled.button<{ $active: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  font-family: var(--font-mono), monospace;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  background: rgba(255, 255, 255, 0.05);
  border: 1.5px solid rgba(99, 102, 241, 0.22);
  border-radius: 100px;
  cursor: pointer;
  padding: 0;
  overflow: hidden;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 1px 4px rgba(99, 102, 241, 0.08);

  &:hover {
    border-color: rgba(99, 102, 241, 0.45);
    box-shadow: 0 2px 10px rgba(99, 102, 241, 0.18);
  }

  .opt {
    position: relative;
    z-index: 1;
    padding: 0.38rem 0.9rem;
    transition: color 0.25s ease;
  }

  .opt-ko {
    color: ${({ $active }) => ($active ? '#ffffff' : '#475569')};
  }

  .opt-en {
    color: ${({ $active }) => (!$active ? '#ffffff' : '#475569')};
  }

  .slider {
    position: absolute;
    top: 2px;
    bottom: 2px;
    width: calc(50% - 2px);
    background: linear-gradient(135deg, #6366f1, #4f46e5);
    border-radius: 100px;
    transition: left 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    left: ${({ $active }) => ($active ? '2px' : 'calc(50%)')};
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);
  }
`;

// ─── Hero ─────────────────────────────────────────────────────────────────────
export const HeroSection = styled.section`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 8rem 3rem 6rem;
  position: relative;
  overflow: hidden;
  text-align: center;

  @media (max-width: 768px) {
    padding: 7rem 1.5rem 5rem;
  }
`;

export const HeroOrb = styled.div<{
  $top?: string;
  $right?: string;
  $bottom?: string;
  $left?: string;
  $color: string;
  $size: string;
  $delay?: string;
}>`
  position: absolute;
  width: ${({ $size }) => $size};
  height: ${({ $size }) => $size};
  border-radius: 50%;
  background: ${({ $color }) => `radial-gradient(circle, ${$color} 0%, transparent 65%)`};
  top: ${({ $top }) => $top ?? 'auto'};
  right: ${({ $right }) => $right ?? 'auto'};
  bottom: ${({ $bottom }) => $bottom ?? 'auto'};
  left: ${({ $left }) => $left ?? 'auto'};
  pointer-events: none;
  animation: ${orbFloat} ${({ $delay }) => $delay ?? '9s'} ease-in-out infinite;

  @media (max-width: 768px) {
    width: calc(${({ $size }) => $size} * 0.55);
    height: calc(${({ $size }) => $size} * 0.55);
  }
`;

export const HeroBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  font-family: var(--font-mono), monospace;
  font-size: 0.72rem;
  color: #818cf8;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.22);
  border-radius: 100px;
  padding: 0.45rem 1.1rem 0.45rem 0.75rem;
  margin-bottom: 2rem;
  backdrop-filter: blur(8px);

  .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #818cf8;
    flex-shrink: 0;
    animation: ${pulse} 2.2s ease-in-out infinite;
  }
`;

export const HeroTitle = styled.h1`
  font-size: clamp(2.4rem, 7vw, 6rem);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.03em;
  margin-bottom: 1.5rem;
  max-width: 900px;
  color: #f1f5f9;
  position: relative;
  z-index: 1;

  .accent {
    background: linear-gradient(135deg, #818cf8 0%, #34d399 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  @media (max-width: 768px) {
    font-size: clamp(2rem, 8vw, 3rem);
  }
`;

export const HeroSubtitle = styled.p`
  font-size: clamp(0.88rem, 1.4vw, 1.05rem);
  color: #64748b;
  line-height: 1.85;
  max-width: 620px;
  margin-bottom: 2.5rem;
  font-family: var(--font-mono), monospace;
  position: relative;
  z-index: 1;
`;

export const CTARow = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  position: relative;
  z-index: 1;
`;

export const CTAPrimary = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.9rem 2.25rem;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: white;
  font-family: var(--font-mono), monospace;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  text-decoration: none;
  border-radius: 10px;
  transition: all 0.25s ease;
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
  cursor: pointer;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 32px rgba(99, 102, 241, 0.55);
  }

  @media (max-width: 480px) {
    flex: 1;
    justify-content: center;
  }
`;

export const CTASecondary = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.9rem 2.25rem;
  color: #818cf8;
  border: 1.5px solid rgba(99, 102, 241, 0.28);
  font-family: var(--font-mono), monospace;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  text-decoration: none;
  border-radius: 10px;
  transition: all 0.25s ease;
  cursor: pointer;
  background: rgba(99, 102, 241, 0.06);
  backdrop-filter: blur(8px);

  &:hover {
    border-color: rgba(99, 102, 241, 0.55);
    background: rgba(99, 102, 241, 0.12);
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(99, 102, 241, 0.2);
  }

  @media (max-width: 480px) {
    flex: 1;
    justify-content: center;
  }
`;

// ─── Sections ─────────────────────────────────────────────────────────────────
export const SectionOuter = styled.section`
  padding: 8rem 3rem;
  border-top: 1px solid rgba(99, 102, 241, 0.08);

  &:nth-of-type(even) {
    background: rgba(255, 255, 255, 0.02);
  }

  @media (max-width: 768px) {
    padding: 5rem 1.5rem;
  }
`;

export const SectionInner = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
`;

export const SectionLabel = styled.div`
  font-family: var(--font-mono), monospace;
  font-size: 0.72rem;
  color: #818cf8;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  margin-bottom: 0.75rem;
`;

export const SectionTitle = styled.h2`
  font-size: clamp(1.8rem, 4vw, 3.5rem);
  font-weight: 800;
  letter-spacing: -0.025em;
  line-height: 1.1;
  margin-bottom: 1rem;
  color: #f1f5f9;
`;

export const SectionDesc = styled.p`
  font-size: 0.95rem;
  color: #64748b;
  line-height: 1.8;
  max-width: 560px;
  margin-bottom: 4rem;
  font-family: var(--font-mono), monospace;

  @media (max-width: 768px) {
    margin-bottom: 2.5rem;
  }
`;

// ─── Skills ───────────────────────────────────────────────────────────────────
export const SkillsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 580px) {
    grid-template-columns: 1fr;
  }
`;

export const SkillDetailSection = styled.div`
  scroll-margin-top: 100px;
`;

export const SkillDetailGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const SkillDetailCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(99, 102, 241, 0.12);
  border-radius: 16px;
  padding: 2rem;
  position: relative;
  overflow: hidden;
  transition: border-color 0.25s ease, box-shadow 0.25s ease, background 0.25s ease;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, #6366f1, #34d399);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.35s ease;
    border-radius: 16px 16px 0 0;
  }

  &:hover {
    border-color: rgba(99, 102, 241, 0.28);
    box-shadow: 0 8px 32px rgba(99, 102, 241, 0.12);
    background: rgba(255, 255, 255, 0.05);

    &::before {
      transform: scaleX(1);
    }
  }

  .icon {
    font-size: 2rem;
    display: block;
    margin-bottom: 1rem;
  }

  .cmd {
    display: inline-block;
    font-family: var(--font-mono), monospace;
    font-size: 0.72rem;
    color: #34d399;
    background: rgba(52, 211, 153, 0.08);
    border: 1px solid rgba(52, 211, 153, 0.18);
    padding: 0.3rem 0.85rem;
    border-radius: 6px;
    margin-top: 1rem;
    letter-spacing: 0.04em;
  }
`;

export const SkillDetailTitle = styled.h3`
  font-size: 1.05rem;
  font-weight: 700;
  margin-bottom: 0.6rem;
  letter-spacing: -0.01em;
  color: #f1f5f9;
`;

export const SkillDetailDesc = styled.p`
  font-size: 0.85rem;
  color: #64748b;
  line-height: 1.75;
`;

// ─── Agents ───────────────────────────────────────────────────────────────────
export const AgentPhaseLabel = styled.div`
  font-family: var(--font-mono), monospace;
  font-size: 0.7rem;
  color: #818cf8;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  margin-bottom: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;

  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: rgba(99, 102, 241, 0.15);
  }
`;

export const AgentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 0.75rem;
  margin-bottom: 2.5rem;
`;

export const AgentCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(99, 102, 241, 0.12);
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  transition: all 0.2s ease;

  &:hover {
    border-color: rgba(99, 102, 241, 0.3);
    box-shadow: 0 6px 20px rgba(99, 102, 241, 0.12);
    transform: translateY(-2px);
    background: rgba(255, 255, 255, 0.05);
  }

  .name {
    font-family: var(--font-mono), monospace;
    font-size: 0.8rem;
    color: #818cf8;
    margin-bottom: 0.45rem;
    font-weight: 600;
  }

  .role {
    font-size: 0.8rem;
    color: #64748b;
    line-height: 1.55;
  }

  .model {
    font-family: var(--font-mono), monospace;
    font-size: 0.62rem;
    color: rgba(52, 211, 153, 0.8);
    margin-top: 0.75rem;
    letter-spacing: 0.05em;
  }
`;

// ─── Workflow ─────────────────────────────────────────────────────────────────
export const WorkflowList = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 520px;
`;

export const WorkflowStep = styled.div`
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
  position: relative;

  &:not(:last-child) {
    padding-bottom: 2.25rem;

    &::before {
      content: '';
      position: absolute;
      left: 19px;
      top: 42px;
      width: 1px;
      height: calc(100% - 42px);
      background: linear-gradient(to bottom, rgba(99, 102, 241, 0.3), transparent);
    }
  }
`;

export const WorkflowNum = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(99, 102, 241, 0.1);
  border: 1.5px solid rgba(99, 102, 241, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono), monospace;
  font-size: 0.78rem;
  color: #818cf8;
  font-weight: 700;
  flex-shrink: 0;
`;

export const WorkflowContent = styled.div`
  padding-top: 0.45rem;

  .label {
    font-family: var(--font-mono), monospace;
    font-size: 0.88rem;
    font-weight: 600;
    color: #f1f5f9;
    margin-bottom: 0.35rem;
  }

  .desc {
    font-size: 0.82rem;
    color: #64748b;
    line-height: 1.65;
  }
`;

// ─── Code Block ───────────────────────────────────────────────────────────────
export const CodeBlock = styled.pre`
  background: #020617;
  border: 1px solid rgba(99, 102, 241, 0.15);
  border-radius: 14px;
  padding: 1.75rem 2rem;
  font-family: var(--font-mono), monospace;
  font-size: 0.82rem;
  line-height: 1.9;
  color: #e2e8f0;
  overflow-x: auto;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(99, 102, 241, 0.08);

  .comment {
    color: #475569;
  }
  .cmd {
    color: #34d399;
  }

  @media (max-width: 768px) {
    padding: 1.25rem;
    font-size: 0.75rem;
  }
`;

// ─── FAQ ──────────────────────────────────────────────────────────────────────
export const FAQList = styled.div`
  max-width: 800px;
`;

export const FAQItem = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(99, 102, 241, 0.1);
  border-radius: 14px;
  padding: 1.75rem 2rem;
  margin-bottom: 0.75rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;

  &:hover {
    border-color: rgba(99, 102, 241, 0.22);
    box-shadow: 0 4px 16px rgba(99, 102, 241, 0.08);
    background: rgba(255, 255, 255, 0.05);
  }

  .q {
    font-size: 0.98rem;
    font-weight: 700;
    color: #f1f5f9;
    margin-bottom: 0.65rem;
    letter-spacing: -0.01em;
  }

  .a {
    font-size: 0.88rem;
    color: #64748b;
    line-height: 1.8;
    font-family: var(--font-mono), monospace;
  }
`;

// ─── Footer ───────────────────────────────────────────────────────────────────
export const PageFooter = styled.footer`
  padding: 2rem 3rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid rgba(99, 102, 241, 0.08);
  font-family: var(--font-mono), monospace;
  font-size: 0.68rem;
  color: #334155;
  letter-spacing: 0.1em;
  background: rgba(0, 0, 0, 0.2);

  @media (max-width: 768px) {
    padding: 1.5rem;
    flex-direction: column;
    gap: 0.4rem;
    text-align: center;
  }
`;
