import React, { useEffect, useRef } from 'react';

interface AdsterraBannerProps {
    adKey: string;
    width: number;
    height: number;
    className?: string;
}

export const AdsterraBanner: React.FC<AdsterraBannerProps> = ({ adKey, width, height, className = '' }) => {
    const bannerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!bannerRef.current) return;

        // Clear previous content
        bannerRef.current.innerHTML = '';

        // Create the configuration script
        const confScript = document.createElement('script');
        confScript.type = 'text/javascript';
        confScript.innerHTML = `
            atOptions = {
                'key' : '${adKey}',
                'format' : 'iframe',
                'height' : ${height},
                'width' : ${width},
                'params' : {}
            };
        `;

        // Create the invocation script
        const invokeScript = document.createElement('script');
        invokeScript.type = 'text/javascript';
        invokeScript.src = `//www.highperformanceformat.com/${adKey}/invoke.js`;
        invokeScript.async = true;

        // Append to the container
        bannerRef.current.appendChild(confScript);
        bannerRef.current.appendChild(invokeScript);

    }, [adKey, width, height]);

    return (
        <div
            ref={bannerRef}
            className={`adsterra-banner flex justify-center items-center bg-black/20 rounded-xl overflow-hidden ${className}`}
            style={{ width: `${width}px`, height: `${height}px` }}
        >
            {/* Ads will be injected here */}
        </div>
    );
};
