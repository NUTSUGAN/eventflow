import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { SiteFooter } from './components/Footer/Footer'
import { Navbar } from './components/Navbar/Navbar'
import { CookieConsentBanner } from './components/CookieConsentBanner/CookieConsentBanner'
import { AccountPage } from './pages/AccountPage/AccountPage'
import { AccountEmailChangeConfirmPage } from './pages/AccountPage/AccountEmailChangeConfirmPage'
import { AdminDashboardPage } from './pages/AdminDashboardPage/AdminDashboardPage'
import { AdminOrganizerApplicationsPage } from './pages/AdminOrganizerApplicationsPage/AdminOrganizerApplicationsPage'
import { AdminOrdersPage } from './pages/AdminOrdersPage/AdminOrdersPage'
import { AdminTicketsPage } from './pages/AdminTicketsPage/AdminTicketsPage'
import { AdminUsersPage } from './pages/AdminUsersPage/AdminUsersPage'
import { AuthPage } from './pages/AuthPage/AuthPage'
import { EventDetailPage } from './pages/EventDetailPage/EventDetailPage'
import { ExplorerPage } from './pages/ExplorerPage/ExplorerPage'
import { EventsListPage } from './pages/EventsListPage/EventsListPage'
import { NotFoundPage } from './pages/NotFoundPage/NotFoundPage'
import { OrderPreparationPage } from './pages/OrderPreparationPage/OrderPreparationPage'
import { OrderCheckoutPage } from './pages/OrderCheckoutPage/OrderCheckoutPage'
import { MyTicketsPage } from './pages/MyTicketsPage/MyTicketsPage'
import { OrganizerAccessPage } from './pages/OrganizerAccessPage/OrganizerAccessPage'
import { OrganizerDashboardPage } from './pages/OrganizerDashboardPage/OrganizerDashboardPage'
import { OrganizerEventCreatePage } from './pages/OrganizerEventCreatePage/OrganizerEventCreatePage'
import { OrganizerEventDetailPage } from './pages/OrganizerEventDetailPage/OrganizerEventDetailPage'
import { OrganizerEventsPage } from './pages/OrganizerEventsPage/OrganizerEventsPage'
import { OrganizerStaffPage } from './pages/OrganizerStaffPage/OrganizerStaffPage'
import { OrganizerProfilePage } from './pages/OrganizerProfilePage/OrganizerProfilePage'
import { PastEventsPage } from './pages/PastEventsPage/PastEventsPage'
import { StaffScanPage } from './pages/StaffScanPage/StaffScanPage'
import { TicketDetailPage } from './pages/TicketDetailPage/TicketDetailPage'
import './App.css'

function ScrollToTop() {
  const { pathname, search } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname, search])

  return null
}

function App() {
  return (
    <div className="app-shell">
      <ScrollToTop />
      <Navbar />
      <div className="app-content">
        <Routes>
          <Route path="/" element={<EventsListPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/orders" element={<AdminOrdersPage />} />
          <Route path="/admin/tickets" element={<AdminTicketsPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route
            path="/admin/organizer-applications"
            element={<AdminOrganizerApplicationsPage />}
          />
          <Route path="/account" element={<AccountPage />} />
          <Route
            path="/account/email-change/confirm"
            element={<AccountEmailChangeConfirmPage />}
          />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/explorer" element={<ExplorerPage />} />
          <Route path="/events/:eventId" element={<EventDetailPage />} />
          <Route path="/orders/prepare" element={<OrderPreparationPage />} />
          <Route path="/checkout" element={<OrderCheckoutPage />} />
          <Route path="/checkout/success" element={<OrderCheckoutPage />} />
          <Route path="/checkout/cancel" element={<OrderCheckoutPage />} />
          <Route path="/mes-billets" element={<MyTicketsPage />} />
          <Route path="/corbeille" element={<PastEventsPage />} />
          <Route path="/mes-billets/:ticketId" element={<TicketDetailPage />} />
          <Route path="/organizer-access" element={<OrganizerAccessPage />} />
          <Route
            path="/organizer/dashboard"
            element={<OrganizerDashboardPage />}
          />
          <Route path="/organizer/staff" element={<OrganizerStaffPage />} />
          <Route
            path="/organizer/events"
            element={<OrganizerEventsPage />}
          />
          <Route
            path="/organizer/events/new"
            element={<OrganizerEventCreatePage />}
          />
          <Route
            path="/organizer/events/:eventId"
            element={<OrganizerEventDetailPage />}
          />
          <Route path="/staff/scan" element={<StaffScanPage />} />
          <Route path="/organizers/:organizerId" element={<OrganizerProfilePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
      <CookieConsentBanner />
      <SiteFooter />
    </div>
  )
}

export default App
