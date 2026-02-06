import { Routes, Route, Navigate } from "react-router";
import Homepage from "./pages/Homepage";
import Login from "./pages/login";
import Signup from "./pages/Signup";
import AdminPanel from "./pages/adminPanel";
import Admin from "./pages/Admin";
import ProblemPage from "./components/ProblemPage";
import AdminVideo from "./components/AdminVideo";
import AdminDelete from "./components/adminDelete";
import UpdateProblem from "./components/updateProblem";
import AdminUpload from "./components/AdminUpload";

import { checkAuth } from "./authSlice";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={isAuthenticated ? <Homepage /> : <Navigate to="/signup" />}
      />

      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" /> : <Login />}
      />

      <Route
        path="/signup"
        element={isAuthenticated ? <Navigate to="/" /> : <Signup />}
      />

      {/* Admin Cards Page */}
      <Route
        path="/admin"
        element={
          isAuthenticated && user?.role === "admin" ? (
            <Admin />
          ) : (
            <Navigate to="/" />
          )
        }
      />

      {/* Admin Create Page */}
      <Route
        path="/admin/create"
        element={
          isAuthenticated && user?.role === "admin" ? (
            <AdminPanel />
          ) : (
            <Navigate to="/" />
          )
        }
      />

      {/* Admin Delete Page */}
      <Route
        path="/admin/delete"
        element={
          isAuthenticated && user?.role === "admin" ? (
            <AdminDelete />
          ) : (
            <Navigate to="/" />
          )
        }
      />

      {/* Admin Update Page */}
      <Route
        path="/admin/update"
        element={
          isAuthenticated && user?.role === "admin" ? (
            <UpdateProblem />
          ) : (
            <Navigate to="/" />
          )
        }
      />
       {/* Admin video upload Page */}
      <Route
        path="/admin/video"
        element={
          isAuthenticated && user?.role === "admin" ? (
            <AdminVideo />
          ) : (
            <Navigate to="/" />
          )
        }
      />
      
      <Route
        path="/admin/upload/:problemId"
        element={
          isAuthenticated && user?.role === "admin" ? (
            <AdminUpload />
          ) : (
            <Navigate to="/" />
          )
        }
      />

      <Route
        path="/problem/:problemId"
        element={
          isAuthenticated ? <ProblemPage /> : <Navigate to="/login" />
        }
      />
    </Routes>
  );
}

export default App;
