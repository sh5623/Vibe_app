import {
  Section, SectionHeader, SectionNumber, SectionTitle,
  SkillCategory, CategoryLabel, SkillsContainer, SkillTag,
} from '../styled';

interface Skill {
  label: string;
  accent?: boolean;
}

interface SkillGroup {
  category: string;
  items: Skill[];
}

const skills: SkillGroup[] = [
  {
    category: 'Frontend',
    items: [
      { label: 'React', accent: true },
      { label: 'Next.js', accent: true },
      { label: 'TypeScript', accent: true },
      { label: 'JavaScript (ES2024)' },
      { label: 'HTML5' },
      { label: 'CSS3' },
    ],
  },
  {
    category: 'Styling',
    items: [
      { label: 'Emotion CSS', accent: true },
      { label: 'CSS-in-JS' },
      { label: 'Responsive Design' },
      { label: 'Animation' },
    ],
  },
  {
    category: 'State & Data',
    items: [
      { label: 'Jotai', accent: true },
      { label: 'React Query', accent: true },
      { label: 'REST API' },
    ],
  },
  {
    category: 'Tools',
    items: [
      { label: 'Git / GitHub' },
      { label: 'Yarn' },
      { label: 'Recharts' },
      { label: 'Lucide Icons' },
      { label: 'VS Code' },
    ],
  },
];

export default function Stack() {
  return (
    <Section id="stack">
      <SectionHeader>
        <SectionNumber>[ 02 ]</SectionNumber>
        <SectionTitle>TECH STACK</SectionTitle>
      </SectionHeader>
      {skills.map(({ category, items }) => (
        <SkillCategory key={category}>
          <CategoryLabel>{category}</CategoryLabel>
          <SkillsContainer>
            {items.map(({ label, accent }) => (
              <SkillTag key={label} accent={accent}>
                {label}
              </SkillTag>
            ))}
          </SkillsContainer>
        </SkillCategory>
      ))}
    </Section>
  );
}
