import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Signup = () => {
  const [errorMessage, setErrorMessage] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  const from = location.state?.from?.pathname || '/';

  const handleSignup = async (event) => {
    event.preventDefault();
    const form = event.target;
    const name = form.name.value;
    const email = form.email.value;
    const password = form.password.value;
    const avatar_url = form.avatar_url.value;

    try {
      const res = await axios.post('http://localhost:5000/auth/signup', {
        name,
        email,
        password,
        avatar_url
      });

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      alert("✅ Compte créé avec succès !");
      navigate(from, { replace: true });
    } catch (error) {
      console.error(error.response?.data?.error);
      setErrorMessage("❌ Erreur : compte déjà existant ou serveur indisponible.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-300 to-blue-600 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div>
              <h1 className="text-3xl font-semibold">Créer un compte</h1>
            </div>
            <div className="divide-y divide-gray-200">
              <form onSubmit={handleSignup} className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <div className="relative">
                  <input id="name" name="name" type="text"
                    className="peer h-10 w-full border-b-2 border-gray-300 text-gray-900 focus:outline-none"
                    placeholder="Nom complet" required />
                </div>
                <div className="relative">
                  <input id="email" name="email" type="email"
                    className="peer h-10 w-full border-b-2 border-gray-300 text-gray-900 focus:outline-none"
                    placeholder="Adresse email" required />
                </div>
                <div className="relative">
                  <input id="password" name="password" type="password"
                    className="peer h-10 w-full border-b-2 border-gray-300 text-gray-900 focus:outline-none"
                    placeholder="Mot de passe" required />
                </div>
                <div className="relative">
                  <input id="avatar_url" name="avatar_url" type="text"
                    className="peer h-10 w-full border-b-2 border-gray-300 text-gray-900 focus:outline-none"
                    placeholder="URL de l'avatar (facultatif)" />
                </div>
                {errorMessage && <p className='text-red-500 text-sm'>{errorMessage}</p>}
                <p className='text-base'>Déjà un compte ? <Link to='/login' className='underline text-blue-600'>Connectez-vous</Link></p>
                <div className="relative">
                  <button type='submit' className="bg-green-500 text-white rounded px-6 py-2 w-full">Créer un compte</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
