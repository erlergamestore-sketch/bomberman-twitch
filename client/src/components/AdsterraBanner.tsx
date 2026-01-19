import React, { useEffect, useRef } from 'react';

interface AdsterraBannerProps {
    adKey: string;
    width: number;
    height: number;
    className?: string;
}

export const AdsterraBanner: React.FC<AdsterraBannerProps> = ({ adKey, width, height, className = '' }) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe) return;

        const doc = iframe.contentWindow?.document;
        if (!doc) return;

        // Reset iframe content
        doc.open();
        doc.write(`
            <!DOCTYPE html>
            <html style="margin:0;padding:0;overflow:hidden;">
            <head>
                <style>body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; background: transparent; }</style>
            </head>
            <body>
                <script type="text/javascript">
                    var atOptions = {
                        'key' : '${adKey}',
                        'format' : 'iframe',
                        'height' : ${height},
                        'width' : ${width},
                        'params' : {}
                    };
                </script>
                <script type="text/javascript" src="//www.highperformanceformat.com/${adKey}/invoke.js"></script>
            </body>
            </html>
        `);
        doc.close();

    }, [adKey, width, height]);

    return (
        <div className={`adsterra-banner flex justify-center items-center bg-transparent rounded-xl overflow-hidden ${className}`} style={{ width: width, height: height }}>
            <iframe
                ref={iframeRef}
                width={width}
                height={height}
                style={{ border: 'none', overflow: 'hidden' }}
                scrolling="no"
                title={`ad-${adKey}`}
            />
        </div>
    );
};
