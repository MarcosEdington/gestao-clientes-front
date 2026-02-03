import React from 'react';

const Skeleton: React.FC = () => {
    return (
        <div className="container mt-5">
            <div className="placeholder-glow">
                <div className="d-flex justify-content-between mb-4">
                    <span className="placeholder col-4 py-4 rounded"></span>
                    <span className="placeholder col-2 py-4 rounded"></span>
                </div>
                <div className="card border-0 shadow-sm p-4">
                    <span className="placeholder col-12 mb-3 py-3"></span>
                    <span className="placeholder col-12 mb-3 py-3"></span>
                    <span className="placeholder col-12 mb-3 py-3"></span>
                    <span className="placeholder col-8 py-3"></span>
                </div>
            </div>
        </div>
    );
};

export default Skeleton;