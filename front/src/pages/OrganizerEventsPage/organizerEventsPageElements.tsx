import styled, { css } from 'styled-components'

export const OrganizerEventsPageSection = styled.main`
  width: min(1240px, calc(100% - 40px));
  margin: 72px auto 96px;
`

export const OrganizerEventsPageShell = styled.section`
  display: grid;
  gap: 24px;
  padding: 30px;
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(35, 29, 25, 0.98), rgba(22, 19, 17, 0.99));
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 26px 70px rgba(0, 0, 0, 0.34);
`

export const OrganizerEventsPageEyebrow = styled.span`
  color: #ff9d5a;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`

export const OrganizerEventsPageHero = styled.div`
  display: grid;
  gap: 18px;
`

export const OrganizerEventsPageTitle = styled.h1`
  margin: 0;
  color: #fffaf4;
  font-size: clamp(2rem, 3vw, 3rem);
`

export const OrganizerEventsPageText = styled.p`
  margin: 0;
  color: rgba(255, 237, 222, 0.82);
  line-height: 1.7;
`

export const OrganizerEventsPageActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`

const buttonStyles = css`
  min-height: 50px;
  padding: 0 18px;
  border-radius: 14px;
  font-size: 0.96rem;
  font-weight: 700;
  cursor: pointer;
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
  display: grid;
  gap: 14px;
`

export const OrganizerEventsPageToolbarTop = styled.div`
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
`

export const OrganizerEventsPageToolbarText = styled.p`
  margin: 0;
  color: rgba(255, 237, 222, 0.74);
  line-height: 1.6;
`

export const OrganizerEventsPageFilters = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`

export const OrganizerEventsPageFilter = styled.button<{ $active: boolean }>`
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
  cursor: pointer;
`

export const OrganizerEventsPageGrid = styled.section`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`

export const OrganizerEventsPageCard = styled.article`
  display: grid;
  gap: 18px;
  overflow: hidden;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
`

export const OrganizerEventsPageCardCover = styled.button<{ $imageUrl?: string }>`
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
  display: grid;
  gap: 16px;
  padding: 0 20px 20px;
`

export const OrganizerEventsPageCardTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
`

export const OrganizerEventsPageBadge = styled.span<{ $published: boolean }>`
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
`

export const OrganizerEventsPageStatusBlock = styled.label`
  display: grid;
  gap: 8px;
  min-width: 170px;
`

export const OrganizerEventsPageStatusLabel = styled.span`
  color: rgba(255, 237, 222, 0.72);
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
`

export const OrganizerEventsPageSelect = styled.select`
  min-height: 42px;
  padding: 0 14px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: #fff3e5;
  font-size: 0.94rem;
  font-weight: 600;

  &:disabled {
    opacity: 0.7;
    cursor: wait;
  }

  option {
    color: #1a1512;
  }
`

export const OrganizerEventsPageCardTitleButton = styled.button`
  margin: 0;
  padding: 0;
  border: none;
  background: none;
  color: #fff8f2;
  font-size: 1.14rem;
  font-weight: 700;
  line-height: 1.4;
  text-align: left;
  cursor: pointer;
`

export const OrganizerEventsPageMeta = styled.p`
  margin: 0;
  color: rgba(255, 237, 222, 0.74);
  line-height: 1.6;
`

export const OrganizerEventsPageFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`

export const OrganizerEventsPageOpenButton = styled.button`
  min-height: 44px;
  padding: 0 16px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: #fff3e5;
  font-size: 0.92rem;
  font-weight: 700;
  cursor: pointer;
`
