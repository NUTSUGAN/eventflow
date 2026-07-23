import { Link, NavLink } from 'react-router-dom'
import styled from 'styled-components'

export const NavbarContainer = styled.header`
  position: sticky;
  top: 0;
  z-index: 30;
  background: rgba(25, 23, 22, 0.82);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
`

export const NavbarInner = styled.div`
  width: min(1480px, calc(100% - 96px));
  min-width: 0;
  margin: 0 auto;
  display: grid;
  grid-template-columns: auto minmax(320px, 1fr) auto auto auto;
  align-items: center;
  gap: 20px;
  padding: 20px 0;

  @media (max-width: 840px) {
    width: min(100%, calc(100% - 24px));
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 12px;
    padding: 10px 0 14px;
  }
`

export const Brand = styled(NavLink)`
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  min-width: 0;
  flex: 0 0 auto;
  overflow: hidden;

  picture {
    display: block;
    line-height: 0;
  }
`

export const BrandImage = styled.img`
  width: 200px;
  height: auto;
  display: block;
  mix-blend-mode: screen;
  filter: brightness(1.1) contrast(1.05);

  @media (max-width: 840px) {
    width: 52px;
    max-height: 52px;
    object-fit: contain;
  }
`

export const SearchBox = styled.div`
  position: relative;
  min-width: 0;
`

export const SearchForm = styled.form`
  margin: 0;
  min-width: 0;
`

export const SearchField = styled.div`
  min-width: 0;
  min-height: 44px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.05);
`

export const SearchIcon = styled.svg`
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
`

export const SearchInput = styled.input`
  min-width: 0;
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.98rem;

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`

export const SearchSuggestionsPanel = styled.div`
  position: absolute;
  top: calc(100% + 12px);
  left: 0;
  right: 0;
  max-height: min(420px, 70vh);
  overflow-y: auto;
  display: grid;
  gap: 14px;
  padding: 16px;
  border-radius: 18px;
  background: rgba(30, 27, 26, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 28px 44px rgba(0, 0, 0, 0.32);

  @media (max-width: 520px) {
    position: fixed;
    top: 78px;
    left: 12px;
    right: 12px;
    max-height: min(420px, calc(100vh - 96px));
  }
`

export const SearchSuggestionSection = styled.section`
  display: grid;
  gap: 8px;
`

export const SearchSuggestionHeading = styled.h3`
  margin: 0;
  color: rgba(255, 255, 255, 0.62);
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`

export const SearchSuggestionList = styled.div`
  display: grid;
  gap: 8px;
`

export const SearchSuggestionLink = styled(Link)`
  text-decoration: none;
`

export const SearchSuggestionButton = styled.button`
  width: 100%;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.03);
  color: var(--color-text);
  cursor: pointer;
  text-align: left;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    background-color 0.18s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: rgba(248, 143, 82, 0.35);
    background: rgba(255, 255, 255, 0.05);
  }
`

export const SearchSuggestionAvatar = styled.div<{ $imageUrl?: string }>`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  background:
    ${({ $imageUrl }) =>
      $imageUrl
        ? `linear-gradient(180deg, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.18)), url(${$imageUrl})`
        : 'linear-gradient(135deg, rgba(191, 106, 65, 0.95), rgba(248, 143, 82, 0.82))'};
  background-size: cover;
  background-position: center;
  color: #fff7f2;
  font-weight: 700;
  font-size: 0.95rem;
`

export const SearchSuggestionCover = styled.div<{ $imageUrl?: string }>`
  width: 58px;
  height: 58px;
  border-radius: 12px;
  flex: 0 0 auto;
  background:
    ${({ $imageUrl }) =>
      $imageUrl
        ? `linear-gradient(180deg, rgba(0, 0, 0, 0.12), rgba(0, 0, 0, 0.18)), url(${$imageUrl})`
        : `radial-gradient(circle at 20% 20%, rgba(244, 208, 122, 0.2), transparent 18%),
           radial-gradient(circle at 78% 18%, rgba(255, 87, 154, 0.28), transparent 18%),
           radial-gradient(circle at 74% 72%, rgba(23, 211, 170, 0.26), transparent 28%),
           linear-gradient(180deg, rgba(7, 13, 30, 0.96) 0%, rgba(15, 31, 53, 0.98) 100%)`};
  background-size: cover;
  background-position: center;
`

export const SearchSuggestionContent = styled.div`
  min-width: 0;
  display: grid;
  gap: 4px;
`

export const SearchSuggestionTitle = styled.span`
  color: var(--color-text);
  font-weight: 700;
  font-size: 0.98rem;
  line-height: 1.2;
`

export const SearchSuggestionMeta = styled.span`
  color: var(--color-text-muted);
  font-size: 0.85rem;
  line-height: 1.3;
`

export const SearchSuggestionStatus = styled.p`
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.9rem;
`

