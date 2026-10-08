import { redirect } from "next/navigation"
import {
  AppstoreOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons"
import Shell, { type NavItem } from "../_components/Shell"
import { getSessionUser } from "@/lib/auth"

const navItems: NavItem[] = [
  {
    key: "/partner/properties",
    href: "/partner/properties",
    icon: <EnvironmentOutlined />,
    label: "Properties",
  },
  {
    key: "/partner",
    href: "/partner",
    icon: <AppstoreOutlined />,
    label: "Insights",
  },
  {
    key: "/partner/guests",
    href: "/partner/guests",
    icon: <UserOutlined />,
    label: "Guests",
  },
  {
    key: "/partner/specialists",
    href: "/partner/specialists",
    icon: <TeamOutlined />,
    label: "Specialists",
  },
]

export default async function PartnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getSessionUser()
  if (!user) redirect("/login")
  if (user.role === "admin") redirect("/admin")
  if (user.role === "user") redirect(`${(process.env.NEXT_PUBLIC_PUBLIC_SITE_URL ?? "").replace(/\/$/, "")}/profile`)

  return (
    <Shell email={user.email} navItems={navItems} brand="Partner Portal">
      {children}
    </Shell>
  )
}
