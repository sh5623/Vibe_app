import { Routes, Route } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { Home } from '../pages/Home';
import { Invitation } from '../pages/Invitation';

export const AppRoutes = () => {
    return (
        <Routes>
            <Route element={<MainLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/invitation" element={<Invitation />} />
            </Route>
        </Routes>
    );
};
