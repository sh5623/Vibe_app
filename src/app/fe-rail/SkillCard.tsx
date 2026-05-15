'use client';

import { motion } from 'framer-motion';
import styled from '@emotion/styled';

// ─── Design Tokens ────────────────────────────────────────────────────────────
// --skill-card-bg          : rgba(255,255,255,0.04)
// --skill-card-border      : rgba(99,102,241,0.15)
// --skill-card-shadow      : 0 2px 12px rgba(0,0,0,0.3)
// --skill-card-hover-shadow: 0 18px 48px rgba(99,102,241,0.18)
// --skill-card-radius      : 20px
// --skill-card-gradient    : linear-gradient(90deg,#6366f1,#34d399)

const Card = styled(motion.button)`
  position: relative;
  width: 100%;
  background: rgba(255, 255, 255, 0.04);
  border: 1.5px solid rgba(99, 102, 241, 0.15);
  border-radius: 20px;
  padding: 2rem;
  text-align: left;
  cursor: pointer;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  transition:
    border-color 0.25s ease,
    box-shadow 0.25s ease,
    background 0.25s ease;

  /* gradient top bar */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #6366f1, #34d399);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.35s ease;
    border-radius: 20px 20px 0 0;
  }

  &:hover {
    border-color: rgba(99, 102, 241, 0.35);
    box-shadow: 0 18px 48px rgba(99, 102, 241, 0.18);
    background: rgba(255, 255, 255, 0.07);

    &::before {
      transform: scaleX(1);
    }
  }

  &:focus-visible {
    outline: 2px solid #818cf8;
    outline-offset: 3px;
  }

  &:active {
    transform: scale(0.985);
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
    &::before {
      transition: none;
    }
  }

  @media (max-width: 768px) {
    padding: 1.5rem;
  }
`;

const IconBadge = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: linear-gradient(
    135deg,
    rgba(99, 102, 241, 0.12),
    rgba(52, 211, 153, 0.08)
  );
  border: 1px solid rgba(99, 102, 241, 0.16);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-bottom: 1.25rem;
  flex-shrink: 0;
`;

const SkillName = styled.div`
  font-family: var(--font-mono), monospace;
  font-size: 0.82rem;
  color: #818cf8;
  font-weight: 700;
  letter-spacing: 0.06em;
  margin-bottom: 0.35rem;
`;

const SkillTitle = styled.h3`
  font-size: 1.15rem;
  font-weight: 700;
  color: #f1f5f9;
  letter-spacing: -0.015em;
  margin-bottom: 0.75rem;
  line-height: 1.3;
`;

const SkillDesc = styled.p`
  font-size: 0.84rem;
  color: #64748b;
  line-height: 1.8;
  margin-bottom: 1.25rem;
`;

const CmdBadge = styled.span`
  display: inline-flex;
  align-items: center;
  font-family: var(--font-mono), monospace;
  font-size: 0.68rem;
  color: #34d399;
  background: rgba(52, 211, 153, 0.08);
  border: 1px solid rgba(52, 211, 153, 0.2);
  border-radius: 8px;
  padding: 0.28rem 0.75rem;
  letter-spacing: 0.04em;
  font-weight: 500;
`;

// ─── State Matrix ─────────────────────────────────────────────────────────────
// default  : dark glass bg, subtle indigo border
// hover    : border stronger, shadow elevated, gradient top bar slides in
// focus    : 2px indigo-400 outline, 3px offset (WCAG 2.4.7)
// active   : scale(0.985) press feedback
// reduced  : all transitions removed (prefers-reduced-motion)

export interface SkillCardProps {
  icon: string;
  name: string;
  title: string;
  desc: string;
  cmd: string;
  onClick: () => void;
}

export function SkillCard({ icon, name, title, desc, cmd, onClick }: SkillCardProps) {
  return (
    <Card
      onClick={onClick}
      whileTap={{ scale: 0.985 }}
      role="button"
      tabIndex={0}
      aria-label={`${name}: ${title}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <IconBadge aria-hidden="true">{icon}</IconBadge>
      <SkillName>{name}</SkillName>
      <SkillTitle>{title}</SkillTitle>
      <SkillDesc>{desc}</SkillDesc>
      <CmdBadge>{cmd}</CmdBadge>
    </Card>
  );
}
