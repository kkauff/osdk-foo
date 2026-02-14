import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import store from "./store/store";
import AuthCallback from "./AuthCallback";
import AppWithErrorBoundary from "./components/app/AppWithErrorBoundary";
import "./i18n/config";
import "./index.scss";

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// Create the router with improved routes
const router = createBrowserRouter([
  {
    path: "/",
    element: <AppWithErrorBoundary />,
  },
  {
    path: "/auth/callback",
    element: <AuthCallback />,
  },
  // Fallback route to handle any other paths
  {
    path: "*",
    element: (
      <div style={{ textAlign: "center", padding: "20px" }}>
        <h2>Page Not Found</h2>
        <p>The page you're looking for doesn't exist.</p>
        <a href="/">Go Home</a>
      </div>
    ),
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
    <ReactQueryDevtools initialIsOpen={false} />
  </QueryClientProvider>,
);
