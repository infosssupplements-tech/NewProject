import { Suspense } from "react";
import EmployeeSetupForm from "../../../components/inventory/EmployeeSetupForm.jsx";

export default function EmployeeSetupPage() {
  return <Suspense fallback={<main className="auth-loading">Preparing secure account setup…</main>}><EmployeeSetupForm /></Suspense>;
}
