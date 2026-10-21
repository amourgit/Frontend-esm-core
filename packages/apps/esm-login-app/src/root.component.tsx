import React, { Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import ChangePassword from './change-password/change-password.component';
import LocationPickerView from './location-picker/location-picker-view.component';
import RedirectLogout from './redirect-logout/redirect-logout.component';

// Chargé à la demande : le CSS Tailwind de la page de connexion (et ses
// dépendances d'animation) ne sont injectés que sur les routes /login.
const Login = React.lazy(() => import('./login/login.component'));

const Root: React.FC = () => {
  return (
    <BrowserRouter basename={window.getEgenSpaBase()}>
      <Routes>
        <Route
          path="login"
          element={
            <Suspense fallback={null}>
              <Login />
            </Suspense>
          }
        />
        <Route
          path="login/confirm"
          element={
            <Suspense fallback={null}>
              <Login />
            </Suspense>
          }
        />
        <Route path="login/location" element={<LocationPickerView />} />
        <Route path="logout" element={<RedirectLogout />} />
        <Route path="change-password" element={<ChangePassword />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Root;
