'use client';

import { ArrowUpRight } from 'lucide-react';
import {
  Section, SectionHeader, SectionNumber, SectionTitle,
  ProjectsGrid, ProjectCard, ProjectNum, ProjectName, ProjectDesc, TagRow, Tag,
} from '../styled';

interface Project {
  num: string;
  name: string;
  desc: string;
  tags: string[];
  href: string;
}

const projects: Project[] = [
  {
    num: '01',
    name: 'Vibe App',
    desc: 'Next.js App Router 기반 인터랙티브 포트폴리오. 주식 대시보드, 초대장 시스템, 실시간 데이터 시각화를 포함한 풀스택 경험.',
    tags: ['Next.js', 'TypeScript', 'Emotion', 'Recharts', 'React Query', 'Jotai'],
    href: '/',
  },
  {
    num: '02',
    name: 'Stock Dashboard',
    desc: '야후 파이낸스 API 연동 실시간 주식 차트 대시보드. 한글 종목명 검색, 코스피 지수 시각화, 폴백 데이터 처리 구현.',
    tags: ['Next.js', 'yahoo-finance2', 'Recharts', 'React Query', 'API Route'],
    href: '/stock',
  },
  {
    num: '03',
    name: 'Bambi Portfolio',
    desc: '반려견 파피용 밤비의 포트폴리오. 무한 자동 스크롤 갤러리, 드래그 & 터치 인터랙션, 모델링 작업 쇼케이스.',
    tags: ['Next.js', 'Emotion', 'Image Optimization', 'Canvas Animation'],
    href: '/portfolio',
  },
];

export default function Work() {
  const handleProjectClick = (href: string) => {
    window.location.href = href;
  };

  return (
    <Section id="work">
      <SectionHeader>
        <SectionNumber>[ 03 ]</SectionNumber>
        <SectionTitle>SELECTED WORK</SectionTitle>
      </SectionHeader>
      <ProjectsGrid>
        {projects.map((project) => (
          <ProjectCard
            key={project.num}
            onClick={() => handleProjectClick(project.href)}
          >
            <div className="header">
              <ProjectNum>#{project.num}</ProjectNum>
              <ArrowUpRight size={18} className="arrow" />
            </div>
            <ProjectName>{project.name}</ProjectName>
            <ProjectDesc>{project.desc}</ProjectDesc>
            <TagRow>
              {project.tags.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </TagRow>
          </ProjectCard>
        ))}
      </ProjectsGrid>
    </Section>
  );
}
