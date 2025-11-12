import React from 'react';
import './Layout.css';

interface LayoutProps {
    children: React.ReactNode;
    title?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, title }) => {
    return (
        <div className="layout">
            {title && (
                <header className="layout-header">
                    <h1>{title}</h1>
                </header>
            )}
            <main className="layout-content">
                {children}
            </main>
        </div>
    );
};
