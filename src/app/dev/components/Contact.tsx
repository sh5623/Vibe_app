import {
  ContactSection, ContactGlow, ContactTitle, ContactLinks, ContactLink, Footer,
} from '../styled';

export default function Contact() {
  return (
    <>
      <ContactSection id="contact">
        <ContactGlow />
        <ContactTitle>
          LET&apos;S
          <br />
          <span className="outline">WORK</span>
          <br />
          TOGETHER
        </ContactTitle>
        <ContactLinks>
          <ContactLink href="mailto:sh5623789@naver.com">Email</ContactLink>
          <ContactLink
            href="https://github.com/sh5623"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </ContactLink>
        </ContactLinks>
      </ContactSection>

      <Footer>
        <span>© 2026 이승호</span>
        <span>Built with Next.js + Emotion</span>
      </Footer>
    </>
  );
}
