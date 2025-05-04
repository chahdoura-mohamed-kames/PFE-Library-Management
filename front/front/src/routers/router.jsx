import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import { Home } from "../pages/Home/Home";
import Shop from "../pages/Shop/Shop";
import { DashboardLayout } from "../Dashboard/DashboardLayout";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import Logout from "../pages/Logout";
import ErrorPage from "../pages/shared/ErrorPage";
import SignleBook from "../pages/shared/SignleBook";
import UploadBook from "../Dashboard/UploadBook";
import Dashboard from "../Dashboard/Dashboard";
import ManageBooks from "../Dashboard/ManageBooks";
import EditBooks from "../Dashboard/EditBooks";
import About from "../pages/about/About";
import Blog from "../pages/blog/Blog"
import ManageUsers from "../Dashboard/ManageUsers"; 
import ManageTasks from '../Dashboard/ManageTasks';
import Orders from '../Dashboard/Orders';

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/shop", element: <Shop /> },
      { 
        path: "/book/:id", 
        element: <SignleBook />, 
        loader: ({ params }) => fetch(`http://localhost:5000/book/${params.id}`)
      },
      { path: "/about", element: <About /> },
      { path: "/blog", element: <Blog /> },
    ]
  },
  {
    path: "/admin/dashboard",
    element: <DashboardLayout />,
    children: [
      { path: "/admin/dashboard", element: <Dashboard /> },
      { path: "/admin/dashboard/upload", element: <UploadBook /> },
      { path: "/admin/dashboard/manage", element: <ManageBooks /> },
      {
        path: "/admin/dashboard/edit-books/:id",
        element: <EditBooks />,
        loader: ({ params }) => fetch(`http://localhost:5000/book/${params.id}`)
      },
      
      { path: "/admin/dashboard/manage-users", element: <ManageUsers /> }, 
      { path: "/admin/dashboard/manage-tasks", element: <ManageTasks /> },
      { path: "/admin/dashboard/Orders", element: <Orders /> }
    ]
  },
  { path: "/login", element: <Login /> },
  { path: "/create-user", element: <Signup /> },
  { path: "/logout", element: <Logout /> }
]);

export default router;
