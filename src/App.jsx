import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'

// HomePage fica eager (é a rota de entrada mais comum); as outras viram
// chunk separado carregado sob demanda, pra não pesar o primeiro load com
// código que a maioria das visitas nunca usa (busca, tags, bastidores).
const PostPage = lazy(() => import('./pages/PostPage'))
const TagPage = lazy(() => import('./pages/TagPage'))
const TagsIndexPage = lazy(() => import('./pages/TagsIndexPage'))
const Bastidores = lazy(() => import('./pages/Bastidores'))
const SearchPage = lazy(() => import('./pages/SearchPage'))
const SavedPage = lazy(() => import('./pages/SavedPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

function withSuspense(element) {
  return <Suspense fallback={null}>{element}</Suspense>
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'posts/:slug', element: withSuspense(<PostPage />) },
      { path: 'tags', element: withSuspense(<TagsIndexPage />) },
      { path: 'tags/:tag', element: withSuspense(<TagPage />) },
      { path: 'busca', element: withSuspense(<SearchPage />) },
      { path: 'salvos', element: withSuspense(<SavedPage />) },
      { path: 'bastidores', element: withSuspense(<Bastidores />) },
      { path: '*', element: withSuspense(<NotFoundPage />) },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
