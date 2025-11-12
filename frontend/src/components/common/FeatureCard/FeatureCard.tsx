import React from 'react';
import './FeatureCard.css';

export interface FeatureCardProps {
    title: string;
    description: string;
    icon: string;
    onClick?: () => void;
    disabled?: boolean;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
    title,
    description,
    icon,
    onClick,
    disabled = false
}) => {
    return (
        <button
            className={`feature-card ${disabled ? 'disabled' : ''}`}
            onClick={onClick}
            disabled={disabled}
        >
            <div className="feature-icon">{icon}</div>
            <h3 className="feature-title">{title}</h3>
            <p className="feature-description">{description}</p>
        </button>
    );
};
