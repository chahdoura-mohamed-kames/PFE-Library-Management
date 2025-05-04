import React from 'react'
import { BsCloudArrowUp } from 'react-icons/bs';
import { HiLockClosed, HiServer } from "react-icons/hi";
import { Link } from 'react-router-dom';

const About = () => {
  return (
    <div className='mt-20'>
      <div className="relative isolate overflow-hidden bg-white px-6 py-24 sm:py-32 lg:px-0">
        <div className="absolute inset-0 -z-10 overflow-hidden"></div>

        <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-y-16 gap-x-8 items-start">
          {/* Texte principal */}
          <div className="px-4 sm:px-6 lg:px-8">
            <p className="text-base font-semibold text-indigo-600">Plateforme Intelligente</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl sm:text-center lg:text-left">
              Gestion de Bibliothèque Modernisée
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-700">
              Une application web complète pour digitaliser la gestion des librairies et offrir un espace communautaire interactif aux lecteurs.
            </p>
            <p className="mt-4 text-base leading-7 text-gray-700">
              L’application intègre des modules puissants pour les libraires comme pour les lecteurs :
              gestion de stock, commandes, sécurité renforcée, et espace communautaire dynamique.
            </p>

            <ul className="mt-8 space-y-6 text-gray-600">
              <li className="flex items-start gap-x-3">
                <BsCloudArrowUp className="mt-1 h-6 w-6 text-indigo-600" />
                <span>
                  <strong className="text-gray-900">Automatisation des processus.</strong> Orchestration des tâches métier via Flowable (BPMN).
                </span>
              </li>
              <li className="flex items-start gap-x-3">
                <HiLockClosed className="mt-1 h-6 w-6 text-indigo-600" />
                <span>
                  <strong className="text-gray-900">Sécurité des accès.</strong> Gestion centralisée des identités et des rôles via Keycloak.
                </span>
              </li>
              <li className="flex items-start gap-x-3">
                <HiServer className="mt-1 h-6 w-6 text-indigo-600" />
                <span>
                  <strong className="text-gray-900">Sauvegardes fiables.</strong> Données protégées via PostgreSQL avec haute disponibilité.
                </span>
              </li>
            </ul>
          </div>

          {/* Image à droite */}
          <div className="flex justify-center items-center px-4 sm:px-6 lg:px-0">
            <img
              className="w-full max-w-2xl rounded-xl shadow-xl ring-1 ring-gray-300"
              src="https://tailwindui.com/img/component-images/dark-project-app-screenshot.png"
              alt="Capture d’écran de la plateforme de gestion de bibliothèque"
            />
          </div>
        </div>

        {/* CTA */}
        <div className="mt-24 text-center">
          <h2 className="text-2xl font-bold text-gray-900">Prêt à moderniser votre bibliothèque ?</h2>
          <p className="mt-2 text-lg text-gray-600">Rejoignez notre plateforme en quelques clics.</p>
          <Link
            to="/create-user"
            className="mt-6 inline-block rounded-md bg-indigo-600 px-6 py-3 text-white font-medium hover:bg-indigo-500 transition"
          >
            Commencer maintenant
          </Link>
        </div>
      </div>
    </div>
  )
}

export default About;
