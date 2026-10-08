import {
  AppstoreOutlined,
  CalendarOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  HomeOutlined,
  HomeFilled,
  LineChartOutlined,
  MedicineBoxOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons"
import Shell, { type NavItem } from "../_components/Shell"
import { getSessionUser } from "@/lib/auth"

const navItems: NavItem[] = [
  { key: "/admin", href: "/admin", icon: <HomeOutlined />, label: "Overview" },
  { key: "/admin/insights", href: "/admin/insights", icon: <LineChartOutlined />, label: "Insights" },
  {
    key: "/admin/team",
    href: "/admin/team",
    icon: <TeamOutlined />,
    label: "Team",
  },
  {
    key: "/admin/properties",
    href: "/admin/properties",
    icon: <EnvironmentOutlined />,
    label: "Properties",
  },
  {
    key: "/admin/programs",
    href: "/admin/programs",
    icon: <AppstoreOutlined />,
    label: "Programs",
  },
  {
    key: "/admin/pricing-gaps",
    href: "/admin/pricing-gaps",
    icon: <DollarOutlined />,
    label: "Pricing gaps",
  },
  {
    key: "/admin/services",
    href: "/admin/services",
    icon: <MedicineBoxOutlined />,
    label: "Services",
  },
  {
    key: "/admin/accommodations",
    href: "/admin/accommodations",
    icon: <HomeFilled />,
    label: "Accommodations",
  },
  {
    key: "/admin/users",
    href: "/admin/users",
    icon: <UserOutlined />,
    label: "Guests",
  },
  {
    key: "/admin/bookings",
    href: "/admin/bookings",
    icon: <CalendarOutlined />,
    label: "Bookings",
  },
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getSessionUser()
  return (
    <Shell email={user?.email ?? null} navItems={navItems} brand="DIT Platform">
      {children}
    </Shell>
  )
}
