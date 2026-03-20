import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getResolvedAccessToken, useAuthStore } from '../store/authStore';

export default function ProtectedRoute() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = Boolean(accessToken ?? getResolvedAccessToken());
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
