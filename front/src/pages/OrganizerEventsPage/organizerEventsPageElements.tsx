import styled, { css } from 'styled-components'

export const OrganizerEventsPageSection = styled.main`
  width: min(1240px, calc(100% - 40px));
  min-width: 0;
  margin: 72px auto 96px;

  @media (max-width: 560px) {
    width: min(100%, calc(100% - 24px));
    margin: 34px auto 64px;
  }
`

export const OrganizerEventsPageShell = styled.section`
  min-width: 0;
  display: grid;
  gap: 24px;
  padding: 30px;
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(35, 29, 25, 0.98), rgba(22, 19, 17, 0.99));
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 26px 70px rgba(0, 0, 0, 0.34);

  @media (max-width: 560px) {
    gap: 18px;
    padding: 18px;
    border-radius: 16px;
  }
`

export const OrganizerEventsPageEyebrow = styled.span`
  color: #ff9d5a;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`

export const OrganizerEventsPageHero = styled.div`
  min-width: 0;
  display: grid;
  gap: 18px;
`

export const OrganizerEventsPageTitle = styled.h1`
  margin: 0;
  color: #fffaf4;
  font-size: clamp(2rem, 3vw, 3rem);
  overflow-wrap: anywhere;

  @media (max-width: 560px) {
    font-size: clamp(1.55rem, 8vw, 2.1rem);
  }
`

export const OrganizerEventsPageText = styled.p`
  margin: 0;
  color: rgba(255, 237, 222, 0.82);
  line-height: 1.7;
  overflow-wrap: anywhere;
`

export const OrganizerEventsPageActions = styled.div`
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`

const buttonStyles = css`
  max-width: 100%;
  min-height: 50px;
  padding: 0 18px;
  border-radius: 14px;
  font-size: 0.96rem;
  font-weight: 700;
  line-height: 1.2;
  white-space: normal;
  cursor: pointer;

  @media (max-width: 560px) {
    width: 100%;
  }
`

export const OrganizerEventsPagePrimaryButton = styled.button`
  ${buttonStyles}
  border: none;
  background: linear-gradient(135deg, #eb9451, #c96c3d);
  color: #fffaf4;
`

export const OrganizerEventsPageSecondaryButton = styled.button`
  ${buttonStyles}
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: #fff3e5;
`

export const OrganizerEventsPageState = styled.div`
  min-width: 0;
  padding: 14px 16px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 239, 229, 0.84);
`

export const OrganizerEventsPageError = styled(OrganizerEventsPageState)`
  background: rgba(149, 53, 40, 0.2);
  border-color: rgba(255, 135, 114, 0.25);
  color: #ffd5ca;
`

export const OrganizerEventsPageToolbar = styled.div`
  min-width: 0;
  display: grid;
  gap: 14px;
`

export const OrganizerEventsPageToolbarTop = styled.div`
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
`

export const OrganizerEventsPageToolbarTitle = styled.h2`
  margin: 0;
  color: #fff8f2;
  font-size: 1.26rem;
  overflow-wrap: anywhere;
`

export const OrganizerEventsPageToolbarText = styled.p`
  margin: 0;
  color: rgba(255, 237, 222, 0.74);
  line-height: 1.6;
  overflow-wrap: anywhere;
`

export const OrganizerEventsPageFilters = styled.div`
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`

export const OrganizerEventsPageFilter = styled.button<{ $active: boolean }>`
  max-width: 100%;
  min-height: 42px;
  padding: 0 16px;
  border-radius: 999px;
  border: 1px solid
    ${({ $active }) =>
      $active ? 'rgba(255, 157, 90, 0.36)' : 'rgba(255, 255, 255, 0.08)'};
  background: ${({ $active }) =>
    $active ? 'rgba(235, 148, 81, 0.18)' : 'rgba(255, 255, 255, 0.03)'};
  color: ${({ $active }) => ($active ? '#fff4e7' : 'rgba(255, 237, 222, 0.82)')};
  font-size: 0.92rem;
  font-weight: 700;
  line-height: 1.2;
  white-space: normal;
  cursor: pointer;
`

export const OrganizerEventsPageGrid = styled.section`
  min-width: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`

export const OrganizerEventsPageCard = styled.article`
  min-width: 0;
  display: grid;
  gap: 18px;
  overflow: hidden;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
`

export const OrganizerEventsPageCardCover = styled.button<{ $imageUrl?: string }>`
  width: 100%;
  min-height: 220px;
  border: none;
  background:
    linear-gradient(180deg, rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.34)),
    ${({ $imageUrl }) =>
      $imageUrl
        ? `url("${$imageUrl}") center/cover no-repeat`
        : 'linear-gradient(135deg, rgba(235, 148, 81, 0.26), rgba(110, 78, 58, 0.12))'};
  cursor: pointer;
`

export const OrganizerEventsPageCardBody = styled.div`
  min-width: 0;
  display: grid;
  gap: 16px;
  padding: 0 20px 20px;

  @media (max-width: 560px) {
    padding: 0 14px 14px;
  }
`

export const OrganizerEventsPageCardTop = styled.div`
  min-width: 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
`

export const OrganizerEventsPageBadge = styled.span<{ $published: boolean }>`
  max-width: 100%;
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  background: ${({ $published }) =>
    $published ? 'rgba(89, 181, 114, 0.14)' : 'rgba(255, 255, 255, 0.05)'};
  border: 1px solid
    ${({ $published }) =>
      $published ? 'rgba(89, 181, 114, 0.2)' : 'rgba(255, 255, 255, 0.08)'};
  color: ${({ $published }) => ($published ? '#d9ffe3' : '#fff3e5')};
  font-size: 0.84rem;
  font-weight: 700;
  line-height: 1.25;
  overflow-wrap: anywhere;
  white-space: normal;
`

export const OrganizerEventsPageStatusBlock = styled.label`
  min-width: min(170px, 100%);
  display: grid;
  gap: 8px;

  @media (max-width: 560px) {
    width: 100%;
  }
`

export const OrganizerEventsPageStatusLabel = styled.span`
  color: rgba(255, 237, 222, 0.72);
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
`

export const OrganizerEventsPageSelect = styled.select`
  width: 100%;
  min-width: 0;
  min-height: 42px;
  padding: 0 14px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: #fff3e5;
  color-scheme: dark;
  font-size: 0.94rem;
  font-weight: 600;

  &:disabled {
    opacity: 0.7;
    cursor: wait;
  }

  option {
    background: #2b211b;
    color: #fffaf4;
  }
`

export const OrganizerEventsPageCardTitleButton = styled.button`
  min-width: 0;
  margin: 0;
  padding: 0;
  border: none;
  background: none;
  color: #fff8f2;
  font-size: 1.14rem;
  font-weight: 700;
  line-height: 1.4;
  text-align: left;
  overflow-wrap: anywhere;
  cursor: pointer;
`

export const OrganizerEventsPageMeta = styled.p`
  margin: 0;
  color: rgba(255, 237, 222, 0.74);
  line-height: 1.6;
  overflow-wrap: anywhere;
`

export const OrganizerEventsPageFooter = styled.div`
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`

export const OrganizerEventsPageOpenButton = styled.button`
  max-width: 100%;
  min-height: 44px;
  padding: 0 16px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: #fff3e5;
  font-size: 0.92rem;
  font-weight: 700;
  line-height: 1.2;
  white-space: normal;
  cursor: pointer;

  @media (max-width: 560px) {
    width: 100%;
  }
`