export const ExploreButton = styled.button`
  min-height: 44px;
  padding: 0 10px;
  border: 0;
  background: transparent;
  color: var(--color-text);
  font-family: var(--font-heading);
  font-size: 1rem;
  cursor: pointer;
  transition:
    color 0.2s ease,
    transform 0.2s ease;

  &:hover {
    color: #ffe0cd;
    transform: translateY(-1px);
  }

  @media (max-width: 840px) {
    display: none;
  }
`

export const OrganizerLink = styled.button`
  min-height: 44px;
  padding: 0 10px;
  border: 0;
  background: transparent;
  color: var(--color-text);
  font-family: var(--font-heading);
  font-size: 0.95rem;
  cursor: pointer;
  transition:
    color 0.2s ease,
    transform 0.2s ease;

  &:hover {
    color: #ffe0cd;
    transform: translateY(-1px);
  }

  @media (max-width: 1100px) {
    display: none;
  }
`

export const AuthButton = styled.button`
  min-height: 44px;
  padding: 0 22px;
  border: 0;
  border-radius: 4px;
  background: #c87444;
  color: #ffffff;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    background-color 0.2s ease,
    color 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    background: #d07d4e;
    color: #ffffff;
  }

  @media (max-width: 840px) {
    display: none;
  }
`

export const ProfileMenuWrapper = styled.div`
  position: relative;

  @media (max-width: 840px) {
    display: none;
  }
`

export const ProfileButton = styled.button`
  min-height: 44px;
  padding: 6px 12px 6px 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.04);
  color: var(--color-text);
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    background-color 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: rgba(248, 143, 82, 0.35);
    background: rgba(255, 255, 255, 0.06);
  }
`

export const ProfileAvatar = styled.div<{ $imageUrl?: string }>`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  background:
    ${({ $imageUrl }) =>
      $imageUrl
        ? `linear-gradient(180deg, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.18)), url(${$imageUrl})`
        : 'linear-gradient(135deg, rgba(191, 106, 65, 0.95), rgba(248, 143, 82, 0.82))'};
  background-size: cover;
  background-position: center;
  color: #fff7f2;
  font-weight: 700;
  font-size: 0.82rem;
`

export const ProfileButtonText = styled.span`
  font-weight: 700;
  font-size: 0.94rem;
  white-space: nowrap;
`

export const ProfileDropdown = styled.div`
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  min-width: 220px;
  padding: 10px;
  display: grid;
  gap: 8px;
  border-radius: 16px;
  background: rgba(30, 27, 26, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 28px 44px rgba(0, 0, 0, 0.32);
`

export const ProfileDropdownHeader = styled.div`
  padding: 8px 10px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
`

export const ProfileDropdownName = styled.p`
  margin: 0;
  color: var(--color-text);
  font-weight: 700;
`

export const ProfileDropdownEmail = styled.p`
  margin: 4px 0 0;
  color: var(--color-text-muted);
  font-size: 0.84rem;
`

export const ProfileDropdownAction = styled.button`
  min-height: 42px;
  padding: 0 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  color: var(--color-text);
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    background-color 0.18s ease;

  &:hover {
    border-color: rgba(248, 143, 82, 0.35);
    background: rgba(255, 255, 255, 0.05);
  }
`

export const MobileMenuButton = styled.button`
  display: none;
  width: 40px;
  height: 40px;
  padding: 0;
  border-radius: 10px;
  border: 1px solid rgba(248, 143, 82, 0.8);
  background: transparent;
  align-items: center;
  justify-content: center;
  gap: 4px;
  flex-direction: column;
  flex: 0 0 40px;
  cursor: pointer;

  span {
    width: 18px;
    height: 1.5px;
    background: #f3e7dd;
    border-radius: 999px;
  }

  @media (max-width: 840px) {
    display: inline-flex;
  }
`

export const MobileMenuPanel = styled.div`
  display: none;

  @media (max-width: 840px) {
    width: min(100%, calc(100% - 24px));
    margin: 0 auto 16px;
    padding: 14px;
    display: grid;
    gap: 10px;
    border-radius: 16px;
    background: rgba(32, 28, 26, 0.98);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: var(--shadow-strong);
  }
`

export const MobileMenuLink = styled.button`
  min-height: 46px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  color: var(--color-text);
  font-weight: 600;
  text-align: left;
  cursor: pointer;
`

export const MobileMenuAuthButton = styled(AuthButton)`
  display: inline-flex;
  justify-content: center;

  @media (max-width: 840px) {
    display: inline-flex;
  }
`

export const MobileMenuProfileCard = styled.div`
  display: grid;
  gap: 10px;
  padding: 12px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
`

export const MobileMenuProfileIdentity = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`

export const MobileMenuProfileText = styled.div`
  min-width: 0;
`

export const MobileMenuProfileName = styled.p`
  margin: 0;
  color: var(--color-text);
  font-weight: 700;
`

export const MobileMenuProfileEmail = styled.p`
  margin: 2px 0 0;
  color: var(--color-text-muted);
  font-size: 0.84rem;
  overflow: hidden;
  text-overflow: ellipsis;
`
