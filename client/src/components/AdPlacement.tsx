import React from 'react';

interface AdPlacementProps {
    slot: string;
    format?: 'auto' | 'fluid' | 'rectangle';
    className?: string;
}

export const AdPlacement: React.FC<AdPlacementProps> = ({ slot, format = 'auto', className = '' }) => {
    React.useEffect(() => {
        try {
            // @ts-ignore
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
            console.error('AdSense error:', e);
        }
    }, []);

    return (
        <div className={`ad-container ${className}`}>
            <ins
                className="adsbygoogle"
                style={{ display: 'block' }}
                data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
                data-ad-slot={slot}
                data-ad-format={format}
                data-full-width-responsive="true"
            />
        </div>
    );
};
