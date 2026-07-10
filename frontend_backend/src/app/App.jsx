import React from "react";
import { createBrowserRouter, Navigate, RouterProvider, useNavigate } from "react-router";import Layout from "./components/Layout";
import HomePage from "../imports/HomePage";
import LoginPage from "../imports/LoginPage";
import DashboardPage from "../imports/DashboardPage";
import AnalyticsPage from "../imports/AnalyticsPage";
import PricingPage from "../imports/PricingPage";
import SystemHealthPage from "../imports/SystemHealthPage";
import BookingPage from "../imports/BookingPage";

function HomePageWrapper() {
  const navigate = useNavigate();
  const setPage = (page) => navigate(`/${page}`);
  return <HomePage setPage={setPage} />;
}

function LoginPageWrapper() {
  const navigate = useNavigate();
  const handleLogin = () => navigate("/");
  return <LoginPage onLogin={handleLogin} />;
}

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPageWrapper />,
  },
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <HomePageWrapper /> },
      { path: "parking", element: <DashboardPage /> },
      { path: "booking", element: <BookingPage /> },
      { path: "analytics", element: <AnalyticsPage /> },
      { path: "pricing", element: <PricingPage /> },
      { path: "system-health", element: <SystemHealthPage /> },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}