import React from 'react'
import LoginScreen from '../screens/LoginScreen'
import OnboardingScreen from '../screens/OnboardingScreen'
import OrdersScreen from '../screens/OrdersScreen'
import DeliveriesScreen from '../screens/DeliveriesScreen'
import CompletedScreen from '../screens/CompletedScreen'
import ProfileScreen from '../screens/ProfileScreen'
import EarningsScreen from '../screens/EarningsScreen'

export function RiderNavigator({ route }: { route: string }) {
  let Page: React.ComponentType<any>
  switch (route) {
    case '/login':
      Page = LoginScreen
      break
    case '/onboarding':
      Page = OnboardingScreen
      break
    case '/available':
      Page = OrdersScreen
      break
    case '/in-progress':
      Page = DeliveriesScreen
      break
    case '/completed':
      Page = CompletedScreen
      break
    case '/profile':
      Page = ProfileScreen
      break
    case '/earnings':
      Page = EarningsScreen
      break
    default:
      Page = LoginScreen
      break
  }
  return <Page />
}