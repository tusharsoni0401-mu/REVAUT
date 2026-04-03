// Index is not used — the "/" route is handled by Dashboard directly in App.tsx.
// This file is kept as a redirect guard to prevent confusion if someone
// imports it directly in a future route change.
import { Navigate } from "react-router-dom";

export default function Index() {
  return <Navigate to="/" replace />;
}
