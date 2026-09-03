import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";

export default function AuthPage({ mode }) {
  const isRegister = mode === "register";
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isRegister) await register(email, password);
      else await login(email, password);
      navigate("/businesses");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-2xl text-ink mb-1">ERP Automiser</h1>
        <p className="text-sm text-muted mb-6">
          {isRegister ? "Create an account to get started." : "Welcome back."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 bg-panel border border-line rounded p-6">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-line rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-line rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-accent text-white rounded text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Please wait..." : isRegister ? "Create account" : "Log in"}
          </button>
        </form>

        <p className="text-sm text-muted mt-4 text-center">
          {isRegister ? (
            <>Already have an account? <Link to="/login" className="text-accent font-medium">Log in</Link></>
          ) : (
            <>No account yet? <Link to="/register" className="text-accent font-medium">Register</Link></>
          )}
        </p>
      </div>
    </div>
  );
}
