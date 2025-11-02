import type { Metadata } from "next"
import LandingPage from "./(marketing)/landing/LandingPage"

export const metadata: Metadata = {
  title: "blipee - Your AI Workforce for Sustainability",
}

export default function Home() {
  return <LandingPage />
}
