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
      { label: 'Vue.js', accent: true },
    ],
  },
  {
    category: 'Styling',
    items: [
      { label: 'Emotion CSS', accent: true },
      { label: 'Tailwind CSS', accent: true },
      { label: 'Responsive Design' },
    ],
  },
  {
    category: 'State & Data',
    items: [
      { label: 'Jotai', accent: true },
      { label: 'Redux', accent: true },
      { label: 'React Query', accent: true },
      { label: 'Vuex' },
      { label: 'REST API' },
    ],
  },
  {
    category: 'Build',
    items: [
      { label: 'Turborepo', accent: true },
      { label: 'Vite', accent: true },
    ],
  },
  {
    category: 'Tools',
    items: [
      { label: 'Git / GitHub / GitLab' },
      { label: 'Yarn / NPM' },
      { label: 'Recharts' },
      { label: 'Jira / Confluence' },
      { label: 'Figma' },
      { label: 'Slack' },
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
