import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Login() {
  const [errorMessage, setErrorMessage] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const from = location.state?.from?.pathname || '/';

  const handleLogin = async (event) => {
    event.preventDefault();
    const form = event.target;
    const email = form.email.value;
    const password = form.password.value;

    try {
      const res = await axios.post('http://localhost:5000/auth/login', {
        email,
        password
      });

      // ✅ Stockage complet (user + token)
      localStorage.setItem('user', JSON.stringify({
        ...res.data.user,
        token: res.data.token
      }));

      alert('✅ Connexion réussie !');
      navigate(from, { replace: true });

    } catch (error) {
      console.error("Erreur connexion:", error.response?.data?.error);
      setErrorMessage("❌ Email ou mot de passe invalide.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-300 to-blue-600 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div>
              <h1 className="text-3xl font-semibold">Connexion à votre compte</h1>
            </div>
            <div className="divide-y divide-gray-200">
              <form onSubmit={handleLogin} className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <div className="relative">
                  <input id="email" name="email" type="text"
                    className="peer h-10 w-full border-b-2 border-gray-300 text-gray-900 focus:outline-none"
                    placeholder="Email" required />
                </div>
                <div className="relative">
                  <input id="password" name="password" type="password"
                    className="peer h-10 w-full border-b-2 border-gray-300 text-gray-900 focus:outline-none"
                    placeholder="Mot de passe" required />
                </div>
                {errorMessage && <p className='text-red-500 text-sm'>{errorMessage}</p>}
                <p className='text-base mt-1'>
                  Vous n'avez pas de compte ? <Link to='/create-user' className='underline text-blue-600'>Créer un compte</Link>
                </p>
                <div className="relative">
                  <button type='submit' className="bg-blue-500 text-white rounded px-6 py-2 w-full">Connexion</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
