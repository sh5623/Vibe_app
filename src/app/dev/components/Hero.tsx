'use client';

import { useState, useEffect } from 'react';
import {
  HeroSection, HeroOrbA, HeroOrbB, HeroCodeCard,
  StatusBadge, HeroEyebrow, HeroName, HeroRole, Cursor,
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
      <HeroOrbA />
      <HeroOrbB />
      <HeroCodeCard>
        <div>
          <span className="line-num">1</span>
          <span className="kw">const</span> <span className="vr">developer</span> = {'{'}
        </div>
        <div>
          <span className="line-num">2</span>
          &nbsp;&nbsp;<span className="fn">name</span>: <span className="str">&quot;Seungho Lee&quot;</span>,
        </div>
        <div>
          <span className="line-num">3</span>
          &nbsp;&nbsp;<span className="fn">role</span>: <span className="str">&quot;Frontend Dev&quot;</span>,
        </div>
        <div>
          <span className="line-num">4</span>
          &nbsp;&nbsp;<span className="fn">stack</span>: [<span className="str">&quot;React&quot;</span>, <span className="str">&quot;Next&quot;</span>],
        </div>
        <div>
          <span className="line-num">5</span>
          &nbsp;&nbsp;<span className="fn">exp</span>: <span className="str">&quot;7+ years&quot;</span>,
        </div>
        <div>
          <span className="line-num">6</span>
          {'}'}
        </div>
      </HeroCodeCard>

      <StatusBadge>
        <span className="dot" />
        Available for work
      </StatusBadge>

      <HeroEyebrow>Portfolio</HeroEyebrow>

      <HeroName>
        <span className="gradient">SEUNG</span>
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
