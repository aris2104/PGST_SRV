import React from 'react'
import { useAuth } from '../../context/AuthContext'

// Import de tous les dashboards
import PresiSecreDashboard from '../roles-dashboards/PresiSecreDashboard'
import TresorDashboard from '../roles-dashboards/TresorDashboard'
import DisciplinaireDashboard from '../roles-dashboards/DisciplinaireDashboard'
import OrganisateurDashboard from '../roles-dashboards/OrganisateurDashboard'
import AdminDashboard from '../roles-dashboards/AdminDashboard'
import ServantDashboard from '../roles-dashboards/ServantDashboard'

export default function HomePage() {
  const { user, loading } = useAuth()

  // 1. Attendre la fin du chargement de l'authentification
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-neutral-500 font-medium">
        Chargement de votre profil...
      </div>
    )
  }

  // 2. LOG DE DÉBOGAGE (Ouvre F12 > Console pour inspecter)
  console.log('👤 USER REÇU DANS HOMEPAGE :', user)

  // 3. Extraction propre et sécurisée de la chaîne du rôle
  let rawRole = ''
  if (user?.role_code) {
    rawRole = user.role_code
  } else if (typeof user?.role === 'string') {
    rawRole = user.role
  } else if (typeof user?.role === 'object' && user?.role !== null) {
    rawRole = user.role.code || user.role.libelle || user.role.nom || ''
  }

  const roleCode = String(rawRole).trim().toUpperCase()
  console.log('🎯 ROLE CODE CALCULÉ :', roleCode)

  // 4. Aiguillage selon le rôle
  switch (roleCode) {
    case 'PRESIDENT':
    case 'SECRETAIRE':
      return <PresiSecreDashboard />

    case 'TRESORIER':
      return <TresorDashboard />

    case 'DISCIPLINAIRE':
      return <DisciplinaireDashboard />

    case 'ORGANISATEUR':
      return <OrganisateurDashboard />

    case 'ADMIN':
    case 'SUPERADMIN':
      return <AdminDashboard />

    case 'SERVANT':
    default:
      return <ServantDashboard />
  }
}