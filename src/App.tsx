import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { I18nProvider } from '@/i18n';
import { AppStateProvider } from '@/state/AppState';
import { AdminAuthProvider, RequireAdmin } from '@/state/AdminAuth';
import { BottomNav } from '@/components/layout/AppShell';
import Home from '@/pages/Home';

/**
 * Route-level code splitting keeps the landing entry inside the N-1.2 budget
 * (150 KB gzipped). Home is imported eagerly because it is the LCP route;
 * everything else, and the whole admin bundle, loads on demand.
 */
const Catalogue = lazy(() => import('@/pages/Catalogue'));
const Product = lazy(() => import('@/pages/Product'));
const Wizard = lazy(() => import('@/pages/Wizard'));
const Shortlist = lazy(() => import('@/pages/Shortlist'));
const Estimate = lazy(() => import('@/pages/Estimate'));
const MyHouse = lazy(() => import('@/pages/MyHouse'));
const Enquiry = lazy(() => import('@/pages/Enquiry'));
const Confirmation = lazy(() => import('@/pages/Confirmation'));
const Compare = lazy(() => import('@/pages/Compare'));
const Orders = lazy(() => import('@/pages/Orders'));

const Content = () => import('@/pages/Content');
const Store = lazy(() => Content().then((m) => ({ default: m.Store })));
const Policies = lazy(() => Content().then((m) => ({ default: m.Policies })));
const Guides = lazy(() => Content().then((m) => ({ default: m.Guides })));
const Gallery = lazy(() => Content().then((m) => ({ default: m.Gallery })));

const Admin = () => import('@/pages/admin/Admin');
const AdminLogin = lazy(() => Admin().then((m) => ({ default: m.AdminLogin })));
const AdminHome = lazy(() => Admin().then((m) => ({ default: m.AdminHome })));
const AdminProducts = lazy(() => Admin().then((m) => ({ default: m.AdminProducts })));
const AdminProductEdit = lazy(() => Admin().then((m) => ({ default: m.AdminProductEdit })));
const AdminEnquiries = lazy(() => Admin().then((m) => ({ default: m.AdminEnquiries })));
const AdminEnquiryDetail = lazy(() => Admin().then((m) => ({ default: m.AdminEnquiryDetail })));
const AdminReports = lazy(() => Admin().then((m) => ({ default: m.AdminReports })));
const AdminSettings = lazy(() => Admin().then((m) => ({ default: m.AdminSettings })));

/** Every route change starts at the top. Without this a phone keeps the old
    scroll position and the customer lands halfway down a product page. */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

/** The bottom tab bar belongs to the customer site only; admin has its own. */
function CustomerNav() {
  const { pathname } = useLocation();
  const hidden =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/product/') ||   // one-screen page, no room for a tab bar
    pathname === '/enquiry' ||
    pathname.startsWith('/estimate/') ||
    pathname === '/my-house' ||
    pathname === '/wizard';
  return hidden ? null : <BottomNav />;
}

const Loading = () => (
  <div className="space-y-3 px-4 pt-6" aria-busy="true" aria-label="Loading">
    <div className="skeleton h-8 w-2/3" />
    <div className="skeleton h-4 w-full" />
    <div className="skeleton h-4 w-4/5" />
    <div className="skeleton mt-4 h-40 w-full rounded" />
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <I18nProvider>
        <AppStateProvider>
          <AdminAuthProvider>
            <ScrollToTop />
            <div className="shell min-h-[100dvh] bg-ink">
              <Suspense fallback={<Loading />}>
                <Routes>
                  {/* Customer */}
                  <Route path="/" element={<Home />} />
                  <Route path="/catalogue" element={<Catalogue />} />
                  <Route path="/product/:slug" element={<Product />} />
                  <Route path="/wizard" element={<Wizard />} />
                  <Route path="/shortlist" element={<Shortlist />} />
                  <Route path="/estimate/:ref" element={<Estimate />} />
                  <Route path="/my-house" element={<MyHouse />} />
                  <Route path="/enquiry" element={<Enquiry />} />
                  <Route path="/confirmation" element={<Confirmation />} />
                  <Route path="/compare" element={<Compare />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/store" element={<Store />} />
                  <Route path="/policies" element={<Policies />} />
                  <Route path="/policies/:id" element={<Policies />} />
                  <Route path="/guides" element={<Guides />} />
                  <Route path="/guides/:id" element={<Guides />} />
                  <Route path="/gallery" element={<Gallery />} />

                  {/* Admin — TRD §8.3, role-gated behind a session */}
                  <Route path="/admin" element={<AdminLogin />} />
                  <Route path="/admin/home" element={<RequireAdmin><AdminHome /></RequireAdmin>} />
                  <Route path="/admin/products" element={<RequireAdmin><AdminProducts /></RequireAdmin>} />
                  <Route path="/admin/products/:id" element={<RequireAdmin><AdminProductEdit /></RequireAdmin>} />
                  <Route path="/admin/enquiries" element={<RequireAdmin><AdminEnquiries /></RequireAdmin>} />
                  <Route path="/admin/enquiries/:id" element={<RequireAdmin><AdminEnquiryDetail /></RequireAdmin>} />
                  <Route path="/admin/reports" element={<RequireAdmin><AdminReports /></RequireAdmin>} />
                  <Route path="/admin/settings" element={<RequireAdmin><AdminSettings /></RequireAdmin>} />

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              <CustomerNav />
            </div>
          </AdminAuthProvider>
        </AppStateProvider>
      </I18nProvider>
    </BrowserRouter>
  );
}

function NotFound() {
  return (
    <main className="px-6 py-24 text-center">
      <p className="font-display text-display">404</p>
      <p className="mt-3 text-small text-muted">That page does not exist.</p>
      <a href="/" className="btn-primary mt-6 inline-flex">Back to the shop</a>
    </main>
  );
}
