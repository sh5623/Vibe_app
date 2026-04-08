'use client';

import React, { useRef, useEffect } from 'react';
import Image from 'next/image';
import { Heart, Stars, Instagram, ExternalLink } from 'lucide-react';
import BambiImage from '@/assets/Bambi.jpg';
import {
  Container,
  HeroSection,
  Title,
  Subtitle,
  ContentGrid,
  InfoCard,
  ImageCard,
  HighlightText,
  FeatureList,
  FeatureItem,
  GallerySection,
  GalleryTitle,
  GallerySliderContainer,
  GalleryTrack,
  GalleryItem,
  InstagramButton,
  WorkSection,
  WorkTitle,
  WorkGrid,
  WorkCard
} from './styled';

import Bambi1 from '@/assets/Bambi/Bambi_1.jpeg';
import Bambi2 from '@/assets/Bambi/Bambi_2.jpeg';
import Bambi3 from '@/assets/Bambi/Bambi_3.jpeg';
import Bambi4 from '@/assets/Bambi/Bambi_4.jpeg';
import Bambi5 from '@/assets/Bambi/Bambi_5.jpeg';
import Bambi6 from '@/assets/Bambi/Bambi_6.jpeg';
import Bambi7 from '@/assets/Bambi/Bambi_7.jpeg';
import Bambi8 from '@/assets/Bambi/Bambi_8.jpeg';
import Work1 from '@/assets/Bambi/works/work_1.jpg';
import Work2 from '@/assets/Bambi/works/work_2.jpg';

const galleryImages = [
  { src: Bambi1, alt: '밤비 갤러리 1' },
  { src: Bambi2, alt: '밤비 갤러리 2' },
  { src: Bambi3, alt: '밤비 갤러리 3' },
  { src: Bambi4, alt: '밤비 갤러리 4' },
  { src: Bambi5, alt: '밤비 갤러리 5' },
  { src: Bambi6, alt: '밤비 갤러리 6' },
  { src: Bambi7, alt: '밤비 갤러리 7' },
  { src: Bambi8, alt: '밤비 갤러리 8' },
];

// Multiply array to allow infinite scrolling effect
const sliderImages = [...galleryImages, ...galleryImages];

const workItems = [
  {
    title: '강아지 미스트 모델',
    brand: '펫생각 (ThinkPets)',
    description: '데일리케어 이지브러싱 강아지 미스트 (150ml) 메인 모델',
    image: Work1,
    link: 'https://thinkpets.co.kr/product/%EB%8D%B0%EC%9D%BC%EB%A6%AC%EC%BC%80%EC%96%BC-%EC%9D%B4%EC%A7%80%EB%B8%8C%EB%9F%AC%EC%8B%B1-%EA%B0%95%EC%95%84%EC%A7%80-%EB%AF%B8%EC%8A%A4%ED%8A%B8-150ml/297/category/76/display/1/'
  },
  {
    title: '강아지 영양제 모델',
    brand: '마이펫닥터',
    description: '시그니처 기관지 2.0 영양제 모델',
    image: Work2,
    link: 'https://drmypet.co.kr/product/%EB%A7%88%EC%9D%B4%ED%8E%AB%EB%8B%A5%ED%84%B0-%EC%8B%9C%EA%B7%B8%EB%8B%88%EC%B2%98-%EA%B8%B0%EA%B4%80%EC%A7%80-20-%EC%98%81%EC%96%91%EC%A0%9C/948/category/90/display/1/'
  }
];

