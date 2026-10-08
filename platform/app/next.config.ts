import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/properties/peking-union-medical-college-hospital", destination: "/medical/china/hospitals/peking-union-medical-college-hospital", statusCode: 301 },
      { source: "/properties/fudan-zhongshan-hospital", destination: "/medical/china/hospitals/fudan-zhongshan-hospital", statusCode: 301 },
      { source: "/properties/shanghai-jiaotong-ruijin-hospital", destination: "/medical/china/hospitals/ruijin-hospital", statusCode: 301 },
      { source: "/properties/xian-international-medical-center", destination: "/medical/china/hospitals/xian-international-medical-center", statusCode: 301 },
      { source: "/properties/shanghai-jiahui-international-hospital", destination: "/medical/china/hospitals/shanghai-jiahui-international-hospital", statusCode: 301 },
      { source: "/properties/peking-university-first-hospital", destination: "/medical/china/hospitals/peking-university-first-hospital", statusCode: 301 },
      { source: "/properties/peking-university-international-hospital", destination: "/medical/china/hospitals/peking-university-international-hospital", statusCode: 301 },
      { source: "/properties/sichuan-university-west-china-hospital", destination: "/medical/china/hospitals/west-china-hospital", statusCode: 301 },
      { source: "/properties/sun-yat-sen-university-affiliated-hospital", destination: "/medical/china/hospitals/sun-yat-sen-university-hospital", statusCode: 301 },
      { source: "/properties/better-migrate-medical-network", destination: "/medical/china", statusCode: 301 },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "xbzrtofanbrahasxbisf.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};
export default nextConfig;
