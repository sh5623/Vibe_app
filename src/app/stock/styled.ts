import styled from '@emotion/styled';

export const Container = styled.div`
  min-height: 100vh;
  background-color: #0b1120; // Dark navy base
  color: #ffffff;
  padding: 2rem;
  font-family: 'Inter', system-ui, sans-serif;
  display: flex;
  flex-direction: column;
  gap: 2rem;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

export const Header = styled.header`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;

    @media (max-width: 768px) {
        flex-direction: column;
        gap: 1.5rem;
    }

    h1 {
        font-size: 4rem;
        font-weight: 800;
        margin: 0;
        letter-spacing: -0.02em;
        line-height: 1.1;

        @media (max-width: 768px) {
            font-size: 2.5rem;
        }
    }

    .subtitle {
        color: #f1f5f9;
        font-size: 2rem;
        font-weight: 600;
        margin-top: 0.5rem;

        @media (max-width: 768px) {
            font-size: 1.5rem;
        }
    }
    
    .return-btn {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
        padding: 0.75rem 1.5rem;
        border-radius: 9999px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        transition: all 0.2s ease;
        backdrop-filter: blur(10px);

        &:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: translateY(-2px);
        }
    }
`;

export const Highlight = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 1.5rem;

  .percent {
      color: #34d399; // Neon green
      font-size: 5rem;
      font-weight: 800;
      text-shadow: 0 0 30px rgba(52, 211, 153, 0.5);
      line-height: 1;

      @media (max-width: 768px) {
          font-size: 2.25rem;
      }
  }
  
  svg {
      color: #34d399;
      width: 4rem;
      height: 4rem;
      filter: drop-shadow(0 0 15px rgba(52, 211, 153, 0.5));

      @media (max-width: 768px) {
          width: 2.5rem;
          height: 2.5rem;
      }
  }
`;

export const Grid = styled.div`
    display: grid;
    grid-template-columns: 1fr;
    gap: 2rem;

    @media (min-width: 1024px) {
        grid-template-columns: 2fr 1.2fr;
    }
`;

export const Card = styled.div`
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(59, 130, 246, 0.3); // Slight blue tint border
    border-radius: 1rem;
    padding: 1.5rem;
    backdrop-filter: blur(12px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);

    h2 {
        font-size: 1.25rem;
        font-weight: 600;
        margin-top: 0;
        margin-bottom: 2rem;
        color: #f1f5f9;
        display: flex;
        justify-content: space-between;
        align-items: center;

        @media (max-width: 768px) {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
        }
    }
`;
