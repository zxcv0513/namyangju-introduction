import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import Layout from "./components/Layout.tsx";
import Cafes from "./pages/Cafes.tsx";
import Festivals from "./pages/Festivals.tsx";
import Home from "./pages/Home.tsx";
import NotFound from "./pages/NotFound.tsx";
import Places from "./pages/Places.tsx";

// 주소 목록은 src/shared/types.ts의 SITE_PATHS(sitemap.xml)와 맞춘다
const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/places", element: <Places /> },
      { path: "/festivals", element: <Festivals /> },
      { path: "/cafes", element: <Cafes /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
