/** @type {import('next').NextConfig} */
const nextConfig = {
    serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
    modularizeImports: {
        "lucide-react": {
            transform: "lucide-react/dist/esm/icons/{{member}}",
        },
    },
    async rewrites() {
        return [
            {
                source: '/api/proxy/audio/upload',
                destination: 'https://callcenterprofessionals.info/api/audio/upload',
            },
        ];
    },
};

export default nextConfig;
