'use client';

import { useState, useEffect } from 'react';
import {
  HeroSection, StatusBadge, HeroEyebrow, HeroName, HeroRole, Cursor,
  HeroCTAs, CTAPrimary, CTASecondary, ScrollHint,
} from '../styled';

const roles = [
  'Frontend Developer',
  'React / Next.js Developer',
  'Vue.js / Nuxt.js Developer',
];

export default function Hero() {
  const [currentRole, setCurrentRole] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const role = roles[currentRole];

    if (!isDeleting && displayText === role) {
      const t = setTimeout(() => setIsDeleting(true), 2500);
      return () => clearTimeout(t);
    }

    if (isDeleting && displayText === '') {
      setIsDeleting(false);
      setCurrentRole((p) => (p + 1) % roles.length);
      return;
    }

    const delay = isDeleting ? 38 : 85;
    const t = setTimeout(() => {
      setDisplayText((p) =>
        isDeleting ? p.slice(0, -1) : role.slice(0, p.length + 1)
      );
    }, delay);

    return () => clearTimeout(t);
  }, [displayText, isDeleting, currentRole]);

  return (
    <HeroSection id="hero">
      <StatusBadge>
        <span className="dot" />
        Available for work
      </StatusBadge>

      <HeroEyebrow>Portfolio</HeroEyebrow>

      <HeroName>
        SEUNG
        <br />
        <span className="outline">HO LEE</span>
      </HeroName>

      <HeroRole>
        {displayText}
        <Cursor />
      </HeroRole>

      <HeroCTAs>
        <CTAPrimary href="#work">View Projects</CTAPrimary>
        <CTASecondary href="#contact">Get in Touch</CTASecondary>
      </HeroCTAs>

      <ScrollHint>Scroll</ScrollHint>
    </HeroSection>
  );
}
