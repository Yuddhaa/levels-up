import React from 'react';
import { motion } from 'framer-motion';

export const Skeleton: React.FC<{
    width?: string | number,
    height?: string | number,
    borderRadius?: string
}> = ({ width = '100%', height = '20px', borderRadius = '8px' }) => {
    return (
        <motion.div
            style={{
                width,
                height,
                borderRadius,
                backgroundColor: 'rgba(255,255,255,0.05)',
                marginBottom: '0.5rem'
            }}
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        />
    );
};
