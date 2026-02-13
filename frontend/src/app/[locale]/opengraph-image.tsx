import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const alt = 'Agri-OS - Universal Farm Operating System';
export const size = {
    width: 1200,
    height: 630,
};

export const contentType = 'image/png';

// Image generation
export default async function Image({ params }: { params: { locale: string } }) {
    // We can't access i18n directly here easily without setup, so we fallback to English or generic
    // But we can keep it universal
    return new ImageResponse(
        (
            // ImageResponse JSX element
            <div
                style={{
                    background: 'linear-gradient(to bottom right, #020617, #0f172a)',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'sans-serif',
                    position: 'relative',
                }}
            >
                {/* Background Accents */}
                <div
                    style={{
                        position: 'absolute',
                        top: '-20%',
                        right: '-10%',
                        width: '600px',
                        height: '600px',
                        background: 'rgba(34, 197, 94, 0.15)', // green-500
                        borderRadius: '50%',
                        filter: 'blur(100px)',
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        bottom: '-10%',
                        left: '-10%',
                        width: '500px',
                        height: '500px',
                        background: 'rgba(59, 130, 246, 0.15)', // blue-500
                        borderRadius: '50%',
                        filter: 'blur(100px)',
                    }}
                />

                {/* Content */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', zIndex: 10 }}>
                    {/* Logo Icon (Simple Leaf/Sprout Shape) */}
                    <svg
                        width="80"
                        height="80"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#4ade80"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M7 17C7 17 8.5 10 16 3" />
                        <path d="M12 14C12 14 13.5 10 20 8" />
                        <path d="M5 21C12 21 16 16.5 19 12" />
                    </svg>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <h1
                            style={{
                                fontSize: '80px',
                                fontWeight: 'bold',
                                margin: 0,
                                lineHeight: 1,
                                background: 'linear-gradient(to right, #ffffff, #cbd5e1)',
                                backgroundClip: 'text',
                                color: 'transparent', // fallback
                            }}
                        >
                            Agri-OS
                        </h1>
                    </div>
                </div>

                <p style={{
                    fontSize: '32px',
                    color: '#94a3b8',
                    marginTop: '20px',
                    fontWeight: 500,
                    zIndex: 10
                }}>
                    The Universal Farm Operating System
                </p>

                <div style={{
                    position: 'absolute',
                    bottom: '40px',
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'center',
                    fontSize: '20px',
                    color: '#64748b'
                }}>
                    <span>AI Diagnosis</span> • <span>Marketplace</span> • <span>Farm Management</span>
                </div>
            </div>
        ),
        // ImageResponse options
        {
            ...size,
        }
    );
}
