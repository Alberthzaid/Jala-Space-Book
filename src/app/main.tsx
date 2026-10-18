import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import { AuthProvider } from '@/features/auth';
import { LoansProvider } from '@/features/loans';
import { NotificationsProvider } from '@/features/notifications';
import { ReadingListProvider } from '@/features/reading-list';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element "#root" not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <ReadingListProvider>
        <AuthProvider>
          <LoansProvider>
            <NotificationsProvider>
              <App />
            </NotificationsProvider>
          </LoansProvider>
        </AuthProvider>
      </ReadingListProvider>
    </BrowserRouter>
  </StrictMode>
);
