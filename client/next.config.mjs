/** @type {import('next').NextConfig} */
const nextConfig = {
    serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
    experimental: {
        optimizePackageImports: ["lucide-react"],
    },
    async rewrites() {
        return [
            {
                source: '/api/proxy/audio/:path*',
                destination: `${process.env.NEXT_PUBLIC_BACKEND_URL || 'https://callcenterprofessionals.info'}/api/audio/:path*`,
            },
        ];
    },
};

export default nextConfig;