export default function Portfolio() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startScrollLeft = useRef(0);

  // Auto-scroll loop
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let animationId: number;
    let currentScroll = scrollContainer.scrollLeft;

    const playScroll = () => {
      // Auto scroll logic when not dragging
      if (!isDragging.current) {
        // Detect native mobile scrolling (touch momentum or trackpad)
        if (Math.abs(scrollContainer.scrollLeft - currentScroll) > 5) {
          // Native scrolling taking place, sync the tracker
          currentScroll = scrollContainer.scrollLeft;
        } else {
          currentScroll += 2.5; // Auto-scroll speed
          // Reset scroll position gracefully before hitting the end
          if (currentScroll >= scrollContainer.scrollWidth / 2) {
            currentScroll = 0;
          }
          scrollContainer.scrollLeft = currentScroll;
        }
      } else {
        // Sync the tracker if the user manually drags via desktop Mouse
        currentScroll = scrollContainer.scrollLeft;
      }
      animationId = requestAnimationFrame(playScroll);
    };

    animationId = requestAnimationFrame(playScroll);
    return () => cancelAnimationFrame(animationId);
  }, []);

  // Desktop Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    isDragging.current = true;
    startX.current = e.pageX - scrollRef.current.offsetLeft;
    startScrollLeft.current = scrollRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    scrollRef.current.scrollLeft = startScrollLeft.current - walk;
  };

  const handleUpOrLeave = () => {
    isDragging.current = false;
  };

  // Mobile Touch Handlers
  const handleTouchStart = () => {
    isDragging.current = true;
  };
  const handleTouchEnd = () => {
    isDragging.current = false;
  };

  return (
    <Container>
      <HeroSection>
        <Title>HI, I'M BAMBI</Title>
        <Subtitle>The cutest Papillon with big pretty ears 🦋</Subtitle>
        <InstagramButton
          href="https://www.instagram.com/bambi.__.i?igsh=d3U2ZHRybjNpdjQz&utm_source=qr"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Instagram size={20} />
          Follow on Instagram
        </InstagramButton>
      </HeroSection>

      <ContentGrid>
        <ImageCard>
          <div className="image-wrapper">
            <Image
              src={BambiImage}
              alt="밤비 사진"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              style={{ objectFit: 'cover' }}
              priority
            />
          </div>
        </ImageCard>

        <div className="info-column">
          <InfoCard delay={0.1}>
            <Heart size={24} color="#f43f5e" className="icon" />
            <h3>Profile</h3>
            <p>이름: <HighlightText>밤비 (Bambi)</HighlightText></p>
            <p>견종: 파피용 (Papillon)</p>
            <p>생일: 2021년 4월생</p>
          </InfoCard>

          <InfoCard delay={0.2}>
            <Stars size={24} color="#fbbf24" className="icon" />
            <h3>Charm Points</h3>
            <FeatureList>
              <FeatureItem>✨ 이쁘고 아주 큰 귀 (나비 같은 매력!)</FeatureItem>
              <FeatureItem>✨ 반짝이는 눈망울</FeatureItem>
              <FeatureItem>✨ 활발하고 사랑스러운 성격</FeatureItem>
            </FeatureList>
          </InfoCard>
        </div>
      </ContentGrid>

      <WorkSection>
        <WorkTitle>Modeling Work</WorkTitle>
        <WorkGrid>
          {workItems.map((work, index) => (
            <WorkCard key={index} href={work.link} target="_blank" rel="noopener noreferrer" delay={0.2 * index}>
              <div className="image-wrapper">
                <Image
                  src={work.image}
                  alt={work.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  style={{ objectFit: 'cover' }}
                />
              </div>
              <div className="content">
                <h3>{work.title}</h3>
                <p><strong>{work.brand}</strong><br />{work.description}</p>
                <div className="link-text">
                  보러가기 <ExternalLink size={16} />
                </div>
              </div>
            </WorkCard>
          ))}
        </WorkGrid>
      </WorkSection>

      <GallerySection>
        <GalleryTitle>Photo Gallery</GalleryTitle>
        <GallerySliderContainer
          ref={scrollRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleUpOrLeave}
          onMouseUp={handleUpOrLeave}
          onMouseMove={handleMouseMove}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <GalleryTrack>
            {sliderImages.map((image, index) => (
              <GalleryItem key={index} delay={0.1 * (index % galleryImages.length)}>
                <div className="image-wrapper" onDragStart={(e) => e.preventDefault()}>
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes="300px"
                    style={{ objectFit: 'cover' }}
                    draggable={false}
                  />
                </div>
              </GalleryItem>
            ))}
          </GalleryTrack>
        </GallerySliderContainer>
      </GallerySection>
    </Container>
  );
}
