import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import PostPage from './pages/PostPage'
import TagPage from './pages/TagPage'
import Bastidores from './pages/Bastidores'
import SearchPage from './pages/SearchPage'
import NotFoundPage from './pages/NotFoundPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'posts/:slug', element: <PostPage /> },
      { path: 'tags/:tag', element: <TagPage /> },
      { path: 'busca', element: <SearchPage /> },
      { path: 'bastidores', element: <Bastidores /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
